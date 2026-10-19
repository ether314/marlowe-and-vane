// Procedural furniture illustration for Marlowe & Vane.
// All geometry is in centimeters: x runs left to right from the sofa's center, y runs upward from the
// floor as negative numbers (floor = 0, top of the back = -height). Every function returns SVG markup.

let counter = 0;
const uid = (p = 'x') => `${p}${(++counter).toString(36)}`;
const n = (v) => Math.round(v * 100) / 100;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/* ---------- color ---------- */
function rgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const v = parseInt(h, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
const toHex = (r, g, b) => '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
export function mix(a, b, t) {
  const A = rgb(a);
  const B = rgb(b);
  return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}
const WARM_LIGHT = '#fff3d9';
const WARM_DARK = '#1a100a';
export const shade = (c, t) => (t >= 0 ? mix(c, WARM_LIGHT, t) : mix(c, WARM_DARK, -t));
export function luminance(c) {
  const [r, g, b] = rgb(c).map((v) => v / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/* ---------- geometry ---------- */
export function rr(x, y, w, h, r = 0) {
  let [tl, tr, br, bl] = Array.isArray(r) ? r : [r, r, r, r];
  const m = Math.min(w, h) / 2;
  tl = Math.min(tl, m); tr = Math.min(tr, m); br = Math.min(br, m); bl = Math.min(bl, m);
  const arc = (rad, x2, y2) => (rad ? `A${n(rad)} ${n(rad)} 0 0 1 ${n(x2)} ${n(y2)}` : '');
  return `M${n(x + tl)} ${n(y)}H${n(x + w - tr)}${arc(tr, x + w, y + tr)}V${n(y + h - br)}${arc(br, x + w - br, y + h)}H${n(x + bl)}${arc(bl, x, y + h - bl)}V${n(y + tl)}${arc(tl, x + tl, y)}Z`;
}
const circle = (cx, cy, r) => `M${n(cx - r)} ${n(cy)}A${n(r)} ${n(r)} 0 1 0 ${n(cx + r)} ${n(cy)}A${n(r)} ${n(r)} 0 1 0 ${n(cx - r)} ${n(cy)}Z`;

/* ---------- fabrics ---------- */
export const FABRICS = {
  leather: { patterns: ['leather'], sheen: 0.3, edge: 0.55 },
  boucle: { patterns: ['boucle'], sheen: 0.05, edge: 0.3 },
  silk: { patterns: ['brocade'], sheen: 0.32, edge: 0.5 },
  canvas: { patterns: ['canvas', 'brush'], sheen: 0.04, edge: 0.4 },
  velvet: { patterns: ['pile'], sheen: 0.36, edge: 0.4 },
  tweed: { patterns: ['herring'], sheen: 0.03, edge: 0.45 },
  linen: { patterns: ['linen'], sheen: 0.05, edge: 0.4 },
};

export function patternMarkup(name, id, base, scale = 1) {
  const dark = luminance(base) < 0.34;
  const hi = dark ? '#fff1cf' : '#ffffff';
  const lo = dark ? '#000000' : '#2a1608';
  const hiA = dark ? 0.2 : 0.4;
  const loA = dark ? 0.3 : 0.15;
  const tf = scale !== 1 ? ` patternTransform="scale(${scale})"` : '';
  const open = (w, h) => `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${w}" height="${h}"${tf}>`;
  switch (name) {
    case 'leather':
      return `${open(6, 6)}<path d="M.4 1.3c.9-.6 1.8-.5 2.5.1M3.3 3.7c.9-.7 1.8-.5 2.4.3M.8 5.2c.6-.4 1.2-.4 1.7 0M4.1 .9c.5-.3 1-.3 1.4.1" fill="none" stroke="${lo}" stroke-opacity="${n(loA * 0.75)}" stroke-width=".14" stroke-linecap="round"/><circle cx="1.6" cy="2.7" r=".14" fill="${lo}" fill-opacity="${n(loA * 0.6)}"/><circle cx="4.6" cy="5.1" r=".12" fill="${lo}" fill-opacity="${n(loA * 0.6)}"/><circle cx="3" cy="1" r=".1" fill="${hi}" fill-opacity="${n(hiA * 0.5)}"/><circle cx="5.2" cy="3.1" r=".1" fill="${hi}" fill-opacity="${n(hiA * 0.5)}"/></pattern>`;
    case 'boucle': {
      const curl = (x, y, c, a, w, r = 0) => `<path d="M${x} ${y}a.5.5 0 1 1 .9.2" fill="none" stroke="${c}" stroke-opacity="${a}" stroke-width="${w}" stroke-linecap="round" transform="rotate(${r} ${x} ${y})"/>`;
      return `${open(3.4, 3.4)}${curl(0.4, 0.8, hi, hiA, 0.28)}${curl(1.7, 0.5, hi, hiA, 0.26, 40)}${curl(2.7, 1.5, hi, hiA, 0.28, 110)}${curl(0.9, 2.2, hi, hiA, 0.26, 200)}${curl(2.1, 2.8, hi, hiA, 0.28, 280)}${curl(1.2, 1.5, lo, n(loA * 0.9), 0.22, 70)}${curl(2.4, 2.1, lo, n(loA * 0.9), 0.2, 160)}${curl(0.2, 2.9, lo, n(loA * 0.9), 0.22, 250)}${curl(1.6, 3.1, lo, n(loA * 0.9), 0.2, 20)}</pattern>`;
    }
    case 'linen':
      return `${open(1.9, 1.9)}<path d="M0 .45H1.9M0 1.4H1.9" stroke="${hi}" stroke-opacity="${n(hiA * 0.55)}" stroke-width=".13"/><path d="M.45 0V1.9M1.4 0V1.9" stroke="${lo}" stroke-opacity="${n(loA * 0.7)}" stroke-width=".1"/><path d="M.2 .95H.95" stroke="${hi}" stroke-opacity="${n(hiA * 0.7)}" stroke-width=".16"/></pattern>`;
    case 'canvas':
      return `${open(2.4, 2.4)}<path d="M0 .6H2.4M0 1.8H2.4" stroke="${hi}" stroke-opacity="${n(hiA * 0.5)}" stroke-width=".2"/><path d="M.6 0V2.4M1.8 0V2.4" stroke="${lo}" stroke-opacity="${n(loA * 0.6)}" stroke-width=".16"/></pattern>`;
    case 'brush':
      return `${open(52, 18)}<path d="M0 2.4C14 1.4 30 3.4 52 2.2" fill="none" stroke="${lo}" stroke-opacity="${n(loA * 0.7)}" stroke-width="1.2"/><path d="M0 8.6C18 9.6 34 7.6 52 8.8" fill="none" stroke="${hi}" stroke-opacity="${n(hiA * 0.4)}" stroke-width=".9"/><path d="M0 14C12 13 38 15.2 52 14.2" fill="none" stroke="${lo}" stroke-opacity="${n(loA * 0.55)}" stroke-width="1.5"/></pattern>`;
    case 'brocade':
      return `${open(6, 6)}<path d="M3 .7 5.3 3 3 5.3.7 3Z" fill="none" stroke="${hi}" stroke-opacity="${n(hiA * 0.7)}" stroke-width=".22"/><circle cx="3" cy="3" r=".55" fill="${hi}" fill-opacity="${n(hiA * 0.6)}"/><path d="M0 0 .8 .8M6 0 5.2 .8M0 6 .8 5.2M6 6 5.2 5.2" stroke="${hi}" stroke-opacity="${n(hiA * 0.5)}" stroke-width=".2"/><path d="M0 3H.6M5.4 3H6M3 0V.5M3 5.5V6" stroke="${lo}" stroke-opacity="${n(loA * 0.6)}" stroke-width=".18"/></pattern>`;
    case 'pile':
      return `${open(4, 4)}<path d="M.3 .6l.9-.2M2.1 1.1l.9.3M.9 2.8l.8-.3M2.9 3.3l.7.1" stroke="${hi}" stroke-opacity="${n(hiA * 0.4)}" stroke-width=".12" stroke-linecap="round"/><path d="M1.5 1.9l.8.2M3.2 2l.6-.3M.2 3.6l.7-.1" stroke="${lo}" stroke-opacity="${n(loA * 0.5)}" stroke-width=".12" stroke-linecap="round"/></pattern>`;
    case 'herring':
      return `${open(5, 5)}<path d="M0 2.5 2.5 0 5 2.5M0 5 2.5 2.5 5 5" fill="none" stroke="${lo}" stroke-opacity="${n(loA)}" stroke-width=".34"/><path d="M0 0 2.5 2.5 5 0M0 2.5 2.5 5 5 2.5" fill="none" stroke="${hi}" stroke-opacity="${n(hiA * 0.75)}" stroke-width=".22"/><circle cx="1.2" cy="1.1" r=".24" fill="#c98a4b" fill-opacity=".55"/><circle cx="3.7" cy="3.4" r=".22" fill="#e9dcc0" fill-opacity=".5"/><circle cx="1.4" cy="3.9" r=".2" fill="#7a3f22" fill-opacity=".5"/></pattern>`;
    default:
      return `${open(2, 2)}</pattern>`;
  }
}

export const LEG_FINISH = {
  walnut: { color: '#5a3d2b', metal: false },
  oak: { color: '#b58a52', metal: false },
  ebonized: { color: '#2b2420', metal: false },
  brass: { color: '#c69a48', metal: true },
};

/* ---------- drawing context ---------- */
function createCtx({ color, fabric, legs }) {
  const id = uid('s');
  const defs = [];
  const parts = [];
  const reg = new Map();
  const fx = FABRICS[fabric] || FABRICS.linen;
  const leg = LEG_FINISH[legs] || LEG_FINISH.walnut;
  let W = 200;
  let H = 80;

  const once = (key, make) => {
    if (!reg.has(key)) {
      const gid = `${id}_${reg.size}`;
      reg.set(key, gid);
      defs.push(make(gid));
    }
    return reg.get(key);
  };

  const grad = (base, kind = 'v') =>
    `url(#${once(`g${kind}${base}`, (gid) => {
      if (kind === 'r') {
        return `<radialGradient id="${gid}" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="${shade(base, 0.2)}"/><stop offset=".55" stop-color="${base}"/><stop offset="1" stop-color="${shade(base, -0.26)}"/></radialGradient>`;
      }
      if (kind === 'h') {
        return `<linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(base, -0.3)}"/><stop offset=".42" stop-color="${shade(base, 0.16)}"/><stop offset="1" stop-color="${shade(base, -0.34)}"/></linearGradient>`;
      }
      return `<linearGradient id="${gid}" x1="0" y1="0" x2=".16" y2="1"><stop offset="0" stop-color="${shade(base, 0.17)}"/><stop offset=".42" stop-color="${base}"/><stop offset="1" stop-color="${shade(base, -0.21)}"/></linearGradient>`;
    })})`;

  const pat = (name, base) => once(`p${name}${base}`, (gid) => patternMarkup(name, gid, base));

  const sheenFor = (name) => {
    const f = FABRICS[name] || fx;
    return once(`sheen${name || ''}`, (gid) => {
      const a = f.sheen;
      return `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${n(-W / 2)}" y1="${n(-H)}" x2="${n(W / 2)}" y2="0"><stop offset="0" stop-color="${WARM_LIGHT}" stop-opacity="0"/><stop offset=".1" stop-color="${WARM_LIGHT}" stop-opacity="${n(a * 0.2)}"/><stop offset=".3" stop-color="${WARM_LIGHT}" stop-opacity="${n(a * 0.75)}"/><stop offset=".38" stop-color="${WARM_LIGHT}" stop-opacity="${n(a)}"/><stop offset=".52" stop-color="${WARM_LIGHT}" stop-opacity="${n(a * 0.3)}"/><stop offset=".72" stop-color="${WARM_LIGHT}" stop-opacity="0"/><stop offset=".88" stop-color="${WARM_LIGHT}" stop-opacity="${n(a * 0.38)}"/><stop offset="1" stop-color="${WARM_LIGHT}" stop-opacity="0"/></linearGradient>`;
    });
  };

  const c = {
    id, color, fx, leg, parts, defs,
    setSize(w, h) { W = w; H = h; },

    fab(d, base = color, o = {}) {
      const f = FABRICS[o.fabric] || fx;
      const edge = o.edge ?? f.edge;
      parts.push(`<path d="${d}" fill="${grad(base, o.kind || 'v')}" stroke="${shade(base, -0.4)}" stroke-opacity="${edge}" stroke-width=".22" stroke-linejoin="round"/>`);
      if (o.tex !== false) for (const p of f.patterns) parts.push(`<path d="${d}" fill="url(#${pat(p, base)})"/>`);
      if (o.sheen !== false && f.sheen > 0) parts.push(`<path d="${d}" fill="url(#${sheenFor(o.fabric)})" opacity="${o.sheenMul ?? 1}"/>`);
    },
    flat(d, fill, o = {}) {
      parts.push(`<path d="${d}" fill="${fill}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw ?? 0.2}" stroke-opacity="${o.so ?? 0.6}"` : ''}${o.opacity ? ` opacity="${o.opacity}"` : ''}/>`);
    },
    line(d, stroke, w = 0.25, a = 0.5, extra = '') {
      parts.push(`<path d="${d}" fill="none" stroke="${stroke}" stroke-opacity="${a}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`);
    },
    ao(d, a = 0.28, dir = 'down') {
      const vec = { down: [0, 1, 1, 0], up: [0, 1, 0, 1], right: [1, 0, 1, 0], left: [1, 0, 0, 1] }[dir];
      const gid = once(`ao${dir}`, (g) => `<linearGradient id="${g}" x1="0" y1="0" x2="${vec[0]}" y2="${vec[1]}"><stop offset="0" stop-color="#120a05" stop-opacity="${vec[2]}"/><stop offset="1" stop-color="#120a05" stop-opacity="${vec[3]}"/></linearGradient>`);
      parts.push(`<path d="${d}" fill="url(#${gid})" opacity="${a}"/>`);
    },
    clip(d) {
      return once(`clip${d}`, (g) => `<clipPath id="${g}"><path d="${d}"/></clipPath>`);
    },
    wood(d, base = leg.color, o = {}) {
      if (leg.metal && !o.forceWood) return c.brass(d, o);
      const gid = once(`wood${base}`, (g) => `<linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(base, -0.18)}"/><stop offset=".3" stop-color="${shade(base, 0.2)}"/><stop offset=".62" stop-color="${base}"/><stop offset="1" stop-color="${shade(base, -0.4)}"/></linearGradient>`);
      parts.push(`<path d="${d}" fill="url(#${gid})" stroke="${shade(base, -0.5)}" stroke-opacity=".5" stroke-width=".18"/>`);
    },
    brass(d, o = {}) {
      const gid = once('brass', (g) => `<linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a6527"/><stop offset=".3" stop-color="#f4dc98"/><stop offset=".55" stop-color="#d1a655"/><stop offset="1" stop-color="#6e4d1c"/></linearGradient>`);
      parts.push(`<path d="${d}" fill="url(#${gid})" stroke="#5d4115" stroke-opacity=".45" stroke-width=".15"${o.opacity ? ` opacity="${o.opacity}"` : ''}/>`);
    },
    btn(x, y, r = 1.1, base = color) {
      parts.push(`<circle cx="${n(x)}" cy="${n(y)}" r="${r}" fill="${grad(base, 'r')}" stroke="${shade(base, -0.5)}" stroke-opacity=".6" stroke-width=".18"/>`);
    },
    nails(xa, xb, y, gap = 3.6, r = 0.55) {
      parts.push(`<path d="M${n(xa)} ${n(y)}H${n(xb)}" stroke="#7d5a24" stroke-width="${n(r * 2 + 0.3)}" stroke-dasharray="0 ${gap}" stroke-linecap="round" opacity=".55" transform="translate(.25 .35)"/>`);
      parts.push(`<path d="M${n(xa)} ${n(y)}H${n(xb)}" stroke="#e2bd6c" stroke-width="${n(r * 2)}" stroke-dasharray="0 ${gap}" stroke-linecap="round"/>`);
      parts.push(`<path d="M${n(xa - 0.12)} ${n(y - 0.2)}H${n(xb)}" stroke="#fff0bf" stroke-width="${n(r * 0.8)}" stroke-dasharray="0 ${gap}" stroke-linecap="round" opacity=".8"/>`);
    },
    pillow(x, y, w, h, r, base, rot = 0, o = {}) {
      const cx = x + w / 2;
      const cy = y + h / 2;
      parts.push(`<g transform="rotate(${rot} ${n(cx)} ${n(cy)})">`);
      c.ao(rr(x - 0.5, y + h - 4, w + 1, 6, 3), 0.35, 'down');
      c.fab(rr(x, y, w, h, r), base, { fabric: o.fabric, sheenMul: 0.8 });
      c.line(`M${n(x + r * 0.7)} ${n(y + 0.9)}H${n(x + w - r * 0.7)}`, shade(base, 0.4), 0.3, 0.5);
      if (o.stripe) {
        for (const [dy, col] of o.stripe) c.flat(`M${n(x + 0.6)} ${n(y + dy)}H${n(x + w - 0.6)}V${n(y + dy + 1.6)}H${n(x + 0.6)}Z`, col, { opacity: 0.85 });
      }
      parts.push('</g>');
    },
    foot(cx, dy = 0, dim = false) {
      const base = leg.metal ? '#c69a48' : leg.color;
      const col = dim ? shade(base, -0.28) : base;
      c.wood(`M${n(cx - 3.4)} ${n(-1.6 + dy)}C${n(cx - 5.2)} ${n(-3.4 + dy)} ${n(cx - 4.8)} ${n(-8.4 + dy)} ${n(cx - 2.6)} ${n(-9.6 + dy)}H${n(cx + 2.6)}C${n(cx + 4.8)} ${n(-8.4 + dy)} ${n(cx + 5.2)} ${n(-3.4 + dy)} ${n(cx + 3.4)} ${n(-1.6 + dy)}C${n(cx + 2.2)} ${n(dy)} ${n(cx - 2.2)} ${n(dy)} ${n(cx - 3.4)} ${n(-1.6 + dy)}Z`, col, { forceWood: !leg.metal });
    },
    turned(cx, dy, h, dim = false) {
      const t = (v) => n(-h + v + dy);
      const base = leg.metal ? '#c69a48' : leg.color;
      const col = dim ? shade(base, -0.28) : base;
      c.wood(`M${n(cx - 2.6)} ${t(0)}H${n(cx + 2.6)}V${t(2.4)}C${n(cx + 4)} ${t(3.4)} ${n(cx + 4)} ${t(7)} ${n(cx + 2.2)} ${t(8)}L${n(cx + 1.4)} ${t(h - 3)}C${n(cx + 2.6)} ${t(h - 2.4)} ${n(cx + 2.6)} ${t(h - 0.6)} ${n(cx + 1.6)} ${t(h)}H${n(cx - 1.6)}C${n(cx - 2.6)} ${t(h - 0.6)} ${n(cx - 2.6)} ${t(h - 2.4)} ${n(cx - 1.4)} ${t(h - 3)}L${n(cx - 2.2)} ${t(8)}C${n(cx - 4)} ${t(7)} ${n(cx - 4)} ${t(3.4)} ${n(cx - 2.6)} ${t(2.4)}Z`, col, { forceWood: !leg.metal });
    },
    taper(cx, h, topW, botW, splay = 0, dim = false, dy = 0) {
      const base = leg.metal ? '#c69a48' : leg.color;
      const col = dim ? shade(base, -0.28) : base;
      const bx = cx + splay;
      c.wood(`M${n(cx - topW / 2)} ${n(-h + dy)}H${n(cx + topW / 2)}L${n(bx + botW / 2)} ${n(dy)}H${n(bx - botW / 2)}Z`, col, { forceWood: !leg.metal });
      if (leg.metal) c.flat(`M${n(bx - botW / 2 - 0.2)} ${n(dy - 1.6)}H${n(bx + botW / 2 + 0.2)}V${n(dy)}H${n(bx - botW / 2 - 0.2)}Z`, '#f1d792', { opacity: 0.75 });
    },
    tuft(boundary, xa, xb, y0, rows, sy, sx, base = color) {
      const pts = [];
      for (let r = 0; r < rows; r++) {
        const y = y0 + r * sy;
        const off = r % 2 ? sx / 2 : 0;
        for (let x = xa + off; x <= xb + 0.01; x += sx) pts.push([x, y, r]);
      }
      const puff = once('puff', (g) => `<radialGradient id="${g}"><stop offset="0" stop-color="${WARM_LIGHT}" stop-opacity=".26"/><stop offset=".7" stop-color="${WARM_LIGHT}" stop-opacity=".06"/><stop offset="1" stop-color="${WARM_LIGHT}" stop-opacity="0"/></radialGradient>`);
      const cp = c.clip(boundary);
      let g = `<g clip-path="url(#${cp})">`;
      for (let r = 0; r < rows; r++) {
        const y = y0 + r * sy;
        const off = r % 2 ? 0 : sx / 2;
        for (let x = xa + off - sx; x <= xb + sx; x += sx) g += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(sx * 0.62)}" ry="${n(sy * 0.78)}" fill="url(#${puff})"/>`;
      }
      let dark = '';
      let light = '';
      for (const [x, y, r] of pts) {
        for (const dx of [-sx / 2, sx / 2]) {
          const q = pts.find((p) => p[2] === r + 1 && Math.abs(p[0] - (x + dx)) < 0.01);
          if (q) {
            dark += `M${n(x)} ${n(y)}L${n(q[0])} ${n(q[1])}`;
            light += `M${n(x)} ${n(y + 0.55)}L${n(q[0])} ${n(q[1] + 0.55)}`;
          }
        }
      }
      g += `<path d="${dark}" stroke="${shade(base, -0.5)}" stroke-opacity=".5" stroke-width=".42" fill="none" stroke-linecap="round"/><path d="${light}" stroke="${shade(base, 0.45)}" stroke-opacity=".3" stroke-width=".28" fill="none" stroke-linecap="round"/></g>`;
      parts.push(g);
      for (const [x, y] of pts) c.btn(x, y, 1.15, base);
    },
  };
  return c;
}

