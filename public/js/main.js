// App shell: routing, header, bag drawer, footer, and the opening curtain.
import { $, $$, esc, money, arrow, coord, toast } from './util.js';
import { loadCatalog, onBagChange, bagCount, resolveBag, setQty, clearBag, reserve } from './store.js';
import { studioSVG } from './art.js';
import { observeReveals } from './reveal.js';
import { homeView } from './home.js';
import { collectionView, TILE_VB } from './catalog.js';
import { pieceView } from './piece.js';
import { archSVG } from './marks.js';
import { closeModal } from './modal.js';

history.scrollRestoration = 'manual';
loadCatalog(); // start fetching while the shell paints

const notFoundView = {
  meta: () => ({ title: 'Not found · Marlowe & Vane', description: '' }),
  render: () => `<section class="page-head"><div class="wrap"><div class="eyebrow">404</div><h1>This page has <em class="amp">wandered off</em>.</h1><p class="lede" style="margin:24px 0 32px">It may have moved, or it never existed. The collection is always a good place to start again.</p><a class="btn btn--solid" href="/collection" data-link>Browse the collection ${arrow}</a></div></section>`,
};

const routes = [
  { re: /^\/$/, view: homeView },
  { re: /^\/collection$/, view: collectionView },
  { re: /^\/pieces\/([a-z0-9-]+)$/, view: pieceView },
];

/* ---------- meta ---------- */
function setMeta({ title, description }) {
  document.title = title;
  const set = (sel, val) => { const el = $(sel); if (el && val != null) el.setAttribute('content', val); };
  set('meta[name="description"]', description);
  set('meta[property="og:title"]', title);
  set('meta[property="og:description"]', description);
}

/* ---------- footer ---------- */
function footerHTML(cat) {
  const a = cat.atelier;
  return `
  <div class="wrap">
    <div class="footer__top">
      <div class="footer__badge">${archSVG()}</div>
      <div class="footer__word" aria-label="Marlowe and Vane">Marlowe<br><span class="amp">&amp;</span>Vane</div>
    </div>
    <div class="footer__grid">
      <div><h5>The collection</h5><ul>${cat.pieces.map((p) => `<li><a href="/pieces/${p.slug}" data-link>${esc(p.name)}</a></li>`).join('')}</ul></div>
      <div><h5>The house</h5><ul><li><a href="/#provenance" data-link>Provenance</a></li><li><a href="/#materials" data-link>Materials</a></li><li><a href="/#passport" data-link>The passport</a></li><li><a href="/collection" data-link>All pieces</a></li></ul></div>
      <div><h5>The atelier</h5><p>${esc(a.city)}, ${esc(a.country)}<br><span class="num dim">${coord(a.lat, a.lon)}</span></p><p class="dim" style="margin-top:12px">Showroom visits by appointment.</p></div>
      <div><h5>The logbook</h5><p class="dim">Dispatches from the workshops, four times a year.</p><p style="margin-top:16px"><a class="link" href="/#newsletter" data-link>Subscribe ${arrow}</a></p></div>
    </div>
    <div class="footer__legal"><span>© 2026 Marlowe &amp; Vane</span><span>Prices in US dollars · Online checkout opening soon</span></div>
  </div>`;
}

/* ---------- router ---------- */
let token = 0;
let cleanup = null;
let currentPath = null;

const normalize = (p) => p.replace(/\/+$/, '') || '/';
const scrollToHash = (hash) => {
  const el = hash && document.getElementById(decodeURIComponent(hash.slice(1)));
  if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return true; }
  return false;
};

