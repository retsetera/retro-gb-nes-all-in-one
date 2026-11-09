// Retro Pocket online-play signalling server: a plain PeerJS server.
// It only relays the short connection handshake (offers/answers/ICE candidates) between host and guests;
// the game stream and controller inputs travel directly between the devices (WebRTC), or via your TURN server.
const http = require('http');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const express = require('express');
const { ExpressPeerServer } = require('peer');

const PORT = Number(process.env.PORT || 9000);
const PATH = process.env.PEER_PATH || '/';          // the app expects the server URL to point at this path
const EJS_VERSION = '4.2.3';
const EJS_CDN = `https://cdn.emulatorjs.org/${EJS_VERSION}/data/`;
const app = express();
app.get('/health', (_req, res) => res.json({ ok: true, service: 'retro-pocket-netplay' }));
app.use((req, res, next) => { res.setHeader('Access-Control-Allow-Origin', '*'); next(); });

// Keep this proxy pinned to the same EmulatorJS release as the app; never accept an arbitrary upstream URL.
app.use(`/emulatorjs/:version/data`, async (req, res) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  if (req.params.version !== EJS_VERSION) return res.sendStatus(404);
  if (req.method !== 'GET' && req.method !== 'HEAD') return res.sendStatus(405);

  const asset = req.path.replace(/^\/+/, '');
  if (!asset || !/^[A-Za-z0-9._/-]+$/.test(asset) || asset.split('/').some((part) => !part || part === '.' || part === '..')) {
    return res.sendStatus(400);
  }

  let upstream;
  try {
    upstream = await fetch(EJS_CDN + asset, { method: req.method, headers: { Accept: req.get('accept') || '*/*' } });
  } catch (error) {
    console.error('EmulatorJS proxy request failed:', error);
    return res.status(502).send('EmulatorJS upstream unavailable');
  }

  res.status(upstream.status);
  res.setHeader('Cache-Control', upstream.ok ? 'public, max-age=31536000, immutable' : 'no-store');
  for (const header of ['content-type', 'etag', 'last-modified']) {
    const value = upstream.headers.get(header);
    if (value) res.setHeader(header, value);
  }
  if (req.method === 'HEAD' || !upstream.body) return res.end();
  try {
    await pipeline(Readable.fromWeb(upstream.body), res);
  } catch (error) {
    console.error('EmulatorJS proxy response failed:', error);
    if (!res.headersSent) res.status(502).end('EmulatorJS upstream unavailable');
    else res.destroy(error);
  }
});

const server = http.createServer(app);
const peer = ExpressPeerServer(server, {
  path: '/',
  proxied: process.env.PROXIED !== '0',              // Render/Fly/Railway terminate TLS in front of the app
  allow_discovery: false,                            // nobody can list open rooms
  alive_timeout: 60000,
  key: process.env.PEER_KEY || 'peerjs',
});
app.use(PATH, peer);
peer.on('connection', (c) => console.log('peer +', c.getId()));
peer.on('disconnect', (c) => console.log('peer -', c.getId()));
server.listen(PORT, '0.0.0.0', () => console.log(`Retro Pocket netplay server on :${PORT}${PATH} (health: /health)`));
