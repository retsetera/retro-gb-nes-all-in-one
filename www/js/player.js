// Launches EmulatorJS (RetroArch cores compiled to WebAssembly) for one ROM from the IndexedDB library,
// guards the core against crashes and keeps resumable snapshots.
import * as db from './db.js';
import { EJS_CDN, EJS_VERSION, SYSTEMS, CORE_LABELS, altCore, needsThreads, normalizeEjsProxy } from './cores.js';
import { hardcoreOn, achievementsPanel } from './retroach.js';
import { cheatsPanel, applyCheats, loadCheats } from './cheats.js';
import { startSession, trackPlay, getNote } from './meta.js';
import { applyLayout, editLayout } from './touchlayout.js';
import { FILTERS, loadFilter, saveFilter, nextFilter, applyFilter, loadRewind, saveRewind, loadQuick, saveQuick, quickBar, RP_SHADERS, usePreset, startFilter } from './video.js';
import { loadPerf, savePerf, effectivePreset, presetOptions, reconcileSaved, autoTier, deviceInfo, PRESETS } from './perf.js';
let playTracker = null;
import { buildBios } from './bios.js';
import { loadPad, buildControls, installShim, rawPads, assignPlayers, padName, MAX_PLAYERS, swallow, loadGameMap, saveGameMap, diffControls } from './pads.js';
import { takeOverGamepad } from './padinput.js';
import { trackAudio, initStartButton, resumeAllAudio, audioBlocked } from './startgame.js';
import { patchNipple, wrapSimulateInput, loadInvert } from './stick.js';
import { loadUi, saveUi, UI_POS } from './ingameui.js';
import { startPadNav } from './padnav.js';

// Where EmulatorJS' loader, UI and cores come from: a PINNED release (see EJS_VERSION in cores.js), not "stable".
// Override with window.RP_EJS_DATA for a self-hosted copy (README → Self-hosting EmulatorJS).
const ejsProxy = normalizeEjsProxy(localStorage.getItem('rp.ejsProxy'));
export const EJS_DATA = window.RP_EJS_DATA || (ejsProxy ? `${ejsProxy}/emulatorjs/${EJS_VERSION}/data/` : EJS_CDN);

const params = new URLSearchParams(location.search);
const id = params.get('id');
const $ = (s) => document.querySelector(s);
const status = $('#status');
const fail = (msg) => { status.hidden = false; status.classList.add('err'); status.textContent = msg; };

const FLUSH_MS = 60_000;      // battery-save flush (only while the game is running in the foreground)
const SNAP_MS = 90_000;       // auto-resume snapshot (not for DS: states are large, exit/background snapshots only)
const STALL_MS = 12_000;      // no new frame for this long while running in the foreground == hung core
const EARLY_MS = 15_000;      // a crash this soon after start triggers the automatic core fallback
const CRASH_RE = /abort|RuntimeError|unreachable|memory access out of bounds|table index is out of bounds|null function|signature mismatch|Cannot enlarge memory|out of memory|integer divide by zero|stack overflow|invalid atomic/i;

let rom = null, started = false, startedAt = 0, crashed = false, leaving = false;
let lastFrame = -1, lastFrameAt = 0, lastPersist = 0;
const emu = () => window.EJS_emulator;
const running = () => { const e = emu(); return started && !crashed && e && !e.paused && document.visibilityState === 'visible'; };

/* ---------- saving ---------- */
function flushSaves() {            // in-game (battery) saves; never while hidden/paused/crashed, never throws
  if (!running()) return;
  try { emu().gameManager.saveSaveFiles(); } catch (e) { console.warn('saveSaveFiles', e); }
}
async function snapshot({ force = false } = {}) {
  const e = emu();
  if (!e || !started || crashed || !e.gameManager || !rom) return;
  if (!force && !running()) return;
  if (Date.now() - lastPersist < 4000) return;
  lastPersist = Date.now();
  try { e.gameManager.saveSaveFiles(); } catch (x) { console.warn('saveSaveFiles', x); }
  try {
    // JS is single-threaded and the core only advances inside its own animation-frame callback, so this never
    // runs mid-frame. getState() returns a view into the wasm heap: copy it out immediately.
    const state = e.gameManager.getState();
    if (state && state.length) await db.putState({ id: rom.id, core: rom.core, data: state.slice().buffer, time: Date.now() });
  } catch (x) { console.warn('snapshot', x); }
}
setInterval(flushSaves, FLUSH_MS);
setInterval(() => { if (rom && rom.system !== 'nds' && !(SYSTEMS[rom.system] || {}).heavy) snapshot(); }, SNAP_MS);   // big-state systems (DS, N64, PS1, PSP, Saturn…) only snapshot on exit/background

