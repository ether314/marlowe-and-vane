// Scenes built around the procedural sofas: a styled room, a scale drawing, and fabric close-ups.
// All geometry is in centimeters, matching art.js.
import { sofaGroup, sofaDims, rr, shade, FABRICS, patternMarkup, esc } from './art.js';

let counter = 0;
const nid = (p) => `sc-${p}${++counter}`;
const n = (v) => Math.round(v * 100) / 100;

/* ---------- styled room ---------- */
export function roomSVG(spec, scene = {}, o = {}) {
  const dusk = o.time === 'dusk';
  const wall = scene.wall || '#4A5A35';
  const rug = scene.rug || '#8A6A4A';
  const rug2 = scene.rug2 || '#E7DAC3';
  const art = scene.art || ['#D98A5B', '#E7DAC3', '#5A3D2B'];
  const g = sofaGroup(spec);
  const I = { wall: nid('w'), floor: nid('f'), sky: nid('sk'), beam: nid('bm'), glow: nid('gl'), vig: nid('vg'), cur: nid('cu'), top: nid('tp'), blur: nid('bl') };
  const floorY = 38;
  const frame = '#e9e2cc';
  const wood = '#4a3524';

  const defs = `
    <linearGradient id="${I.wall}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(wall, -0.2)}"/><stop offset=".32" stop-color="${wall}"/><stop offset="1" stop-color="${shade(wall, -0.1)}"/></linearGradient>
    <linearGradient id="${I.floor}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5e4530"/><stop offset="1" stop-color="#9c7a52"/></linearGradient>
    <linearGradient id="${I.sky}" x1="0" y1="0" x2="0" y2="1">${dusk
      ? '<stop offset="0" stop-color="#6e3d2d"/><stop offset=".55" stop-color="#d98a5b"/><stop offset="1" stop-color="#f2c98a"/>'
      : '<stop offset="0" stop-color="#f6e9b6"/><stop offset="1" stop-color="#fdf6d9"/>'}</linearGradient>
    <linearGradient id="${I.beam}" x1="0" y1="0" x2="1" y2="0.2"><stop offset="0" stop-color="${dusk ? '#ffb878' : '#fff1bf'}" stop-opacity="${dusk ? 0.38 : 0.36}"/><stop offset="1" stop-color="${dusk ? '#ffb878' : '#fff1bf'}" stop-opacity="0"/></linearGradient>
    <radialGradient id="${I.glow}"><stop offset="0" stop-color="#ffd58a" stop-opacity="${dusk ? 0.7 : 0.18}"/><stop offset="1" stop-color="#ffd58a" stop-opacity="0"/></radialGradient>
    <radialGradient id="${I.vig}" cx=".5" cy=".46" r=".78"><stop offset=".5" stop-color="#0b0806" stop-opacity="0"/><stop offset="1" stop-color="#0b0806" stop-opacity=".55"/></radialGradient>
    <linearGradient id="${I.cur}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b9a97f"/><stop offset=".3" stop-color="#e0d3ae"/><stop offset=".55" stop-color="#c4b48a"/><stop offset=".8" stop-color="#dccfa8"/><stop offset="1" stop-color="#b3a37a"/></linearGradient>
    <filter id="${I.blur}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>
    <linearGradient id="${I.top}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0806" stop-opacity=".45"/><stop offset="1" stop-color="#0b0806" stop-opacity="0"/></linearGradient>
    ${g.defs}${g.body}`;

  let panels = '';
  for (let x = -300; x < 300; x += 75) {
    panels += `<rect x="${x + 9}" y="-97" width="57" height="75" fill="none" stroke="${shade(wall, 0.24)}" stroke-opacity=".34" stroke-width=".8"/><rect x="${x + 11.5}" y="-94.5" width="52" height="70" fill="none" stroke="${shade(wall, -0.32)}" stroke-opacity=".3" stroke-width=".6"/>`;
  }

  let planks = '';
  for (let r = 0, y = 0; y < 84; r++, y += 9) {
    planks += `<path d="M-300 ${y}H300" stroke="#1a0f08" stroke-opacity=".18" stroke-width=".5"/>`;
    for (let x = -300 + ((r * 53) % 90); x < 300; x += 90) planks += `<path d="M${x} ${y}V${y + 9}" stroke="#1a0f08" stroke-opacity=".14" stroke-width=".5"/>`;
  }

  const rugBlock = `
    <path d="M-168 22H168L214 80H-214Z" fill="${rug}"/>
    <path d="M-154 28H154L194 74H-194Z" fill="none" stroke="${rug2}" stroke-width="2.2"/>
    <path d="M-140 33H140L174 69H-174Z" fill="none" stroke="${rug2}" stroke-opacity=".6" stroke-width=".8"/>
    <path d="M-100 40H100L120 62H-120Z" fill="${shade(rug, -0.12)}" fill-opacity=".55"/>
    <path d="M-214 80H214" stroke="${rug2}" stroke-width="3" stroke-dasharray="1 2.2" stroke-opacity=".7"/>`;

  const plant = (() => {
    const px = 268; const by = floorY + 2;
    let s = `<path d="M${px - 15} ${by - 30}H${px + 15}L${px + 11} ${by}H${px - 11}Z" fill="#b4603c" stroke="#6e3419" stroke-opacity=".5" stroke-width=".4"/><path d="M${px - 15} ${by - 30}H${px + 15}" stroke="#d98a5b" stroke-width="2"/>`;
    const stems = [[-6, -118, -14], [0, -140, 0], [7, -126, 14], [-2, -96, -4]];
    for (const [dx, ty, bend] of stems) {
      s += `<path d="M${px} ${by - 30}Q${px + bend} ${(by - 30 + ty) / 2} ${px + dx} ${ty}" fill="none" stroke="#3a4a29" stroke-width="1.2"/>`;
      for (let t = 0.3; t <= 1; t += 0.14) {
        const yy = by - 30 + (ty - (by - 30)) * t;
        const xx = px + dx * t + bend * Math.sin(t * Math.PI) * 0.5;
        const rot = (t * 100) % 2 > 1 ? 52 : -52;
        s += `<ellipse cx="${n(xx + (rot > 0 ? 5 : -5))}" cy="${n(yy)}" rx="4.6" ry="10" fill="${t > 0.6 ? '#6f7a4a' : '#55663e'}" transform="rotate(${rot} ${n(xx)} ${n(yy)})"/>`;
      }
    }
    return s;
  })();

  const table = (() => {
    const tx = 170; const y = floorY;
    return `
      <path d="${rr(tx - 23, y - 57, 46, 3.4, 1.2)}" fill="${wood}"/>
      <rect x="${tx - 2}" y="${y - 54}" width="4" height="52" fill="${shade(wood, -0.1)}"/>
      <path d="${rr(tx - 13, y - 2.6, 26, 2.6, 1)}" fill="${wood}"/>
      <path d="${rr(tx - 15, y - 61.2, 25, 4.2, 0.8)}" fill="${art[2]}"/>
      <path d="${rr(tx - 12.5, y - 65.2, 20, 4, 0.8)}" fill="${art[0]}"/>
      <path d="M${tx + 12} ${y - 57}c-3.4-1-4.4-9-1.6-14.5 1-2 1-4 1-6h2.6c0 2 0 4 1 6 2.8 5.5 1.8 13.5-1.6 14.5Z" fill="#cdbf9f" stroke="#7a6d5a" stroke-opacity=".5" stroke-width=".4"/>
      <path d="M${tx + 12.5} ${y - 78}C${tx + 8} ${y - 100} ${tx + 4} ${y - 108} ${tx + 2} ${y - 118}M${tx + 12.5} ${y - 78}C${tx + 14} ${y - 100} ${tx + 17} ${y - 110} ${tx + 20} ${y - 120}M${tx + 12.5} ${y - 78}C${tx + 12} ${y - 98} ${tx + 12} ${y - 108} ${tx + 11} ${y - 124}" fill="none" stroke="#c69a48" stroke-width=".7"/>
      <ellipse cx="${tx + 2}" cy="${y - 118}" rx="1.4" ry="4" fill="#c69a48"/><ellipse cx="${tx + 20}" cy="${y - 120}" rx="1.4" ry="4" fill="#c69a48" transform="rotate(14 ${tx + 20} ${y - 120})"/><ellipse cx="${tx + 11}" cy="${y - 124}" rx="1.4" ry="4.4" fill="#c69a48"/>`;
  })();

  const lamp = (() => {
    const lx = 224; const y = floorY;
    return `
      <path d="${rr(lx - 10, y - 3.4, 20, 3.4, 1.5)}" fill="#c69a48"/>
      <rect x="${lx - 0.9}" y="${y - 158}" width="1.8" height="155" fill="#c69a48"/>
      <path d="M${lx - 16} ${y - 186}H${lx + 16}L${lx + 22} ${y - 152}H${lx - 22}Z" fill="${dusk ? '#f6dca0' : '#e9dcb6'}" stroke="#7a6d5a" stroke-opacity=".5" stroke-width=".5"/>
      <path d="M${lx - 16} ${y - 186}H${lx + 16}" stroke="#fff6dc" stroke-width="1.2" stroke-opacity=".8"/>`;
  })();

  const artwork = (() => {
    const ax = 0; const ay = -190;
    return `
      <path d="${rr(ax - 66, ay - 43, 132, 86, 1)}" fill="${wood}"/>
      <path d="${rr(ax - 62, ay - 39, 124, 78, 0.5)}" fill="#efe6d0"/>
      <path d="${rr(ax - 52, ay - 30, 104, 60, 0.5)}" fill="#e7dac3"/>
      <path d="M${ax - 40} ${ay + 24}V${ay - 8}A16 16 0 0 1 ${ax - 8} ${ay - 8}V${ay + 24}Z" fill="${art[0]}"/>
      <circle cx="${ax + 22}" cy="${ay - 10}" r="14" fill="${art[2]}"/>
      <path d="${rr(ax + 6, ay + 8, 34, 16, 0.5)}" fill="${art[1]}" stroke="${art[2]}" stroke-opacity=".4" stroke-width=".4"/>`;
  })();

  const windowBlock = `
    <g transform="translate(-205 0)">
      <path d="M-50 -62V-195A50 50 0 0 1 50 -195V-62Z" fill="url(#${I.sky})"/>
      <path d="M-50 -62V-195A50 50 0 0 1 50 -195V-62Z" fill="none" stroke="${frame}" stroke-width="5"/>
      <path d="M0 -62V-245M-50 -128H50M-50 -176H50" stroke="${frame}" stroke-width="2.6"/>
      <path d="${rr(-58, -62, 116, 7, 1)}" fill="${frame}"/>
    </g>
    <path d="${rr(-290, -262, 24, 258, 3)}" fill="url(#${I.cur})"/>
    <path d="${rr(-146, -262, 24, 258, 3)}" fill="url(#${I.cur})"/>
    <path d="M-290 -262H-122" stroke="#c69a48" stroke-width="2.4"/>
    <path d="M-156 -236L232 -92V28L-156 -64Z" fill="url(#${I.beam})" filter="url(#${I.blur})"/>`;

  const body = `
    <rect x="-300" y="-300" width="600" height="300" fill="url(#${I.wall})"/>
    <rect x="-300" y="-300" width="600" height="34" fill="url(#${I.top})"/>
    <rect x="-300" y="-252" width="600" height="3" fill="${shade(wall, 0.16)}"/>
    <rect x="-300" y="-108" width="600" height="4" fill="${shade(wall, 0.14)}"/>
    ${panels}
    <rect x="-300" y="-14" width="600" height="14" fill="${shade(wall, 0.1)}"/>
    <rect x="-300" y="-14.6" width="600" height="1.2" fill="${shade(wall, 0.3)}" fill-opacity=".6"/>
    ${artwork}
    <rect x="-300" y="0" width="600" height="84" fill="url(#${I.floor})"/>
    ${planks}
    <rect x="-300" y="0" width="600" height="16" fill="#0b0806" fill-opacity=".28"/>
    ${rugBlock}
    ${plant}${table}${lamp}
    <g transform="translate(0 ${floorY})"><ellipse cx="46" cy="3" rx="${n(g.W * 0.55)}" ry="9" fill="#0b0806" fill-opacity=".26"/>${g.shadow}<use href="#${g.id}b"/></g>
    ${dusk ? '<rect x="-300" y="-300" width="600" height="384" fill="#150d07" fill-opacity=".4"/>' : ''}
    ${windowBlock}
    <circle cx="224" cy="${floorY - 168}" r="${dusk ? 150 : 100}" fill="url(#${I.glow})"/>
    <rect x="-300" y="-300" width="600" height="384" fill="url(#${I.vig})"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-300 -300 600 384" class="${o.class || ''}" role="img" aria-label="${esc(o.label || 'Sofa in a styled room')}" preserveAspectRatio="xMidYMid slice"><defs>${defs}</defs>${body}</svg>`;
}

