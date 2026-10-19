// Brand marks drawn in code: the weathervane, round seal, scalloped badge, arch badge, and passport stamps.
import { esc } from './util.js';

let counter = 0;
const uid = (p) => `mk${p}${++counter}`;

const vanePaths = (ink, sw = 2) => `
  <path d="M36 20V68" stroke="${ink}" stroke-width="${sw * 1.2}"/>
  <path d="M14 20H54" stroke="${ink}" stroke-width="${sw * 1.3}"/>
  <path d="M60 20 48 14v12Z" fill="${ink}"/>
  <path d="M14 20 8 14M14 20 8 26M22 20 16 14M22 20 16 26" stroke="${ink}" stroke-width="${sw}" stroke-linecap="round"/>
  <circle cx="36" cy="20" r="2.6" stroke="${ink}" stroke-width="${sw}"/>
  <path d="M25 46H47" stroke="${ink}" stroke-width="${sw}"/>
  <circle cx="36" cy="46" r="3" stroke="${ink}" stroke-width="${sw}"/>`;

export const vaneMark = (ink = 'currentColor') => `<svg viewBox="0 0 72 72" fill="none" aria-hidden="true">${vanePaths(ink)}</svg>`;

// Round seal: lettering on a circle around the weathervane.
export function sealSVG({ ink = '#2e3a23', top = 'MARLOWE &amp; VANE', bottom = 'FINE SEATING' } = {}) {
  const a = uid('t');
  const b = uid('b');
  return `<svg viewBox="0 0 136 136" fill="none" aria-hidden="true">
    <defs><path id="${a}" d="M20 68A48 48 0 0 1 116 68"/><path id="${b}" d="M12 68A56 56 0 0 0 124 68"/></defs>
    <circle cx="68" cy="68" r="63" stroke="${ink}" stroke-width="1.1"/>
    <circle cx="68" cy="68" r="43" stroke="${ink}" stroke-width=".7"/>
    <text font-family="Marcellus, serif" font-size="10.5" letter-spacing="2.4" fill="${ink}"><textPath href="#${a}" startOffset="50%" text-anchor="middle">${top}</textPath></text>
    <text font-family="Marcellus, serif" font-size="10.5" letter-spacing="2.4" fill="${ink}"><textPath href="#${b}" startOffset="50%" text-anchor="middle">${bottom}</textPath></text>
    <g transform="translate(68 68) scale(.62) translate(-36 -44)">${vanePaths(ink, 1.8)}</g>
  </svg>`;
}

function scallopPath(n = 16, R = 64, cx = 72, cy = 72) {
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i * 2 * Math.PI) / n - Math.PI / 2;
    return [cx + R * Math.cos(a), cy + R * Math.sin(a)];
  });
  const rad = R * Math.sin(Math.PI / n) * 1.06;
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i <= n; i++) {
    const p = pts[i % n];
    d += `A${rad.toFixed(1)} ${rad.toFixed(1)} 0 0 1 ${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  }
  return `${d}Z`;
}

// Scalloped certificate badge with the MV monogram.
export function scallopSVG({ ink = '#2e3a23' } = {}) {
  return `<svg viewBox="0 0 144 144" fill="none" aria-hidden="true">
    <path d="${scallopPath()}" stroke="${ink}" stroke-width="1.4"/>
    <path d="${scallopPath(16, 56)}" stroke="${ink}" stroke-width=".6" stroke-opacity=".6"/>
    <text x="40" y="82" font-family="'Playfair Display', serif" font-size="46" fill="${ink}">M</text>
    <text x="70" y="108" font-family="'Playfair Display', serif" font-size="46" fill="${ink}">V</text>
    <path d="M44 100 46.2 107.8 54 110 46.2 112.2 44 120 41.8 112.2 34 110 41.8 107.8Z" fill="${ink}"/>
  </svg>`;
}

// Arch badge for the footer: an arched window holding the weathervane and the name.
export function archSVG({ ink = '#f2e6a8' } = {}) {
  return `<svg viewBox="0 0 112 146" fill="none" aria-hidden="true">
    <path d="M8 142V58a48 48 0 0 1 96 0v84Z" stroke="${ink}" stroke-width="1.1"/>
    <g transform="translate(40 22) scale(.44)">${vanePaths(ink, 2)}</g>
    <text x="56" y="88" text-anchor="middle" font-family="Marcellus, serif" font-size="12" letter-spacing="3.4" fill="${ink}">MARLOWE</text>
    <text x="56" y="106" text-anchor="middle" font-family="Marcellus, serif" font-size="12" letter-spacing="3.4" fill="${ink}">&amp; VANE</text>
    <path d="M46 120H66" stroke="${ink}" stroke-width="1"/>
  </svg>`;
}

// Passport stamp for one workshop.
function stampName(city) {
  const words = city.split(' ');
  const two = words.slice(0, 2).join(' ');
  return (two.length <= 12 ? two : words[0]).toUpperCase();
}
export function stampSVG(o) {
  const a = uid('s');
  const b = uid('c');
  const lat = `${Math.abs(o.lat).toFixed(1)}° ${o.lat >= 0 ? 'N' : 'S'}`;
  const lon = `${Math.abs(o.lon).toFixed(1)}° ${o.lon >= 0 ? 'E' : 'W'}`;
  return `<svg viewBox="0 0 80 80" fill="none" aria-hidden="true">
    <defs><path id="${a}" d="M11 40A29 29 0 0 1 69 40"/><path id="${b}" d="M7 40A33 33 0 0 0 73 40"/></defs>
    <circle cx="40" cy="40" r="37.5" stroke="currentColor" stroke-width="1.5"/>
    <circle cx="40" cy="40" r="24" stroke="currentColor" stroke-width=".9"/>
    <text font-family="Marcellus, serif" font-size="7.4" letter-spacing="1.1" fill="currentColor"><textPath href="#${a}" startOffset="50%" text-anchor="middle">${esc(stampName(o.city))}</textPath></text>
    <text font-family="Marcellus, serif" font-size="6.6" letter-spacing="1.1" fill="currentColor"><textPath href="#${b}" startOffset="50%" text-anchor="middle">${esc(o.country.toUpperCase())}</textPath></text>
    <text x="40" y="37.5" text-anchor="middle" font-family="Jost, sans-serif" font-size="5.6" letter-spacing=".6" fill="currentColor">${lat}</text>
    <text x="40" y="46" text-anchor="middle" font-family="Jost, sans-serif" font-size="5.6" letter-spacing=".6" fill="currentColor">${lon}</text>
  </svg>`;
}
