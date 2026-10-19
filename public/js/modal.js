// The fabric close-up dialog.
import { $, esc, coord, arrow } from './util.js';
import { fabricSVG } from './art-scenes.js';
import { colorOf } from './store.js';

let lastFocus = null;

export function openFabric(cat, slug, colorId) {
  const p = cat.pieceBySlug[slug];
  if (!p) return;
  const c = colorOf(p, colorId);
  const o = cat.originById[p.material.origin];
  const panel = $('#modalPanel');
  panel.innerHTML = `
    <button class="iconbtn modal__close" type="button" data-close aria-label="Close"><svg viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M14 2 2 14" stroke="currentColor" stroke-width="1.2"/></svg></button>
    <div class="modal__art" id="fabricArt">${fabricSVG(p.material.fabric, c.hex, { label: `${p.material.name} in ${c.name}` })}</div>
    <div class="modal__info">
      <div class="eyebrow">${esc(o.city)}, ${esc(o.country)} · ${coord(o.lat, o.lon)}</div>
      <h3>${esc(p.material.name)}</h3>
      <p class="dim">${esc(o.blurb)}</p>
      <p>Shown in <b style="font-weight:500">${esc(c.name)}</b>. ${esc(p.material.care)}</p>
      <div class="zoom" style="position:static;transform:none;width:max-content"><label for="mz">Zoom</label><input id="mz" type="range" min="1" max="3" step="0.1" value="1"></div>
      <div><a class="btn btn--solid" href="/pieces/${p.slug}" data-link data-close>Shop the ${esc(p.short)} ${arrow}</a></div>
    </div>`;
  let raf = 0;
  $('#mz', panel).addEventListener('input', (e) => {
    const zoom = Number(e.target.value);
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; $('#fabricArt', panel).innerHTML = fabricSVG(p.material.fabric, c.hex, { zoom, label: `${p.material.name} in ${c.name}` }); });
  });
  lastFocus = document.activeElement;
  const modal = $('#modal');
  modal.classList.add('is-on');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-locked');
  $('.modal__close', panel).focus();
}

export function closeModal() {
  const modal = $('#modal');
  if (!modal.classList.contains('is-on')) return;
  modal.classList.remove('is-on');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('is-locked');
  lastFocus?.focus?.();
}
