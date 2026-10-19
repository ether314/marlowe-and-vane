// Home page: scroll-driven hero, marquee, manifesto, collection, sourcing map, materials, passport, services, newsletter.
import { $, $$, esc, km, coord, roman, arrow, clamp, reduceMotion, distanceKm, bearing, docNumber } from './util.js';
import { studioSVG, mix } from './art.js';
import { swatchSVG } from './art-scenes.js';
import { defaultConfig, specFor, subscribe } from './store.js';
import { renderMap } from './map.js';
import { cardHTML, mountCards } from './catalog.js';
import { stampSVG, sealSVG, scallopSVG } from './marks.js';
import { observeReveals } from './reveal.js';
import { openFabric } from './modal.js';

const WALLS = ['#2e3a23', '#34432a', '#4a3d2e', '#27321e', '#33402a'];
const SUN = ['#f6e6a0', '#f4d98f', '#f0b97c', '#e9cf8c', '#f6e6a0'];
const HERO_VB = '-178 -114 356 172';
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

const heroPieces = (cat) => cat.pieces.filter((p) => p.featured).slice(0, 4);
const heroSpec = (p) => specFor(p, { ...defaultConfig(p), size: (p.sizes.find((s) => s.seats === 3) || p.sizes[0]).id, color: p.heroColor || p.colorways[0].id });

/* ---------- markup ---------- */
function heroHTML(cat) {
  const pieces = heroPieces(cat);
  const continents = new Set(cat.origins.map((o) => o.continent)).size;
  const a = cat.atelier;
  const acts = pieces
    .map((p, i) => {
      const o = cat.originById[p.journey[0].origin];
      return `
      <article class="act" data-act="${i + 1}" aria-hidden="true">
        <div class="act__roman">Act ${roman(i + 1)} · ${esc(o.city)}</div>
        <h2 class="act__title">${esc(p.name)}</h2>
        <p class="act__line">${esc(p.material.name)}. ${esc(o.blurb)}</p>
        <div class="act__coords num">${coord(o.lat, o.lon)} · ${km(distanceKm(a, o))} from London</div>
        <div class="act__actions"><a class="btn btn--solid" href="/pieces/${p.slug}" data-link>View the ${esc(p.short)} ${arrow}</a></div>
      </article>`;
    })
    .join('');
  const sofas = pieces.map((p, i) => `<div class="hero__sofa" data-i="${i}">${studioSVG(heroSpec(p), { vb: HERO_VB, reflection: true, label: `${p.name}, ${p.type}` })}</div>`).join('');
  const bars = ['', ...pieces].map(() => '<b></b>').join('');
  return `
  <section class="hero" aria-label="Introduction">
    <div class="hero__pin" style="--wall:${WALLS[0]};--sun:${SUN[0]}">
      <div class="hero__wall"></div>
      <div class="hero__window"></div>
      <div class="hero__beam"></div>
      <div class="hero__floor"></div>
      <div class="hero__stage">${sofas}</div>
      <div class="hero__copy">
        <article class="act act--intro is-active" data-act="0">
          <div class="eyebrow">Fine seating from ${cat.origins.length} workshops on ${continents} continents</div>
          <h1>The<br>well-traveled<br><em class="amp">sofa.</em></h1>
          <p class="act__line">Marlowe &amp; Vane gathers the world's finest makers under one roof, then finishes every piece by hand in London.</p>
          <div class="act__actions"><a class="btn btn--solid" href="/collection" data-link>Explore the collection ${arrow}</a><a class="btn" href="/#provenance" data-link>Follow the journey</a></div>
        </article>
        ${acts}
      </div>
      <div class="hero__hud">
        <div class="hero__scroll"><i></i>Scroll to travel</div>
        <div class="hero__progress" aria-hidden="true">${bars}</div>
        <div class="hero__compass">
          <div><span id="heroPlace">London atelier</span><br><span id="heroCoord" class="num">${coord(a.lat, a.lon)}</span></div>
          <div class="hero__vane"><svg viewBox="0 0 54 54" fill="none" aria-hidden="true"><path d="M27 8l5 22H22z" fill="#d98a5b"/><path d="M27 30v17" stroke="#f2e6a8" stroke-width="1.2"/><circle cx="27" cy="30" r="2.2" fill="#2e3a23" stroke="#f2e6a8" stroke-width="1"/></svg></div>
        </div>
      </div>
    </div>
  </section>`;
}