/* ---------- silhouettes ---------- */
const MODELS = {
  chesterfield: {
    label: 'Chesterfield', depth: 98, height: 80, seatHeight: 47,
    width: (s) => s * 62 + 44,
    build(c, s, W) {
      const x0 = -W / 2; const x1 = W / 2; const base = c.color;
      c.foot(x0 + 30, 0.6, true); c.foot(x1 - 30, 0.6, true);
      c.foot(x0 + 12, 0); c.foot(x1 - 12, 0);
      c.fab(rr(x0, -34, W, 23, [3, 3, 5, 5]), shade(base, -0.08));
      c.nails(x0 + 8, x1 - 8, -15, 3.7);
      const bx0 = x0 + 4; const bx1 = x1 - 4;
      const back = `M${bx0} -34V-71Q${bx0} -80 ${bx0 + 9} -80H${bx1 - 9}Q${bx1} -80 ${bx1} -71V-34Z`;
      c.fab(back, base);
      c.tuft(back, bx0 + 8, bx1 - 8, -72, 4, 10, 14, base);
      const sx0 = x0 + 19; const sx1 = x1 - 19; const cw = (sx1 - sx0) / s;
      c.ao(rr(sx0, -52, sx1 - sx0, 7, 1), 0.3, 'up');
      for (let i = 0; i < s; i++) {
        const x = sx0 + i * cw;
        c.fab(rr(x + 0.3, -47, cw - 0.6, 14, [5, 5, 3, 3]), base);
        c.line(`M${n(x + 5)} -46.2H${n(x + cw - 5)}`, shade(base, -0.45), 0.25, 0.45);
        c.line(`M${n(x + 5)} -47.4H${n(x + cw - 5)}`, shade(base, 0.38), 0.3, 0.55);
      }
      const arm = (xe, dir) => {
        const cx = xe + dir * 11;
        c.ao(rr(dir > 0 ? cx + 10 : cx - 16, -47, 6, 14, 1), 0.34, dir > 0 ? 'right' : 'left');
        c.fab(rr(cx - 11, -62, 22, 30, [0, 0, 3, 3]), shade(base, -0.05));
        c.btn(cx - 4.5, -47, 1.1, base); c.btn(cx + 4.5, -47, 1.1, base); c.btn(cx, -39, 1.1, base);
        c.line(`M${n(cx - 4.5)} -47L${n(cx)} -39L${n(cx + 4.5)} -47`, shade(base, -0.5), 0.35, 0.45);
        c.fab(circle(cx, -63, 12), base, { kind: 'r' });
        c.line(circle(cx, -63, 8.1), shade(base, -0.45), 0.3, 0.5);
        c.line(`M${n(cx - 8.1)} -63A8.1 8.1 0 0 1 ${n(cx)} -71.1`, shade(base, 0.45), 0.3, 0.5);
        c.line(circle(cx, -63, 4.2), shade(base, -0.4), 0.26, 0.4);
        c.btn(cx, -63, 1.4, base);
      };
      arm(x0, 1); arm(x1, -1);
    },
  },

  cloud: {
    label: 'Cloud sofa', depth: 104, height: 74, seatHeight: 41,
    width: (s) => s * 62 + 44,
    build(c, s, W) {
      const x0 = -W / 2; const x1 = W / 2; const base = c.color; const a = c.accent;
      c.fab(rr(x0 + 20, -9, W - 40, 9, 2), shade(base, -0.75), { tex: false, sheen: false });
      c.fab(rr(x0 + 6, -70, W - 12, 52, 24), base);
      const sx0 = x0 + 25; const sx1 = x1 - 25; const cw = (sx1 - sx0) / s;
      for (let i = 0; i < s; i++) c.fab(rr(sx0 + i * cw + 1.5, -70, cw - 3, 40, 17), shade(base, 0.05));
      c.ao(rr(sx0, -48, sx1 - sx0, 9, 4), 0.28, 'up');
      for (let i = 0; i < s; i++) {
        c.ao(rr(sx0 + i * cw - 2, -16, cw + 4, 6, 3), 0.3, 'up');
        c.fab(rr(sx0 - 3 + i * cw, -41, cw + 6, 29, 13), base);
        c.line(`M${n(sx0 + i * cw + 7)} -39.8H${n(sx0 + i * cw + cw - 1)}`, shade(base, 0.45), 0.4, 0.4);
      }
      c.pillow(x0 + 34, -57, 46, 19, 9.5, a, -7, { fabric: 'boucle' });
      c.fab(rr(x0, -61, 34, 56, 17), shade(base, 0.03));
      c.fab(rr(x1 - 34, -61, 34, 56, 17), shade(base, 0.03));
      c.line(`M${n(x0 + 9)} -58.6Q${n(x0 + 17)} -60 ${n(x0 + 25)} -58.4`, shade(base, 0.5), 0.4, 0.45);
      c.line(`M${n(x1 - 25)} -58.4Q${n(x1 - 17)} -60 ${n(x1 - 9)} -58.6`, shade(base, 0.5), 0.4, 0.45);
    },
  },

  camelback: {
    label: 'Camelback', depth: 96, height: 86, seatHeight: 47,
    width: (s) => s * 58 + 34,
    build(c, s, W) {
      const x0 = -W / 2; const x1 = W / 2; const base = c.color; const a = c.accent;
      c.turned(x0 + 24, -1.2, 16, true); c.turned(x1 - 24, -1.2, 16, true);
      c.turned(x0 + 10, 0, 17); c.turned(x1 - 10, 0, 17);
      c.fab(rr(x0, -31, W, 14.5, [1, 1, 3, 3]), shade(base, -0.08));
      c.line(`M${n(x0 + 1.5)} -18.4H${n(x1 - 1.5)}`, '#e2bd6c', 0.5, 0.8);
      const bx0 = x0 + 3; const bx1 = x1 - 3;
      const hump = `M${bx0} -31V-58Q${bx0} -66 ${bx0 + 12} -67C${n(bx0 + 38)} -68 -32 -87 0 -87C32 -87 ${n(bx1 - 38)} -68 ${bx1 - 12} -67Q${bx1} -66 ${bx1} -58V-31Z`;
      c.fab(hump, base);
      const arch = `M${bx0 + 0.6} -58Q${bx0 + 0.6} -65.4 ${bx0 + 12} -66.4C${n(bx0 + 38)} -67.4 -32 -86 0 -86C32 -86 ${n(bx1 - 38)} -67.4 ${bx1 - 12} -66.4Q${bx1 - 0.6} -65.4 ${bx1 - 0.6} -58`;
      c.line(arch, shade(base, -0.5), 0.4, 0.4);
      parts_nailPath(c, arch, 3.4);
      const sx0 = x0 + 17; const sx1 = x1 - 17; const cw = (sx1 - sx0) / s;
      c.tuft(hump, sx0 + 12, sx1 - 12, -62, 3, 10, 24, base);
      c.ao(rr(sx0, -52, sx1 - sx0, 7, 1), 0.3, 'up');
      for (let i = 0; i < s; i++) {
        const x = sx0 + i * cw;
        c.fab(rr(x + 0.3, -46, cw - 0.6, 15.5, [4, 4, 2, 2]), base);
        c.line(`M${n(x + 4)} -45.2H${n(x + cw - 4)}`, shade(base, 0.4), 0.3, 0.55);
      }
      c.pillow(sx0 + 2, -70, 36, 36, 6, a, -8, { fabric: 'velvet' });
      c.pillow(sx1 - 38, -68, 36, 34, 6, shade(a, -0.1), 7, { fabric: 'velvet' });
      const arm = (xe, dir) => {
        const cx = xe + dir * 8.5;
        c.fab(`M${n(cx - 8.5)} -31V-56Q${n(cx - 8.5)} -65 ${n(cx)} -65Q${n(cx + 8.5)} -65 ${n(cx + 8.5)} -56V-31Z`, base);
        c.fab(circle(cx + dir * -0.5, -60, 7.4), base, { kind: 'r' });
        c.line(circle(cx + dir * -0.5, -60, 4.4), shade(base, -0.45), 0.28, 0.5);
        c.btn(cx + dir * -0.5, -60, 1.2, base);
        c.nails(cx - 4.5, cx + 4.5, -44, 4.4, 0.5);
      };
      arm(x0, 1); arm(x1, -1);
    },
  },

  daybed: {
    label: 'Daybed', depth: 88, height: 90, seatHeight: 51,
    width: (s) => 118 + s * 30,
    build(c, s, W) {
      const x0 = -W / 2; const x1 = W / 2; const base = c.color; const a = c.accent; const b = c.accent2;
      c.taper(x0 + 30, 18, 6, 3.6, 1.6, true); c.taper(x1 - 30, 18, 6, 3.6, -1.6, true);
      c.taper(x0 + 13, 20, 6.4, 3.8, 2); c.taper(x1 - 13, 20, 6.4, 3.8, -2);
      c.wood(rr(x0 + 4, -24, W - 8, 6, 0.9), shade(c.leg.metal ? '#8a5f3a' : c.leg.color, 0.05), { forceWood: true });
      c.fab(rr(x0 + 3, -38, W - 6, 14.5, 3), shade(base, -0.12));
      c.nails(x0 + 8, x1 - 8, -26.6, 3.8, 0.45);
      c.fab(rr(x0 + 36, -68, W - 36 - 12, 31, [10, 10, 0, 0]), shade(base, -0.05));
      c.line(`M${n(x0 + 40)} -66.4H${n(x1 - 16)}`, shade(base, 0.45), 0.3, 0.5);
      c.nails(x0 + 46, x1 - 22, -64.2, 3.8, 0.45);
      const head = `M${x0} -38V-76Q${x0} -90 ${x0 + 16} -90Q${x0 + 40} -90 ${x0 + 40} -72V-38Z`;
      c.fab(head, base);
      c.tuft(head, x0 + 9, x0 + 31, -80, 3, 11, 13, base);
      c.ao(rr(x0 + 40, -50, 6, 14, 1), 0.32, 'right');
      c.fab(rr(x0 + 38, -51, W - 38 - 14, 13.5, [4, 4, 2, 2]), base);
      c.line(`M${n(x0 + 43)} -50.2H${n(x1 - 19)}`, shade(base, 0.42), 0.3, 0.55);
      c.pillow(x0 + 42, -67, 54, 17, 8.5, a, -2.5, { fabric: 'canvas' });
      c.line(`M${n(x0 + 48)} -66V-50.6M${n(x0 + 90)} -66V-50.6`, shade(a, -0.4), 0.28, 0.4);
      const tx = x1 - 72;
      c.fab(rr(tx, -53.4, 46, 4, 1.4), b, { fabric: 'linen' });
      c.fab(rr(tx + 3, -50, 40, 13, 1), b, { fabric: 'linen' });
      for (const dy of [2.2, 5.2, 8.2]) c.flat(`M${n(tx + 3.2)} ${n(-50 + dy)}H${n(tx + 42.8)}V${n(-50 + dy + 1.4)}H${n(tx + 3.2)}Z`, a, { opacity: 0.85 });
      let fringe = '';
      for (let i = 0; i < 9; i++) fringe += `M${n(tx + 4.5 + i * 4.3)} -37v1.9`;
      c.line(fringe, shade(b, -0.25), 0.5, 0.85);
      c.fab(`M${x1 - 16} -38V-54Q${x1 - 16} -62 ${x1 - 8} -62Q${x1} -62 ${x1} -54V-38Z`, base);
      c.fab(circle(x1 - 8, -55.5, 6.4), base, { kind: 'r' });
      c.line(circle(x1 - 8, -55.5, 3.8), shade(base, -0.45), 0.26, 0.5);
    },
  },

  channel: {
    label: 'Channel-tufted settee', depth: 90, height: 78, seatHeight: 44,
    width: (s) => s * 60 + 36,
    build(c, s, W) {
      const x0 = -W / 2; const x1 = W / 2; const base = c.color;
      c.taper(x0 + 24, 16, 4.4, 2.2, 1, true); c.taper(x1 - 24, 16, 4.4, 2.2, -1, true);
      c.taper(x0 + 10, 17, 4.8, 2.4, 1.6); c.taper(x1 - 10, 17, 4.8, 2.4, -1.6);
      c.fab(rr(x0, -30, W, 14, [2, 2, 3, 3]), shade(base, -0.1));
      c.line(`M${n(x0 + 1)} -29.4H${n(x1 - 1)}`, '#e2bd6c', 0.55, 0.85);
      const bx0 = x0 + 8; const bx1 = x1 - 8;
      const back = `M${bx0} -30V-69Q${bx0} -78 ${bx0 + 9} -78H${bx1 - 9}Q${bx1} -78 ${bx1} -69V-30Z`;
      c.fab(back, base);
      const cp = c.clip(back);
      const tw = (bx1 - bx0) / Math.round((bx1 - bx0) / 8.6);
      let g = `<g clip-path="url(#${cp})">`;
      const tubeGrad = (b) => c.tubeGrad(b);
      for (let x = bx0; x < bx1 - 0.1; x += tw) g += `<path d="${rr(x, -80, tw, 52, [tw / 2, tw / 2, 0, 0])}" fill="${tubeGrad(base)}" stroke="${shade(base, -0.5)}" stroke-opacity=".5" stroke-width=".2"/>`;
      g += '</g>';
      c.parts.push(g);
      c.parts.push(`<path d="${back}" fill="url(#${c.sheenId()})"/>`);
      const sx0 = x0 + 17; const sx1 = x1 - 17; const cw = (sx1 - sx0) / s;
      c.ao(rr(sx0, -50, sx1 - sx0, 7, 1), 0.3, 'up');
      for (let i = 0; i < s; i++) {
        const x = sx0 + i * cw;
        c.fab(rr(x + 0.3, -45, cw - 0.6, 15.5, [5, 5, 2.5, 2.5]), base);
        c.line(`M${n(x + 5)} -44.2H${n(x + cw - 5)}`, shade(base, 0.45), 0.3, 0.55);
        c.btn(x + cw / 2, -38, 1.1, base);
      }
      const arm = (xe, dir) => {
        const ax = dir > 0 ? xe : xe - 18;
        const d = `M${ax} -30V-52Q${ax} -62 ${ax + 9} -62Q${ax + 18} -62 ${ax + 18} -52V-30Z`;
        c.fab(d, base);
        const cp2 = c.clip(d);
        let g2 = `<g clip-path="url(#${cp2})">`;
        for (let x = ax; x < ax + 17.9; x += 6) g2 += `<path d="${rr(x, -64, 6, 36, [3, 3, 0, 0])}" fill="${tubeGrad(base)}" stroke="${shade(base, -0.5)}" stroke-opacity=".5" stroke-width=".2"/>`;
        g2 += '</g>';
        c.parts.push(g2);
        c.parts.push(`<path d="${d}" fill="url(#${c.sheenId()})"/>`);
      };
      arm(x0, 1); arm(x1, -1);
      c.pillow(sx0 + 4, -68, 30, 22, 5, c.accent, -6, { fabric: 'linen' });
    },
  },

  midcentury: {
    label: 'Mid-century sofa', depth: 88, height: 76, seatHeight: 44,
    width: (s) => s * 56 + 28,
    build(c, s, W) {
      const x0 = -W / 2; const x1 = W / 2; const base = c.color; const a = c.accent;
      c.taper(x0 + 20, 21, 4.4, 2.4, 2.6, true); c.taper(x1 - 20, 21, 4.4, 2.4, -2.6, true);
      c.taper(x0 + 9, 22, 4.8, 2.6, 3.2); c.taper(x1 - 9, 22, 4.8, 2.6, -3.2);
      c.wood(rr(x0 + 2, -27, W - 4, 5, 0.8), shade(c.leg.metal ? '#5a3d2b' : c.leg.color, 0.05), { forceWood: true });
      c.fab(rr(x0, -35, W, 9, 1.5), shade(base, -0.12));
      const sx0 = x0 + 14; const sx1 = x1 - 14; const cw = (sx1 - sx0) / s;
      for (let i = 0; i < s; i++) {
        const x = sx0 + i * cw;
        c.fab(rr(x + 0.6, -72, cw - 1.2, 31, [3, 3, 1, 1]), shade(base, 0.03));
        c.line(`M${n(x + 3)} -71.2H${n(x + cw - 3)}`, shade(base, 0.45), 0.3, 0.5);
        c.line(`M${n(x + cw / 2)} -69V-45`, shade(base, -0.5), 0.2, 0.18);
      }
      c.ao(rr(sx0, -49, sx1 - sx0, 7, 1), 0.3, 'up');
      for (let i = 0; i < s; i++) {
        const x = sx0 + i * cw;
        c.fab(rr(x, -45, cw, 12, [2.5, 2.5, 1.5, 1.5]), base);
        c.line(`M${n(x + 2.5)} -44.4H${n(x + cw - 2.5)}`, shade(base, 0.4), 0.3, 0.55);
      }
      c.pillow(sx0 + 3, -66, 34, 21, 4, a, -7, { fabric: 'linen' });
      const arm = (xe, dir) => {
        const ax = dir > 0 ? xe : xe - 14;
        c.fab(rr(ax, -61, 14, 35, [2, 2, 1, 1]), shade(base, -0.04));
        c.wood(rr(ax - 0.3, -63, 14.6, 2.6, 1), shade(c.leg.metal ? '#5a3d2b' : c.leg.color, 0.1), { forceWood: true });
      };
      arm(x0, 1); arm(x1, -1);
    },
  },
};

