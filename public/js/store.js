// Catalog, configuration math, the bag, and form submissions.
// The catalog comes from Firestore when reachable and falls back to the bundled copy, so the site always renders.
import { withTimeout } from './util.js';

const KEY = 'mv.bag.v1';

export const state = { catalog: null, bag: readBag() };
const subscribers = new Set();

function readBag() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state.bag)); } catch { /* storage unavailable */ }
  subscribers.forEach((fn) => fn());
}
export const onBagChange = (fn) => { subscribers.add(fn); return () => subscribers.delete(fn); };

/* ---------- catalog ---------- */
let pending;
export const loadCatalog = () => (pending ??= fetchCatalog());

async function fetchCatalog() {
  const bundled = await fetch('/data/catalog.json').then((r) => r.json());
  let live = null;
  try {
    const fb = await import('./fb.js');
    live = await withTimeout(fb.fetchCatalog(), 2800);
  } catch (err) {
    console.info('Catalog: using the bundled copy.', err?.message || err);
  }
  const cat = live?.pieces?.length
    ? { ...bundled, pieces: live.pieces, origins: live.origins?.length ? live.origins : bundled.origins, source: 'firestore' }
    : { ...bundled, source: 'bundled' };
  return prepare(cat);
}

const normalizePiece = (p) => ({ ...p, details: (p.details || []).map((d) => (Array.isArray(d) ? { label: d[0], value: d[1] } : d)) });

function prepare(cat) {
  cat.pieces = cat.pieces.map(normalizePiece).sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  cat.originById = Object.fromEntries(cat.origins.map((o) => [o.id, o]));
  cat.pieceBySlug = Object.fromEntries(cat.pieces.map((p) => [p.slug, p]));
  state.catalog = cat;
  return cat;
}

/* ---------- configuration ---------- */
export const sizeOf = (p, id) => p.sizes.find((s) => s.id === id) || p.sizes.find((s) => s.id === p.defaultSize) || p.sizes[0];
export const colorOf = (p, id) => p.colorways.find((c) => c.id === id) || p.colorways[0];
export const legsOf = (p, id) => p.legs.find((l) => l.id === id) || p.legs[0];
export const defaultConfig = (p) => ({ size: p.defaultSize, color: p.colorways[0].id, legs: p.legs[0].id });
export const priceFor = (p, cfg) => p.price + sizeOf(p, cfg.size).delta + legsOf(p, cfg.legs).delta;

export function specFor(p, cfg) {
  const size = sizeOf(p, cfg.size);
  const color = colorOf(p, cfg.color);
  const legs = legsOf(p, cfg.legs);
  return { model: p.model, seats: size.seats, color: color.hex, fabric: p.material.fabric, legs: legs.finish, accent: color.accent || p.accent, accent2: p.accent2 };
}

/* ---------- bag ---------- */
export const bagCount = () => state.bag.reduce((n, l) => n + l.qty, 0);

export function addToBag(slug, cfg) {
  const key = `${slug}|${cfg.size}|${cfg.color}|${cfg.legs}`;
  const found = state.bag.find((l) => l.key === key);
  if (found) found.qty = Math.min(9, found.qty + 1);
  else state.bag.push({ key, slug, size: cfg.size, color: cfg.color, legs: cfg.legs, qty: 1 });
  persist();
}

export function setQty(key, qty) {
  const line = state.bag.find((l) => l.key === key);
  if (!line) return;
  if (qty <= 0) state.bag = state.bag.filter((l) => l.key !== key);
  else line.qty = Math.min(9, qty);
  persist();
}

export function clearBag() {
  state.bag = [];
  persist();
}

export function resolveBag(cat = state.catalog) {
  if (!cat) return [];
  return state.bag
    .map((l) => {
      const piece = cat.pieceBySlug[l.slug];
      if (!piece) return null;
      const cfg = { size: l.size, color: l.color, legs: l.legs };
      const unit = priceFor(piece, cfg);
      return { key: l.key, slug: l.slug, qty: l.qty, piece, cfg, unit, total: unit * l.qty, sizeOpt: sizeOf(piece, l.size), colorOpt: colorOf(piece, l.color), legsOpt: legsOf(piece, l.legs), spec: specFor(piece, cfg) };
    })
    .filter(Boolean);
}

export const bagTotal = () => resolveBag().reduce((n, l) => n + l.total, 0);

/* ---------- forms ---------- */
export async function subscribe(email) {
  const fb = await import('./fb.js');
  await withTimeout(fb.addSubscriber(email), 12000);
}

export async function reserve({ name, email, note }) {
  const lines = resolveBag();
  if (!lines.length) throw new Error('empty-bag');
  const fb = await import('./fb.js');
  const items = lines.map((l) => ({ slug: l.slug, name: l.piece.name, size: l.sizeOpt.label, color: l.colorOpt.name, legs: l.legsOpt.name, qty: l.qty, unit: l.unit }));
  const subtotal = lines.reduce((n, l) => n + l.total, 0);
  await withTimeout(fb.addReservation({ name, email, note, items, subtotal }), 12000);
}
