// The sourcing map: a dotted Natural Earth world with a route from each workshop to the atelier.
import { $, $$, esc, coord, distanceKm, km, clamp } from './util.js';

let worldPromise;
const loadWorld = () => (worldPromise ??= fetch('/data/world.json').then((r) => r.json()));

// Natural Earth 1, matching the projection used by scripts/build-map.mjs.
function project(w, lon, lat) {
  const l = (lon * Math.PI) / 180;
  const p = (lat * Math.PI) / 180;
  const p2 = p * p;
  const p4 = p2 * p2;
  const rx = l * (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4)));
  const ry = p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)));
  return [w.translate[0] + w.scale * rx, w.translate[1] - w.scale * ry];
}

const f1 = (v) => Math.round(v * 10) / 10;
function arcPath(a, b) {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return `M${f1(a[0])} ${f1(a[1])}Q${f1(mx)} ${f1(my - d * 0.3)} ${f1(b[0])} ${f1(b[1])}`;
}

export async function renderMap(container, cat, { origins, roles = {}, compact = false } = {}) {
  const w = await loadWorld();
  const atelier = cat.atelier;
  const home = project(w, atelier.lon, atelier.lat);
  const list = (origins || cat.origins)
    .map((o) => ({ o, xy: project(w, o.lon, o.lat), dist: distanceKm(atelier, o) }))
    .sort((a, b) => b.dist - a.dist);

  let land = '';
  for (let i = 0; i < w.dots.length; i += 2) land += `M${w.dots[i]} ${w.dots[i + 1]}h0`;
  const pm = project(w, 0, -50);

  const arcs = list.map(({ o, xy }, i) => `<path class="map__arc" data-origin="${o.id}" d="${arcPath(xy, home)}" pathLength="1" style="transition-delay:${(i * 0.14).toFixed(2)}s"/>`).join('');
  const travelers = list.map(({ o, xy, dist }, i) => `<circle r="1.9" fill="#f2e6a8"><animateMotion dur="${(5 + dist / 2600).toFixed(1)}s" begin="${(i * 0.8).toFixed(1)}s" repeatCount="indefinite" path="${arcPath(xy, home)}"/></circle>`).join('');
  const pins = list.map(({ o, xy }) => `<g class="map__pin" data-origin="${o.id}" transform="translate(${f1(xy[0])} ${f1(xy[1])})" tabindex="0" role="button" aria-label="${esc(o.city)}, ${esc(o.country)}"><circle class="ring" r="6"/><circle class="core" r="3.2"/><circle r="14" fill="transparent"/></g>`).join('');

  const rows = list.map(({ o, dist }, i) => `<button class="ledger__row" type="button" data-origin="${o.id}"><i class="num">${String(i + 1).padStart(2, '0')}</i><b>${esc(o.city)}<small>${esc(roles[o.id] || o.craft)} · ${esc(o.country)}</small></b><span class="num">${km(dist)}</span></button>`).join('');

  container.innerHTML = `
    <div class="map${compact ? ' map--compact' : ''}">
      <div class="map__stage">
        <svg class="map__svg" viewBox="0 0 ${w.width} ${w.height}" role="img" aria-label="World map with routes from ${list.length} workshops to the London atelier">
          <path class="map__sphere" d="${w.sphere}"/>
          <path class="map__grat" d="${w.graticule}"/>
          <path class="map__eq" d="${w.equator}"/>
          <path class="map__prime" d="${w.primeMeridian}"/>
          <text class="map__label" x="${f1(pm[0] + 7)}" y="${f1(pm[1])}" fill-opacity=".6">0° Prime meridian</text>
          <path class="map__land" d="${land}"/>
          ${arcs}${travelers}${pins}
          <g class="map__home" transform="translate(${f1(home[0])} ${f1(home[1])})"><circle class="ring" r="8" fill="none" stroke="#d98a5b" stroke-width="1"/><circle class="core" r="4.6"/><text x="-10" y="-11" text-anchor="end">London atelier</text></g>
        </svg>
        <div class="map__card" role="status" aria-live="polite"></div>
      </div>
      <div class="map__side"><div class="ledger" role="list">${rows}</div></div>
    </div>`;

  const root = $('.map', container);
  const stage = $('.map__stage', root);
  const card = $('.map__card', root);
  let hideTimer;

  const hot = (id) => $$('[data-origin]', root).forEach((n) => n.classList.toggle('is-hot', n.dataset.origin === id));
  const showCard = (id) => {
    clearTimeout(hideTimer);
    const entry = list.find((e) => e.o.id === id);
    if (!entry) return;
    const { o, xy, dist } = entry;
    const users = cat.pieces.filter((p) => p.journey?.some((j) => j.origin === o.id));
    const px = (xy[0] / w.width) * 100;
    const py = (xy[1] / w.height) * 100;
    const above = py > 52;
    card.style.left = `${clamp(px, 22, 78)}%`;
    card.style.top = `${py}%`;
    card.style.setProperty('--y', above ? 'calc(-100% - 18px)' : '18px');
    card.innerHTML = `<div class="eyebrow">${esc(o.region)} · ${esc(o.country)}</div><h4>${esc(o.city)}</h4><p>${esc(o.blurb)}</p><dl><dt>Craft</dt><dd>${esc(o.craft)}</dd><dt>Position</dt><dd class="num">${coord(o.lat, o.lon)}</dd><dt>To London</dt><dd class="num">${km(dist)}</dd>${users.length ? `<dt>Found in</dt><dd>${users.map((p) => `<a href="/pieces/${p.slug}" data-link style="text-decoration:underline">${esc(p.short)}</a>`).join(', ')}</dd>` : ''}</dl>`;
    card.classList.add('is-on');
    hot(id);
  };
  const hideCard = (delay = 280) => {
    hideTimer = setTimeout(() => { card.classList.remove('is-on'); hot(null); }, delay);
  };

  $$('.map__pin, .ledger__row', root).forEach((n) => {
    const id = n.dataset.origin;
    n.addEventListener('mouseenter', () => showCard(id));
    n.addEventListener('focus', () => showCard(id));
    n.addEventListener('mouseleave', () => hideCard());
    n.addEventListener('blur', () => hideCard());
    n.addEventListener('click', (e) => { e.stopPropagation(); showCard(id); });
  });
  card.addEventListener('mouseenter', () => clearTimeout(hideTimer));
  card.addEventListener('mouseleave', () => hideCard());
  stage.addEventListener('click', (e) => { if (!e.target.closest('.map__pin, .map__card')) hideCard(0); });

  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { root.classList.add('is-in'); io.disconnect(); }
  }, { threshold: 0.25 });
  io.observe(root);

  return () => { io.disconnect(); clearTimeout(hideTimer); };
}