function parts_nailPath(c, d, gap) {
  c.parts.push(`<path d="${d}" fill="none" stroke="#7d5a24" stroke-width="1.3" stroke-dasharray="0 ${gap}" stroke-linecap="round" opacity=".5" transform="translate(.25 .35)"/>`);
  c.parts.push(`<path d="${d}" fill="none" stroke="#e2bd6c" stroke-width="1" stroke-dasharray="0 ${gap}" stroke-linecap="round"/>`);
  c.parts.push(`<path d="${d}" fill="none" stroke="#fff0bf" stroke-width=".4" stroke-dasharray="0 ${gap}" stroke-linecap="round" opacity=".8" transform="translate(-.15 -.2)"/>`);
}

export const MODEL_KEYS = Object.keys(MODELS);

/* ---------- public: sofa group ---------- */
export function sofaDims(spec) {
  const m = MODELS[spec.model];
  const seats = spec.seats || 3;
  return { w: Math.round(m.width(seats)), d: m.depth, h: m.height, seatH: m.seatHeight };
}

export function sofaGroup(spec) {
  const m = MODELS[spec.model] || MODELS.chesterfield;
  const seats = spec.seats || 3;
  const W = m.width(seats);
  const H = m.height;
  const c = createCtx({ color: spec.color, fabric: spec.fabric, legs: spec.legs });
  c.accent = spec.accent || shade(spec.color, 0.25);
  c.accent2 = spec.accent2 || '#e7dac3';
  c.setSize(W, H);
  // helpers that need access to private caches
  c.sheenId = () => c.defs.find((d) => d.includes('gradientUnits="userSpaceOnUse"'))?.match(/id="([^"]+)"/)?.[1] || '';
  c.tubeGrad = (base) => {
    const gid = `${c.id}_tube${base.slice(1)}`;
    if (!c.defs.some((d) => d.includes(`id="${gid}"`))) c.defs.push(`<linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(base, -0.34)}"/><stop offset=".22" stop-color="${shade(base, 0.02)}"/><stop offset=".5" stop-color="${shade(base, 0.2)}"/><stop offset=".78" stop-color="${shade(base, -0.06)}"/><stop offset="1" stop-color="${shade(base, -0.38)}"/></linearGradient>`);
    return `url(#${gid})`;
  };
  // make sure a sheen gradient exists before models reference it directly
  c.fab('M0 0', spec.color, { tex: false });
  c.parts.length = 0;
  m.build(c, seats, W);

  const shadowId = `${c.id}_gs`;
  const shadow = `<radialGradient id="${shadowId}"><stop offset="0" stop-color="#0d0804" stop-opacity=".62"/><stop offset=".55" stop-color="#0d0804" stop-opacity=".3"/><stop offset="1" stop-color="#0d0804" stop-opacity="0"/></radialGradient>`;
  const body = `<g id="${c.id}b">${c.parts.join('')}</g>`;
  return {
    id: c.id,
    W, H, depth: m.depth,
    defs: shadow + c.defs.join(''),
    body,
    shadow: `<ellipse cx="0" cy="1" rx="${n(W * 0.56)}" ry="6.5" fill="url(#${shadowId})"/><ellipse cx="0" cy="0.4" rx="${n(W * 0.47)}" ry="1.8" fill="#0d0804" opacity=".4"/>`,
  };
}