/* ---------- scale drawing ---------- */
export function scaleSVG(spec, o = {}) {
  const g = sofaGroup(spec);
  const dims = sofaDims(spec);
  const unit = o.unit === 'in' ? 'in' : 'cm';
  const fmt = (cm) => (unit === 'in' ? `${Math.round(cm / 2.54)} in` : `${Math.round(cm)} cm`);
  const ink = o.ink || '#F2E6A8';
  const x0 = -g.W / 2; const x1 = g.W / 2;
  const left = x0 - 120; const right = x1 + 128;
  const topY = -Math.max(g.H, 178) - 38; const botY = 44;
  const hx = x0 - 62;
  const tx = x1 + 58;
  const text = (x, y, s, extra = '') => `<text x="${n(x)}" y="${n(y)}" font-family="Jost, sans-serif" font-size="6.4" letter-spacing=".7" fill="${ink}" text-anchor="middle"${extra}>${s}</text>`;

  let grid = '';
  for (let x = Math.ceil(left / 50) * 50; x <= right; x += 50) grid += `<path d="M${x} ${topY}V${botY - 18}" stroke="${ink}" stroke-opacity=".07" stroke-width=".4"/>`;
  for (let y = 0; y >= topY; y -= 50) grid += `<path d="M${left} ${y}H${right}" stroke="${ink}" stroke-opacity=".07" stroke-width=".4"/>`;

  let hatch = '';
  for (let x = Math.ceil(left / 6) * 6; x < right; x += 6) hatch += `M${x} 0l-3 4`;

  const human = `
    <g fill="${ink}" fill-opacity=".9">
      <circle cx="${hx}" cy="-166.5" r="10.2"/>
      <path d="M${hx - 3.4} -157H${hx + 3.4}V-150H${hx - 3.4}Z"/>
      <path d="M${hx - 21} -149Q${hx} -157 ${hx + 21} -149L${hx + 24} -86L${hx + 16} -56H${hx - 16}L${hx - 24} -86Z"/>
      <path d="M${hx - 14} -58H${hx - 2}L${hx - 3.5} -3Q${hx - 3.5} 0 ${hx - 7} 0H${hx - 14}Q${hx - 17.5} 0 ${hx - 16} -4Z"/>
      <path d="M${hx + 14} -58H${hx + 2}L${hx + 3.5} -3Q${hx + 3.5} 0 ${hx + 7} 0H${hx + 14}Q${hx + 17.5} 0 ${hx + 16} -4Z"/>
      <path d="M${hx - 22} -147Q${hx - 30} -110 ${hx - 28} -84L${hx - 22} -84Q${hx - 22} -108 ${hx - 17} -143Z"/>
      <path d="M${hx + 22} -147Q${hx + 30} -110 ${hx + 28} -84L${hx + 22} -84Q${hx + 22} -108 ${hx + 17} -143Z"/>
    </g>`;

  const table = `
    <g fill="none" stroke="${ink}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
      <path d="M${tx - 22} -55H${tx + 22}"/><path d="M${tx - 22} -55.1v-2.4H${tx + 22}v2.4"/>
      <path d="M${tx} -55V-2M${tx - 12} -1H${tx + 12}"/>
      <path d="M${tx - 5} -57.5c-3-1-3.6-8-1.4-12.6h12.8c2.2 4.6 1.6 11.6-1.4 12.6"/>
    </g>`;

  const dimH = (xa, xb, y, label) => `
    <g stroke="${ink}" stroke-width=".7" fill="none"><path d="M${n(xa)} ${y}H${n(xb)}"/><path d="M${n(xa)} ${y - 3.4}V${y + 3.4}M${n(xb)} ${y - 3.4}V${y + 3.4}"/><path d="M${n(xa)} ${y}l4-2.2M${n(xa)} ${y}l4 2.2M${n(xb)} ${y}l-4-2.2M${n(xb)} ${y}l-4 2.2"/></g>
    <rect x="${n((xa + xb) / 2 - 24)}" y="${y - 5}" width="48" height="10" fill="#1f2916" fill-opacity=".0"/>${text((xa + xb) / 2, y + 9.4, label)}`;
  const dimV = (x, ya, yb, label, dir = 1) => `
    <g stroke="${ink}" stroke-width=".7" fill="none"><path d="M${x} ${n(ya)}V${n(yb)}"/><path d="M${x - 3.4} ${n(ya)}H${x + 3.4}M${x - 3.4} ${n(yb)}H${x + 3.4}"/><path d="M${x} ${n(ya)}l-2.2 4M${x} ${n(ya)}l2.2 4M${x} ${n(yb)}l-2.2-4M${x} ${n(yb)}l2.2-4"/></g>
    ${text(x + dir * 9, (ya + yb) / 2, label, ` transform="rotate(${dir > 0 ? 90 : -90} ${n(x + dir * 9)} ${n((ya + yb) / 2)})"`)}`;

  const body = `
    ${grid}
    <path d="M${left} 0H${right}" stroke="${ink}" stroke-width="1" stroke-opacity=".75"/>
    <path d="${hatch}" stroke="${ink}" stroke-opacity=".3" stroke-width=".5" fill="none"/>
    <g>${g.shadow}<use href="#${g.id}b"/></g>
    ${human}${table}
    ${text(hx, -184, fmt(178))}
    <path d="M${hx - 12} -178.4H${hx + 12}" stroke="${ink}" stroke-width=".5" stroke-dasharray="1.4 1.4"/>
    ${dimH(x0, x1, 20, `${fmt(dims.w)}  wide`)}
    ${dimV(x1 + 22, -dims.h, 0, `${fmt(dims.h)}  high`, 1)}
    ${dimV(x0 - 22, -dims.seatH, 0, `seat ${fmt(dims.seatH)}`, -1)}
    <path d="M${x0 - 22} ${-dims.seatH}H${x0 + 4}" stroke="${ink}" stroke-width=".5" stroke-dasharray="1.6 1.6"/>
    ${text(tx, 12, 'side table', ' fill-opacity=".7"')}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n(left)} ${n(topY)} ${n(right - left)} ${n(botY - topY)}" class="${o.class || ''}" role="img" aria-label="${esc(o.label || 'Sofa drawn to scale beside a person and a side table')}" preserveAspectRatio="xMidYMid meet"><defs>${g.defs}${g.body}</defs>${body}</svg>`;
}

