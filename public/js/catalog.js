// Piece cards and the collection page with filters.
import { $, $$, esc, money, arrow } from './util.js';
import { studioSVG } from './art.js';
import { roomSVG } from './art-scenes.js';
import { defaultConfig, specFor, colorOf } from './store.js';
import { observeReveals } from './reveal.js';

export const TILE_VB = '-170 -104 340 150';

export const fromPrice = (p) => p.price + Math.min(...p.sizes.map((s) => s.delta)) + Math.min(...p.legs.map((l) => l.delta));

export function cardHTML(cat, p, i = 0) {
  const cfg = defaultConfig(p);
  const spec = specFor(p, cfg);
  const origin = cat.originById[p.journey[0].origin];
  const dots = p.colorways
    .map((c, k) => `<button class="dot" type="button" data-color="${c.id}" style="background:${c.hex}" aria-label="${esc(c.name)}" aria-pressed="${k === 0}"></button>`)
    .join('');
  return `
  <article class="card reveal" data-slug="${p.slug}" style="--d:${(i % 3) * 0.09}s">
    <div class="card__media">
      <span class="card__tag">${esc(p.type)}</span>
      <div class="card__art" data-art>${studioSVG(spec, { vb: TILE_VB, label: `${p.name} in ${colorOf(p, cfg.color).name}` })}</div>
      <div class="card__room" data-room></div>
      <span class="card__view">View ${arrow}</span>
    </div>
    <div class="card__body">
      <h3 class="card__name"><a href="/pieces/${p.slug}" data-link>${esc(p.name)}</a></h3>
      <div class="card__price num">From ${money(fromPrice(p))}</div>
      <div class="card__meta">${esc(p.material.name)} · ${esc(origin?.city || '')}</div>
      <div class="card__dots" role="group" aria-label="Colorways">${dots}</div>
    </div>
  </article>`;
}

export function mountCards(root, cat) {
  $$('.card', root).forEach((card) => {
    const p = cat.pieceBySlug[card.dataset.slug];
    if (!p) return;
    let cfg = defaultConfig(p);
    let roomOn = false;
    const art = $('[data-art]', card);
    const room = $('[data-room]', card);
    const paint = () => {
      const spec = specFor(p, cfg);
      art.innerHTML = studioSVG(spec, { vb: TILE_VB, label: `${p.name} in ${colorOf(p, cfg.color).name}` });
      if (roomOn) room.innerHTML = roomSVG(spec, p.scene, { time: 'day', label: `${p.name} in a styled room` });
    };
    const ensureRoom = () => { if (!roomOn) { roomOn = true; paint(); } };
    card.addEventListener('pointerenter', ensureRoom, { once: true });
    card.addEventListener('focusin', ensureRoom, { once: true });
    $$('.dot', card).forEach((dot) =>
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        cfg = { ...cfg, color: dot.dataset.color };
        $$('.dot', card).forEach((x) => x.setAttribute('aria-pressed', String(x === dot)));
        paint();
      }),
    );
  });
}

/* ---------- collection page ---------- */
const FABRIC_LABEL = { leather: 'Leather', boucle: 'Bouclé', silk: 'Silk', canvas: 'Cotton', velvet: 'Velvet', tweed: 'Tweed', linen: 'Linen' };
const SORTS = {
  featured: ['Featured', (a, b) => a.order - b.order],
  low: ['Price, low to high', (a, b) => fromPrice(a) - fromPrice(b)],
  high: ['Price, high to low', (a, b) => fromPrice(b) - fromPrice(a)],
  soon: ['Soonest delivery', (a, b) => a.leadWeeks[0] - b.leadWeeks[0]],
};

const regionsOf = (cat, p) => [...new Set(p.journey.map((j) => cat.originById[j.origin]?.continent).filter(Boolean))];

