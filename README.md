# Retro Pocket — 46 retro systems in one app (Game Boy → PlayStation, N64, PSP, Sega, Atari, arcade, DOS…)

An all-in-one retro emulator that runs **in the browser** (installable on iPhone from Safari as a Home Screen app) and as an **Android APK**. It does *not* need RetroArch installed: it embeds [EmulatorJS](https://github.com/EmulatorJS/EmulatorJS), which ships the RetroArch/libretro cores compiled to WebAssembly.

<!-- systems:start -->
| System | Add as | Default core (alternates) | BIOS | Notes |
|---|---|---|---|---|
| **Game Boy** (Nintendo) | `.gb` `.dmg` `.sgb` | `gambatte` (`mgba`) | gb_bios.bin optional, dmg_boot.bin optional | 1P |
| **Game Boy Color** (Nintendo) | `.gbc` `.cgb` | `gambatte` (`mgba`) | gbc_bios.bin optional | 1P |
| **Game Boy Advance** (Nintendo) | `.gba` | `mgba` | gba_bios.bin optional | 1P |
| **NES / Famicom** (Nintendo) | `.nes` `.unf` `.unif` `.fds` | `nestopia` (`fceumm`) | disksys.rom recommended | 2P |
| **SNES / Super Famicom** (Nintendo) | `.sfc` `.smc` `.swc` `.fig` `.bs` `.st` | `snes9x` | none | 2P |
| **Nintendo 64** (Nintendo) | `.n64` `.v64` `.z64` `.ndd` `.bin` *(asks which system)* | `mupen64plus_next` (`parallel_n64`) | none | ⚠ heavy · analog · 4P · Z = L2/ZL, C-buttons = right stick, analog stick = left stick. |
| **Nintendo DS** (Nintendo) | `.nds` | `desmume2015` (`melonds`) | bios7.bin optional, bios9.bin optional, firmware.bin optional | 1P |
| **Virtual Boy** (Nintendo) | `.vb` `.vboy` `.bin` *(asks which system)* | `beetle_vb` | none | 1P |
| **PlayStation** (Sony) | `.mdf` `.toc` `.cbn` `.bin` `.iso` `.cue` `.chd` `.ccd` `.m3u` … *(asks which system)* | `pcsx_rearmed` (`mednafen_psx_hw`) | scph5501.bin recommended, scph5500.bin recommended, scph5502.bin recommended, scph1001.bin optional, psxonpsp660.bin optional | ⚠ heavy · analog · 2P · Multi-disc games: add a .m3u playlist or one .cue per disc. L2/R2 = triggers, analog sticks supported. |
| **PlayStation Portable** (Sony) | `.cso` `.prx` `.elf` `.iso` `.chd` `.pbp` *(asks which system)* | `ppsspp` | none | ⚠ heavy · analog · 1P · Needs threads + WebGL2 (the app turns on cross-origin isolation automatically). |
| **Master System** (Sega) | `.sms` `.bin` `.rom` *(asks which system)* | `smsplus` (`genesis_plus_gx`, `picodrive`) | none | 2P |
| **Game Gear** (Sega) | `.gg` | `genesis_plus_gx` (`smsplus`) | none | 1P |
| **SG-1000** (Sega) | `.sg` | `genesis_plus_gx` (`smsplus`) | none | 2P |
| **Genesis / Mega Drive** (Sega) | `.md` `.smd` `.gen` `.mdx` `.68k` `.sgd` `.bms` `.bin` `.iso` `.cue` *(asks which system)* | `genesis_plus_gx` (`picodrive`) | none | 2P |
| **Sega CD / Mega-CD** (Sega) | `.bin` `.iso` `.cue` `.chd` `.m3u` *(asks which system)* | `genesis_plus_gx` (`picodrive`) | bios_CD_U.bin **required**, bios_CD_E.bin **required**, bios_CD_J.bin **required** | 2P |
| **Sega 32X** (Sega) | `.32x` | `picodrive` | none | 2P |
| **Sega Saturn** (Sega) | `.mds` `.bin` `.iso` `.cue` `.chd` `.ccd` `.m3u` … *(asks which system)* | `yabause` | saturn_bios.bin recommended | ⚠ heavy · 2P · Digital pad: A/B/C = ✕/○/□-style face buttons, X/Y/Z = Y/X + R. Saturn emulation is very heavy. |
| **Atari 2600** (Atari) | `.a26` `.bin` `.zip` *(asks which system)* | `stella2014` | none | 2P · Select = Game Select, Start = Reset. |
| **Atari 5200** (Atari) | `.a52` `.bin` `.rom` *(asks which system)* | `a5200` | 5200.rom optional | 2P |
| **Atari 7800** (Atari) | `.a78` `.bin` `.rom` *(asks which system)* | `prosystem` | 7800 BIOS (U).rom optional, 7800 BIOS (E).rom optional | 2P |
| **Atari Lynx** (Atari) | `.lnx` | `handy` | lynxboot.img recommended | 1P |
| **Atari Jaguar** (Atari) | `.j64` `.jag` `.abs` `.cof` `.bin` `.rom` *(asks which system)* | `virtualjaguar` | none | 2P |
| **Neo Geo Pocket** (SNK) | `.ngp` | `mednafen_ngp` | none | 1P |
| **Neo Geo Pocket Color** (SNK) | `.ngc` | `mednafen_ngp` | none | 1P |
| **Neo Geo (AES/MVS)** (SNK) | `.zip` `.7z` *(asks which system)* | `fbneo` | neogeo.zip **required** | 2P · Select = Coin, Start = Start. Games are the usual FBNeo/MAME .zip sets. |
| **PC Engine / TurboGrafx-16** (NEC) | `.pce` `.bin` *(asks which system)* | `mednafen_pce` | none | 2P |
| **PC Engine CD / TurboGrafx-CD** (NEC) | `.bin` `.iso` `.cue` `.chd` `.ccd` `.m3u` … *(asks which system)* | `mednafen_pce` | syscard3.pce **required**, syscard2.pce optional, syscard1.pce optional, gexpress.pce optional | 2P |
| **PC-FX** (NEC) | `.iso` `.cue` `.chd` `.ccd` *(asks which system)* | `mednafen_pcfx` | pcfx.rom **required** | 2P |
| **WonderSwan** (Bandai) | `.ws` `.pc2` | `mednafen_wswan` | none | 1P |
| **WonderSwan Color** (Bandai) | `.wsc` | `mednafen_wswan` | none | 1P |
| **3DO** (Other) | `.bin` `.iso` `.cue` `.chd` *(asks which system)* | `opera` | panafz10.bin **required**, panafz1.bin optional, goldstar.bin optional, sanyotry.bin optional | ⚠ heavy · 2P |
| **ColecoVision** (Other) | `.col` `.cv` `.bin` `.rom` *(asks which system)* | `gearcoleco` | colecovision.rom **required**, eos.rom optional, writer.rom optional | 2P |
| **Philips CD-i** (Other) | `.iso` `.cue` `.chd` *(asks which system)* | `same_cdi` | cdimono1.zip **required** | ⚠ heavy · 1P · experimental |
| **Commodore 64** (Computers) | `.d64` `.d71` `.d81` `.t64` `.prg` `.p00` `.crt` … `.m3u` `.gz` `.tap` *(asks which system)* | `vice_x64sc` (`vice_x64`) | none | 2P · Joystick only on mobile; a physical keyboard works on desktop. Auto-starts disks/tapes. |
| **Commodore 128** (Computers) | — | `vice_x128` | none | 2P · experimental |
| **Commodore VIC-20** (Computers) | — | `vice_xvic` | none | 2P |
| **Commodore PET** (Computers) | — | `vice_xpet` | none | 1P · experimental |
| **Commodore Plus/4** (Computers) | — | `vice_xplus4` | none | 2P |
| **Commodore Amiga** (Computers) | `.adf` `.adz` `.dms` `.fdi` `.ipf` `.hdf` `.hdz` … `.iso` `.cue` `.chd` `.ccd` `.m3u` `.zip` … *(asks which system)* | `puae` | kick34005.A500 recommended, kick37175.A500 recommended, kick40063.A600 recommended, kick40068.A1200 optional | 2P · Mouse/keyboard-centric: joystick games work best. Keyboard on desktop. |
| **ZX Spectrum** (Computers) | `.z80` `.rzx` `.scl` `.trd` `.tap` `.tzx` *(asks which system)* | `fuse` | none | 1P · experimental |
| **ZX81** (Computers) | `.t81` `.p` `.tzx` *(asks which system)* | `81` | none | 1P · experimental |
| **Amstrad CPC** (Computers) | `.dsk` `.sna` `.cdt` `.cpr` `.kcr` `.m3u` `.zip` `.tap` *(asks which system)* | `cap32` (`crocods`) | none | 1P · experimental |
| **DOS** (Computers) | `.conf` `.com` `.bat` `.dosz` `.iso` `.exe` `.zip` `.7z` *(asks which system)* | `dosbox_pure` | none | ⚠ heavy · 1P · experimental · Add a game as a .zip (a DOS game folder zipped) or a single .exe/.com/.bat. Needs threads (enabled automatically). |
| **Doom (PrBoom)** (Computers) | `.wad` `.iwad` `.pwad` | `prboom` | none | 1P · experimental · Add your own IWAD (doom.wad, doom2.wad, freedoom…). Not included. |
| **Arcade (FinalBurn Neo)** (Arcade) | `.zip` `.7z` *(asks which system)* | `fbneo` (`fbalpha2012_cps1`, `fbalpha2012_cps2`) | shares Neo Geo (AES/MVS) BIOS (optional) | 4P · Select = Coin, Start = Start. Use the exact ROM-set .zip for FBNeo (needs matching version of the set). |
| **Arcade (MAME 2003+)** (Arcade) | `.zip` `.7z` *(asks which system)* | `mame2003_plus` (`mame2003`) | shares Neo Geo (AES/MVS) BIOS (optional) | 4P · Select = Coin, Start = Start. Use ROM sets matching MAME 0.78 / 2003-Plus. |
<!-- systems:end -->

Features: **46 systems** (table above, verified against the pinned EmulatorJS 4.2.3 core list), content-based system detection with a *Which system?* picker for ambiguous files, `.cue`+`.bin` disc bundling, per-system **BIOS upload** (stored on your device, never bundled), performance warnings, **Bluetooth/USB controller support**, automatic **box art** (+ a *Change cover* picker with web search, URL paste and upload), crash protection with automatic core fallback, ROM library saved on your device (IndexedDB), add many ROMs at once, search + system filters, auto-detected core per file, on-screen touch gamepad, save states, battery saves (flushed every 30 s), **auto-resume** (your session is snapshotted when you leave a game), dark mobile-first UI, offline shell via service worker.

## ⚖️ Legal

* **Bring your own ROMs.** No games are included or downloaded. Only use dumps of cartridges you own, or homebrew you have the right to play. The ROMs you add never leave your device (they're stored in the browser's local database).
* **No commercial BIOS, ever.** Original BIOS/firmware files (Sony, Sega, Nintendo, Atari, SNK, NEC, Panasonic/3DO, Coleco, Commodore…) are copyrighted: they are **not** in this repository, **not** downloaded by the app, and the app never links to dump sites or archive copies. You supply them from your own console. The only BIOS-type files that can be downloaded are the **three open-licensed replacements** listed under [BIOS files](#-bios-files) (MIT / Expat), mirrored in `www/bios-open/` together with their licence texts; `npm run check` fails if anything else is placed there or a checksum / licence entry is missing.
* **Licensing:** this project is released under **GPL-3.0** (see `LICENSE`). It loads [EmulatorJS](https://github.com/EmulatorJS/EmulatorJS) (GPL-3.0) and the RetroArch/libretro cores (Gambatte GPL-2.0, mGBA MPL-2.0, FCEUmm/Nestopia GPL-2.0, DeSmuME GPL-2.0, melonDS GPL-3.0, Mupen64Plus-Next GPL-2.0, PCSX ReARMed GPL-2.0, PPSSPP GPL-2.0, Genesis Plus GX / SMS Plus **non-commercial** licences, Snes9x **non-commercial**, Stella GPL-2.0, MAME 2003 / FBNeo **non-commercial**, VICE GPL-2.0, DOSBox Pure GPL-2.0 …) from the EmulatorJS CDN at runtime. Several cores forbid commercial use, so do not sell this app or publish it commercially; check each core's licence if you redistribute. Apple's App Store is generally incompatible with GPL — which is why the iPhone version is a Home Screen web app.
* Nintendo, Game Boy, NES, SNES etc. are trademarks of Nintendo; this project is not affiliated with or endorsed by them.

## 📱 iPhone / iPad (runs in Safari, saved to Home Screen)

1. On your iPhone open **`https://<your-github-username>.github.io/retro-gb-nes-all-in-one/`** in **Safari** (it must be Safari — not Chrome — for *Add to Home Screen* to create a full-screen app).
2. Tap the **Share** button (square with the up-arrow at the bottom).
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add** (top-right). A *Retro Pocket* icon appears on your Home Screen.
5. Open it from the Home Screen, tap **＋ Add games**, and pick ROM files from the Files app / iCloud Drive / Downloads. Tap a game to play; tap the on-screen **Start** button once (iOS needs a tap to unlock sound).
6. Tap **‹ Library** to leave a game — it auto-saves and shows **▶ Resume** next time.

The first launch of each system downloads its core (~1–4 MB) from the EmulatorJS CDN; after that it is cached and works offline. Tip: if Safari ever clears website data for the app, the ROM library goes with it — keep your original ROM files.

## 🤖 Android

**Option A – APK:** download `RetroPocket-debug.apk` from the repo's **Releases** page (rolling `latest` release), or from the newest run in the **Actions → Build Android APK** tab (artifact `RetroPocket-debug-apk`). Open it and allow *Install unknown apps* when asked.

### 📲 Installing and updating the APK (read this once)

Android only installs an update **over** an existing app when the new APK is signed with the **same key** and has a **higher versionCode**. Earlier builds were signed with a throw-away debug key that CI generated fresh on every run, so updating over them failed with *"App not installed" / "package conflicts"*. That is fixed for all builds from now on:

* **One stable signing key** for every build: a private keystore stored as GitHub Actions secrets (`RP_KEYSTORE_B64`, `RP_KEYSTORE_PASSWORD`, `RP_KEY_ALIAS`, `RP_KEY_PASSWORD`; never in the repo). If the secrets are missing (forks, PRs) the build falls back to a committed, *public* debug keystore (`android/app/retropocket-fallback.keystore`) — consistent, but **not secret and not the same key**, so only use release-key builds for your own device.
* **Increasing version:** `versionCode = 1000 + number of commits`, `versionName = 1.0.<commits>-<sha>`; `applicationId` stays `com.retropocket.app`. The workflow runs `apksigner verify` and checks the versionCode of the built APK; the signing-certificate SHA-256 and version are printed in the job summary and the release notes.

**Exact steps**
1. **One time only (because of the old key):** uninstall the old *Retro Pocket* app (Settings → Apps → Retro Pocket → Uninstall). ⚠️ This deletes the library, save states and BIOS files, which live in the app's WebView storage — the old builds have no export function, so they cannot be saved; keep your original ROM files. (Alternatively keep using the web app/PWA, whose data is separate.)
2. Install the newest `RetroPocket-debug.apk` from the Releases page.
3. **From now on** updates install **over** the current app and keep your data. Inside the app: open **Settings → 🔄 Check for updates**; when a newer build exists you get **Update now** right there in Settings (there are no pop-ups on the main screen) (see *In-app APK updates* below).

### ⬇️ In-app APK updates
Builds from 1.0.27 (versionCode 1027) on update themselves. Install **one** of these builds the old way (browser download) first; after that:
1. Open **Settings → 🔄 Check for updates** and tap **Update now**. The APK downloads **inside the app**, with a percentage, a progress bar and **Cancel**.
2. The app checks the download before anything is installed. It must be a valid APK of `com.retropocket.app`, signed with the **same certificate** as the installed app, and have a **higher versionCode**. If a check fails you get an error and nothing is installed.
3. Android 8+ asks once to allow **"Install unknown apps"** for Retro Pocket. The banner explains this and **Open settings** goes straight to that switch. Come back and the install continues.
4. The Android installer opens. Tap **Update**; your library, saves and settings stay.

Old and already-installed downloads are deleted at start-up. If a finished download is still waiting (for example, Android restarted the app after the settings screen), Settings shows **Install now** (with a small dot on the Settings button) instead of a second download. Without the native plugin (older APKs) or if the download fails, it falls back to the browser download link. The web app / iPhone shows *Update available — Reload* in Settings. Native code: `android/app/src/main/java/com/retropocket/app/AppUpdaterPlugin.java` (permission `REQUEST_INSTALL_PACKAGES`, FileProvider path `cache/updates/`). Tested with a mocked plugin by `node tests/appupdate.mjs`.
4. Before any future uninstall/reinstall (or moving to another phone): **Settings → 💾 Backup & restore → Export backup** (games, states, cover art, BIOS, settings in one ZIP) and import it afterwards. (Some Android app WebViews cannot save downloaded files; if the export does not produce a file, use the web app in Chrome for the backup.)

Verified on two consecutive CI builds (1.0.15 → versionCode 1015, then the next one): identical signer certificate, higher versionCode.

Signing certificate of the stable key (SHA-256): `3D:22:72:23:FC:4D:C7:E5:6E:18:7B:CE:E3:DD:28:11:66:8E:AE:21:0A:9E:E4:C2:AE:EB:17:03:50:F7:12:7C` — `apksigner verify --print-certs RetroPocket-debug.apk` should print exactly this (lower-case, no colons).

### 🔄 Web app updates

The service worker is **network-first** (online you always get the newest files; the cache is only the offline fallback) and a new version installs in the background and **waits**, so you never get half-old/half-new files. It is applied **silently the next time you open the app**. There are **no update banners on the main screen**; **Settings → 🔄 Check for updates** is the only place to look for updates. It says *You're up to date (version X)* or offers **Reload** (web) / **Update now** (APK). Before 1.0.29 an update banner could show on every launch, even on the current version (an already-applied service worker was reported as "waiting", mostly inside the APK). That is fixed. Every deployment is stamped with the commit count (`www/build-info.json`, `www/js/version.js`, service-worker `VERSION`). Tested by `node tests/update.mjs`.

**Option B – PWA (no APK):** open the Pages URL above in **Chrome** → ⋮ menu → **Install app** / **Add to Home screen**.

## 🖼 Cover art

* When you add a ROM, Retro Pocket cleans the file name (`Super Mario Bros. (World) [!].nes` → *Super Mario Bros.*), looks it up in the [libretro thumbnails](https://github.com/libretro-thumbnails) listing for that system (one libretro-thumbnails repository per system, e.g. `Sony - PlayStation`, `Nintendo - Nintendo 64`, `Sega - Mega Drive - Genesis`, `FBNeo - Arcade Games`, `DOS` — see `art` in `www/js/cores.js`; every repository name was checked against GitHub), fuzzy-matches region/revision tags (e.g. *Tetris (World)* → `Tetris (World) (Rev 1).png`), tries **Named_Boxarts** then **Named_Titles**, and falls back to a generated cover (system colour + title).
* Art is downscaled and cached in IndexedDB, so it shows offline. **Refresh cover art** (per game ⋯ menu) and **🖼 Get art (n)** (library) fetch missing covers again.
* **CORS note:** `thumbnails.libretro.com` sends no `Access-Control-Allow-Origin` header, so browsers can't `fetch` it or read it into a canvas. The same files live in GitHub repos whose `raw.githubusercontent.com` / `api.github.com` endpoints are CORS-enabled, so art is fetched from there. `thumbnails.libretro.com` is only used as a display-only last resort.
* **Change cover…** (per game ⋯ menu): search prefilled with *title + system*; results from **libretro** (box art, title screens, screenshots), **Wikipedia** (page images — usually the real cover), **Wikimedia Commons**, **Internet Archive**, plus optionally **RAWG** if you paste a free API key (stored only on your device). You can also paste an image URL or upload from your camera roll / files, then pan/zoom, crop-to-cover or *Fit*, and save. If an image host blocks CORS, the picker retries through the keyless proxy `images.weserv.nl` (only for the one image you picked) and, failing that, stores a link-only cover. **Reset to automatic** goes back to the libretro match.
* SteamGridDB, IGDB and TheGamesDB require private keys and/or server-side calls, so they are not usable from a static site and are not included.

## 🎮 Nintendo DS notes

* DS emulation is **demanding**. Modern Android phones and recent iPhones can run many games but expect slowdowns; **iPhone Safari may be slow** (WebAssembly without JIT) — DeSmuME 2015 is the lighter core and the default, melonDS is more accurate but heavier (switch via the game's ⋯ menu).
* **No special headers needed for DS.** Both DS cores run in the single-threaded build; only PPSSPP and DOSBox Pure need threads (see *Threads / cross-origin isolation* below).
* DS save states are large, so auto-resume snapshots are taken only when you leave a game, not periodically.

### ✋ DS touchscreen (stylus)

**What was wrong:** EmulatorJS 4.2.3 has no touch API for the DS. RetroArch's web input turns taps into a "pointer", but both DS cores default to *relative-mouse* pointer modes (`desmume_pointer_type = mouse`, `melonds_touch_mode = Mouse`), so a finger on the bottom screen did nothing; even in the cores' absolute mode a finger resting on an on-screen button is first in the touch list, so the stylus finger is lost, and sliding in from the top screen or past the edge was not handled.

**The fix** (`www/js/dstouch.js`, DS games only, both DeSmuME 2015 and melonDS): the player switches the core to its absolute touch mode and puts a transparent overlay over the game canvas (below the on-screen buttons, so buttons keep winning). The overlay computes where the bottom screen is (RetroArch's viewport maths for the current layout, CSS scaling, letter-boxing, orientation and `devicePixelRatio`) and feeds a single, correctly scaled mouse "stylus" to the core via the canvas. It supports tap, hold-and-slide, edge clamping, **multi-touch** (a thumb on A/D-pad while the other finger drives the stylus, in any order), ignores touches that *start* on the top screen, and a real **mouse** works on desktop (without pointer lock).

**Settings** (Library → ⚙ Settings → *Nintendo DS touch & screens…*, and the in-game ☰ menu cycles *Touch* and *Screens* live):
* **Touch mode** — *Direct touch* (default: the stylus is where your finger is) or *Trackpad* (drag moves a cursor without touching; tap = tap at the cursor; tap-then-drag or a second finger = hold the stylus down). Trackpad speed 1×–3×.
* **Screen layout** — *Auto* (stacked in portrait, side-by-side in landscape), *Stacked*, *Stacked swapped*, *Side by side*, *Side by side swapped*, or *Bottom screen only* (bigger stylus area). Applied live through the core's own layout option; touch mapping follows.

**Tests** (`node tests/dstouch.mjs`): a tiny hand-assembled DS "probe" ROM (`scripts/make-ds-touch-rom.py`, not a game) runs on the ARM7 and mirrors the touch panel and key registers into RAM; the test reads them back out of the core. With synthetic CDP touch/mouse input on **both cores** it checks the stylus pixel at centre/corners, drags, top-screen start ignored, edge clamping, A/B-button multi-touch, every layout, portrait/landscape and DPR 1–3, trackpad gestures, desktop mouse, the pause menu, that other systems get no overlay, and it reproduces the original bug. **Not tested:** a real DS game, a real phone or iOS Safari (Pointer Events + synthetic mouse events on iOS are unverified), real-game touch calibration/pressure, or the look of each layout in melonDS (the probe's ARM9 screen output doesn't run there).

## ☰ In-game menu (no pop-up bottom bar)

EmulatorJS' own bottom control bar (it popped up when you touched "dead" areas, hovered near the bottom edge or long-pressed) is **never shown** any more, so touches in empty areas do nothing and never interrupt play (on DS they are ignored too). Instead there is one small, semi-transparent **☰ button at the top of the screen** (44 px tap target, safe-area aware for the iPhone notch / Home Screen app). It opens the pause menu:

* **Resume · Save state · Load state · Restart · Exit to library**
* **Sound** on/off · **Fast-forward** on/off · **Screenshot** (downloads a PNG) · **Fullscreen** (whole page, so the menu stays reachable; hidden where the browser has no fullscreen, e.g. iPhone Safari)
* **Controls…** (EmulatorJS key/touch mapping) · **Cheats…** (where the core supports them) · **Disc / disk…** (multi-disc games) · **Emulator settings…** (EmulatorJS' full settings: shaders, speed ratios, volume, save-state slot, core options — shown in our own full-screen panel)
* **DS only:** *Touch* mode and *Screens* layout · **Menu button position** (cycle)
* Controller: hold **Select + Start** (or **Guide**) still opens the same menu; **Select + R1 / L1** quick save / load are unchanged.

**Settings** (Library → ⚙ Settings → *In-game menu button…*): position **top-left / top-center / top-right**, and **fade out when idle** (on by default: after ~3.5 s the button dims to a faint ghost; it is still there and a single tap still opens the menu, and touching near the top edge brings it back). The library-side *‹ Library* button is gone; use *Exit to library* in the menu.

Tested in `node tests/ingame.mjs` (dead-zone taps, long-press, swipe, desktop hover/click/right-click, ☰ placement/size, every menu function, settings panel, auto-fade, position/auto-hide settings, landscape) and in `tests/dstouch.mjs` (DS dead zones, ☰ does not reach the stylus). Not tested: a real phone / iOS Safari (safe-area insets with a real notch are only checked by CSS `env()`), real fullscreen on iOS, a multi-disc game (the Disc button is verified hidden for single-disc games).

## 📁 ROM folders & "Scan for new ROMs"

The library has a **Scan** button and a **📁 ROM folders** button. Single files can still be added with **＋ Add games**.

| Platform | How it works |
|---|---|
| **Android APK** | Tap **🔄 Scan for new ROMs**. The Android folder picker opens at **Download/**; choose any folder (or several, via ROM folders → Add). Permission is kept, so later scans and the automatic scan at launch read the folder directly (subfolders included). |
| **Chrome / Edge (desktop & Android browser)** | Same flow, using the File System Access API. Folders are remembered. If the browser asks again after a restart, tap **Rescan** to allow access. |
| **iPhone / iPad (Safari, Home Screen app)** | Tap **📥 Scan Downloads**, then **Browse → Downloads → Select (top right) → Select All → Open**. Safari can't open a folder by itself or remember it, so do this each time you've downloaded new games. Only new games are added; the last import time is shown in ROM folders. |
| **Firefox** | "Import a whole folder" (directory upload); same de-duplication. |

- Only **new** files are added. Matching uses the path/size/date index, then name+size and the content hash against the library.
- Pictures, text, saves, and other non-game files are skipped. `.zip`, `.7z`, and every supported ROM extension are imported. `.cue`/`.m3u` files are imported together with the `.bin`/track files they reference.
- Scans never stop to ask questions. A file whose system can't be detected (e.g. a bare `.bin`) is reported as "need a system choice"; add it with **＋**.
- Games are copied into the app's storage, so they keep working offline and when the folder is gone. Removing a folder never deletes games.
- Settings → **📁 ROM folders…** lists the folders with their file count and last scan time, plus Rescan, Remove, and scan progress.

## 🌐 Online & LAN play (netplay)

Play with or against friends over the internet or on the same Wi-Fi.

1. **Host:** start a game → ☰ → **🌐 Online play… → Start a room**. You get a 6-letter **room code** and a share link.
2. **Friends:** open the link, or in Retro Pocket go to Settings → 🌐 Online play → **Join a friend's game** and enter the code. They see your screen live and play as **Player 2–4**. Controls: the on-screen touch pad, a keyboard (arrows, Z/X/A/S, Q/W, Enter, Shift), or a Bluetooth/USB controller.
3. The host decides who is who: each guest can be Player 2/3/4, **Player 1 (shared)** for 1-player games (take turns or help out), or **Watching**. The host can also remove guests. A badge shows the room code and guest count.

**How it works, honestly:**
- It is **host-streams-the-game**: the emulator runs only on the host. Guests receive a WebRTC video+audio stream and send their buttons back over a WebRTC data channel.
- So it works with **every system and core**, guests **don't need the ROM, BIOS or the same app version**, and the players can never desync. (EmulatorJS' own netplay is experimental, needs the same ROM everywhere, and is disabled in 4.2.3.)
- Guests see the game with the network delay added. On the same Wi-Fi that is ~20–60 ms, which is fine for most games. Over the internet it is typically 50–150 ms: good for RPGs, puzzle, party, and co-op games, and noticeable in twitchy fighting games.
- The host's device does all the work (emulating plus video encoding). A recent phone handles 8/16-bit systems easily; for 3D systems, host on a computer.
- Players per system follow the console: NES/SNES/Genesis/N64/PS1 up to 2–4, Game Boy/GBA/DS 1 (guests share Player 1 or watch).
- **Signalling:** by default the free public PeerJS server introduces the devices. No account or setup is needed. Self-host with [`server/`](server/README.md) (Render / Fly.io / Railway / Docker, one click) and enter its URL under Settings → Online play.
- **LAN:** on the same Wi-Fi, WebRTC connects the two devices directly, so the stream never leaves your network. Only the handshake goes to the signalling server. For play with no internet at all, run `server/` on a PC on the LAN.
- **STUN/TURN:** Google + Cloudflare STUN by default. If someone on a strict mobile/corporate network can't connect ("No answer from that room"), add a TURN server in Settings → Online play.
- iPhone guests: Safari plays the stream muted until you tap **🔇 Tap for sound**. Hosting from iPhone works too, but iOS stops the game when Safari goes to the background.
- The Android app's share link points to the web version (`…github.io/…/join.html`), so friends need nothing installed.

## ☁️ Cloud save sync (Google Drive)

Settings → **☁️ Cloud save sync** keeps your **in-game (battery) saves and auto-resume states** in sync between your devices: iPhone, Android Chrome and desktop.
- They are stored in the hidden *app data* folder of **your own Google Drive** (`drive.appdata` scope). Retro Pocket cannot see any of your other files, and the folder doesn't clutter your Drive.
- Games, BIOS files and API keys are **never uploaded**.
- Per file, the newest copy wins. Identical files are skipped (SHA-256). Nothing is ever deleted from the cloud.
- After you sign in, it syncs automatically each time you come back to the library from a game. **Sync now** syncs on demand.
- Battery saves are matched by the game's **file name**, and auto-resume states by the ROM's content hash. So keep the same ROM file names on all devices.

**One-time setup (you need your own free OAuth client ID; Google requires one per web app):**
1. Open <https://console.cloud.google.com/> → create a project (e.g. "Retro Pocket").
2. **APIs & Services → Library → Google Drive API → Enable.**
3. **APIs & Services → OAuth consent screen** (Google Auth Platform → Branding/Audience):
   - User type **External**, app name "Retro Pocket", your e-mail.
   - Under **Data access** add the scope `.../auth/drive.appdata`.
   - Under **Audience** add your Google account(s) as **test users**. While the app is in "Testing", only those accounts can sign in, and Google asks again every 7 days. To lift that, click *Publish app*: `drive.appdata` is not a restricted scope, so no security review is needed.
4. **Clients (Credentials) → Create OAuth client ID → Web application.**
   - Authorized JavaScript origins: `https://geek4945-creator.github.io` (plus your own domain or `http://localhost:8080` if you self-host).
   - No redirect URI is needed.
5. Copy the client ID (`….apps.googleusercontent.com`). In Retro Pocket go to Settings → ☁️ Cloud save sync, paste it, then tap **Sign in with Google & sync**. Do this on each device; the client ID is also included in backups.

**Limits:**
- Google blocks OAuth sign-in inside app WebViews. In the **Android APK** cloud sync is therefore not available. Use the web app in Chrome on Android (it shares the same saves via Drive), or use Backup & restore.
- Background sync needs a sign-in from the current app session. After the app is fully closed, tap *Sync now* once (one tap, no password if you're signed in to Google).
- Don't play the same game on two devices at once: the newest save wins.

## 🏆 RetroAchievements

Settings → **🏆 RetroAchievements**:
- Log in with your username and your personal **Web API key** (retroachievements.org → Settings → Keys). Your password is never asked for or stored. The key stays on the device and is excluded from backups.
- **In-game ☰ → 🏆 Achievements** lists the achievement set for the running game and what you've unlocked (softcore/hardcore), with badges. The game is matched by RetroAchievements' own ROM hash, so it has to be a supported dump.
- Hash matching works for cartridge systems: NES, SNES, N64, GB/GBC/GBA, Virtual Boy, Genesis, 32X, SMS, GG, SG-1000, PC Engine, Atari 2600/7800/Lynx/Jaguar, NGP/NGPC, WonderSwan and ColecoVision.
- **Hardcore mode** applies RetroAchievements' hardcore rules in Retro Pocket: loading save states, auto-resume, cheats, rewind and slow motion are all disabled. Saving and fast-forward still work.

**Honest limit:** Retro Pocket can't award new unlocks, for two reasons:
- RetroAchievements only accepts unlocks from approved emulators such as RetroArch.
- Its unlock API blocks browser (CORS) requests, and the EmulatorJS cores don't expose game memory for the rcheevos runtime.

Unlocks you earn in RetroArch on other devices show up here.

## 🧪 Cheats

In game, open **☰ → 🧪 Cheats…**:
- **Add a code** by typing any code the core understands:
  - NES: Game Genie / Pro Action Rocky / raw `AAAA:VV`
  - SNES: Game Genie / Pro Action Replay
  - GB/GBC: Game Genie / GameShark
  - GBA: Action Replay / GameShark / CodeBreaker
  - Genesis, SMS, GG: Game Genie / PAR
  - N64, PS1: GameShark
  - DS: Action Replay
  - PSP: CWCheat

  To put several codes in one cheat, join them with `+`.
- **📚 Browse cheat database** finds your game in the [libretro-database](https://github.com/libretro/libretro-database/tree/master/cht) cheat collection, then lets you tap a cheat to add and enable it.
  - The list is downloaded from GitHub on demand and cached for 14 days.
  - It needs internet. GitHub allows 60 lookups per hour per IP address.
- Cheats are saved per game and switched on again automatically the next time you start it. Use the checkbox to turn one off.
- Database codes are made for a specific ROM version. If a code glitches the game, turn it off.
- Cheats are disabled in RetroAchievements hardcore mode.

## ⭐ Favorites, recents, play time & collections

- **Favorites:** open a game's **⋯** menu and tap **☆ Add to favorites**. The game gets a ★ badge and appears under the **★ Favorites** filter chip.
- **🕘 Recent** shows the 24 games you played most recently.
- **Play time** counts only while a game is actually running: not paused, and not with the app in the background.
  - Cards show ⏱ once a game has 1 minute or more of play.
  - The ⋯ sheet shows total time, the number of sessions and the date you last played.
- **Sort** with the selector next to the search box: Recent, A–Z or Most played.
- **Collections:** go to **⋯ → 📁 Collections…** to create collections (for example "Couch co-op" or "RPGs") and tick the games that belong in them. Each collection gets its own filter chip. You can rename or delete collections from the same screen.
- All of this is stored on the device and included in **Backup**. Removing a game also removes its entries.

## 🎮 Touch layout editor & skins

In game, open **☰ → 🎮 Touch layout…**. The game pauses and the on-screen controls become editable:
- **Drag** any button, d-pad or stick to move it.
- **Tap** a control to select it, then use the **Size** slider (50–200%) to resize it.
- **All controls** scales the whole pad. **Opacity** goes from 10–100%.
- **Presets:** Default, Large, Compact, Raised (higher, clear of the home bar) and Left-handed (d-pad and buttons swap sides).
- **Skins:** Classic, Dark, Clear, Retro colors (SNES-coloured ABXY, Famicom/Game Boy maroon) and Neon.
- Use **⇵ Panel** to move the editor panel out of the way. **Reset** goes back to the default layout.

Layouts are saved **per system**, re-applied every time a game starts, and included in Backup. Sizes and positions are stored relative to the screen, so they also work after rotating the device.

Analog sticks can be moved but not resized.

## ⏪ Rewind, fast-forward & screen filters

- **⏪ / ⏩ next to ☰.** While a game runs, two small buttons sit beside the menu button and fade with it. **Hold ⏪** to rewind and let go to keep playing. **Tap ⏩** to switch fast-forward on or off. You can hide them with **☰ → ⏪⏩ Top buttons**.
- **☰ → ⏪ Rewind: On/Off.** This is saved per system and takes effect the next time the game starts, because RetroArch sets up its rewind buffer at launch.
  - **On by default** for the light 8/16-bit and handheld systems: NES, SNES, GB/GBC/GBA, Master System, Game Gear, SG-1000, Mega Drive, PC Engine, Atari 2600/7800, Lynx, Neo Geo Pocket, WonderSwan, Virtual Boy and ColecoVision.
  - **Off by default** for 3D/CD systems, where saving a state every few frames costs too much speed and memory on phones.
  - **RetroAchievements hardcore** always turns rewind off.
- **☰ → ✨ Screen filter** cycles through these filters, saved per system:
  - **Off** (sharp pixels, the default)
  - **CRT** (zfast: scanlines and mask, cheap enough for phones)
  - **CRT (curved)** (crt-geom)
  - **LCD grid** (Retro Pocket's own shader: pixel grid with faint RGB sub-pixels, made for GB/GBA/handhelds)
  - **Smooth** (bicubic)
  - **HQ 2×**

  Filters are WebGL shaders. Heavier ones (CRT curved, HQ 2×) can cost speed on older phones.

## 🧭 Compatibility, cores & per-game notes

- Retro Pocket stays on **EmulatorJS 4.2.3**, the latest stable release. The 4.3.0-pre pre-release was tested and regresses N64 and PSP, so it is not used yet. The full results and the core and new-system evaluation are in [docs/compatibility.md](docs/compatibility.md).
- **Switch core per game:** in the library, tap a game's **⋯** and pick **Core**. If a core crashes right at start, the player also falls back to the other core automatically.
- **📝 Compatibility note:** in the same sheet you can write a short note for each game, such as "works best on melonDS". It appears in the in-game ☰ menu and is included in Backup.

## ⚡ Performance & device, top-of-screen buttons, controller start

**Buttons at the top.** Phones with on-screen navigation buttons (and Android 15 edge-to-edge) could hide the bottom row, so every Close / Save / Done button is now at the **top**, inside the safe area:
- EmulatorJS pop-ups (Control Settings, Cheats, Netplay…): the title and buttons come first and the content scrolls below. While a pop-up is open, our ☰ / quick buttons hide so they can't cover it.
- Touch layout editor: **▴ Hide / Reset / Done** make up the first row. *Hide* collapses the panel so you can see the controls you're moving.
- Settings, Performance, the game sheet and other dialogs have a sticky top bar with **Close** / **‹ Back**. Toasts also show at the top.

**Settings → ⚡ Performance & device…** shows:
- the phone, chipset (Android 12+, from the APK's native plugin), Android version, RAM, CPU cores, GPU, WebGL2, screen and refresh rate;
- a 1-second **benchmark**;
- the graphics mode: **Auto / Fast / Balanced / Best**. Auto explains its pick (for example "8 CPU cores, 8 GB RAM, fast GPU (Adreno 740)"). Running the benchmark feeds into Auto; you can override it.

Each game's ⋯ sheet has a **Graphics** select that overrides the global mode for that game. Precedence: the game's select, then Settings, then Auto. Anything you change yourself in a game's EmulatorJS menu still wins.

| Option | Fast | Balanced | Best |
|---|---|---|---|
| N64 (mupen64plus_next) resolution | 320×240 | 640×480 | 960×720 |
| N64 frame duping | on | off | off |
| N64 (parallel_n64) resolution | 320×240 | 640×480 | 640×480 |
| PS1 (pcsx_rearmed) frameskip | auto | off | off |
| PS1 (beetle) internal resolution | 1× | 1× | 2× |
| PSP (ppsspp) internal resolution | 480×272 | 480×272 | 960×544 |
| PSP auto / fixed frameskip | on / 1 | off | off |
| Default screen filter | off | off | CRT (TV consoles), LCD (handhelds) |
| Default rewind | off | light systems | light systems |

The DS core (DeSmuME 2015) has no speed options in EmulatorJS 4.2.3, so presets leave DS alone. On iPhone / iPad (PWA), Auto picks Balanced at most.

**N64 / analog sticks.** Controllers → *Invert stick X / Y* per system. These flips are applied on top of your custom mappings. With a keyboard, T F G H moves the left stick and I J K L moves the right stick (the N64 C-buttons). The touch stick no longer drops "right" at exactly 0°.

**Start the game with a controller.** The **▶ Start game** button and the hint **"Press A / Start on your controller"** are at the top of the screen. Pressing A or Start on a Bluetooth/USB pad (or Enter / Space on a keyboard) starts the game, same as a tap. That counts as a user gesture, so iOS audio unlocks. The press that starts the game is swallowed until you release it, so it doesn't also press A in the game.

## 🧩 Adding games for many systems

* **Detection:** unique extensions pick the system directly (`.nes`, `.gba`, `.z64`, `.md`, `.sms`, `.a26`, `.pce`, `.ws`, …). For `.bin`/`.iso`/`.cue`/`.chd`/`.zip`/`.7z`/`.img`/`.m3u`/`.pbp`/`.tap`/`.tzx`/`.exe`/`.rom`/`.ccd`, Retro Pocket first **sniffs the content** (iNES / N64 / GBA / Game Boy / Mega Drive / 32X / Master System / Game Gear / Atari 7800 / Lynx headers, `PLAYSTATION` / `SEGADISCSYSTEM` / `SEGASATURN` / PC-FX / 3DO / CD-i disc signatures, and the file names inside a `.zip`). If that is not conclusive you get a **Which system is this?** picker listing the plausible systems first (likely one highlighted) and a *Show all systems…* list. You can change a game's system later in its ⋯ menu.
* **Disc images:** select the `.cue` **together with its `.bin` file(s)** (or an `.m3u` with its discs) and they are bundled into one uncompressed ZIP in the library (which is what EmulatorJS needs; a cue whose tracks are missing is refused with a message). Single `.iso`, `.chd`, `.pbp`, `.img` and `.cso` images work as they are. Very large images (hundreds of MB) need enough free memory and storage; the app is limited to ~1.2 GB per file.
* **Arcade:** add the exact ROM-set `.zip` (FBNeo, or MAME 0.78 / 2003-Plus sets). Neo Geo sets go under **Neo Geo** and need `neogeo.zip` in Settings → BIOS files.
* **DOS:** add a game folder zipped as `.zip` (it is nested so DOSBox Pure receives the archive as-is), or a single `.exe`/`.com`/`.bat`/`.conf`. **Doom:** add your own IWAD (`.wad`).

## 🔑 BIOS files

Open **Settings → 🔑 BIOS files…** (or ⋯ → *BIOS files…* on a game that needs one). Pick a system in the **dropdown** (all 18 BIOS systems, grouped, each with a status). The panel lists every file the core looks for with its level (**required** / **recommended** / **optional**), whether it is **installed** or **missing**, and the md5 libretro publishes for the usual dump (a stored file whose md5 differs is flagged, it may still work). Then:

* **Free, open-source files** get a **Download open files** button (and *Download all open files* for every system): files are fetched from the app's own `bios-open/` folder (same origin, so no CORS problems, cached for offline use), shown with a progress bar, **size + md5 verified** before they are stored, and never stored if the check fails.
* **Copyrighted files** (everything else) show a *“Must come from your own console”* note with the exact file name and md5 expected, the **Upload** button (`.zip` packs are unpacked, names that differ only by case such as `SCPH5501.BIN` are corrected) and a link to that system's [libretro documentation](https://docs.libretro.com/library/bios/) page.

Files are stored in IndexedDB on your device and, at launch, handed to EmulatorJS (`EJS_biosUrl`), which places them where the core looks for them. Files that must stay zipped (`neogeo.zip`, CD-i `cdimono1.zip`) are passed through untouched. Systems that *require* a BIOS show a ⚠ note in the game's menu until you add one.

| System | Offered by the dropdown | Source / licence |
|---|---|---|
| Game Boy Advance | **Download** `gba_bios.bin` (16 KB, optional) | [Cult of GBA open-source BIOS](https://github.com/Cult-of-GBA/BIOS) – **MIT**. mGBA also has its own built-in replacement, so no file is needed. |
| Game Boy | **Download** `gb_bios.bin` (256 B, optional boot ROM) | [SameBoy](https://github.com/LIJI32/SameBoy) v1.0.4 `dmg_boot.bin` – **Expat (MIT)**. Used by Gambatte; mGBA ignores non-original boot ROMs. |
| Game Boy Color | **Download** `gbc_bios.bin` (2.3 KB, optional boot ROM) | SameBoy `cgb_boot.bin` – **Expat (MIT)**. |
| Nintendo DS | nothing to download | melonDS FreeBIOS / DeSmuME 2015 run without files (built-in open replacements). Real `bios7.bin`, `bios9.bin`, `firmware.bin` are optional and come from your console. |
| Atari 5200 | nothing to download | The core contains the open-source AltirraOS; `5200.rom` is optional. |
| Commodore Amiga | nothing to download | PUAE contains the open-source AROS Kickstart; Retro Pocket selects it automatically while no real Kickstart is stored (`puae_kickstart=aros`). Real `kick*.A500/A600/A1200` files are recommended for many games. |
| PlayStation, Saturn | upload only | HLE BIOS is built in (limited); real BIOS from your console is recommended (`scph5501.bin` …, `saturn_bios.bin`). |
| **Must be dumped from your own console** | upload only, exact name + md5 shown | Sega CD (`bios_CD_U/E/J.bin`), PC Engine CD (`syscard3.pce`), PC-FX (`pcfx.rom`), 3DO (`panafz10.bin`), ColecoVision (`colecovision.rom`), CD-i (`cdimono1.zip`), Neo Geo / Arcade (`neogeo.zip`), Atari 7800 / Lynx (`7800 BIOS (U).rom`, `lynxboot.img`), NES Famicom Disk System (`disksys.rom`) |

Why only these three? libretro's own “Download Core System Files” pack contains only open per-core assets (no commercial BIOS) and its host sends no CORS headers, so a web page cannot fetch it. Other open BIOS replacements either live inside the cores already (AROS, AltirraOS, melonDS FreeBIOS) or are not accepted by the cores. Sources and licence texts are in [`www/bios-open/`](www/bios-open/README.md); md5/size/licence are verified by `npm run check`. BIOS delivery and the dialog are covered by `tests/bios.mjs` (mocked fetch: corrupt / truncated / 404 / slow / good, IndexedDB result, mGBA sees the downloaded `/gba_bios.bin` byte-for-byte) and `tests/library.mjs` (`neogeo.zip` arrives byte-identical).

## ⚠ Performance warnings

Heavy systems get a **⚠ badge** on the cover, a note in the game's menu and a banner on launch: **N64, PlayStation, PSP, Saturn, 3DO, DOS, CD-i** (and DS has its own note). Expect them to need a recent desktop or high-end phone; iPhone Safari (WebAssembly without JIT) will be slow for most of them. Heavy systems do not take periodic auto-resume snapshots (their states are huge); the snapshot is taken when you leave or background the game. The N64 default is Mupen64Plus-Next (ParaLLEl N64 on iOS, as EmulatorJS itself does); a core that aborts early triggers the automatic fallback to the alternate core.

## 🧵 Threads / cross-origin isolation (PSP, DOS)

PPSSPP and DOSBox Pure need threads, i.e. `SharedArrayBuffer`, which browsers only enable on *cross-origin isolated* pages (COOP + COEP response headers). GitHub Pages cannot send custom headers, so the service worker (`www/sw.js`, same idea as `coi-serviceworker`) adds `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` to **`player.html?…&iso=1`**, and `player.js` redirects there once (after making sure the worker is active) **only when the game's core needs threads**. Everything else stays non-isolated, because COEP would block the cross-origin script tags EmulatorJS injects: on the isolated page, `cdn.emulatorjs.org` responses are re-fetched with CORS (the CDN sends `Access-Control-Allow-Origin: *`) and returned with `Cross-Origin-Resource-Policy: cross-origin`. The library page, cover-art fetches (GitHub raw/API, Wikipedia, Commons, Internet Archive, weserv) and all other cores are untouched.

Verified in headless Chrome against a plain `python -m http.server` (no isolation headers): `crossOriginIsolated === true`, `typeof SharedArrayBuffer === 'function'`, `EJS_threads === true`, frames advance for PPSSPP and DOSBox Pure, no request blocked by COEP, GB core stays non-isolated, and the library page still reaches `api.github.com`. **Not verified on devices:** iOS Safari (16.4+ supports SharedArrayBuffer under COOP/COEP and service workers; PPSSPP additionally needs WebGL2 and plenty of RAM, so expect it to be unusable on many iPhones) and the Capacitor Android WebView (Chromium; service workers work on `https://localhost`, but isolation could not be tested here). If isolation is unavailable the player shows a clear message instead of a blank screen.

## 🚫 Not supported (no core in EmulatorJS 4.2.3)

Magnavox Odyssey², Vectrex, Pokémon Mini, Mattel Intellivision, Neo Geo CD, Fairchild Channel F, Atari ST, MSX and Game & Watch have **no core in the pinned EmulatorJS release**, so they are not offered (nothing is faked). They will appear automatically only if a future pinned version ships cores for them and `www/js/cores.js` is extended. Neo Geo (AES/MVS) works through FBNeo; Sega SG-1000, Neo Geo Pocket Color, WonderSwan Color and Famicom Disk System are included.

## 🧪 Boot tests

`tests/systems.mjs` generates a tiny original stub image per system (`scripts/make-system-stubs.py`; not games), stores it in the library, launches the player with each system's default core **and every alternate core**, taps *Start*, and checks that the core downloaded, initialised and kept producing frames (and that threaded cores run isolated). That proves the core + file hand-off path for each family, **not that real games run** — stubs are not valid commercial images, so a core running garbage still counts as booted. The latest per-core results are committed in [`docs/boot-matrix.md`](docs/boot-matrix.md). Known results with stubs: every core boots except **Philips CD-i** (needs `cdimono1.zip`, reports "Required files are missing") and **Mupen64Plus-Next** aborts on the stub image ("table index is out of bounds") — in the app that is the automatic fallback case (ParaLLEl N64 boots).

## 🕹 Controllers (Bluetooth / USB gamepads)

Uses the browser **Gamepad API**, so Xbox, PlayStation (DualShock 4 / DualSense), Switch Pro, 8BitDo, MFi and generic pads work wherever the browser sees them: **iPhone/iPad Safari 13+ (Bluetooth pairing in Settings → Bluetooth)**, Android Chrome / the Android app (Chromium WebView), and desktop. Press any button after connecting — browsers only reveal a controller after its first input.

* **Auto-detect:** a toast appears on connect/disconnect (library and in game); the first pads become Player 1, 2, 3, 4 in connection order. The on-screen touch pad is **hidden while a controller is connected**, comes back when you touch the screen (and hides again on the next controller input), and returns on disconnect.
* **Settings → 🎮 Controllers…** (not an About tab): connected pads with a live input readout, per-pad **player assignment** (Auto / Player 1–4 / Off), **button layout** (*Nintendo positions*: right = A, bottom = B — or *Xbox labels*), **stick deadzone**, left-stick-as-D-pad, hide-touch-pad, hotkeys on/off, **keyboard** controls for desktop with a preset, and a **per-player remap table** (tap a control, then press the pad button / key you want; "Reset" per player). Mappings are stored in `localStorage` (`rp.pad`) and applied to EmulatorJS (`EJS_defaultControls` + re-applied after start) for **every system**, all four players. Player counts follow each system (table above, `players` in `www/js/cores.js`: e.g. 4 for N64 and arcade, 2 for NES/SNES/Genesis/PS1, 1 for handhelds); extra controllers are ignored by one-player systems.
* **Analog sticks / triggers:** a deadzone (radial) is applied to the sticks before EmulatorJS sees them. NES/GB/GBA/SNES/DS are digital, so the left stick acts as a D-pad (and "hat" D-pads that browsers expose as an axis are decoded); analog triggers act as L2/R2 buttons. On the analog systems (**N64, PlayStation, PSP**; `analog: true` in `cores.js`) both sticks are passed through unmodified apart from the deadzone: the left stick is the analog stick (N64/PSP/PS1 analog mode), the right stick is the N64 C-buttons, **L2/R2** are the PS1/PSP triggers and **Z** on N64, L3/R3 are the stick clicks. Arcade/Neo Geo: **Select = Coin**, **Start = Start** (hold Select+Start still opens the app menu). Per-system hints are shown in the pause menu.
* **Analog sticks are remappable with direction** (N64 / PlayStation / PSP): the remap table has rows *Left stick → right / ← left / ↑ up / ↓ down* and the same for the right stick (N64 C-buttons). Tap a row and push the stick the way you want; the direction is stored (e.g. `LEFT_STICK_X:+1`), so a pad whose stick reports backwards can be fixed by remapping or with *Invert stick X / Y*. Since 1.0.29 every pad input goes through one Retro Pocket path (`www/js/padinput.js`). It honours the direction and invert settings and sends analog values proportionally to the core.
* **In-game Control Settings** (EmulatorJS menu) changes apply immediately and are saved **per game** on top of your Controllers mappings (`rp.pad.game.<id>`). Changes in Settings → Controllers apply to a running game straight away.
* **🧪 Test controller** (Controllers screen): live raw axes and buttons with what each one is mapped to, plus the pad's `id` and `mapping` (also written to the browser console as `[Retro Pocket] controller …`). Menu navigation is paused while testing. Stop with the button or **Select + Start**.
* **In game hotkeys:** hold **Select + Start** (or press the **Guide/Home** button) for the pause menu (Resume, Save state, Load state, Restart, Sound, Fast-forward, Screenshot, Exit… — the same menu as the top ☰ button); **Select + R1** quick-save, **Select + L1** quick-load. While Select is held, Start/L1/R1 are not sent to the game. Turn this off in the Controllers screen if a game needs those combos.
* **Library with a controller:** D-pad / left stick moves between games and menu items, **A** opens (Nintendo layout: right button; Xbox layout: bottom button), **B** goes back/closes, **Start** opens the game's options, **Select** opens Settings, **L1/R1** switch the system filter.
* **Desktop keyboard defaults (Retro Pocket preset):** arrows = D-pad, **X** = A, **Z** = B, **S** = X, **A** = Y, **Q/W** = L/R, **Enter** = Start, **Backspace** = Select, **F5/F9** quick save/load. Remappable.
* **Tested with a mocked Gamepad API** (`node tests/pads.mjs`, headless Chrome with `navigator.getGamepads` overridden): connect/disconnect, library navigation, remap capture, deadzone, trigger handling, 2-player routing, touch-pad hiding, hotkeys and the pause menu. **Not tested on real hardware:** actual Bluetooth/USB pads, iOS Safari, and the Capacitor Android WebView (it is Chromium, so the same API is available, but the app window must have focus; some pads/OS versions report a non-standard button order — remap in the Controllers screen if so).

## 🛡 Crash protection

The player pins EmulatorJS to a fixed version (`4.2.3`, see `EJS_VERSION` in `www/js/cores.js`), flushes battery saves only while a game is running in the foreground (guarded, never throws), and only loads an auto-resume snapshot taken by the **same core**. If a core aborts or freezes, the **Game crashed** screen offers *Resume from last auto-save*, *Restart*, *Try another core* and *Back to library*; a crash in the first 15 s switches cores automatically once. NES now defaults to **Nestopia**; FCEUmm is a per-game option.

## 🛠 Build locally

```bash
git clone https://github.com/<you>/retro-gb-nes-all-in-one && cd retro-gb-nes-all-in-one
npm install

# Web app (any static server works; there's no build step)
npm start                 # http://localhost:8080
npm run check             # syntax + manifest + service-worker precache + README table sync
npm test                  # headless-Chrome end-to-end test (needs Chrome + internet for the CDN cores)
node tests/crash.mjs      # crash screen / fallback / watchdog tests
node tests/cover.mjs      # box art + cover picker tests (real network)
node tests/pads.mjs       # controller tests with a mocked Gamepad API
node tests/detect.mjs     # system detection / zip / cue unit tests (no browser)
node tests/padsys.mjs     # per-system controller wiring unit tests (no browser)
node tests/library.mjs    # picker, cue/bin bundling, BIOS upload -> emulator FS (headless Chrome)
node tests/bios.mjs       # BIOS dialog: dropdown, open-file downloads (mocked fetch), IndexedDB, delivery
node tests/update.mjs     # service-worker updates (no stale files, banner, offline), APK update prompt, backup/restore
node tests/gamepad.mjs    # one input path: stick direction at core level, invert, remaps (Controllers + in-game, per game), Test controller
node tests/appupdate.mjs  # in-app APK update flow with a mocked native plugin (progress, cancel, permission, verification, fallbacks)
node tests/ingame.mjs     # in-game ☰ menu, no bottom bar pop-up (headless Chrome, touch/mouse)
node tests/dstouch.mjs    # DS touchscreen: probe ROM, both cores, synthetic touch/mouse (headless Chrome)
node tests/hash.mjs       # md5 implementation (no browser)
node tests/threads.mjs    # PPSSPP/DOSBox cross-origin isolation + regression checks
KEYS=psx,n64 ALT=1 node tests/systems.mjs   # boot matrix: a stub image per system / core (all systems when KEYS is unset)
node tests/soak.mjs tests/fixtures/nes-test.nes nestopia 5   # N-minute soak

# Android APK (needs JDK 21 and the Android SDK; ANDROID_HOME set)
npm run android:debug     # -> android/app/build/outputs/apk/debug/app-debug.apk
npm run android:open      # or open in Android Studio
```

After editing anything in `www/`, run `npx cap sync android` before rebuilding the APK. Icons are generated by `npm run icons` (Pillow) and `python3 scripts/make-android-assets.py`.

### Deploying
* **GitHub Pages:** repo **Settings → Pages → Source: GitHub Actions** (the `pages.yml` workflow deploys `www/` on every push to `main`).
* **APK:** `android.yml` builds a debug-signed APK on every push, uploads it as an artifact and refreshes the `latest` release; tagging `v1.0.0` creates a versioned release.

### Self-hosting EmulatorJS (optional)
By default the loader and cores come from the pinned `https://cdn.emulatorjs.org/4.2.3/data/` release. To bundle them (fully offline from first launch), download an EmulatorJS release into `www/ejs/data/` (or the cores you need) and set `window.RP_EJS_DATA = 'ejs/data/'` before `js/player.js` loads in `www/player.html`; add the files to `SHELL_FILES` in `www/sw.js` if you want them precached.

If a network blocks the public CDN, deploy the optional server from [`server/README.md`](server/README.md) and enter its origin in **Settings → Proxy server URL**. The proxy routes the pinned EmulatorJS loader, UI, and core assets through your server; they are cached after the first successful download.

## 🗂 Project structure

```
www/                      the whole app (static; served by Pages and bundled into the APK)
  index.html, css/app.css library UI            js/app.js     library, adding ROMs, settings
  player.html, css/player.css  game screen      js/player.js  launches EmulatorJS, saves/resumes
  js/cores.js             THE systems table (cores, extensions, BIOS, art, players)   js/db.js  IndexedDB (ROMs, states, art, BIOS)
  js/detect.js            content sniffing, ZIP reader/writer, cue/m3u parsing   js/bios.js, js/biosui.js, js/biosdata.js, js/hash.js  BIOS storage, dialog, open-file table, md5
  bios-open/              the only BIOS-type files in the repo: open-licensed, with licences/
  js/art.js               automatic box art (libretro)        js/cover.js  “Change cover” picker
  js/dstouch.js  DS touchscreen (overlay, stylus mapping, layouts)   js/dsui.js  DS settings dialog   js/ingameui.js  ☰ button settings   js/updates.js  Settings update check   js/backup.js  export/import backup   js/version.js  stamped build number
  js/pads.js  gamepad settings/shim/control maps   js/padinput.js  single gamepad→core input path   js/padnav.js  controller menu navigation   js/padsui.js  Settings → Controllers
  sw.js                   offline shell + CDN runtime cache   manifest.webmanifest, icons/
android/                  Capacitor Android project (generated by `cap add android`, committed)
capacitor.config.json     appId com.retropocket.app, webDir = www
scripts/                  make-icons.py, make-android-assets.py, check.mjs, make-test-rom.py, make-system-stubs.py, make-ds-touch-rom.py, stamp-build.mjs, systems-table.mjs (README table generator)
tests/                    e2e, crash, cover, pads, ds, dstouch, ingame, update, soak, library, threads, systems (headless Chrome) + detect, padsys (Node); tiny generated stub images
.github/workflows/        pages.yml (deploy web) · android.yml (build APK + release)
```

## Troubleshooting
* *"Could not load the emulator"* — you're offline and haven't played that system yet; connect once to cache the core.
* *No sound on iPhone* — tap the on-screen Start button / screen once; also check the ringer switch.
* *"App not installed" when updating the APK* — see *Installing and updating the APK*: uninstall the old app once (it was signed with a different key), then install the new APK; later updates install over it.
* *Game crashed* — use the on-screen *Resume* / *Try another core*. *A game won't start* — try the other core via the **⋯** menu → *Emulator core*. Zipped ROMs are supported by most cores; if the system isn't recognised you'll be asked to pick one.