/* ---------- crash handling ---------- */
function crashScreen(reason, detail) {
  if (crashed) return; crashed = true; window.__rpCrashed = true;
  console.error('Core crash:', reason, detail || '');
  try { emu() && emu().pause && emu().pause(true); } catch {}
  try { const a = emu() && emu().Module && emu().Module.AL && emu().Module.AL.currentCtx; a && a.audioCtx && a.audioCtx.suspend(); } catch {}
  status.hidden = true;
  const box = $('#crash'); box.hidden = false;
  $('#crash-msg').textContent = `${rom ? rom.title : 'This game'} stopped unexpectedly (core: ${rom ? CORE_LABELS[rom.core] || rom.core : '?'}).`;
  $('#crash-detail').textContent = String(reason || '').slice(0, 300);
  db.getState(id).then((st) => {
    const ok = st && st.core === rom.core && st.data;
    $('#crash-resume').hidden = !ok;
    if (ok) $('#crash-resume').textContent = `Resume from last auto-save (${new Date(st.time).toLocaleTimeString()})`;
  }).catch(() => {});
  const alt = rom && altCore(rom.system, rom.core);
  const altBtn = $('#crash-alt'); altBtn.hidden = !alt;
  if (alt) altBtn.textContent = `Try another core: ${CORE_LABELS[alt] || alt}`;
  if (rom) { rom.crashes = (rom.crashes || 0) + 1; rom.lastCrash = Date.now(); db.putRom(rom).catch(() => {}); }
}

async function switchCore() {
  const alt = altCore(rom.system, rom.core); if (!alt) return;
  rom.core = alt; await db.putRom(rom); await db.deleteState(rom.id).catch(() => {});
  location.replace(`player.html?id=${encodeURIComponent(rom.id)}&switched=1`);
}
function onFault(reason, detail) {
  if (crashed || leaving) return;
  const early = !started || Date.now() - startedAt < EARLY_MS;
  const key = 'rp.fb.' + id;
  if (early && rom && altCore(rom.system, rom.core) && !sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, '1');                   // automatic fallback, once per session, to avoid loops
    rom.crashes = (rom.crashes || 0) + 1;
    console.warn('Early core failure, falling back to', altCore(rom.system, rom.core), reason);
    switchCore(); return;
  }
  crashScreen(reason, detail);
}
addEventListener('error', (e) => { const m = (e.error && e.error.message) || e.message || ''; if (CRASH_RE.test(m)) onFault(m); });
addEventListener('unhandledrejection', (e) => { const m = (e.reason && e.reason.message) || String(e.reason || ''); if (CRASH_RE.test(m)) onFault(m); });

setInterval(() => {                 // watchdog: the frame counter must keep advancing while we are running in the foreground
  if (!running()) { lastFrameAt = Date.now(); return; }
  let f = -1; try { f = emu().gameManager.getFrameNum(); } catch (e) { return onFault('core not responding: ' + e.message); }
  if (f !== lastFrame) { lastFrame = f; lastFrameAt = Date.now(); }
  else if (Date.now() - lastFrameAt > STALL_MS) onFault('core stopped producing frames');
}, 2000);

$('#crash-restart').onclick = () => { sessionStorage.removeItem('rp.fb.' + id); location.replace(`player.html?id=${encodeURIComponent(id)}`); };
$('#crash-resume').onclick = () => location.replace(`player.html?id=${encodeURIComponent(id)}&resume=1`);
$('#crash-alt').onclick = switchCore;
$('#crash-lib').onclick = () => { location.href = 'index.html'; };

/* ---------- navigation / lifecycle ---------- */
$('#back').addEventListener('click', async () => {
  if (leaving) return; leaving = true;
  status.hidden = false; status.textContent = 'Saving…';
  await Promise.race([snapshot({ force: true }), new Promise((r) => setTimeout(r, 2500))]);
  location.href = 'index.html';
});
patchNipple();                      // before EmulatorJS loads: on-screen stick sent nothing when pushed straight right (stick.js)
trackAudio();                       // before EmulatorJS loads: lets us resume the core's AudioContext after a controller start (iOS)
function resumeAudio() {
  try { const a = emu().Module.AL.currentCtx.audioCtx; if (a && a.state !== 'running') a.resume(); } catch {}   // iOS suspends audio on background
  resumeAllAudio();
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') snapshot({ force: true }); else { lastFrameAt = Date.now(); resumeAudio(); }
});
addEventListener('pagehide', () => snapshot({ force: true }));
addEventListener('pointerdown', resumeAudio, { passive: true });
addEventListener('touchend', resumeAudio, { passive: true });   // iOS unlocks audio on touchend
addEventListener('keydown', resumeAudio, { passive: true });