export const collectionView = {
  meta: () => ({
    title: 'The Collection · Marlowe & Vane',
    description: 'Sofas, daybeds, and settees from workshops on four continents. Choose your fabric, legs, and size.',
  }),

  render() {
    return `
    <section class="page-head">
      <div class="wrap">
        <div class="eyebrow reveal">The collection</div>
        <h1 class="reveal" style="--d:.08s">Pieces from <em class="amp">everywhere</em>.</h1>
        <p class="lede reveal" style="--d:.16s">Every piece is made by the hands best suited to it, then finished at our London atelier. Filter by silhouette, fabric, or where in the world it began.</p>
      </div>
    </section>
    <div class="filters"><div class="wrap filters__in" id="filters"></div></div>
    <section class="results"><div class="wrap"><p class="eyebrow results__count" id="count" aria-live="polite"></p><div class="grid-cards" id="grid"></div></div></section>`;
  },

  mount(root, cat) {
    const q = new URLSearchParams(location.search);
    const state = { type: q.get('type') || '', material: q.get('material') || '', region: q.get('region') || '', sort: SORTS[q.get('sort')] ? q.get('sort') : 'featured' };

    const types = [...new Set(cat.pieces.map((p) => p.type))];
    const mats = [...new Set(cat.pieces.map((p) => p.material.fabric))];
    const regions = ['Europe', 'Asia', 'Africa', 'Americas'].filter((r) => cat.pieces.some((p) => regionsOf(cat, p).includes(r)));

    const group = (key, label, options) => `
      <div class="filters__group" role="group" aria-label="${label}">
        <span class="eyebrow">${label}</span>
        <button class="chip" type="button" data-key="${key}" data-val="" aria-pressed="${!state[key]}">All</button>
        ${options.map(([val, text]) => `<button class="chip" type="button" data-key="${key}" data-val="${esc(val)}" aria-pressed="${state[key] === val}">${esc(text)}</button>`).join('')}
      </div>`;

    $('#filters', root).innerHTML = `
      ${group('type', 'Silhouette', types.map((t) => [t, { 'Cloud sofa': 'Cloud', 'Mid-century sofa': 'Mid-century' }[t] || t]))}
      ${group('material', 'Fabric', mats.map((m) => [m, FABRIC_LABEL[m] || m]))}
      ${group('region', 'Origin', regions.map((r) => [r, r]))}
      <select class="sortsel" id="sort" aria-label="Sort pieces">${Object.entries(SORTS).map(([k, [label]]) => `<option value="${k}"${state.sort === k ? ' selected' : ''}>${label}</option>`).join('')}</select>`;

    const grid = $('#grid', root);
    const count = $('#count', root);

    const apply = () => {
      const list = cat.pieces
        .filter((p) => (!state.type || p.type === state.type) && (!state.material || p.material.fabric === state.material) && (!state.region || regionsOf(cat, p).includes(state.region)))
        .sort(SORTS[state.sort][1]);
      count.textContent = `${list.length} ${list.length === 1 ? 'piece' : 'pieces'}`;
      grid.innerHTML = list.length
        ? list.map((p, i) => cardHTML(cat, p, i)).join('')
        : `<div class="empty" style="grid-column:1/-1"><h3>Nothing matches yet</h3><p class="dim">Try a different silhouette, fabric, or origin.</p><button class="btn" type="button" id="reset">Clear filters</button></div>`;
      mountCards(grid, cat);
      observeReveals(grid);
      $('#reset', grid)?.addEventListener('click', () => { Object.assign(state, { type: '', material: '', region: '', sort: 'featured' }); sync(); apply(); });
      const next = new URLSearchParams();
      for (const k of ['type', 'material', 'region']) if (state[k]) next.set(k, state[k]);
      if (state.sort !== 'featured') next.set('sort', state.sort);
      history.replaceState(null, '', `${location.pathname}${next.toString() ? `?${next}` : ''}`);
    };
    const sync = () => {
      $$('.chip', root).forEach((c) => c.setAttribute('aria-pressed', String((state[c.dataset.key] || '') === c.dataset.val)));
      $('#sort', root).value = state.sort;
    };

    $('#filters', root).addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      state[chip.dataset.key] = chip.dataset.val;
      sync();
      apply();
    });
    $('#sort', root).addEventListener('change', (e) => { state.sort = e.target.value; apply(); });
    apply();
  },
};