const marqueeHTML = (cat) => {
  const items = cat.origins.map((o) => `<span class="marquee__item"><b>${esc(o.city)}</b><span class="num">${coord(o.lat, o.lon, ' ')}</span></span>`).join('');
  return `<div class="marquee" aria-hidden="true"><div class="marquee__track">${items}${items}</div></div>`;
};

function splitWords(text) {
  let em = false;
  return text
    .split(' ')
    .map((t) => {
      if (t.startsWith('*')) em = true;
      const clean = esc(t.replaceAll('*', ''));
      const out = `<span class="w">${em ? `<em>${clean}</em>` : clean}</span>`;
      if (t.endsWith('*')) em = false;
      return out;
    })
    .join(' ');
}

function manifestoHTML(cat) {
  const countries = new Set(cat.origins.map((o) => o.country)).size;
  const continents = new Set(cat.origins.map((o) => o.continent)).size;
  const weeks = Math.round(cat.pieces.reduce((n, p) => n + (p.leadWeeks[0] + p.leadWeeks[1]) / 2, 0) / cat.pieces.length);
  const stats = [[cat.origins.length, 'Workshops'], [countries, 'Countries'], [continents, 'Continents'], [weeks, 'Weeks from loom to living room']];
  return `
  <section class="section section--butter manifesto" id="atelier">
    <div class="wrap">
      <div class="eyebrow reveal" style="margin-bottom:30px">The house</div>
      <p class="manifesto__text" id="manifesto">${splitWords("We don't make sofas. We *seek out* the finest makers on earth, bring their work home, and finish every piece by hand.")}</p>
      <div class="stats">${stats.map(([n, label], i) => `<div class="stat reveal" style="--d:${i * 0.1}s"><b class="num" data-count="${n}">${n}</b><span>${label}</span></div>`).join('')}</div>
    </div>
  </section>`;
}

const collectionHTML = (cat) => `
  <section class="section" id="collection">
    <div class="wrap">
      <div class="section__head">
        <div class="eyebrow reveal">The collection</div>
        <h2 class="reveal" style="--d:.08s">${WORDS[cat.pieces.length] ? WORDS[cat.pieces.length][0].toUpperCase() + WORDS[cat.pieces.length].slice(1) : cat.pieces.length} pieces, <em class="amp">six passports</em>.</h2>
        <p class="lede reveal" style="--d:.16s">Hover a piece to step into a room with it. Tap a color to try it on.</p>
      </div>
      <div class="grid-cards">${cat.pieces.map((p, i) => cardHTML(cat, p, i)).join('')}</div>
      <div style="margin-top:56px;display:flex;justify-content:center"><a class="btn" href="/collection" data-link>Filter by fabric or origin ${arrow}</a></div>
    </div>
  </section>`;

const provenanceHTML = () => `
  <section class="section section--deep" id="provenance">
    <div class="wrap">
      <div class="section__head">
        <div class="eyebrow reveal">Provenance</div>
        <h2 class="reveal" style="--d:.08s">Follow every thread <em class="amp">home</em>.</h2>
        <p class="lede reveal" style="--d:.16s">Hover a workshop to see what it makes, where it sits on the globe, and how far its work travels to reach our London atelier.</p>
      </div>
      <div id="homeMap" class="reveal" style="--d:.2s"></div>
    </div>
  </section>`;

