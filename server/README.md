# Retro Pocket online-play server (optional)

Retro Pocket works without this server, because it uses the free public PeerJS server (0.peerjs.com) by default. Deploy your own if you want reliability or privacy, or if you want LAN play without internet.
It is a stock [PeerJS server](https://github.com/peers/peerjs-server) (MIT). It only passes the short connection handshake between host and guests. The game video and the button presses then travel **directly between the devices** (WebRTC), so a free instance is enough.

After deploying, open Retro Pocket on **every device** and go to **Settings → 🌐 Online play → Signalling server**. Enter the URL, e.g. `https://retro-pocket-netplay.onrender.com`. The host's share link carries it automatically.

## Emulator download proxy

The same server can proxy the pinned EmulatorJS 4.2.3 loader, UI and core downloads for networks that block `cdn.emulatorjs.org`. After deploying it, open Retro Pocket → **Settings**, enter the server origin (for example `https://retro-pocket-netplay.onrender.com`) under **Proxy server URL**, and save. This routes all EmulatorJS files through `/emulatorjs/4.2.3/data/` on your server; the app caches them after the first successful download. The proxy only fetches assets from the pinned EmulatorJS CDN release and is not a general-purpose URL proxy.

## One-click options
| Host | Steps |
|---|---|
| **Render** (free) | Fork the repo → https://dashboard.render.com/blueprints → **New Blueprint Instance** → pick the fork. `render.yaml` creates the `retro-pocket-netplay` web service from `server/`. Free instances sleep after 15 min idle; the first connection then takes ~30 s. |
| **Fly.io** | `cd server && fly launch --copy-config --no-deploy && fly deploy`. URL: `https://<app>.fly.dev`. |
| **Railway** | New Project → Deploy from GitHub repo → Settings → **Root directory** `server` (it uses the Dockerfile) → Networking → **Generate domain**. |
| **Any Docker host** | `docker build -t rp-net server && docker run -p 9000:9000 rp-net` |
| **LAN only (no internet)** | On a PC on your Wi-Fi: `cd server && npm install && npm start`. Then use `http://<pc-ip>:9000` as the server on all devices. |

Health check: `GET /health`. Environment: `PORT` (default 9000), `PEER_PATH` (default `/`), `PEER_KEY` (default `peerjs`), and `PROXIED=0` when not behind a TLS proxy.

## TURN (only if players can't connect)
About 10–20 % of mobile and corporate networks block direct connections. Add a TURN relay in Settings → Online play: either a free tier (e.g. Metered/Open Relay, Cloudflare Calls TURN) or your own `coturn`. STUN defaults: Google + Cloudflare.
