// Everything the app shows lives in one Redis document:
//   { settings: { name, lang }, categories: [{ id, name, color, section }], videos: [{ id, cat, title, by, at }] }
// Video order inside a category is the order of `videos`; the first 3 are the home-screen highlights.
//
// GET  /api/data                      → the document (public: the kids' app reads it), or { setup: false }
// POST /api/data { pin, action, ... } → changes, only with the parents' PIN (env PARENT_PIN)
// Errors come back as { error: '<code>' }; the pages translate the code.
import { readFile } from 'node:fs/promises';
import { createHash, timingSafeEqual, randomBytes } from 'node:crypto';

const KEY = 'cineminha:data';
const MAX_FAILS = 10; // wrong PINs per IP per hour
const SECTIONS = ['music', 'cartoons'];
const COLORS = ['#ff8c42', '#4ecdc4', '#ffd23f', '#f78fb3', '#ff6b6b', '#a78bfa', '#7ed957', '#b9c1d9'];

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

class Fail extends Error { constructor(code, status = 400) { super(code); this.status = status; } }

async function redis(...command) {
  const r = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  if (!r.ok) throw new Error(`redis ${r.status}`);
  return (await r.json()).result;
}
async function readDoc() {
  const raw = await redis('GET', KEY);
  return raw ? JSON.parse(raw) : null;
}
const writeDoc = (doc) => redis('SET', KEY, JSON.stringify(doc));

function pinMatches(given) {
  const want = process.env.PARENT_PIN || '';
  const a = createHash('sha256').update(String(given || '')).digest();
  const b = createHash('sha256').update(want).digest();
  return want !== '' && timingSafeEqual(a, b);
}

function parseId(text) {
  text = String(text || '').trim();
  if (/^[\w-]{11}$/.test(text)) return text;
  try {
    const u = new URL(text);
    if (u.hostname.endsWith('youtu.be')) return u.pathname.slice(1, 12);
    if (u.searchParams.get('v')) return u.searchParams.get('v').slice(0, 11);
    const m = u.pathname.match(/\/(?:shorts|embed|live|v)\/([\w-]{11})/);
    if (m) return m[1];
  } catch {}
  return null;
}