function materialsHTML(cat) {
  const rows = cat.pieces
    .map((p) => {
      const o = cat.originById[p.material.origin];
      const sw = p.colorways
        .map((c) => `<button class="swatch" type="button" data-fabric data-slug="${p.slug}" data-color="${c.id}" aria-label="${esc(p.material.name)}, ${esc(c.name)}: see close-up"><div class="swatch__disc">${swatchSVG(p.material.fabric, c.hex)}</div><span>${esc(c.name)}</span></button>`)
        .join('');
      return `<div class="mat reveal"><div class="mat__info"><span class="eyebrow">${esc(o.city)}, ${esc(o.country)}</span><h3>${esc(p.material.name)}</h3><p>${esc(o.blurb)}</p><a class="link" href="/pieces/${p.slug}" data-link style="margin-top:20px">Shop the ${esc(p.short)} ${arrow}</a></div><div class="mat__swatches">${sw}</div></div>`;
    })
    .join('');
  return `
  <section class="section" id="materials">
    <div class="wrap">
      <div class="section__head">
        <div class="eyebrow reveal">The swatch library</div>
        <h2 class="reveal" style="--d:.08s">Fabrics worth <em class="amp">crossing oceans</em> for.</h2>
        <p class="lede reveal" style="--d:.16s">Tap any swatch for a close-up of the weave, the grain, and the stitching.</p>
      </div>
      <div class="mats">${rows}</div>
    </div>
  </section>`;
}

function bookHTML(cat, p) {
  const a = cat.atelier;
  const rows = p.journey
    .map((j, i) => {
      const o = cat.originById[j.origin];
      return `<div class="book__row"><div class="stamp" style="--r:${[-12, 8, -6, 10][i % 4]}deg;--i:${i}">${stampSVG(o)}</div><div><b>${esc(o.city)}</b><small>${esc(j.role)} · ${esc(o.country)}</small></div><span class="num">${coord(o.lat, o.lon, '<br>')}</span></div>`;
    })
    .join('');
  const home = `<div class="book__row"><div class="stamp" style="--r:6deg;--i:${p.journey.length}">${stampSVG({ city: a.city, country: a.country, lat: a.lat, lon: a.lon })}</div><div><b>The Atelier</b><small>Finished by hand · ${esc(a.country)}</small></div><span class="num">${coord(a.lat, a.lon, '<br>')}</span></div>`;
  return `
    <div class="book__head"><div><div class="caps">Passport · No. ${docNumber(p.slug)}</div><h3>${esc(p.name)}</h3></div><div class="book__seal">${sealSVG()}</div></div>
    <div class="book__rows">${rows}${home}</div>
    <div class="book__foot"><div class="caps">Certificate of origin<br>Issued at the atelier</div><div class="cert">${scallopSVG()}</div></div>`;
}

const passportHTML = (cat) => `
  <section class="section section--olive" id="passport">
    <div class="wrap passport">
      <div>
        <div class="eyebrow reveal" style="color:var(--butter)">The passport</div>
        <h2 class="reveal" style="--d:.08s;margin:22px 0 26px">Every piece travels with a <em class="amp" style="color:var(--butter)">passport</em>.</h2>
        <p class="lede reveal" style="--d:.16s">Each sofa leaves the atelier with a stamped record of where its leather, silk, frame, and finishing touches began, down to the coordinates of the workshop.</p>
        <div class="passport__chips reveal" style="--d:.24s" role="group" aria-label="Choose a piece">${cat.pieces.map((p, i) => `<button class="chip" type="button" data-passport="${p.slug}" aria-pressed="${i === 0}">${esc(p.short)}</button>`).join('')}</div>
      </div>
      <div class="reveal" style="--d:.12s"><div class="book" id="book">${bookHTML(cat, cat.pieces[0])}</div></div>
    </div>
  </section>`;

const icons = {
  truck: '<svg viewBox="0 0 46 46" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h24v20H4zM28 18h9l6 7v7H28"/><circle cx="12" cy="34" r="3.6" fill="#2e3a23"/><circle cx="35" cy="34" r="3.6" fill="#2e3a23"/></svg>',
  ruler: '<svg viewBox="0 0 46 46" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" aria-hidden="true"><path d="M6 32 32 6l8 8-26 26z"/><path d="M13 25l4 4M18 20l3 3M23 15l4 4M28 10l3 3"/></svg>',
  star: '<svg viewBox="0 0 46 46" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" aria-hidden="true"><path d="M23 4l3.8 15.2L42 23l-15.2 3.8L23 42l-3.8-15.2L4 23l15.2-3.8z"/></svg>',
};