/* ---------- fabric close-up ---------- */
const NOISE = { leather: '0.19', boucle: '0.2', linen: '0.02 0.55', canvas: '0.03 0.45', silk: '0.012 0.5', velvet: '0.45', tweed: '0.3' };

export function fabricSVG(fabric, color, o = {}) {
  const fx = FABRICS[fabric] || FABRICS.linen;
  const S = 15 * (o.zoom || 1);
  const gid = nid('fb');
  const pats = fx.patterns.map((p, i) => ({ id: `${gid}p${i}`, markup: patternMarkup(p, `${gid}p${i}`, color, S) }));
  const seam = 'M-10 304C110 262 250 336 410 250';
  const barPx = 5 * S;
  const bx = 200 - barPx / 2;
  let ticks = '';
  for (let i = 0; i <= 5; i++) ticks += `M${n(bx + i * S)} 350v${i % 5 === 0 ? 8 : 5}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" class="${o.class || ''}" role="img" aria-label="${esc(o.label || 'Close-up of the upholstery fabric')}">
<defs>
${pats.map((p) => p.markup).join('')}
<clipPath id="${gid}c"><circle cx="200" cy="200" r="186"/></clipPath>
<linearGradient id="${gid}b" x1="0" y1="0" x2=".2" y2="1"><stop offset="0" stop-color="${shade(color, 0.2)}"/><stop offset=".5" stop-color="${color}"/><stop offset="1" stop-color="${shade(color, -0.3)}"/></linearGradient>
<radialGradient id="${gid}h" cx=".3" cy=".25" r=".85"><stop offset="0" stop-color="#fff3d9" stop-opacity="${n(0.16 + fx.sheen * 0.5)}"/><stop offset=".5" stop-color="#fff3d9" stop-opacity="0"/><stop offset="1" stop-color="#0d0804" stop-opacity=".52"/></radialGradient>
<linearGradient id="${gid}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(color, -0.1)}"/><stop offset=".45" stop-color="${shade(color, 0.28)}"/><stop offset="1" stop-color="${shade(color, -0.2)}"/></linearGradient>
<filter id="${gid}n" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${NOISE[fabric] || '0.2'}" numOctaves="3" seed="6"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .7 -.26"/></filter>
</defs>
<g clip-path="url(#${gid}c)">
<rect width="400" height="400" fill="url(#${gid}b)"/>
${pats.map((p) => `<rect width="400" height="400" fill="url(#${p.id})"/>`).join('')}
<rect width="400" height="400" filter="url(#${gid}n)"/>
<path d="${seam}" stroke="#0d0804" stroke-opacity=".34" stroke-width="40" fill="none" transform="translate(0 7)"/>
<path d="${seam}" stroke="url(#${gid}s)" stroke-width="28" fill="none" stroke-linecap="round"/>
<path d="${seam}" stroke="${shade(color, 0.5)}" stroke-opacity=".34" stroke-width="7" fill="none" transform="translate(0 -6)"/>
<path d="${seam}" stroke="${shade(color, 0.55)}" stroke-opacity=".85" stroke-width="1.8" stroke-dasharray="8 6" fill="none" transform="translate(0 -26)"/>
<path d="${seam}" stroke="${shade(color, 0.55)}" stroke-opacity=".85" stroke-width="1.8" stroke-dasharray="8 6" fill="none" transform="translate(0 26)"/>
<circle cx="200" cy="200" r="186" fill="url(#${gid}h)"/>
</g>
<circle cx="200" cy="200" r="190" fill="none" stroke="#F2E6A8" stroke-width="3"/>
<circle cx="200" cy="200" r="197" fill="none" stroke="#F2E6A8" stroke-opacity=".35" stroke-width=".8"/>
<path d="M${n(bx)} 350H${n(bx + barPx)}${ticks}" stroke="#F2E6A8" stroke-width="1.5" fill="none"/>
<text x="200" y="378" text-anchor="middle" font-family="Jost, sans-serif" font-size="11" letter-spacing="1.6" fill="#F2E6A8">5 CM</text>
</svg>`;
}