/* ---------- controllers ---------- */
installShim(loadPad, () => rom && rom.system);      // must be in place before EmulatorJS starts polling navigator.getGamepads()
initStartButton({ rawPads, swallow });
// EmulatorJS popups (controls, cheats, netplay…) keep their Close / Save buttons at the top (player.css); hide our own
// top-corner buttons while one is open so they never cover them.
new MutationObserver(() => document.body.classList.toggle('rp-popup', [...document.querySelectorAll('.ejs_popup_container')].some((p) => p.isConnected && p.getClientRects().length > 0)))   // rendered (not display:none / [hidden] anywhere up the tree)
  .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'hidden'] });              // A / Start on a controller or Enter / Space starts the game like a tap (startgame.js)
const ptoast = (msg) => { const t = $('#ptoast'); t.textContent = msg; t.hidden = false; clearTimeout(ptoast.t); ptoast.t = setTimeout(() => (t.hidden = true), 2600); };
let padSig = '', touchOverride = false;

// Controls = Settings → Controllers (global) + this game's changes from the in-game EmulatorJS "Control Settings".
// EmulatorJS saves its whole controls object per game; we used to overwrite it on every launch, which silently threw away
// in-game remaps. Now whatever the user changes in that popup is diffed against our global map and stored as a per-game
// override (rp.pad.game.<id>), applied on top of the global map on every launch.
let globalControls = null;
function applyControls() {
  const e = emu(); if (!e || !e.controls) return;
  globalControls = buildControls(loadPad());
  e.controls = JSON.parse(JSON.stringify(buildControls(loadPad(), loadGameMap(rom && rom.id))));
  try { e.setupKeys(); e.checkGamepadInputs(); } catch (x) { console.warn('applyControls', x); }
  if (!e.__rpSaveHook && typeof e.saveSettings === 'function') {
    const save = e.saveSettings.bind(e); e.__rpSaveHook = true;
    e.saveSettings = (...a) => { try { if (globalControls && rom) saveGameMap(rom.id, diffControls(globalControls, e.controls, (k) => parseInt(e.keyLookup(k)))); } catch (x) { console.warn('control remap save', x); } return save(...a); };
  }
}
function syncPads({ announce = true } = {}) {
  const cfg = loadPad(), pads = rawPads(), e = emu();
  const sig = pads.map((g) => g.id + '#' + g.index).join('|') + JSON.stringify(cfg.assign);
  if (sig === padSig) return; const had = padSig.split('|').filter(Boolean).length; padSig = sig;
  const slots = assignPlayers(pads, cfg);
  if (e && Array.isArray(e.gamepadSelection)) {
    const maxP = (rom && MAX_PLAYERS[rom.system]) || 4;               // systems with fewer ports ignore extra controllers
    e.gamepadSelection = slots.map((g, i) => (g && i < maxP ? `${g.id}_${g.index}` : ''));
    try { e.updateGamepadLabels && e.updateGamepadLabels(); } catch {}
  }
  window.__rpPlayers = slots.map((g) => (g ? g.id : null));
  if (announce) {
    if (pads.length > had) ptoast(`🎮 ${padName(pads[pads.length - 1].id)} connected${slots.indexOf(pads[pads.length - 1]) >= 0 ? ` — Player ${slots.indexOf(pads[pads.length - 1]) + 1}` : ''}`);
    else if (pads.length < had) ptoast('🎮 Controller disconnected');
  }
  updateTouchPad();
}
function updateTouchPad() {         // hide the on-screen pad while a controller is connected (touch brings it back)
  const e = emu(); if (!e || typeof e.toggleVirtualGamepad !== 'function') return;
  const hide = loadPad().hideTouch && rawPads().length > 0 && !touchOverride;
  e.toggleVirtualGamepad(!hide);
  window.__rpTouchHidden = hide;
}
addEventListener('pointerdown', (ev) => { if (ev.pointerType === 'touch' && rawPads().length && !touchOverride) { touchOverride = true; updateTouchPad(); } }, { passive: true });
addEventListener('gamepadconnected', () => syncPads());
addEventListener('storage', (ev) => { if (started && ev.key === 'rp.pad') applyControls(); });   // Controllers changed in another window: apply now
addEventListener('gamepaddisconnected', () => setTimeout(syncPads, 0));
setInterval(() => syncPads(), 700);

