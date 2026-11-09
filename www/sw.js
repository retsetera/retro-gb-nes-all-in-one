// Offline shell + runtime cache for the EmulatorJS CDN (loader, UI and cores are cached after first use).
const VERSION = 'dev';      // stamped to b<build> by scripts/stamp-build.mjs in CI, so every deployment changes this file and browsers notice the update
const SHELL = `retro-pocket-shell-${VERSION}`;
const RUNTIME = 'retro-pocket-ejs-v3';      // the EmulatorJS cores cache is version-independent: keep it across app updates
const EJS_VERSION = '4.2.3';
const SHELL_FILES = [
  './', 'index.html', 'player.html', 'join.html', 'manifest.webmanifest',
  'css/app.css', 'css/player.css', 'css/join.css', 'vendor/peerjs.min.js',
  'js/app.js', 'js/art.js', 'js/cover.js', 'js/pads.js', 'js/padnav.js', 'js/padsui.js', 'js/cores.js', 'js/db.js', 'js/player.js', 'js/detect.js', 'js/bios.js', 'js/biosui.js', 'js/biosdata.js', 'js/hash.js', 'js/dstouch.js', 'js/dsui.js', 'js/ingameui.js', 'js/updates.js', 'js/backup.js', 'js/folders.js', 'js/foldersui.js', 'js/netcfg.js', 'js/netplay.js', 'js/cloud.js', 'js/retroach.js', 'js/cheats.js', 'js/meta.js', 'js/touchlayout.js', 'js/video.js', 'js/join.js', 'js/version.js', 'js/padinput.js', 'js/perf.js', 'js/perfui.js', 'js/startgame.js', 'js/stick.js', 'js/topbar.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png',
];

// A new worker installs in the background and WAITS (no automatic skipWaiting): the app activates it silently on the next launch
// (or Settings → Check for updates → Reload), so a running game/library never gets half-old, half-new files. First install activates at once.
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES.map((u) => new Request(u, { cache: 'reload' })))).then(() => { if (!self.registration.active) return self.skipWaiting(); }));
});
self.addEventListener('message', (e) => {
  if (e.data === 'skip-waiting') e.waitUntil(self.skipWaiting());   // waitUntil: the worker must not be stopped before activation is queued
  else if (e.data === 'get-version' && e.source) e.source.postMessage({ type: 'version', version: VERSION });
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (![SHELL, RUNTIME].includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

// Cross-origin isolation for threaded cores (PPSSPP, DOSBox Pure): player.html?...&iso=1 is served with COOP/COEP.
// COEP "require-corp" blocks no-cors cross-origin subresources unless they send CORP, and EmulatorJS injects plain <script>
// tags for its loader files, so CDN and configured proxy responses are re-fetched with CORS and handed back with
// `Cross-Origin-Resource-Policy: cross-origin`. Pages without ?iso=1 get no COOP/COEP and behave exactly as before.
function isolate(r) {
  const h = new Headers(r.headers);
  h.set('Cross-Origin-Opener-Policy', 'same-origin'); h.set('Cross-Origin-Embedder-Policy', 'require-corp'); h.set('Cross-Origin-Resource-Policy', 'same-origin');
  return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    // NETWORK-FIRST for the app shell (never serves a stale file while online); the cache is the offline fallback.
    // build-info.json is never cached: it is how the app asks "is there a newer build?".
    e.respondWith((async () => {
      if (url.pathname.endsWith('/build-info.json')) return fetch(req.url, { cache: 'no-store' });
      const cache = await caches.open(SHELL);
      const key = req.url.split('?')[0];
      const net = fetch(url.pathname.endsWith('/') || /\.(html|js|css|webmanifest|json)$/.test(url.pathname) ? new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' }) : req)
        .then((r) => { if (r.ok) cache.put(key, r.clone()); return r; }).catch(() => null);
      let r;
      const cached = await cache.match(req, { ignoreSearch: true });
      if (cached) { const n = await Promise.race([net, new Promise((res) => setTimeout(() => res(null), 4000))]); r = n && n.ok ? n : cached; }   // slow / no network / server error -> cached copy
      else r = (await net) || new Response('Offline', { status: 503 });
      return req.mode === 'navigate' && url.searchParams.has('iso') && r.status === 200 ? isolate(r) : r;
    })());
    return;
  }

  const proxiedEjsAsset = url.pathname.startsWith(`/emulatorjs/${EJS_VERSION}/data/`);
  if (url.hostname === 'cdn.emulatorjs.org' || proxiedEjsAsset) {
    // cache-first: pinned, versioned assets never change
    e.respondWith((async () => {
      const cache = await caches.open(RUNTIME);
      let r = await cache.match(url.href);
      if (!r) {
        const net = await fetch(url.href, { mode: 'cors', credentials: 'omit' }).catch(() => null);
        if (!net) return Response.error();
        if (net.ok && net.status === 200) cache.put(url.href, net.clone());
        r = net;
      }
      const h = new Headers(r.headers); h.set('Cross-Origin-Resource-Policy', 'cross-origin');
      return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
    })());
  }
});
