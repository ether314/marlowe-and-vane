// Generates public/data/world.json: a dotted Natural Earth map in a 1000-unit-wide space,
// plus the projection constants the browser needs to place workshops on it.
// Source data: Natural Earth (public domain) via the world-atlas package.
// Run: node scripts/build-map.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { feature } from 'topojson-client';
import { geoNaturalEarth1, geoContains, geoGraticule, geoPath } from 'd3-geo';

const root = new URL('../', import.meta.url);
const topo = JSON.parse(await readFile(new URL('node_modules/world-atlas/land-110m.json', root), 'utf8'));
const land = feature(topo, topo.objects.land);

const W = 1000;
const projection = geoNaturalEarth1().precision(0.1);
projection.fitWidth(W, { type: 'Sphere' });
const path = geoPath(projection);
const [[, , ], [, bottom]] = path.bounds({ type: 'Sphere' });
const H = Math.ceil(bottom);

// Hex-packed dot lattice, tested against the land polygons on the sphere.
const step = 8.6;
const rowStep = step * 0.866;
const dots = [];
for (let row = 0, y = rowStep / 2; y < H; row++, y += rowStep) {
  const offset = row % 2 ? step / 2 : 0;
  for (let x = offset + step / 2; x < W; x += step) {
    const ll = projection.invert([x, y]);
    if (!ll || !Number.isFinite(ll[0]) || !Number.isFinite(ll[1])) continue;
    if (ll[1] < -58) continue; // leave Antarctica off the chart
    if (geoContains(land, ll)) dots.push(Math.round(x * 10) / 10, Math.round(y * 10) / 10);
  }
}

const range = (a, b, s) => Array.from({ length: Math.floor((b - a) / s) + 1 }, (_, i) => a + i * s);
const lines = geoGraticule().step([30, 30]).extent([[-180, -60], [180, 80]]).lines();
const graticule = lines.map((l) => path(l)).filter(Boolean).join('');
const primeMeridian = path({ type: 'LineString', coordinates: range(-60, 80, 2).map((lat) => [0, lat]) });
const equator = path({ type: 'LineString', coordinates: range(-180, 180, 2).map((lon) => [lon, 0]) });
const sphere = path({ type: 'Sphere' });

const out = {
  width: W,
  height: H,
  scale: projection.scale(),
  translate: projection.translate(),
  step,
  dots,
  sphere,
  graticule,
  primeMeridian,
  equator,
};

await mkdir(new URL('public/data/', root), { recursive: true });
await writeFile(new URL('public/data/world.json', root), JSON.stringify(out));

// Self-check: the browser re-implements Natural Earth 1; confirm it matches d3 for a few cities.
const raw = (lon, lat) => {
  const l = (lon * Math.PI) / 180;
  const p = (lat * Math.PI) / 180;
  const p2 = p * p;
  const p4 = p2 * p2;
  return [
    l * (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4))),
    p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4))),
  ];
};
const mine = (lon, lat) => {
  const [rx, ry] = raw(lon, lat);
  return [out.translate[0] + out.scale * rx, out.translate[1] - out.scale * ry];
};
for (const [name, lon, lat] of [['London', -0.12, 51.5], ['Arequipa', -71.54, -16.41], ['Tokushima', 134.56, 34.07]]) {
  const a = projection([lon, lat]);
  const b = mine(lon, lat);
  console.log(name, a.map((n) => n.toFixed(2)).join(','), 'vs', b.map((n) => n.toFixed(2)).join(','));
}
console.log(`map ${W}x${H}, ${dots.length / 2} dots, ${(JSON.stringify(out).length / 1024).toFixed(1)} KB`);
