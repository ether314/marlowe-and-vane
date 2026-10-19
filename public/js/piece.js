// Product page: configurator, four ways to see the piece (studio, room, scale, fabric), passport, and journey map.
import { $, $$, esc, money, coord, arrow, docNumber } from './util.js';
import { studioSVG, sofaDims } from './art.js';
import { roomSVG, scaleSVG, fabricSVG, swatchSVG } from './art-scenes.js';
import { sealSVG } from './marks.js';
import { defaultConfig, specFor, sizeOf, colorOf, legsOf, priceFor, addToBag } from './store.js';
import { renderMap } from './map.js';
import { cardHTML, mountCards } from './catalog.js';
import { observeReveals } from './reveal.js';

const STAGE_VB = '-150 -118 300 182';
const inch = (cm) => Math.round(cm / 2.54);
const delta = (n) => (n ? ` · ${n > 0 ? '+' : '–'}${money(Math.abs(n))}` : '');

const truck = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M1.5 5.5h10v8h-10zM11.5 8h4l3 3v2.5h-7" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/><circle cx="5.5" cy="14.5" r="1.7" fill="#2e3a23" stroke="currentColor" stroke-width="1.1"/><circle cx="14.5" cy="14.5" r="1.7" fill="#2e3a23" stroke="currentColor" stroke-width="1.1"/></svg>';

const notFound = (slug) => `
  <section class="page-head"><div class="wrap"><div class="eyebrow">Not found</div><h1>That piece has <em class="amp">wandered off</em>.</h1>
  <p class="lede" style="margin:24px 0 32px">We couldn't find “${esc(slug)}”. It may have been retired from the collection.</p>
  <a class="btn btn--solid" href="/collection" data-link>Browse the collection ${arrow}</a></div></section>`;

