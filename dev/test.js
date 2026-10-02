// End-to-end check of the API against the local server (needs internet for YouTube's oEmbed).
//   node dev/test.js
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const PORT = 3999, PIN = '4321', BASE = `http://localhost:${PORT}`;
const server = spawn(process.execPath, [new URL('server.js', import.meta.url).pathname], {
  env: { ...process.env, PORT: String(PORT), PARENT_PIN: PIN, KV_REST_API_URL: '' },
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((r) => server.stdout.once('data', r));

const get = (q = '') => fetch(`${BASE}/api/data${q}`).then((r) => r.json());
const post = async (body, pin = PIN) => {
  const r = await fetch(`${BASE}/api/data`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin, ...body }) });
  return { status: r.status, ...(await r.json()) };
};
const step = (name) => console.log('✓', name);

try {
  assert.deepEqual(await get(), { setup: false }); step('starts empty');
  assert.equal((await get('?packs')).packs.length, 8); step('lists 8 packs');
  assert.equal((await post({ action: 'check' }, 'nope')).error, 'wrong_pin'); step('rejects a wrong PIN');
  assert.equal((await post({ action: 'addVideo', url: 'x' })).error, 'not_set_up'); step('refuses changes before setup');

  assert.ok((await post({ action: 'setup', lang: 'en', name: 'Movie Night', packs: ['sesame-street-songs', 'backyardigans-en'] })).ok);
  let d = await get();
  assert.equal(d.settings.name, 'Movie Night');
  assert.deepEqual(d.categories.map((c) => c.name), ['Sesame Street songs', 'Backyardigans', 'More music', 'More cartoons']);
  const packs = (await get('?packs')).packs;
  const size = (id) => packs.find((p) => p.id === id).count;
  assert.equal(d.videos.length, size('sesame-street-songs') + size('backyardigans-en')); step('setup imports the chosen packs');
  assert.equal((await post({ action: 'setup', lang: 'pt' })).error, 'already_set_up'); step('setup runs only once');

  const music = d.categories[2].id, sesame = d.categories[0].id;
  assert.equal((await post({ action: 'addVideo', url: 'not a link', cat: music })).error, 'bad_link');
  assert.equal((await post({ action: 'addVideo', url: 'https://youtu.be/jNQXAC9IVRw', cat: 'nope' })).error, 'bad_category');
  const added = await post({ action: 'addVideo', url: 'https://youtu.be/jNQXAC9IVRw?si=abc', cat: music, by: 'Test' });
  assert.equal(added.video.title, 'Me at the zoo'); step('adds a video and fills its title from YouTube');
  assert.equal((await post({ action: 'addVideo', url: 'jNQXAC9IVRw', cat: music })).error, 'duplicate'); step('refuses duplicates');

  await post({ action: 'addVideo', url: 'https://www.youtube.com/watch?v=_mZbzDOpylA', cat: sesame, top: true });
  d = await get();
  assert.equal(d.videos.filter((v) => v.cat === sesame)[0].id, '_mZbzDOpylA'); step('"highlight" puts the video first in its category');

  const last = d.videos.filter((v) => v.cat === sesame).at(-1);
  await post({ action: 'moveVideo', id: last.id, cat: sesame, dir: 'top' });
  d = await get();
  assert.equal(d.videos.filter((v) => v.cat === sesame)[0].id, last.id); step('moves a video to the top');
  await post({ action: 'moveVideo', id: last.id, cat: sesame, dir: 1 });
  d = await get();
  assert.equal(d.videos.filter((v) => v.cat === sesame)[1].id, last.id); step('moves a video down one place');

  await post({ action: 'removeVideo', id: 'jNQXAC9IVRw', cat: music });
  assert.ok(!(await get()).videos.some((v) => v.id === 'jNQXAC9IVRw')); step('removes a video');

  const { category } = await post({ action: 'addCategory', name: 'Bedtime', section: 'cartoons', color: '#a78bfa' });
  await post({ action: 'editCategory', id: category.id, name: 'Bedtime stories' });
  await post({ action: 'moveCategory', id: category.id, dir: -1 });
  d = await get();
  assert.equal(d.categories.at(-2).name, 'Bedtime stories'); step('creates, renames and reorders a category');

  await post({ action: 'addPack', pack: 'pe-de-sonho' });
  await post({ action: 'addPack', pack: 'pe-de-sonho' });
  d = await get();
  assert.equal(d.categories.filter((c) => c.pack === 'pe-de-sonho').length, 1); step('adds a pack once');
  const it = d.categories.find((c) => c.pack === 'pe-de-sonho');
  await post({ action: 'deleteCategory', id: it.id });
  d = await get();
  assert.ok(!d.categories.some((c) => c.id === it.id) && !d.videos.some((v) => v.cat === it.id)); step('deletes a category with its videos');

  await post({ action: 'settings', name: 'Cinema da Ana', lang: 'pt' });
  const m = await fetch(`${BASE}/manifest.json`).then((r) => r.json());
  assert.equal(m.name, 'Cinema da Ana'); step('install manifest uses the app name');
  console.log('\nAll good.');
} finally {
  server.kill();
}
