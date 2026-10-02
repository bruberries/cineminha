// Local preview without a Vercel account: serves the pages, runs api/*.js the way Vercel does,
// and fakes the Redis database in memory (unless KV_REST_API_URL is set).
//   PARENT_PIN=1234 node dev/server.js   →  http://localhost:3000
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const REWRITES = { '/manifest.json': '/api/manifest', '/pais': '/parents.html', '/parents': '/parents.html', '/': '/index.html' };

// Tiny in-memory stand-in for Upstash's REST API: GET, SET, DEL, INCR, EXPIRE.
if (!process.env.KV_REST_API_URL) {
  const mem = new Map();
  const fake = createServer(async (req, res) => {
    let body = '';
    for await (const c of req) body += c;
    const [cmd, key, val] = JSON.parse(body);
    let result = null;
    switch (String(cmd).toUpperCase()) {
      case 'GET': result = mem.has(key) ? mem.get(key) : null; break;
      case 'SET': mem.set(key, val); result = 'OK'; break;
      case 'DEL': result = mem.delete(key) ? 1 : 0; break;
      case 'INCR': result = Number(mem.get(key) || 0) + 1; mem.set(key, String(result)); break;
      case 'EXPIRE': result = 1; break;
    }
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ result }));
  }).listen(0);
  await new Promise((r) => fake.once('listening', r));
  process.env.KV_REST_API_URL = `http://127.0.0.1:${fake.address().port}`;
  process.env.KV_REST_API_TOKEN = 'local';
}
process.env.PARENT_PIN ??= '1234';

// Minimal versions of the helpers Vercel adds to req/res.
function wrap(req, res, url) {
  req.query = Object.fromEntries(url.searchParams);
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); return res; };
  res.send = (s) => { res.end(s); return res; };
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let path = REWRITES[url.pathname] || url.pathname;
  try {
    if (path.startsWith('/api/')) {
      let raw = '';
      for await (const c of req) raw += c;
      req.body = raw ? JSON.parse(raw) : undefined;
      wrap(req, res, url);
      const mod = await import(join(ROOT, path.replace(/\/$/, '') + '.js'));
      return await mod.default(req, res);
    }
    const file = normalize(join(ROOT, path));
    if (!file.startsWith(ROOT)) throw new Error('outside');
    const body = await readFile(file);
    res.setHeader('Content-Type', TYPES[extname(file)] || 'application/octet-stream');
    res.end(body);
  } catch (e) {
    res.statusCode = e.code === 'ENOENT' ? 404 : 500;
    res.end(String(e.message));
  }
}).listen(PORT, () => console.log(`Cineminha local: http://localhost:${PORT}  (PIN ${process.env.PARENT_PIN})`));