/* ---------- public: studio view (catalog tiles, hero) ---------- */
export function studioSVG(spec, o = {}) {
  const g = sofaGroup(spec);
  const padX = o.padX ?? 30; const top = o.top ?? 18; const bottom = o.bottom ?? (o.reflection ? 52 : 22);
  const vb = o.vb || `${n(-g.W / 2 - padX)} ${n(-g.H - top)} ${n(g.W + padX * 2)} ${n(g.H + top + bottom)}`;
  let refl = '';
  if (o.reflection) {
    const fade = `${g.id}_rf`;
    refl = `<linearGradient id="${fade}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#fff" stop-opacity=".34"/></linearGradient><mask id="${fade}m" maskUnits="userSpaceOnUse" x="${n(-g.W)}" y="-60" width="${n(g.W * 2)}" height="60"><rect x="${n(-g.W)}" y="-60" width="${n(g.W * 2)}" height="60" fill="url(#${fade})"/></mask>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" class="${o.class || ''}" role="img" aria-label="${esc(o.label || 'Sofa illustration')}" preserveAspectRatio="xMidYMid meet"><defs>${g.defs}${g.body.replace(/^<g id="([^"]+)">/, '<g id="$1">')}${refl}</defs>${o.reflection ? `<use href="#${g.id}b" transform="scale(1 -1)" mask="url(#${g.id}_rfm)"/>` : ''}${g.shadow}<use href="#${g.id}b"/></svg>`;
}