const servicesHTML = () => `
  <section class="section">
    <div class="wrap">
      <div class="section__head"><div class="eyebrow reveal">The service</div><h2 class="reveal" style="--d:.08s">Made slowly. <em class="amp">Delivered gently.</em></h2></div>
      <div class="services">
        <div class="service reveal">${icons.truck}<h3>White-glove delivery</h3><p>Our own team brings your piece inside, places it where you like, and takes the packaging away.</p></div>
        <div class="service reveal" style="--d:.1s">${icons.ruler}<h3>Made to your measure</h3><p>Choose the fabric, the legs, and the length. Need something different? We will draw it with you.</p></div>
        <div class="service reveal" style="--d:.2s">${icons.star}<h3>Cared for, for decades</h3><p>Frames built to be repaired and re-covered, with a lifetime of care advice from the people who made it.</p></div>
      </div>
    </div>
  </section>`;

const newsletterHTML = () => `
  <section class="section section--deep" id="newsletter">
    <div class="wrap news">
      <div>
        <div class="eyebrow reveal">The logbook</div>
        <h2 class="reveal" style="--d:.08s;margin-top:22px">Dispatches from the <em class="amp">workshops</em>.</h2>
        <p class="lede reveal" style="--d:.16s;margin-top:22px">New pieces, new fabrics, and the occasional postcard from a loom. Four times a year, never more.</p>
      </div>
      <div class="reveal" style="--d:.2s">
        <form id="newsForm" novalidate>
          <div class="field"><label for="ne">Email</label><input class="input" id="ne" type="email" name="email" placeholder="you@example.com" autocomplete="email" required maxlength="120"></div>
          <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
          <button class="btn btn--solid" type="submit">Subscribe ${arrow}</button>
        </form>
        <p class="form-note" id="newsNote" role="status"></p>
      </div>
    </div>
  </section>`;

/* ---------- behavior ---------- */
function mountHero(root, cat) {
  const hero = $('.hero', root);
  if (!hero) return () => {};
  const pin = $('.hero__pin', hero);
  const acts = $$('.act', hero);
  const sofas = $$('.hero__sofa', hero);
  const bars = $$('.hero__progress b', hero);
  const place = $('#heroPlace', hero);
  const coordEl = $('#heroCoord', hero);
  const vane = $('.hero__vane svg', hero);
  const stops = heroPieces(cat).map((p) => cat.originById[p.journey[0].origin]);
  const N = acts.length;

  if (reduceMotion()) {
    acts[0].style.opacity = '1';
    if (sofas[0]) sofas[0].style.opacity = '1';
    return () => {};
  }
  hero.style.height = `${(N - 1) * 125 + 100}vh`;

  let raf = 0;
  let lastIdx = -1;
  const tick = () => {
    raf = 0;
    const range = hero.offsetHeight - innerHeight;
    if (range <= 0) return;
    const p = clamp(-hero.getBoundingClientRect().top / range, 0, 1);
    const f = p * (N - 1);

    acts.forEach((a, k) => {
      const d = f - k;
      const vis = clamp(1 - Math.abs(d) * 1.9, 0, 1);
      a.style.opacity = vis.toFixed(3);
      a.style.transform = `translateY(calc(-50% + ${(-d * 46).toFixed(1)}px))`;
      const on = vis > 0.55;
      a.classList.toggle('is-active', on);
      a.setAttribute('aria-hidden', String(!on));
    });
    sofas.forEach((s, i) => {
      const d = f - (i + 1);
      let vis = clamp(1 - Math.abs(d) * 1.7, 0, 1);
      if (i === 0 && f < 1) vis = 1;
      s.style.opacity = vis.toFixed(3);
      s.style.transform = `translate3d(${(-d * 11).toFixed(2)}%, ${(Math.abs(d) * 2.4).toFixed(2)}%, 0) scale(${(1 - Math.abs(d) * 0.045).toFixed(4)})`;
    });
    bars.forEach((b, k) => b.style.setProperty('--fill', clamp(f - (k - 1), 0, 1).toFixed(3)));

    const idx = Math.round(f);
    pin.style.setProperty('--wall', WALLS[idx % WALLS.length]);
    const s = p * (SUN.length - 1);
    const i0 = Math.min(SUN.length - 2, Math.floor(s));
    pin.style.setProperty('--sun', mix(SUN[i0], SUN[i0 + 1], s - i0));
    pin.style.setProperty('--p', p.toFixed(3));

    if (idx !== lastIdx) {
      lastIdx = idx;
      if (idx === 0) {
        place.textContent = 'London atelier';
        coordEl.textContent = coord(cat.atelier.lat, cat.atelier.lon);
        vane.style.transform = 'rotate(0deg)';
      } else {
        const o = stops[idx - 1];
        place.textContent = o.city;
        coordEl.textContent = coord(o.lat, o.lon);
        vane.style.transform = `rotate(${bearing(cat.atelier, o).toFixed(0)}deg)`;
      }
    }
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  tick();
  return () => {
    removeEventListener('scroll', onScroll);
    removeEventListener('resize', onScroll);
    if (raf) cancelAnimationFrame(raf);
  };
}

function mountManifesto(root) {
  const text = $('#manifesto', root);
  if (!text || reduceMotion()) return () => {};
  const words = $$('.w', text);
  let raf = 0;
  const tick = () => {
    raf = 0;
    const r = text.getBoundingClientRect();
    const p = clamp((innerHeight * 0.84 - r.top) / (r.height + innerHeight * 0.32), 0, 1);
    const n = Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle('is-lit', i < n));
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
  addEventListener('scroll', onScroll, { passive: true });
  tick();
  return () => { removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
}

function countUp(root) {
  const els = $$('[data-count]', root);
  if (reduceMotion()) return () => {};
  const run = (el) => {
    const target = Number(el.dataset.count);
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 1400);
      el.textContent = Math.round(target * (1 - (1 - k) ** 3));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }), { threshold: 0.6 });
  els.forEach((el) => { el.textContent = '0'; io.observe(el); });
  return () => io.disconnect();
}