/* ---------- in-game menu (touch ☰ button or Select+Start on a controller) ---------- */
const menuEl = $('#pmenu'); let menuOpen = false;
const slot = () => String((emu() && emu().getSettingValue && emu().getSettingValue('save-state-slot')) || '1');
function say(msg) { try { emu().displayMessage(msg, 2000); } catch { ptoast(msg); } }
function quickSave() { try { const ok = emu().gameManager.quickSave(slot()); say(ok ? `State saved (slot ${slot()})` : 'Save failed'); return ok; } catch (e) { say('Save failed'); return false; } }
const HARDCORE = hardcoreOn();      // RetroAchievements hardcore rules: no state loading, cheats or rewind / slow motion
function quickLoad() { if (HARDCORE) { say('Hardcore mode: loading states is disabled'); return; } try { emu().gameManager.quickLoad(slot()); say(`State loaded (slot ${slot()})`); } catch (e) { say('Load failed'); } }
function setMenu(open) {
  if (!started || crashed) return; if (!open && panelOpen()) closePanel(); menuOpen = open; menuEl.hidden = !open; wake();
  try { open ? emu().pause(true) : emu().play(true); } catch {}
  if (open) { refreshMenu(); const h = $('#pm-hint'); const sy = SYSTEMS[rom.system] || {}; if (h) h.textContent = [sy.label, `${sy.players || 1} player${(sy.players || 1) > 1 ? 's' : ''}`, sy.analog ? 'analog sticks' : '', HARDCORE ? '🏆 hardcore' : '', sy.hint || '', getNote(rom.id) ? '📝 ' + getNote(rom.id) : ''].filter(Boolean).join(' · '); const first = menuEl.querySelector('button'); nav.setFocus(first); }
  window.__rpMenuOpen = open;
  if (np && np.isHosting()) np.broadcast({ t: 'paused', paused: open });
}
$('#menu-btn').addEventListener('click', () => setMenu(!menuOpen));
$('#pm-resume').onclick = () => setMenu(false);
$('#pm-save').onclick = () => { quickSave(); setMenu(false); };
$('#pm-load').onclick = () => { quickLoad(); setMenu(false); };
$('#pm-restart').onclick = () => { try { emu().gameManager.restart(); } catch {} setMenu(false); };
/* ---------- the rest of what EmulatorJS' bottom bar offered (the bar itself is never shown, see player.css) ---------- */
const barBtn = (re) => { try { return [...emu().elements.menu.querySelectorAll('button')].find((b) => re.test(b.textContent.trim())); } catch { return null; } };
const barOn = (re) => { const b = barBtn(re); return !!b && b.style.display !== 'none' && !b.hidden; };
const fsSupported = () => !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
const isFull = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
function refreshMenu() {
  const e = emu(); if (!e) return;
  $('#pm-sound').textContent = `${e.muted ? '🔇' : '🔊'} Sound: ${e.muted ? 'Off' : 'On'}`;
  $('#pm-ff').textContent = `⏩ Fast-forward: ${e.isFastForward ? 'On' : 'Off'}`;
  paintVideoMenu();
  $('#pm-full').hidden = !fsSupported(); $('#pm-full').textContent = isFull() ? '⛶ Exit fullscreen' : '⛶ Fullscreen';
  $('#pm-cheats').hidden = HARDCORE; $('#pm-load').hidden = HARDCORE; $('#pm-controls').hidden = !barOn(/control/i);
  $('#pm-disc').hidden = !(e.diskParent && e.diskParent.style.display !== 'none' && e.gameManager && e.gameManager.getDiskCount() > 1);
  $('#pm-btnpos').textContent = `📍 Menu button: ${UI_POS[loadUi().pos]}`;
}
$('#pm-sound').onclick = () => {
  const e = emu(); if (e.muted) { if (!e.volume) e.volume = 0.5; e.muted = false; e.setVolume(e.volume); } else { e.muted = true; e.setVolume(0); }
  refreshMenu();
};
$('#pm-ff').onclick = () => { try { emu().changeSettingOption('fastForward', emu().isFastForward ? 'disabled' : 'enabled'); } catch {} refreshMenu(); quick.paint(); };
/* ---------- rewind, screen filter (shaders) and the ⏪ / ⏩ quick buttons next to ☰ (see video.js) ---------- */
const rewindActive = () => !HARDCORE && !!(emu() && emu().rewindEnabled);
const quick = quickBar({ emu, canRewind: rewindActive, onChange: () => { if (menuOpen) refreshMenu(); } });
document.body.append(quick.el);
new MutationObserver(() => { quick.el.dataset.pos = mbtn.dataset.pos; quick.el.className = mbtn.className; }).observe($('#menu-btn'), { attributes: true });
function paintVideoMenu() {
  if (!rom) return;
  const want = loadRewind(rom.system), now = rewindActive();
  $('#pm-rewind').hidden = HARDCORE;
  $('#pm-rewind').textContent = `⏪ Rewind: ${want ? 'On' : 'Off'}${want !== now ? ' (after restart)' : ''}`;
  $('#pm-filter').textContent = `✨ Screen filter: ${FILTERS[loadFilter(rom.system)].label}`;
  $('#pm-quick').textContent = `⏪⏩ Top buttons: ${loadQuick() ? 'On' : 'Off'}`;
}
$('#pm-rewind').onclick = () => { saveRewind(rom.system, !loadRewind(rom.system)); refreshMenu(); say(loadRewind(rom.system) === rewindActive() ? `Rewind ${rewindActive() ? 'on' : 'off'}` : 'Rewind setting saved: it takes effect the next time this game starts'); };
$('#pm-filter').onclick = () => { const k = nextFilter(loadFilter(rom.system)); saveFilter(rom.system, k); if (!applyFilter(emu(), k) && k !== 'off') say('This filter is not available in this EmulatorJS copy'); refreshMenu(); };
$('#pm-quick').onclick = () => { saveQuick(!loadQuick()); quick.show(started && loadQuick()); refreshMenu(); };
$('#pm-shot').onclick = () => {
  try { emu().screenshot((blob, format) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${(rom.title || 'screenshot').replace(/[^\w.-]+/g, '_')}-${Date.now()}.${format || 'png'}`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); say('Screenshot saved'); }); } catch { say('Screenshot failed'); }
  setMenu(false);
};
// our own fullscreen on the whole page (EmulatorJS would fullscreen only its canvas box and hide this menu)
$('#pm-full').onclick = () => {
  const d = document, r = d.documentElement;
  try { if (isFull()) (d.exitFullscreen || d.webkitExitFullscreen).call(d); else (r.requestFullscreen || r.webkitRequestFullscreen).call(r); } catch {}
  setMenu(false);
};
$('#pm-controls').onclick = () => { setMenu(false); const b = barBtn(/control/i); if (b) b.click(); };
$('#pm-cheats').onclick = () => openPanel('Cheats', cheatsPanel({ rom, gm: () => emu() && emu().gameManager, say }), () => {});
$('#pm-btnpos').onclick = () => { const o = Object.keys(UI_POS), u = loadUi(); saveUi({ ...u, pos: o[(o.indexOf(u.pos) + 1) % o.length] }); refreshMenu(); };
// EmulatorJS' settings / disc panels normally pop out of its (hidden) bottom bar: show them in our own full-screen panel
let panelNode = null, panelHome = null, panelClose = null;
const panelEl = $('#pmpanel'), panelOpen = () => !panelEl.hidden;
function openPanel(title, node, close) {
  if (!node) return; panelNode = node; panelHome = node.parentElement; panelClose = close;
  $('#pmpanel-title').textContent = title; $('#pmpanel-body').replaceChildren(node); node.style.display = '';
  menuEl.hidden = true; panelEl.hidden = false; nav.setFocus($('#pmpanel-back'));
}
function closePanel() {
  if (!panelOpen()) return;
  try { panelClose && panelClose(); } catch {}
  try { panelNode.style.display = 'none'; panelHome && panelHome.appendChild(panelNode); } catch {}
  panelEl.hidden = true; panelNode = null; menuEl.hidden = !menuOpen; if (menuOpen) { refreshMenu(); nav.setFocus(menuEl.querySelector('button')); }
}
$('#pmpanel-back').onclick = closePanel;
$('#pm-touch').onclick = async () => {
  menuEl.hidden = true;
  try { await editLayout(emu(), rom.system, (SYSTEMS[rom.system] || {}).label || rom.system); } catch (e) { say('Layout editor failed: ' + e.message); }
  updateTouchPad(); setMenu(false);
};
addEventListener('orientationchange', () => setTimeout(() => { try { if (started) applyLayout(emu(), rom.system); } catch {} }, 400));
$('#pm-settings').onclick = () => { const e = emu(); e.settingsMenuOpen = true; openPanel('Emulator settings', e.settingsMenu, () => e.closeSettingsMenu && e.closeSettingsMenu()); };
// online / LAN play (netplay.js is only loaded when used)
let np = null;
async function netplay() {
  if (np) return np;
  np = await import('./netplay.js');
  np.init({ emu, rom: () => rom, maxP: () => (rom && MAX_PLAYERS[rom.system]) || 4, toast: ptoast });
  return np;
}
$('#pm-net').onclick = async () => { try { const n = await netplay(); openPanel('Online play', n.panel(), () => {}); } catch (e) { say('Online play unavailable: ' + e.message); } };
$('#pm-ach').onclick = () => openPanel('Achievements', achievementsPanel(rom), () => {});
$('#pm-disc').onclick = () => { const e = emu(); e.disksMenuOpen = true; openPanel('Disc / disk', e.disksMenu, () => e.closeDisksMenu && e.closeDisksMenu()); };

/* ---------- the ☰ button: position + fade-out from Settings, always one tap away ---------- */
const mbtn = $('#menu-btn'); let fadeT = 0;
function wake() { mbtn.classList.remove('faded'); mbtn.classList.add('awake'); clearTimeout(fadeT); if (loadUi().autohide && !menuOpen) fadeT = setTimeout(() => { mbtn.classList.remove('awake'); mbtn.classList.add('faded'); }, 3500); else if (!loadUi().autohide) mbtn.classList.remove('awake'); }
function applyUi() { mbtn.dataset.pos = loadUi().pos; wake(); }
addEventListener('rp-ui-change', applyUi); addEventListener('storage', applyUi); applyUi();
const nearTop = (y) => y < Math.max(70, (parseFloat(getComputedStyle(mbtn).top) || 0) + 56);
addEventListener('pointerdown', (e) => { if (nearTop(e.clientY)) wake(); }, { capture: true, passive: true });
addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' && nearTop(e.clientY)) wake(); }, { capture: true, passive: true });
// long-press / right-click context menu of EmulatorJS has nothing we want (Save/Restart live in ☰)
addEventListener('contextmenu', (e) => e.preventDefault(), true);
/* DS: quick switches in the pause menu (cycle buttons work with a controller too) */
function addDsMenu(ds) {
  if (document.getElementById('pm-dsmode')) return;
  const cur = () => ds.loadDs(), paints = [];
  const mk = (id, get, cycle) => { const b = document.createElement('button'); b.id = id; const paint = () => (b.textContent = get()); b.onclick = () => { cycle(); paint(); }; paint(); paints.push(paint); $('#pm-grid').append(b); };
  mk('pm-dsmode', () => `✋ Touch: ${cur().mode === 'direct' ? 'Direct' : 'Trackpad'}`, () => ds.saveDs({ ...cur(), mode: cur().mode === 'direct' ? 'trackpad' : 'direct' }));
  mk('pm-dslayout', () => `🖥 Screens: ${({ auto: 'Auto', stacked: 'Stacked', stackedSwap: 'Stacked, swapped', side: 'Side by side', sideSwap: 'Side by side, swapped', bottom: 'Bottom only' })[cur().layout] || 'Auto'}`,
    () => { const o = ds.LAYOUT_ORDER; ds.saveDs({ ...cur(), layout: o[(o.indexOf(cur().layout) + 1) % o.length] }); });
  addEventListener('rp-ds-change', () => paints.forEach((f) => f()));
}
$('#pm-exit').onclick = () => { setMenu(false); $('#back').click(); };
const nav = startPadNav({
  getFocusables: () => [...document.querySelectorAll(!$('#crash').hidden ? '#crash button:not([hidden])' : panelOpen() ? '#pmpanel-back' : '#pmenu button:not([hidden])')],
  enabled: () => menuOpen || !$('#crash').hidden,
  onBack: () => { if (panelOpen()) closePanel(); else if (menuOpen) setMenu(false); },
});

// hotkeys: Select+Start (hold 0.5 s) or Guide = menu; Select+R1 = quick save; Select+L1 = quick load
let hk = { combo: {}, prev: {} };
function hotkeys() {
  requestAnimationFrame(hotkeys);
  const cfg = loadPad(); if (!cfg.hotkeys || !started || crashed) return;
  const now = performance.now();
  for (const g of rawPads()) {
    const d = (i) => !!(g.buttons[i] && g.buttons[i].pressed), was = hk.prev[g.index] || {};
    const sel = d(8), edge = (i) => d(i) && !was[i];
    if (d(16) && !was[16]) setMenu(!menuOpen);
    const cs = (hk.combo[g.index] = hk.combo[g.index] || { at: 0, fired: false });   // per pad, so a 2nd controller can't reset it
    if (sel && d(9)) { if (!cs.at) cs.at = now; if (!cs.fired && now - cs.at > 500) { cs.fired = true; setMenu(!menuOpen); } } else { cs.at = 0; cs.fired = false; }
    if (sel && edge(5) && !menuOpen) quickSave();
    if (sel && edge(4) && !menuOpen) quickLoad();
    hk.prev[g.index] = { 16: d(16), 5: d(5), 4: d(4) };
    if (g.buttons.some((b) => b.pressed) && touchOverride && !menuOpen) { touchOverride = false; updateTouchPad(); }   // controller used again -> hide touch pad
  }
}
requestAnimationFrame(hotkeys);

/* ---------- boot ---------- */
(async () => {
  if (!id) return fail('No game selected.');
  rom = await db.getRom(id);
  if (!rom) return fail('Game not found in your library.');
  document.title = rom.title;
  rom.lastPlayed = Date.now(); db.putRom(rom).catch(() => {});
  if (params.get('switched')) { const b = $('#banner'); b.textContent = `Switched to ${CORE_LABELS[rom.core] || rom.core} after a problem with the previous core.`; b.hidden = false; setTimeout(() => (b.hidden = true), 6000); }

  const sys = SYSTEMS[rom.system] || {};
  if (needsThreads(rom.core) && !self.crossOriginIsolated) {
    // Threaded cores (PPSSPP, DOSBox Pure) need SharedArrayBuffer == cross-origin isolation. GitHub Pages cannot send COOP/COEP headers,
    // so our service worker adds them to this page when it is loaded with ?iso=1 (same trick as coi-serviceworker, but scoped to threaded cores only
    // so every other core keeps loading cross-origin scripts exactly as before).
    const why = 'This core needs multi-threading (cross-origin isolation), which this browser / WebView did not enable. Try the other core, a current Chrome/Safari 16.4+, or reload once.';
    if (params.get('iso') || !('serviceWorker' in navigator)) return fail(why);
    status.textContent = 'Enabling multi-threading…';
    try { await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready; } catch (e) { return fail(why + ' (' + e.message + ')'); }
    const u = new URL(location.href); u.searchParams.set('iso', '1'); location.replace(u.href); return;
  }
  const file = new File([rom.data], rom.file, { type: 'application/octet-stream' });
  try {
    const bios = await buildBios(rom.system);                       // user-supplied BIOS from IndexedDB, never bundled
    if (bios) { window.EJS_biosUrl = URL.createObjectURL(bios.file); window.__rpBios = bios.names; }
    // Amiga: with no real Kickstart stored, use PUAE's built-in open-source AROS replacement (otherwise the core stops with "Kickstart ROM not found").
    window.__rpAros = rom.system === 'amiga' && !(bios && bios.names.some((n) => /^kick/i.test(n)));
  } catch (e) { console.warn('BIOS load failed', e); }
  if (sys.heavy && !params.get('switched')) { const b = $('#banner'); b.textContent = `⚠ ${sys.label} is demanding — it may run slowly on phones.`; b.hidden = false; setTimeout(() => (b.hidden = true), 6000); }
  window.EJS_player = '#game';
  window.EJS_core = rom.core;
  window.EJS_gameUrl = file;
  window.EJS_gameName = rom.title;
  window.EJS_gameID = rom.id;
  window.EJS_pathtodata = EJS_DATA;
  window.EJS_color = '#7c5cff';
  window.EJS_backgroundColor = '#000000';
  window.EJS_startOnLoaded = false;            // keep EmulatorJS' tap-to-start button: iOS needs a user gesture for audio
  window.EJS_threads = needsThreads(rom.core);  // single-threaded everywhere except PPSSPP / DOSBox Pure (which need cross-origin isolation, see above)
  window.EJS_language = 'en-US';
  window.EJS_defaultOptions = {
    'save-state-location': 'browser',          // keep manual save states inside the browser, not downloads
    'save-save-interval': '0',                 // we flush battery saves ourselves (guarded, see flushSaves)
    'virtual-gamepad': 'enabled',
  };
  if (window.__rpAros) window.EJS_defaultOptions.puae_kickstart = 'aros';
  // Nintendo DS: absolute touch pointer + chosen screen layout from the first frame (see dstouch.js); other systems never load this module
  let ds = null;
  if (rom.system === 'nds') {
    try { ds = await import('./dstouch.js'); Object.assign(window.EJS_defaultOptions, ds.initialOptions(rom.core)); window.EJS_defaultOptions.lockMouse = 'disabled'; } catch (e) { console.warn('DS touch unavailable', e); ds = null; }
  }
  window.EJS_ready = () => { status.hidden = true; try { emu().rewindEnabled = !HARDCORE && loadRewind(rom.system); } catch {} };   // read by the GameManager when the game starts
  window.EJS_shaders = RP_SHADERS;   // our LCD grid next to EmulatorJS' built-in shaders
  window.EJS_defaultControls = buildControls(loadPad(), loadGameMap(rom.id));
  window.EJS_onGameStart = () => { started = true; try { let inv = loadInvert(rom.system); addEventListener('storage', () => { inv = loadInvert(rom.system); }); wrapSimulateInput(emu().gameManager, () => inv); takeOverGamepad(emu()); } catch (e) { console.warn('stick invert', e); } if (window.__rpStartedBy === 'pad') setTimeout(() => { if (audioBlocked()) ptoast('🔇 Tap the screen once to turn the sound on'); }, 900); try { const m = emu().menu; m.open = m.toggle = () => {}; m.close(); } catch {} wake(); if (ds) { try { ds.startDsTouch(emu(), rom.core); addDsMenu(ds); } catch (e) { console.warn('DS touch failed', e); } } startedAt = Date.now(); lastFrameAt = Date.now(); status.hidden = true; if (!playTracker) { startSession(rom.id); playTracker = trackPlay(rom.id, running); } if (!HARDCORE && loadCheats(rom.id).some((c) => c.on)) setTimeout(() => { const n = applyCheats(emu().gameManager, rom.id); if (n) say(`🧪 ${n} cheat${n > 1 ? 's' : ''} active`); }, 300); padSig = ''; setTimeout(() => { applyControls(); syncPads({ announce: false }); try { applyLayout(emu(), rom.system); } catch (e) { console.warn('touch layout', e); } startFilter(emu(), rom.system, rom.id); quick.show(loadQuick()); }, 50); };

  // Graphics preset (Settings → Performance & device; per-game choice in the game sheet wins; see perf.js)
  try {
    const perf = loadPerf();
    if (perf.mode === 'auto' && !perf.auto) { perf.auto = { ...autoTier(await deviceInfo({ refresh: false })), at: Date.now() }; savePerf(perf); }
    const eff = effectivePreset(rom.id, perf), popts = presetOptions(eff.preset);
    reconcileSaved(rom.id, rom.title, popts);              // EmulatorJS' saved per-game values would otherwise hide a preset change
    Object.assign(window.EJS_defaultOptions, popts); usePreset(eff.preset);
    window.__rpPreset = { ...eff, options: popts };
    console.info('[perf] preset', eff.preset, '(' + eff.source + ')', PRESETS[eff.preset] && PRESETS[eff.preset].short);
  } catch (e) { console.warn('perf preset', e); }
  if (HARDCORE) Object.assign(window.EJS_defaultOptions, { rewindEnabled: 'disabled', 'slowMotion': 'disabled' });
  if (params.get('resume') === '1' && !HARDCORE) {
    const st = await db.getState(rom.id);
    // never load a snapshot taken by a different core: that is a classic way to crash a libretro core
    if (st && st.data && st.core === rom.core) window.EJS_loadStateURL = URL.createObjectURL(new Blob([st.data]));
  }

  status.textContent = 'Loading emulator…';
  const s = document.createElement('script');
  s.src = EJS_DATA + 'loader.js';
  s.onerror = () => fail('Could not load the emulator. Check your internet connection (needed the first time).');
  document.body.appendChild(s);
})().catch((e) => { console.error(e); fail('Error: ' + e.message); });