// oEmbed answers 200 only for public videos that may play inside other sites.
async function lookup(id) {
  const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent('https://www.youtube.com/watch?v=' + id)}`);
  return r.ok ? r.json() : null;
}

const packFile = (name) => new URL(`../packs/${name}`, import.meta.url);
async function readPacks() { return JSON.parse(await readFile(packFile('index.json'), 'utf8')); }

const clean = (s, max) => String(s || '').trim().slice(0, max);
const newCatId = () => 'c' + randomBytes(4).toString('hex');

async function importPack(doc, packId) {
  const pack = (await readPacks()).find((p) => p.id === packId);
  if (!pack) throw new Fail('unknown_pack');
  if (doc.categories.some((c) => c.pack === packId)) return;
  const videos = JSON.parse(await readFile(packFile(`${packId}.json`), 'utf8'));
  const cat = { id: newCatId(), name: pack.name[doc.settings.lang] || pack.name.en, color: pack.color, section: pack.section, pack: packId };
  doc.categories.push(cat);
  for (const v of videos) doc.videos.push({ id: v.id, cat: cat.id, title: v.title });
}

function getCat(doc, id) {
  const c = doc.categories.find((c) => c.id === id);
  if (!c) throw new Fail('bad_category');
  return c;
}

// Each action changes `doc` in place and may return extra fields for the reply.
const actions = {
  check() {},

  async setup(doc, body) {
    if (doc) throw new Fail('already_set_up', 409);
    const lang = body.lang === 'en' ? 'en' : 'pt';
    const fresh = { settings: { name: clean(body.name, 30) || 'Cineminha', lang }, categories: [], videos: [] };
    for (const p of [].concat(body.packs || [])) await importPack(fresh, String(p));
    // A place for one-off videos in each section.
    fresh.categories.push({ id: newCatId(), name: lang === 'en' ? 'More music' : 'Outras músicas', color: '#b9c1d9', section: 'music' });
    fresh.categories.push({ id: newCatId(), name: lang === 'en' ? 'More cartoons' : 'Outros desenhos', color: '#b9c1d9', section: 'cartoons' });
    return { replace: fresh };
  },

  settings(doc, body) {
    if (body.name !== undefined) doc.settings.name = clean(body.name, 30) || doc.settings.name;
    if (body.lang === 'pt' || body.lang === 'en') doc.settings.lang = body.lang;
  },

  async addVideo(doc, body) {
    const id = parseId(body.url);
    if (!id) throw new Fail('bad_link');
    const cat = getCat(doc, body.cat);
    if (doc.videos.some((v) => v.id === id && v.cat === cat.id)) throw new Fail('duplicate');
    const info = await lookup(id);
    if (!info) throw new Fail('not_embeddable');
    const video = { id, cat: cat.id, title: clean(body.title, 120) || info.title, by: clean(body.by, 40), at: new Date().toISOString() };
    if (body.top) {
      const first = doc.videos.findIndex((v) => v.cat === cat.id);
      doc.videos.splice(first < 0 ? doc.videos.length : first, 0, video);
    } else doc.videos.push(video);
    return { video };
  },

  removeVideo(doc, body) {
    const i = doc.videos.findIndex((v) => v.id === body.id && v.cat === body.cat);
    if (i < 0) throw new Fail('not_found', 404);
    doc.videos.splice(i, 1);
  },

  // dir: -1 up, 1 down, 'top' to the front of its category.
  moveVideo(doc, body) {
    const i = doc.videos.findIndex((v) => v.id === body.id && v.cat === body.cat);
    if (i < 0) throw new Fail('not_found', 404);
    const same = doc.videos.map((v, j) => j).filter((j) => doc.videos[j].cat === body.cat);
    const at = same.indexOf(i);
    const to = body.dir === 'top' ? same[0] : same[at + (body.dir === -1 ? -1 : 1)];
    if (to === undefined || to === i) return;
    const [v] = doc.videos.splice(i, 1);
    doc.videos.splice(to, 0, v);
  },

  addCategory(doc, body) {
    const name = clean(body.name, 40);
    if (!name) throw new Fail('bad_name');
    const section = SECTIONS.includes(body.section) ? body.section : 'music';
    const color = COLORS.includes(body.color) ? body.color : COLORS[doc.categories.length % COLORS.length];
    const cat = { id: newCatId(), name, color, section };
    doc.categories.push(cat);
    return { category: cat };
  },

  editCategory(doc, body) {
    const cat = getCat(doc, body.id);
    if (body.name !== undefined) cat.name = clean(body.name, 40) || cat.name;
    if (COLORS.includes(body.color)) cat.color = body.color;
    if (SECTIONS.includes(body.section)) cat.section = body.section;
  },

  moveCategory(doc, body) {
    const i = doc.categories.findIndex((c) => c.id === body.id);
    const j = i + (body.dir === -1 ? -1 : 1);
    if (i < 0 || j < 0 || j >= doc.categories.length) return;
    [doc.categories[i], doc.categories[j]] = [doc.categories[j], doc.categories[i]];
  },

  deleteCategory(doc, body) {
    getCat(doc, body.id);
    doc.categories = doc.categories.filter((c) => c.id !== body.id);
    doc.videos = doc.videos.filter((v) => v.cat !== body.id);
  },

  async addPack(doc, body) { await importPack(doc, String(body.pack)); },
};

const send = (res, status, body) => res.status(status).setHeader('Cache-Control', 'no-store').json(body);

export default async function handler(req, res) {
  try {
    if (!REDIS_URL || !REDIS_TOKEN) throw new Fail('no_db', 500);

    if (req.method === 'GET') {
      const doc = await readDoc();
      if (req.query?.packs !== undefined) return send(res, 200, { packs: await readPacks() });
      return send(res, 200, doc ? { setup: true, ...doc } : { setup: false });
    }
    if (req.method !== 'POST') return send(res, 405, { error: 'method' });

    if (!process.env.PARENT_PIN) throw new Fail('no_pin', 500);
    const ip = String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
    const failKey = `cineminha:fail:${ip}`;
    if (Number(await redis('GET', failKey)) >= MAX_FAILS) throw new Fail('too_many', 429);

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    if (!pinMatches(body.pin)) {
      await redis('INCR', failKey);
      await redis('EXPIRE', failKey, 3600);
      throw new Fail('wrong_pin', 401);
    }

    const action = actions[body.action];
    if (!action) return send(res, 400, { error: 'unknown_action' });
    const doc = await readDoc();
    if (!doc && body.action !== 'setup' && body.action !== 'check') return send(res, 409, { error: 'not_set_up' });

    const extra = (await action(doc, body)) || {};
    const { replace, ...rest } = extra;
    const saved = replace || doc;
    if (body.action !== 'check' && saved) await writeDoc(saved);
    return send(res, 200, { ok: true, setup: !!saved, ...rest });
  } catch (e) {
    if (e instanceof Fail) return send(res, e.status, { error: e.message });
    console.error(e);
    return send(res, 500, { error: 'server' });
  }
}