function mountPassport(root, cat) {
  const book = $('#book', root);
  if (!book) return () => {};
  const stamp = () => { book.classList.remove('is-stamping'); void book.offsetWidth; book.classList.add('is-stamping'); };
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { stamp(); io.disconnect(); } }, { threshold: 0.4 });
  io.observe(book);
  $$('[data-passport]', root).forEach((b) =>
    b.addEventListener('click', () => {
      $$('[data-passport]', root).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      book.innerHTML = bookHTML(cat, cat.pieceBySlug[b.dataset.passport]);
      stamp();
    }),
  );
  return () => io.disconnect();
}

function mountNewsletter(root) {
  const form = $('#newsForm', root);
  if (!form) return;
  const note = $('#newsNote', root);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form.website.value) return;
    const email = form.email.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      note.className = 'form-note is-err';
      note.textContent = 'Enter a valid email address.';
      return;
    }
    const btn = $('button', form);
    btn.disabled = true;
    note.className = 'form-note';
    note.textContent = 'Subscribing…';
    try {
      await subscribe(email);
      form.reset();
      note.className = 'form-note is-ok';
      note.textContent = 'Thank you. Your first dispatch is on its way.';
    } catch {
      note.className = 'form-note is-err';
      note.textContent = "We couldn't save that just now. Please try again in a moment.";
    } finally {
      btn.disabled = false;
    }
  });
}

/* ---------- view ---------- */
export const homeView = {
  meta: () => ({
    title: 'Marlowe & Vane · The well-traveled sofa',
    description: 'Fine seating gathered from workshops on four continents and finished by hand. Leather from Tuscany, bouclé from the Andes, silk from the Ganges.',
  }),

  render(cat) {
    return heroHTML(cat) + marqueeHTML(cat) + manifestoHTML(cat) + collectionHTML(cat) + provenanceHTML() + materialsHTML(cat) + passportHTML(cat) + servicesHTML() + newsletterHTML();
  },

  mount(root, cat) {
    const stops = [mountHero(root, cat), mountManifesto(root), countUp(root), mountPassport(root, cat)];
    mountCards(root, cat);
    mountNewsletter(root);
    $$('[data-fabric]', root).forEach((b) => b.addEventListener('click', () => openFabric(cat, b.dataset.slug, b.dataset.color)));
    renderMap($('#homeMap', root), cat).then((fn) => stops.push(fn));
    observeReveals(root);
    return () => stops.forEach((fn) => fn?.());
  },
};
