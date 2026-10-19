// Loads public/data/catalog.json into Firestore (collections: pieces, origins) using the Firebase CLI's own
// signed-in session, so no service-account key or token ever touches the repo or the terminal output.
//
// Usage: node scripts/seed-firestore.mjs [--check]
//   (no flag)  write every piece and origin, replacing any existing document with the same ID
//   --check    only list what is currently in Firestore
//
// Visitors cannot write these collections (firestore.rules); this script runs with your own CLI credentials.
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';

const PROJECT = 'marlowe-and-vane';
const require = createRequire(import.meta.url);
const auth = require('firebase-tools/lib/auth');
const { requireAuth } = require('firebase-tools/lib/requireAuth');
const { Client } = require('firebase-tools/lib/apiv2');

const account = auth.getGlobalDefaultAccount();
if (!account) {
  console.error('Not signed in. Run: npx firebase login');
  process.exit(1);
}
await requireAuth({ user: account.user, tokens: account.tokens, project: PROJECT });
const api = new Client({ urlPrefix: 'https://firestore.googleapis.com', apiVersion: 'v1' });
const base = `/projects/${PROJECT}/databases/(default)/documents`;

const toValue = (v) => {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, toValue(x)])) } };
};
const toFields = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, toValue(v)]));

const list = async (collection) => {
  const res = await api.get(`${base}/${collection}`, { queryParams: { pageSize: '100' } });
  return (res.body.documents || []).map((d) => d.name.split('/').pop());
};

const fromValue = (v) => {
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromValue);
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, fromValue(x)]));
  return null;
};

if (process.argv.includes('--check')) {
  for (const c of ['pieces', 'origins', 'subscribers', 'reservations']) console.log(c, (await list(c)).length, 'documents');
  process.exit(0);
}

// --show <collection>: print documents written by visitors (read with your own credentials; visitors can never read them back).
const showAt = process.argv.indexOf('--show');
if (showAt > -1) {
  const collection = process.argv[showAt + 1];
  const res = await api.get(`${base}/${collection}`, { queryParams: { pageSize: '50' } });
  for (const d of res.body.documents || []) console.log(d.name.split('/').pop(), JSON.stringify(Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, fromValue(v)]))));
  process.exit(0);
}

const catalog = JSON.parse(await readFile(new URL('../public/data/catalog.json', import.meta.url), 'utf8'));

// Firestore has no nested arrays: store each spec row as { label, value }.
const piece = (p) => ({ ...p, details: p.details.map((d) => (Array.isArray(d) ? { label: d[0], value: d[1] } : d)) });
const strip = ({ slug, id, ...rest }) => rest;

let written = 0;
for (const p of catalog.pieces) {
  await api.patch(`${base}/pieces/${p.slug}`, { fields: toFields(strip(piece(p))) });
  written++;
}
for (const o of catalog.origins) {
  await api.patch(`${base}/origins/${o.id}`, { fields: toFields(strip(o)) });
  written++;
}
console.log(`Wrote ${written} documents to ${PROJECT}.`);
for (const c of ['pieces', 'origins']) console.log(c, (await list(c)).length, 'documents');
