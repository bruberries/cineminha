// The install manifest, named after the app (settings.name) so the phone icon shows the family's name.
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function appName() {
  try {
    const r = await fetch(REDIS_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['GET', 'cineminha:data']),
    });
    const raw = (await r.json()).result;
    return (raw && JSON.parse(raw).settings?.name) || 'Cineminha';
  } catch {
    return 'Cineminha';
  }
}

export default async function handler(req, res) {
  const name = await appName();
  res.setHeader('Content-Type', 'application/manifest+json');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(JSON.stringify({
    name,
    short_name: name,
    start_url: './',
    scope: './',
    display: 'fullscreen',
    orientation: 'any',
    background_color: '#1f2a44',
    theme_color: '#1f2a44',
    icons: [
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  }));
}
