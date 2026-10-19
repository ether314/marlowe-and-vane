// Tiny static dev server. Mirrors Firebase Hosting's clean URLs so local previews match production.
// Usage: node tools/dev-server.mjs <dir> <port>
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.argv[2] || 'public');
const port = Number(process.argv[3] || 4173);

// Pass "csp" as the fourth argument to enforce the same Content-Security-Policy that firebase.json sets in production.
let csp = '';
if (process.argv[4] === 'csp') {
  const cfg = JSON.parse(await readFile(new URL('../firebase.json', import.meta.url), 'utf8'));
  csp = cfg.hosting.headers.flatMap((h) => h.headers).find((h) => h.key === 'Content-Security-Policy')?.value || '';
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json',
};

http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const rel = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
      let file = join(root, rel);
      if (!file.startsWith(root)) {
        res.writeHead(403).end('Forbidden');
        return;
      }
      let info = await stat(file).catch(() => null);
      if (info?.isDirectory()) {
        file = join(file, 'index.html');
        info = await stat(file).catch(() => null);
      }
      if (!info) {
        const alt = `${file}.html`;
        info = await stat(alt).catch(() => null);
        if (info) file = alt;
      }
      if (!info && !extname(file)) {
        // Single-page app fallback, same as the catch-all rewrite in firebase.json.
        file = join(root, 'index.html');
        info = await stat(file).catch(() => null);
      }
      if (!info) {
        res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
        return;
      }
      const body = await readFile(file);
      res
        .writeHead(200, {
          'content-type': types[extname(file)] || 'application/octet-stream',
          'cache-control': 'no-store',
          ...(csp ? { 'content-security-policy': csp } : {}),
        })
        .end(body);
    } catch (err) {
      res.writeHead(500).end(String(err));
    }
  })
  .listen(port, '127.0.0.1', () => console.log(`serving ${root} on http://127.0.0.1:${port}`));