async function render(href, { first = false } = {}) {
  const url = new URL(href, location.origin);
  const path = normalize(url.pathname);

  if (!first && path === currentPath && !url.search) {
    if (!scrollToHash(url.hash)) scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const my = ++token;
  const main = $('#main');
  main.classList.add('is-swapping');
  cleanup?.();
  cleanup = null;

  const cat = await loadCatalog();
  if (my !== token) return;

  const hit = routes.map((r) => ({ r, m: path.match(r.re) })).find((x) => x.m);
  const view = hit ? hit.r.view : notFoundView;
  const m = hit ? hit.m : [];

  main.innerHTML = view.render(cat, m);
  setMeta(view.meta(cat, m));
  $('#footer').innerHTML = footerHTML(cat);
  currentPath = path;
  $$('.nav a').forEach((a) => {
    const target = normalize(new URL(a.href).pathname);
    if (target === path && !a.hash) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  cleanup = view.mount?.(main, cat, m) || null;
  observeReveals(main);
  observeReveals($('#footer'));
  scrollTo(0, 0);
  requestAnimationFrame(() => {
    main.classList.remove('is-swapping');
    if (url.hash) setTimeout(() => scrollToHash(url.hash), 120);
  });
}

function go(href) {
  history.pushState(null, '', href);
  render(href);
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-link]');
  if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return;
  e.preventDefault();
  closeMenu();
  closeBag();
  closeModal();
  go(url.pathname + url.search + url.hash);
});
addEventListener('popstate', () => render(location.href));

/* ---------- header ---------- */
const header = $('#header');
const onScroll = () => header.classList.toggle('is-solid', scrollY > 40);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

const menuBtn = $('#menuBtn');
const mobnav = $('#mobnav');
function closeMenu() {
  mobnav.classList.remove('is-open');
  menuBtn.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('is-locked');
}
menuBtn.addEventListener('click', () => {
  const open = !mobnav.classList.contains('is-open');
  mobnav.classList.toggle('is-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('is-locked', open);
});

/* ---------- bag ---------- */
const bag = $('#bag');
const scrim = $('#scrim');
let bagOpen = false;

function updateCount() {
  const n = bagCount();
  const el = $('#bagCount');
  el.textContent = n;
  el.dataset.n = n;
}

function renderBag() {
  const lines = resolveBag();
  const items = $('#bagItems');
  const foot = $('#bagFoot');
  if (!lines.length) {
    items.innerHTML = `<div class="bag__empty"><p>Your bag is empty.</p><a class="btn" href="/collection" data-link>Explore the collection ${arrow}</a></div>`;
    foot.innerHTML = '';
    return;
  }
  items.innerHTML = lines
    .map((l) => `
    <div class="line" data-key="${esc(l.key)}">
      <div class="line__img">${studioSVG(l.spec, { vb: TILE_VB, label: l.piece.name })}</div>
      <div>
        <h4>${esc(l.piece.name)}</h4>
        <p>${esc(l.colorOpt.name)} · ${esc(l.sizeOpt.label)}<br>${esc(l.legsOpt.name)}</p>
        <div class="line__row"><div class="qty"><button type="button" data-q="-1" aria-label="Decrease quantity">&ndash;</button><span>${l.qty}</span><button type="button" data-q="1" aria-label="Increase quantity">+</button></div><b class="num">${money(l.total)}</b></div>
        <button class="line__rm" type="button" data-rm>Remove</button>
      </div>
    </div>`)
    .join('');
  const subtotal = lines.reduce((n, l) => n + l.total, 0);
  foot.innerHTML = `
    <div class="bag__sub"><span class="eyebrow">Subtotal</span><b class="num">${money(subtotal)}</b></div>
    <p class="bag__fine">Online checkout is opening soon. Reserve your pieces now and we'll email you to confirm fabrics, finish the details, and take payment.</p>
    <button class="btn btn--solid btn--block" id="reserveBtn" type="button">Reserve my order ${arrow}</button>
    <form class="reserve" id="reserveForm" hidden novalidate>
      <div class="field"><label for="rn">Name</label><input class="input" id="rn" name="name" autocomplete="name" required maxlength="80"></div>
      <div class="field"><label for="re">Email</label><input class="input" id="re" name="email" type="email" autocomplete="email" required maxlength="120"></div>
      <div class="field"><label for="rt">Note (optional)</label><textarea class="input" id="rt" name="note" maxlength="600"></textarea></div>
      <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <button class="btn btn--solid btn--block" type="submit">Send reservation</button>
      <p class="form-note" id="reserveNote" role="status"></p>
    </form>`;
}

function openBag() {
  renderBag();
  bagOpen = true;
  bag.classList.add('is-open');
  bag.setAttribute('aria-hidden', 'false');
  scrim.classList.add('is-on');
  document.body.classList.add('is-locked');
  $('#bagClose').focus();
}
function closeBag() {
  if (!bagOpen) return;
  bagOpen = false;
  bag.classList.remove('is-open');
  bag.setAttribute('aria-hidden', 'true');
  scrim.classList.remove('is-on');
  document.body.classList.remove('is-locked');
}

$('#bagBtn').addEventListener('click', openBag);
$('#bagClose').addEventListener('click', closeBag);
scrim.addEventListener('click', closeBag);
document.addEventListener('bag:open', openBag);
$('#modal').addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeBag(); closeModal(); closeMenu(); }
});
onBagChange(() => { updateCount(); if (bagOpen) renderBag(); });
updateCount();