/* ---------- round swatch ---------- */
export function swatchSVG(fabric, color, o = {}) {
  const fx = FABRICS[fabric] || FABRICS.linen;
  const gid = nid('sw');
  const pats = fx.patterns.map((p, i) => ({ id: `${gid}p${i}`, markup: patternMarkup(p, `${gid}p${i}`, color, 4.6) }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="${o.class || ''}" role="img" aria-label="${esc(o.label || 'Fabric swatch')}">
<defs>${pats.map((p) => p.markup).join('')}
<clipPath id="${gid}c"><circle cx="50" cy="50" r="47"/></clipPath>
<linearGradient id="${gid}b" x1="0" y1="0" x2=".2" y2="1"><stop offset="0" stop-color="${shade(color, 0.18)}"/><stop offset=".5" stop-color="${color}"/><stop offset="1" stop-color="${shade(color, -0.26)}"/></linearGradient>
<radialGradient id="${gid}h" cx=".3" cy=".25" r=".85"><stop offset="0" stop-color="#fff3d9" stop-opacity="${n(0.14 + fx.sheen * 0.5)}"/><stop offset=".5" stop-color="#fff3d9" stop-opacity="0"/><stop offset="1" stop-color="#0d0804" stop-opacity=".4"/></radialGradient></defs>
<g clip-path="url(#${gid}c)"><rect width="100" height="100" fill="url(#${gid}b)"/>${pats.map((p) => `<rect width="100" height="100" fill="url(#${p.id})"/>`).join('')}<rect width="100" height="100" fill="url(#${gid}h)"/></g>
<circle cx="50" cy="50" r="47.5" fill="none" stroke="#0d0804" stroke-opacity=".35" stroke-width="1"/></svg>`;
}