export const pieceView = {
  meta(cat, m) {
    const p = cat.pieceBySlug[m[1]];
    if (!p) return { title: 'Not found · Marlowe & Vane', description: '' };
    return { title: `${p.name} · ${p.type} · Marlowe & Vane`, description: `${p.tagline} ${p.description.split('. ')[0]}.` };
  },

  render(cat, m) {
    const p = cat.pieceBySlug[m[1]];
    if (!p) return notFound(m[1]);
    const cfg = defaultConfig(p);

    const colors = p.colorways
      .map((c) => `<button class="cw" type="button" data-opt="color" data-id="${c.id}" aria-pressed="${c.id === cfg.color}" aria-label="${esc(c.name)}"><div class="swatch__disc">${swatchSVG(p.material.fabric, c.hex)}</div><span>${esc(c.name)}</span></button>`)
      .join('');
    const sizes = p.sizes
      .map((s) => `<button class="pill" type="button" data-opt="size" data-id="${s.id}" aria-pressed="${s.id === cfg.size}">${esc(s.label)}<small>${sofaDims({ model: p.model, seats: s.seats }).w} cm${delta(s.delta)}</small></button>`)
      .join('');
    const legs = p.legs
      .map((l) => `<button class="pill" type="button" data-opt="legs" data-id="${l.id}" aria-pressed="${l.id === cfg.legs}">${esc(l.name)}${l.delta ? `<small>${delta(l.delta).slice(3)}</small>` : ''}</button>`)
      .join('');

    const journey = p.journey
      .map((j) => {
        const o = cat.originById[j.origin];
        return `<li><div><b>${esc(o.city)}</b><small>${esc(j.role)} · ${esc(o.country)}</small></div><span class="num">${coord(o.lat, o.lon, ' ')}</span></li>`;
      })
      .join('');

    const dims = p.sizes
      .map((s) => {
        const d = sofaDims({ model: p.model, seats: s.seats });
        return `<dt>${esc(s.label)}</dt><dd class="num">${d.w} × ${d.d} × ${d.h} cm<br><span class="dim">${inch(d.w)} × ${inch(d.d)} × ${inch(d.h)} in · seat ${d.seatH} cm</span></dd>`;
      })
      .join('');

    const related = cat.pieces.filter((x) => x.slug !== p.slug).slice(0, 3);

    return `
    <article class="wrap pdp" data-piece="${p.slug}">
      <div class="pdp__gallery">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/" data-link>Home</a><span>/</span><a href="/collection" data-link>Collection</a><span>/</span><span aria-current="page">${esc(p.name)}</span></nav>
        <div class="stage" id="stage">
          <div class="stage__tools"><div class="stage__caption" id="caption"></div><div id="tools"></div></div>
          <div class="stage__view stage__view--studio is-on" data-view="studio"></div>
          <div class="stage__view stage__view--room" data-view="room"></div>
          <div class="stage__view stage__view--scale" data-view="scale"></div>
          <div class="stage__view stage__view--fabric" data-view="fabric"></div>
          <div class="zoom" id="zoom" hidden><label for="zoomRange">Zoom</label><input id="zoomRange" type="range" min="1" max="3" step="0.1" value="1"></div>
        </div>
        <div class="viewtabs" role="tablist" aria-label="Ways to view this piece">
          <button type="button" role="tab" aria-selected="true" data-tab="studio">Studio</button>
          <button type="button" role="tab" aria-selected="false" data-tab="room">Room</button>
          <button type="button" role="tab" aria-selected="false" data-tab="scale">Scale</button>
          <button type="button" role="tab" aria-selected="false" data-tab="fabric">Fabric</button>
        </div>
      </div>

      <div class="pdp__info">
        <div><div class="eyebrow" style="margin-bottom:14px">${esc(p.type)} · ${esc(p.material.name)}</div><h1>${esc(p.name)}</h1></div>
        <p class="pdp__tag">${esc(p.tagline)}</p>
        <div class="pdp__price"><b id="price" class="num">${money(priceFor(p, cfg))}</b><span id="sizeNote"></span></div>
        <p>${esc(p.description)}</p>

        <div class="opt"><div class="opt__label"><span>Upholstery</span><b id="colorName"></b></div><div class="opt__row" id="optColor">${colors}</div></div>
        <div class="opt"><div class="opt__label"><span>Size</span><b id="sizeName"></b></div><div class="opt__row" id="optSize">${sizes}</div></div>
        <div class="opt"><div class="opt__label"><span>Legs</span><b id="legsName"></b></div><div class="opt__row" id="optLegs">${legs}</div></div>

        <div class="pdp__cta">
          <button class="btn btn--solid btn--block" id="add" type="button">Add to bag ${arrow}</button>
          <div class="pdp__note">${truck}<span>Made to order. Ships in ${p.leadWeeks[0]}–${p.leadWeeks[1]} weeks with white-glove delivery and assembly.</span></div>
        </div>

        <div>
          <details class="acc" open>
            <summary>Passport</summary>
            <div class="acc__body">
              <div style="display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:12px"><p class="dim" style="font-size:13px;letter-spacing:.2em;text-transform:uppercase">No. ${docNumber(p.slug)} · Certificate of origin</p><div style="width:64px;flex:none;color:var(--butter)">${sealSVG({ ink: '#f2e6a8' })}</div></div>
              <ul class="journey">${journey}</ul>
            </div>
          </details>
          <details class="acc"><summary>Details</summary><div class="acc__body"><dl class="spec">${p.details.map((d) => `<dt>${esc(d.label)}</dt><dd>${esc(d.value)}</dd>`).join('')}</dl></div></details>
          <details class="acc"><summary>Dimensions</summary><div class="acc__body"><dl class="spec">${dims}</dl></div></details>
          <details class="acc"><summary>Care and delivery</summary><div class="acc__body"><p>${esc(p.material.care)}</p><p>Every piece is inspected at the atelier, then delivered by our own team, placed where you like, and the packaging taken away.</p></div></details>
        </div>
      </div>
    </article>

    <section class="section section--deep pdp-more">
      <div class="wrap">
        <div class="section__head"><div class="eyebrow reveal">The journey</div><h2 class="reveal" style="--d:.08s">Where the ${esc(p.short)} <em class="amp">travels from</em>.</h2></div>
        <div id="journeyMap" class="reveal"></div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="section__head"><div class="eyebrow reveal">Pairs well with</div><h2 class="reveal" style="--d:.08s">More from the <em class="amp">collection</em></h2></div>
        <div class="grid-cards" id="related">${related.map((x, i) => cardHTML(cat, x, i)).join('')}</div>
      </div>
    </section>`;
  },

  mount(root, cat, m) {
    const p = cat.pieceBySlug[m[1]];
    if (!p) return null;

    let cfg = defaultConfig(p);
    let view = 'studio';
    let time = 'day';
    let unit = 'cm';
    let zoom = 1;
    const stale = new Set(['studio', 'room', 'scale', 'fabric']);
    const views = Object.fromEntries($$('.stage__view', root).map((v) => [v.dataset.view, v]));
    const color = () => colorOf(p, cfg.color);
    const legs = () => legsOf(p, cfg.legs);
    const spec = () => specFor(p, cfg);

    const draw = {
      studio: () => studioSVG(spec(), { padX: 30, top: 24, bottom: 58, reflection: true, label: `${p.name} in ${color().name}, studio view` }),
      room: () => roomSVG(spec(), p.scene, { time, label: `${p.name} in a styled room, ${time === 'day' ? 'daytime' : 'evening'}` }),
      scale: () => scaleSVG(spec(), { unit, label: `${p.name} drawn to scale beside a person and a side table` }),
      fabric: () => fabricSVG(p.material.fabric, color().hex, { zoom, label: `Close-up of ${p.material.name} in ${color().name}` }),
    };
    const captions = {
      studio: () => `${color().name} · ${legs().name}`,
      room: () => 'In a styled drawing room',
      scale: () => 'Drawn to scale beside a 178 cm figure',
      fabric: () => `${p.material.name} · ${color().name}`,
    };
    const paint = (v) => {
      if (stale.has(v)) { views[v].innerHTML = draw[v](); stale.delete(v); }
    };

    const tools = $('#tools', root);
    const renderTools = () => {
      if (view === 'room') tools.innerHTML = `<div class="seg" role="group" aria-label="Time of day"><button type="button" data-time="day" aria-pressed="${time === 'day'}">Day</button><button type="button" data-time="dusk" aria-pressed="${time === 'dusk'}">Dusk</button></div>`;
      else if (view === 'scale') tools.innerHTML = `<div class="seg" role="group" aria-label="Units"><button type="button" data-unit="cm" aria-pressed="${unit === 'cm'}">cm</button><button type="button" data-unit="in" aria-pressed="${unit === 'in'}">in</button></div>`;
      else tools.innerHTML = '';
    };
    tools.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.time) { time = b.dataset.time; stale.add('room'); }
      if (b.dataset.unit) { unit = b.dataset.unit; stale.add('scale'); }
      paint(view);
      renderTools();
    });

    const show = (v) => {
      view = v;
      paint(v);
      $$('.stage__view', root).forEach((s) => s.classList.toggle('is-on', s.dataset.view === v));
      $$('[data-tab]', root).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === v)));
      $('#zoom', root).hidden = v !== 'fabric';
      $('#caption', root).textContent = captions[v]();
      renderTools();
    };
    $$('[data-tab]', root).forEach((b) => b.addEventListener('click', () => show(b.dataset.tab)));

    const update = () => {
      const size = sizeOf(p, cfg.size);
      $('#price', root).textContent = money(priceFor(p, cfg));
      $('#sizeNote', root).textContent = `${size.label} · ${sofaDims({ model: p.model, seats: size.seats }).w} cm wide`;
      $('#colorName', root).textContent = color().name;
      $('#sizeName', root).textContent = size.label;
      $('#legsName', root).textContent = legs().name;
      ['studio', 'room', 'scale', 'fabric'].forEach((v) => stale.add(v));
      paint(view);
      $('#caption', root).textContent = captions[view]();
    };

    $('.pdp__info', root).addEventListener('click', (e) => {
      const b = e.target.closest('[data-opt]');
      if (!b) return;
      cfg = { ...cfg, [b.dataset.opt]: b.dataset.id };
      $$(`[data-opt="${b.dataset.opt}"]`, root).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      update();
    });

    let raf = 0;
    $('#zoomRange', root).addEventListener('input', (e) => {
      zoom = Number(e.target.value);
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; stale.add('fabric'); paint('fabric'); });
    });

    $('#add', root).addEventListener('click', () => {
      addToBag(p.slug, cfg);
      document.dispatchEvent(new CustomEvent('bag:open'));
    });

    update();
    mountCards($('#related', root), cat);
    observeReveals(root);

    let stopMap = null;
    renderMap($('#journeyMap', root), cat, {
      origins: p.journey.map((j) => cat.originById[j.origin]),
      roles: Object.fromEntries(p.journey.map((j) => [j.origin, j.role])),
      compact: true,
    }).then((fn) => { stopMap = fn; });

    return () => { stopMap?.(); if (raf) cancelAnimationFrame(raf); };
  },
};