$('#bagItems').addEventListener('click', (e) => {
  const line = e.target.closest('.line');
  if (!line) return;
  const key = line.dataset.key;
  const l = resolveBag().find((x) => x.key === key);
  if (!l) return;
  const q = e.target.closest('[data-q]');
  if (q) setQty(key, l.qty + Number(q.dataset.q));
  if (e.target.closest('[data-rm]')) setQty(key, 0);
});

$('#bagFoot').addEventListener('click', (e) => {
  if (e.target.closest('#reserveBtn')) {
    const form = $('#reserveForm');
    form.hidden = false;
    e.target.closest('#reserveBtn').hidden = true;
    $('#rn').focus();
  }
});
$('#bagFoot').addEventListener('submit', async (e) => {
  if (e.target.id !== 'reserveForm') return;
  e.preventDefault();
  const form = e.target;
  const note = $('#reserveNote');
  if (form.website.value) return;
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  if (!name) { note.className = 'form-note is-err'; note.textContent = 'Please add your name.'; return; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { note.className = 'form-note is-err'; note.textContent = 'Enter a valid email address.'; return; }
  const btn = $('button[type="submit"]', form);
  btn.disabled = true;
  note.className = 'form-note';
  note.textContent = 'Sending…';
  try {
    await reserve({ name, email, note: form.note.value.trim() });
    clearBag();
    $('#bagItems').innerHTML = `<div class="bag__empty"><h3>Reserved.</h3><p>Thank you, ${esc(name)}. We'll write to ${esc(email)} to complete your order.</p></div>`;
    $('#bagFoot').innerHTML = `<a class="btn btn--block" href="/collection" data-link>Keep browsing ${arrow}</a>`;
  } catch {
    note.className = 'form-note is-err';
    note.textContent = "We couldn't send that just now. Please try again in a moment.";
    btn.disabled = false;
  }
});

/* ---------- opening curtain ---------- */
function runIntro() {
  const intro = $('#intro');
  if (!intro || document.documentElement.classList.contains('no-intro')) return;
  try { sessionStorage.setItem('mv.intro', '1'); } catch { /* ignore */ }
  document.body.classList.add('is-locked');
  intro.style.pointerEvents = 'auto';
  let done = false;
  const leave = () => {
    if (done) return;
    done = true;
    intro.classList.add('is-leaving');
    document.body.classList.remove('is-locked');
    setTimeout(() => intro.classList.add('is-gone'), 1500);
  };
  const t = setTimeout(leave, 3400);
  intro.addEventListener('click', () => { clearTimeout(t); leave(); }, { once: true });
}

runIntro();
render(location.href, { first: true });
