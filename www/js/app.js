import * as meta from './meta.js';
import { EJS_VERSION, SYSTEMS, GROUPS, CORE_LABELS, sortedSystemKeys, titleFrom, defaultCore, loadSettings, saveSettings, extOf, needsThreads, normalizeEjsProxy } from './cores.js';
import { detect, storedZip, parseCue, parseM3u } from './detect.js';
import { biosStatus } from './bios.js';
import { openBios } from './biosui.js';
import * as db from './db.js';
import { fetchArt, artUrl } from './art.js';
import { openCoverPicker } from './cover.js';
import { openControllers } from './padsui.js';
import { openDsTouch } from './dsui.js';
import { openMenuBtnSettings } from './ingameui.js';
import { initUpdates, checkForUpdates, currentBuild, isApk, updatePanel } from './updates.js';
import { openBackup } from './backup.js';
import { initFolders, drawFolders } from './foldersui.js';
import * as cloud from './cloud.js';
import * as ra from './retroach.js';
import { loadNet, saveNet, DEFAULT_STUN, parseServer } from './netcfg.js';
import { startPadNav } from './padnav.js';
import { rawPads, padName } from './pads.js';
import { initTopBars } from './topbar.js';
import { openPerf } from './perfui.js';
import { gamePreset, setGamePreset, effectivePreset, PRESETS } from './perf.js';

const $ = (s) => document.querySelector(s);
const el = (tag, props = {}, ...kids) => {
  const e = Object.assign(document.createElement(tag), props);
  for (const k of kids) e.append(k);
  return e;
};
const MAX_ROM = 1200 * 1024 * 1024;       // PS1/Saturn/3DO disc images are big; the practical limit is the device's memory
let roms = [], artMap = new Map(), artUrls = new Map(), resumable = new Set(), filter = 'all', query = '', settings = loadSettings();

/* ---------- toast ---------- */
let toastTimer, stickyUntil = 0;
function toast(msg, { sticky = 0, soft = false } = {}) {       // `soft` messages (art progress) never replace a sticky one
  if (soft && Date.now() < stickyUntil) return;
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  if (sticky) stickyUntil = Date.now() + sticky;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), sticky || 3200);
}

/* ---------- library ---------- */
async function refresh() {
  roms = (await db.allRoms()).sort((a, b) => (b.lastPlayed || b.added) - (a.lastPlayed || a.added));
  resumable = new Set(await db.allStateIds());
  artMap = new Map((await db.allArt().catch(() => [])).map((a) => [a.id, a]));
  render();
}

const SORTS = { recent: 'Recent', az: 'A–Z', played: 'Most played' };
let sortBy = localStorage.getItem('rp.sort') || 'recent';
function sortList(list, m) {
  const last = (r) => Math.max(r.lastPlayed || 0, (m[r.id] || {}).last || 0) || r.added || 0;
  if (sortBy === 'az') return list.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }));
  if (sortBy === 'played') return list.sort((a, b) => ((m[b.id] || {}).play || 0) - ((m[a.id] || {}).play || 0) || last(b) - last(a));
  return list.sort((a, b) => last(b) - last(a));
}
function render() {
  const chips = $('#chips'); chips.replaceChildren();
  const m = meta.allMeta(), cols = meta.collections(), ids = new Set(roms.map((r) => r.id));
  const played = (r) => (m[r.id] || {}).last || r.lastPlayed;
  const special = [];
  if (roms.some((r) => (m[r.id] || {}).fav)) special.push(['fav', '★ Favorites']);
  if (roms.some(played)) special.push(['recent', '🕘 Recent']);
  for (const c of cols) if (c.ids.some((x) => ids.has(x))) special.push(['col:' + c.id, '📁 ' + c.name]);
  const present = [['all', 'All'], ...special, ...sortedSystemKeys().filter((k) => roms.some((r) => r.system === k)).map((k) => [k, SYSTEMS[k].short])];
  if (!present.some(([k]) => k === filter)) filter = 'all';
  for (const [k, label] of present) {
    chips.append(el('button', {
      className: 'chip' + (filter === k ? ' on' : '') + (special.some(([s]) => s === k) ? ' special' : ''), type: 'button', textContent: label,
      onclick: () => { filter = k; render(); },
    }));
    chips.lastChild.setAttribute('data-f', k);
  }
  chips.hidden = roms.length === 0;
  const on = chips.querySelector('.on'); if (on && on.scrollIntoView) on.scrollIntoView({ inline: 'center', block: 'nearest' });
  $('#search').hidden = roms.length === 0;
  const ss = $('#sort'); ss.hidden = roms.length < 2; ss.value = sortBy;

  const q = query.trim().toLowerCase();
  const col = filter.startsWith('col:') && cols.find((c) => 'col:' + c.id === filter);
  const match = (r) => filter === 'all' || r.system === filter || (filter === 'fav' && (m[r.id] || {}).fav) || (filter === 'recent' && played(r)) || (col && col.ids.includes(r.id));
  let list = sortList(roms.filter((r) => match(r) && (!q || r.title.toLowerCase().includes(q))), m);
  if (filter === 'recent') list = roms.filter((r) => played(r) && (!q || r.title.toLowerCase().includes(q))).sort((a, b) => played(b) - played(a)).slice(0, 24);
  for (const u of artUrls.values()) if (u.startsWith('blob:')) URL.revokeObjectURL(u);
  artUrls.clear();
  const missing = roms.filter((r) => !artMap.has(r.id) || artMap.get(r.id).status === 'none').length;
  const ab = $('#btn-art'); ab.hidden = !missing; ab.textContent = `🖼 Get art (${missing})`;
  const grid = $('#library'); grid.replaceChildren();
  $('#empty').hidden = roms.length !== 0;
  for (const r of list) grid.append(card(r, m[r.id] || {}));
  if (roms.length && !list.length) grid.append(el('p', { className: 'muted center', textContent: 'No matches.' }));
}

function hue(str) { let h = 0; for (const c of str) h = (h * 31 + c.charCodeAt(0)) % 360; return h; }

function card(r, mt = {}) {
  const sys = SYSTEMS[r.system] || SYSTEMS.gb;
  const h = hue(r.title);
  const art = el('div', { className: 'art' },
    el('span', { className: 'ph-title', textContent: r.title }),     // generated placeholder cover: system colour + title
    el('span', { className: 'badge', textContent: sys.short }),
    ...(sys.heavy ? [el('span', { className: 'warn', textContent: '⚠', title: `${sys.label} is demanding — may run slowly on phones` })] : []));
  art.style.background = `linear-gradient(150deg, ${sys.color}, hsl(${h} 45% 18%) 75%)`;
  const url = artUrl(artMap.get(r.id));
  if (url) {
    artUrls.set(r.id, url);
    const img = el('img', { className: 'cover', src: url, alt: '', loading: 'lazy', decoding: 'async', referrerPolicy: 'no-referrer' });
    img.onerror = () => { img.remove(); art.classList.remove('has-img'); };   // offline remote art etc. -> generated placeholder stays visible
    art.classList.add('has-img'); art.prepend(img);
  }
  if (resumable.has(r.id)) art.append(el('span', { className: 'resume', textContent: '▶ Resume' }));
  if (mt.fav) art.append(el('span', { className: 'fav', textContent: '★', title: 'Favorite' }));
  if (mt.play >= 60000) art.append(el('span', { className: 'ptime', textContent: '⏱ ' + meta.fmtTime(mt.play) }));
  const c = el('div', { className: 'card', role: 'button', tabIndex: 0 }, art,
    el('div', { className: 'meta' }, el('span', { className: 'name', textContent: r.title }),
      el('button', { className: 'more', type: 'button', ariaLabel: 'Options for ' + r.title, textContent: '⋯', onclick: (e) => { e.stopPropagation(); openSheet(r); } })));
  const go = () => play(r, settings.autoResume && resumable.has(r.id));
  c.onclick = go;
  c.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
  return c;
}

function play(r, resume) {
  location.href = `player.html?id=${encodeURIComponent(r.id)}${resume ? '&resume=1' : ''}`;
}

/* ---------- box art ---------- */
let artBusy = false;
async function fetchMissingArt(list, { quiet = false, force = false } = {}) {
  if (artBusy) return; artBusy = true;
  try {
    let done = 0, got = 0;
    for (const r of list) {
      const prev = artMap.get(r.id);
      if (!force && prev && prev.status !== 'none') continue;
      if (prev && prev.custom && !force) continue;
      if (!quiet || list.length > 1) toast(`Fetching cover art… ${done + 1}/${list.length}`, { soft: true });
      const rec = await fetchArt(r, { force });
      artMap.set(r.id, rec); if (rec.status !== 'none') got++; done++;
      render();
    }
    if (!quiet || got) toast(done ? `Cover art: found ${got} of ${done}` : 'Nothing to fetch', { soft: true });
  } finally { artBusy = false; }
}
$('#btn-art').onclick = () => {
  if (!navigator.onLine) return toast('You are offline — art needs internet once.');
  fetchMissingArt(roms.filter((r) => !artMap.has(r.id) || artMap.get(r.id).status === 'none'));
};

/* ---------- adding ROMs ---------- */
function askSystem(filename, candidates = [], likely = []) {
  return new Promise((resolve) => {
    const d = $('#sheet'); let all = !candidates.length;
    const pick = (k) => { d.onclose = null; d.close(); resolve(k); };
    const draw = () => {
      const list = all ? sortedSystemKeys() : candidates;
      const rows = [];
      let lastGroup = '';
      for (const k of list) {
        const sy = SYSTEMS[k];
        if (all && sy.group !== lastGroup) { lastGroup = sy.group; rows.push(el('p', { className: 'muted small grp', textContent: sy.group })); }
        rows.push(el('button', { className: 'row' + (likely.includes(k) ? ' primary' : ''), textContent: sy.label + (likely.includes(k) ? '  ✓ looks like this' : '') + (sy.heavy ? '  ⚠' : ''), onclick: () => pick(k) }));
      }
      d.replaceChildren(
        el('h3', { textContent: 'Which system is this?' }),
        el('p', { className: 'muted', textContent: `“${filename}” could be more than one system${candidates.length ? '' : ' (unrecognised extension)'}.` }),
        ...rows,
        ...(!all ? [el('button', { className: 'row', textContent: 'Show all systems…', onclick: () => { all = true; draw(); } })] : []),
        el('button', { className: 'row ghost', textContent: 'Skip this file', onclick: () => d.close() }));
    };
    draw(); d.onclose = () => resolve(null); d.showModal();
  });
}

const baseName = (n) => n.replace(/\.[^.]*$/, '');
/** Group cue sheets / m3u playlists with the track files that were selected together (cue+bin -> one ZIP bundle). */
async function planFiles(files) {
  const byName = new Map(files.map((f) => [f.name.toLowerCase(), f]));
  const used = new Set(), items = [];
  const find = (n) => byName.get(n.toLowerCase());
  const bundleCue = async (cue, entries, missing) => {
    entries.push({ name: cue.name, data: cue }); used.add(cue);
    for (const n of parseCue(await cue.text())) { const t = find(n); if (t) { if (!entries.some((e) => e.name === t.name)) entries.push({ name: t.name, data: t }); used.add(t); } else missing.push(n); }
  };
  for (const m of files.filter((f) => extOf(f.name) === 'm3u')) {
    const entries = [{ name: m.name, data: m }], missing = []; used.add(m);
    for (const n of parseM3u(await m.text())) {
      const t = find(n); if (!t) { missing.push(n); continue; }
      if (extOf(t.name) === 'cue') await bundleCue(t, entries, missing); else { entries.push({ name: t.name, data: t }); used.add(t); }
    }
    items.push({ kind: 'bundle', name: m.name, entries, missing });
  }
  for (const c of files.filter((f) => extOf(f.name) === 'cue' && !used.has(f))) {
    const entries = [], missing = []; await bundleCue(c, entries, missing);
    items.push({ kind: 'bundle', name: c.name, entries, missing });
  }
  for (const f of files) if (!used.has(f)) items.push({ kind: 'single', file: f, name: f.name });
  return items;
}

/** Imports files into the library. Non-interactive (folder scans): ambiguous files use the content-sniffed guess or are
 *  counted in `needChoice` instead of opening the "Which system?" picker. Returns counts; does not refresh the UI. */
async function importFiles(files, { interactive = true } = {}) {
  let added = 0, dup = 0, skipped = 0, needChoice = 0; const newRoms = [], problems = [];
  for (const item of await planFiles(files)) {
    try {
      let blob, name = item.name, probe;
      if (item.kind === 'bundle') {
        if (item.missing.length) { skipped++; problems.push(`“${item.name}” needs ${item.missing.slice(0, 2).join(', ')}${item.missing.length > 2 ? '…' : ''} — select the .cue and its .bin file(s) together`); continue; }
        const first = item.entries.find((e) => !/\.(cue|m3u)$/i.test(e.name)); if (!first) { skipped++; continue; }
        if (interactive) toast(`Bundling ${item.name}…`);
        blob = await storedZip(item.entries); name = baseName(item.name) + '.zip';
        probe = { name: 'x.cue', size: first.data.size, slice: (a, b) => first.data.slice(a, b) };
      } else { blob = item.file; probe = item.file; }
      if (blob.size > MAX_ROM) { skipped++; problems.push(`“${name}” is too large (${(blob.size / 1048576).toFixed(0)} MB)`); continue; }
      let d = await detect(probe), system = d.system;
      if (!system && !interactive) { system = d.likely && d.likely[0]; if (!system) { needChoice++; continue; } }
      if (!system) {
        system = await askSystem(item.name, d.candidates, d.likely);
        if (!system) { skipped++; continue; }
      }
      let fname = name;
      const sy = SYSTEMS[system], ext = extOf(name);
      if (item.kind === 'single' && !['zip', '7z'].includes(ext) && sy.exts.length && !sy.exts.includes(ext) && ext !== 'bin') fname = baseName(name) + '.' + sy.exts[0];
      if (system === 'dos' && ['zip'].includes(ext)) {            // DOSBox Pure wants to open the .zip itself: nest it so EmulatorJS does not unpack it
        blob = await storedZip([{ name: baseName(name) + '.zip', data: blob }]); fname = baseName(name) + '.zip';
      }
      const data = await blob.arrayBuffer();
      const id = await db.sha256Hex(data);
      if (await db.getRom(id)) { dup++; continue; }
      const orig = item.kind === 'single' ? item.file : null;
      await db.putRom({
        id, file: fname, title: titleFrom(item.name), system, core: defaultCore(system, settings),
        size: data.byteLength, added: Date.now(), lastPlayed: 0, data,
        origName: orig ? orig.name : item.name, origSize: orig ? orig.size : data.byteLength,
      });
      added++; newRoms.push(id);
    } catch (e) {
      console.error(e); skipped++;
      if (e && e.name === 'QuotaExceededError') { toast('Storage is full — free up space and try again.'); e.quota = true; problems.push('Storage is full'); break; }
      problems.push(`“${item.name}”: ${e.message || e}`);
    }
  }
  return { added, dup, skipped, needChoice, problems, newRoms };
}

function reportImport(r, { prefix = '', quietIfNone = false } = {}) {
  const parts = [];
  if (r.added) parts.push(`Added ${r.added} game${r.added > 1 ? 's' : ''}`);
  if (r.dup) parts.push(`${r.dup} already in library`);
  if (r.needChoice) parts.push(`${r.needChoice} need a system choice — add with ＋`);
  if (r.skipped) parts.push(`${r.skipped} skipped`);
  if (r.problems && r.problems.length) parts.push(r.problems[0]);
  if (!parts.length && quietIfNone) return;
  toast(prefix + (parts.join(' · ') || 'No new games found'), { sticky: (r.problems && r.problems.length) || r.needChoice ? 6000 : 0 });
  if (r.newRoms && r.newRoms.length) fetchMissingArt(roms.filter((x) => r.newRoms.includes(x.id)), { quiet: true });
}

async function addFiles(files) {
  const r = await importFiles(files, { interactive: true });
  await refresh();
  reportImport(r);
}

$('#file-input').addEventListener('change', async (e) => {
  const files = [...e.target.files]; e.target.value = '';
  if (files.length) await addFiles(files);
});
let dragDepth = 0;
addEventListener('dragenter', (e) => { e.preventDefault(); dragDepth++; $('#drop').hidden = false; });
addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; $('#drop').hidden = true; } });
addEventListener('dragover', (e) => e.preventDefault());
addEventListener('drop', async (e) => {
  e.preventDefault(); dragDepth = 0; $('#drop').hidden = true;
  if (e.dataTransfer.files.length) await addFiles([...e.dataTransfer.files]);
});

/* ---------- per-game sheet ---------- */
async function openSheet(r) {
  const d = $('#sheet'); d.onclose = null;
  const sys = SYSTEMS[r.system];
  const coreSel = el('select', { onchange: async () => { r.core = coreSel.value; await db.putRom(r); await db.deleteState(r.id).catch(() => {}); resumable.delete(r.id); toast('Core set to ' + r.core + ' (auto-resume snapshot cleared)'); } },
    ...sys.cores.map((c) => el('option', { value: c, textContent: CORE_LABELS[c] || c, selected: c === r.core })));
  const sysSel = el('select', { onchange: async () => {
    r.system = sysSel.value; r.core = defaultCore(r.system, settings); await db.putRom(r); await db.deleteState(r.id).catch(() => {}); resumable.delete(r.id);
    d.close(); await refresh(); toast(`Moved to ${SYSTEMS[r.system].label}`);
  } }, ...GROUPS.map((g) => el('optgroup', { label: g }, ...sortedSystemKeys().filter((k) => SYSTEMS[k].group === g).map((k) => el('option', { value: k, textContent: SYSTEMS[k].label, selected: k === r.system })))));
  const size = r.size > 1048576 ? `${(r.size / 1048576).toFixed(1)} MB` : `${(r.size / 1024).toFixed(0)} KB`;
  const rows = [
    el('h3', { textContent: r.title }),
    el('p', { className: 'muted', textContent: `${sys.label} · ${size} · ${r.file}` }),
    playLine(r),
    el('button', { className: 'row primary', textContent: resumable.has(r.id) ? '▶ Resume where you left off' : '▶ Play', onclick: () => play(r, resumable.has(r.id)) }),
  ];
  if (resumable.has(r.id)) {
    rows.push(el('button', { className: 'row', textContent: '↻ Start from the beginning', onclick: async () => { await db.deleteState(r.id); play(r, false); } }));
  }
  rows.push(el('button', { className: 'row', id: 'sheet-fav', textContent: meta.isFav(r.id) ? '★ Remove from favorites' : '☆ Add to favorites', onclick: (e) => {
    const f = meta.toggleFav(r.id); e.currentTarget.textContent = f ? '★ Remove from favorites' : '☆ Add to favorites'; render(); toast(f ? 'Added to favorites' : 'Removed from favorites');
  } }));
  const note = el('textarea', { id: 'sheet-note', className: 'note', rows: 2, maxLength: 200, placeholder: '📝 Compatibility note (e.g. "works best on melonDS", "slow on phone")', value: meta.getNote(r.id),
    onchange: () => { meta.setNote(r.id, note.value); toast('Note saved'); } });
  rows.push(note);
  rows.push(el('button', { className: 'row', id: 'sheet-cols', textContent: '📁 Collections…', onclick: () => openCollections(r) }));
  rows.push(el('button', { className: 'row', textContent: '🖼 Change cover…', onclick: () => {
    d.close();
    openCoverPicker(r, { onSaved: async (res) => {
      if (res.reset) { artMap.delete(r.id); await refresh(); if (navigator.onLine) await fetchMissingArt([r], { force: true }); return; }
      await refresh(); toast('Cover updated');
    } });
  } }));
  rows.push(el('button', { className: 'row', textContent: '🖼 Refresh cover art (automatic)', onclick: async () => {
    d.close(); if (!navigator.onLine) return toast('You are offline — art needs internet.');
    artMap.delete(r.id); await db.deleteArt(r.id).catch(() => {}); await fetchMissingArt([r], { force: true });
  } }));
  if (r.system === 'nds') rows.push(el('p', { className: 'muted small', textContent: 'Nintendo DS is demanding: expect slow speed on older phones and on iPhone Safari. DeSmuME 2015 is the lighter core.' }));
  else if (sys.heavy) rows.push(el('p', { className: 'muted small warnline', textContent: `⚠ ${sys.label} is demanding: expect slow speed or high battery/memory use on phones, especially iPhone Safari. A recent desktop or high-end phone works best.` }));
  if (sys.experimental) rows.push(el('p', { className: 'muted small', textContent: 'Experimental core: it boots in EmulatorJS 4.2.3 but gets little testing — please expect rough edges.' }));
  if (needsThreads(r.core)) rows.push(el('p', { className: 'muted small', textContent: 'This core needs multi-threading (SharedArrayBuffer). Retro Pocket turns on cross-origin isolation for it automatically.' }));
  if (sys.hint) rows.push(el('p', { className: 'muted small', textContent: sys.hint }));
  const bst = await biosStatus(r.system);
  if (bst.spec) {
    rows.push(el('p', { className: 'muted small' + (bst.needs ? ' warnline' : ''), textContent: bst.needs ? `⚠ BIOS needed: ${bst.spec.files.filter((x) => x.level === 'required').map((x) => x.name).join(' / ')} — not added yet.` : bst.have.length ? `BIOS on this device: ${bst.have.join(', ')}` : 'BIOS: optional for this system.' }));
    rows.push(el('button', { className: 'row', textContent: '🔑 BIOS files…', onclick: () => { d.close(); openBios($('#bios'), toast); } }));
  }
  const gfxSel = el('select', { id: 'sheet-gfx', onchange: () => { setGamePreset(r.id, gfxSel.value); toast(gfxSel.value ? `Graphics for this game: ${PRESETS[gfxSel.value].short}` : 'Graphics: same as Settings'); } },
    el('option', { value: '', textContent: `Same as Settings (${PRESETS[effectivePreset(null).preset].short})`, selected: !gamePreset(r.id) }), ...Object.entries(PRESETS).map(([k, v]) => el('option', { value: k, textContent: v.label, selected: gamePreset(r.id) === k })));
  rows.push(el('label', { className: 'row select' }, 'Graphics', gfxSel));
  if (sys.cores.length > 1) rows.push(el('label', { className: 'row select' }, 'Emulator core', coreSel));
  rows.push(el('label', { className: 'row select' }, 'System', sysSel));
  rows.push(
    el('button', { className: 'row', textContent: 'Rename', onclick: async () => {
      const n = prompt('Game title', r.title);
      if (n && n.trim()) { r.title = n.trim(); await db.putRom(r); d.close(); await refresh(); }
    } }),
    el('button', { className: 'row danger', textContent: 'Remove from library', onclick: async () => {
      if (!confirm(`Remove “${r.title}” from this device?\nIn-game saves may also be lost.`)) return;
      await db.deleteRom(r.id); await db.deleteState(r.id); meta.forget(r.id); await db.deleteArt(r.id).catch(() => {}); d.close(); await refresh(); toast('Removed');
    } }),
    el('button', { className: 'row ghost', textContent: 'Close', onclick: () => d.close() }));
  d.replaceChildren(...rows); d.showModal();
}
for (const dlg of document.querySelectorAll('dialog')) {
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
}

function playLine(r) {
  const m = meta.meta(r.id), last = Math.max(m.last || 0, r.lastPlayed || 0), bits = [];
  if (m.play) bits.push('Played ' + meta.fmtTime(m.play)); if (m.plays) bits.push(`${m.plays} session${m.plays > 1 ? 's' : ''}`);
  if (last) bits.push('last ' + new Date(last).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: new Date(last).getFullYear() === new Date().getFullYear() ? undefined : 'numeric' }));
  return el('p', { className: 'muted small', id: 'sheet-play', textContent: bits.length ? '⏱ ' + bits.join(' · ') : 'Not played yet' });
}
// add/remove a game to/from collections; create, rename, delete collections
function openCollections(r) {
  const d = $('#sheet');
  const draw = () => {
    const cols = meta.collections(), name = el('input', { id: 'col-new', placeholder: 'New collection name', maxLength: 40 });
    const add = () => { if (!name.value.trim()) return; const c = meta.newCollection(name.value); if (r) meta.setInCollection(c.id, r.id, true); draw(); render(); };
    name.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
    d.replaceChildren(el('h3', { textContent: r ? `Collections — ${r.title}` : 'Collections' }),
      cols.length ? '' : el('p', { className: 'muted small', textContent: 'No collections yet. Make one (e.g. “Couch co-op”, “RPGs”, “Kids”).' }),
      ...cols.map((c) => el('div', { className: 'row col-row' },
        r ? el('label', {}, el('input', { type: 'checkbox', className: 'col-on', checked: c.ids.includes(r.id), onchange: (e) => { meta.setInCollection(c.id, r.id, e.target.checked); render(); } }), ` ${c.name}`) : el('span', { textContent: `${c.name} (${c.ids.length})` }),
        el('button', { className: 'ghost', textContent: '✎', title: 'Rename', onclick: () => { const n = prompt('Collection name', c.name); if (n && n.trim()) { meta.renameCollection(c.id, n); draw(); render(); } } }),
        el('button', { className: 'ghost', textContent: '🗑', title: 'Delete collection', onclick: () => { if (confirm(`Delete collection “${c.name}”? (games stay in your library)`)) { meta.deleteCollection(c.id); draw(); render(); } } }))),
      el('div', { className: 'row col-new' }, name, el('button', { className: 'chip primary', id: 'col-add', type: 'button', textContent: '＋ Add', onclick: add })),
      el('button', { className: 'row ghost', textContent: r ? '‹ Back' : 'Close', onclick: () => (r ? openSheet(r) : d.close()) }));
    if (!d.open) d.showModal();
  };
  draw();
}
$('#sort').onchange = (e) => { sortBy = e.target.value; localStorage.setItem('rp.sort', sortBy); render(); };

/* ---------- settings ---------- */
$('#btn-settings').onclick = async () => {
  const d = $('#settings');
  const mk = (label, key, opts) => el('label', { className: 'row select' }, label,
    el('select', { onchange: (e) => { settings[key] = e.target.value; saveSettings(settings); } },
      ...opts.map(([v, t]) => el('option', { value: v, textContent: t, selected: settings[key] === v }))));
  const est = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate().catch(() => null) : null;
  d.replaceChildren(
    el('h3', { textContent: 'Settings' }),
    mk('Default Game Boy core (new games)', 'gbCore', [['gambatte', 'Gambatte'], ['mgba', 'mGBA']]),
    mk('Default NES core (new games)', 'nesCore', [['nestopia', 'Nestopia (accurate, default)'], ['fceumm', 'FCEUmm (fast)']]),
    mk('Default Nintendo DS core (new games)', 'dsCore', [['desmume2015', 'DeSmuME 2015 (lighter)'], ['melonds', 'melonDS (accurate, heavy)']]),
    el('button', { className: 'row', id: 'btn-cores', textContent: '⚙︎ Default cores for other systems…', onclick: () => openCoreDefaults(d) }),
    el('button', { className: 'row', id: 'btn-bios', textContent: '🔑 BIOS files…', onclick: () => { d.close(); openBios($('#bios'), toast); } }),
    el('label', { className: 'row select' }, 'Auto-resume saved session',
      el('input', { type: 'checkbox', checked: !!settings.autoResume, onchange: (e) => { settings.autoResume = e.target.checked; saveSettings(settings); } })),
    el('button', { className: 'row', id: 'btn-folders-settings', textContent: '📁 ROM folders…', onclick: () => { d.close(); drawFolders(); } }),
    el('button', { className: 'row', id: 'btn-net', textContent: '🌐 Online play (netplay)…', onclick: () => openNetSettings(d) }),
    el('label', { className: 'row field' }, el('span', { textContent: 'Proxy server URL' }),
      el('input', { id: 'ejs-proxy', value: localStorage.getItem('rp.ejsProxy') || '', placeholder: 'https://your-proxy-host', autocomplete: 'url', spellcheck: false })),
    el('p', { className: 'muted small', textContent: `Optional: route first-time EmulatorJS ${EJS_VERSION} downloads through your own server. Deploy the server from /server, then enter its origin here (HTTPS for remote servers). Leave blank to use the public CDN.` }),
    el('button', { className: 'row', id: 'btn-ejs-proxy-save', textContent: 'Save emulator proxy', onclick: () => {
      const proxy = normalizeEjsProxy($('#ejs-proxy').value);
      if (proxy === null) { toast('Enter only an http(s) server origin, e.g. https://your-proxy-host'); return; }
      if (proxy) localStorage.setItem('rp.ejsProxy', proxy); else localStorage.removeItem('rp.ejsProxy');
      toast(proxy ? 'Emulator downloads will use your proxy' : 'Emulator downloads will use the public CDN');
    } }),
    el('button', { className: 'row', id: 'btn-cloud', textContent: '☁️ Cloud save sync (Google Drive)…', onclick: () => openCloud(d) }),
    el('button', { className: 'row', id: 'btn-ra', textContent: '🏆 RetroAchievements…', onclick: () => openRA(d) }),
    el('button', { className: 'row', id: 'btn-backup', textContent: '💾 Backup & restore…', onclick: () => { d.close(); openBackup($('#backup'), toast); } }),
    el('button', { className: 'row', id: 'btn-update', textContent: `🔄 Check for updates (version ${currentBuild().version})`, onclick: async (e) => { const b = e.currentTarget; b.disabled = true; const m = await checkForUpdates({ manual: true }); b.disabled = false; toast(m || 'Checked.'); } }),
    updatePanel(),
    el('button', { className: 'row', id: 'btn-menubtn', textContent: '📍 In-game menu button…', onclick: () => { d.close(); openMenuBtnSettings($('#uimenu')); } }),
    el('button', { className: 'row', id: 'btn-ds', textContent: '🖐 Nintendo DS touch & screens…', onclick: () => { d.close(); openDsTouch($('#dstouch')); } }),
    el('button', { className: 'row', id: 'btn-controllers', textContent: '🎮 Controllers…', onclick: () => { d.close(); openControllers(); } }),
    el('button', { className: 'row', id: 'btn-perf', textContent: '⚡ Performance & device…', onclick: () => openPerf(d, { onBack: () => { d.close(); $('#btn-settings').click(); }, toast }) }),
    el('button', { className: 'row', textContent: '🖼 Fetch all missing cover art', onclick: () => { d.close(); $('#btn-art').click(); } }),
    el('p', { className: 'muted', textContent: est && est.usage != null ? `Storage used: ${(est.usage / 1048576).toFixed(1)} MB` : '' }),
    el('p', { className: 'muted small', textContent: 'Retro Pocket runs RetroArch-based emulator cores (via EmulatorJS) entirely in your browser. Bring your own legally obtained ROMs — none are included. GPL-3.0.' }),
    el('button', { className: 'row ghost', textContent: 'Close', onclick: () => d.close() }));
  d.showModal();
};

function openNetSettings(d) {
  const c = loadNet();
  const field = (label, key, ph, type = 'text') => el('label', { className: 'row field' }, el('span', { textContent: label }),
    el('input', { type, id: 'net-' + key, value: c[key] || '', placeholder: ph, autocomplete: 'off', spellcheck: false, oninput: (e) => { c[key] = e.target.value.trim(); } }));
  d.replaceChildren(el('h3', { textContent: 'Online play' }),
    el('p', { className: 'muted small', textContent: 'Host: start a game, then ☰ → 🌐 Online play → Start a room and share the code. Friends see your screen and control Player 2–4; they don\'t need the game file. Works over the internet and on the same Wi-Fi (the stream goes directly device-to-device).' }),
    el('button', { className: 'row primary', id: 'btn-join', textContent: '🎮 Join a friend\'s game…', onclick: () => { location.href = 'join.html'; } }),
    field('Signalling server (empty = free public PeerJS server)', 'server', 'e.g. https://my-retro-server.onrender.com'),
    field('STUN servers', 'stun', DEFAULT_STUN),
    field('TURN server (optional, for strict networks)', 'turnUrl', 'turn:turn.example.com:3478'),
    field('TURN username', 'turnUser', ''),
    field('TURN password', 'turnPass', '', 'password'),
    el('p', { className: 'muted small', textContent: 'Self-host the server from the /server folder (Render, Fly.io or Railway: see README). For LAN-only play without internet, run it on a computer on your Wi-Fi and enter http://<its-ip>:9000.' }),
    el('button', { className: 'row', id: 'btn-net-save', textContent: 'Save', onclick: () => {
      try { if (c.server) parseServer(c.server); } catch { toast('That server address is not valid'); return; }
      if (!c.stun) c.stun = DEFAULT_STUN; saveNet(c); toast('Online play settings saved'); $('#btn-settings').click();
    } }),
    el('button', { className: 'row ghost', textContent: 'Back', onclick: () => $('#btn-settings').click() }));
}

function openCloud(d) {
  const c = cloud.loadCloud();
  const status = el('p', { className: 'muted small', id: 'cloud-status' });
  const show = () => {
    const cc = cloud.loadCloud(), r = cc.lastResult;
    status.textContent = (cc.email ? `Signed in as ${cc.email}. ` : 'Not signed in. ') + (cc.last ? `Last sync ${new Date(cc.last).toLocaleString()}${r ? ` (↑${r.up} ↓${r.down} =${r.same})` : ''}.` : 'Never synced.');
  };
  const run = async (fn, btn) => {
    btn.disabled = true;
    try { await fn(); } catch (e) { toast(e.message || String(e), { sticky: 5000 }); } finally { btn.disabled = false; show(); }
  };
  const doSync = async (interactive) => {
    const r = await cloud.syncNow({ interactive, onProgress: (m) => { status.textContent = m; } });
    toast(`☁️ Synced: ${r.up} uploaded, ${r.down} downloaded, ${r.same} unchanged`); if (r.down) refresh();
  };
  d.replaceChildren(el('h3', { textContent: 'Cloud save sync' }),
    el('p', { className: 'muted small', textContent: 'Keeps in-game saves and auto-resume states in sync between your devices through a hidden Retro Pocket folder in your Google Drive (it cannot see your other files). Games and BIOS files are never uploaded. The newest copy of each save wins.' }),
    cloud.isApkWebView() ? el('p', { className: 'small warn-txt', textContent: 'Google does not allow sign-in inside app WebViews, so on Android use the web version in Chrome (Pages link → Add to Home screen) for cloud sync. Your saves are the same game files, so they sync between Chrome, iPhone and desktop.' }) : '',
    el('label', { className: 'row field' }, el('span', { textContent: 'Google OAuth client ID (README → Cloud save sync)' }),
      el('input', { id: 'cloud-client', value: c.clientId || '', placeholder: '1234-abc.apps.googleusercontent.com', autocomplete: 'off', spellcheck: false,
        onchange: (e) => { const cc = cloud.loadCloud(); cc.clientId = e.target.value.trim(); cloud.saveCloud(cc); } })),
    el('label', { className: 'row select' }, 'Sync automatically when the library opens',
      el('input', { type: 'checkbox', id: 'cloud-auto', checked: c.auto !== false, onchange: (e) => { const cc = cloud.loadCloud(); cc.auto = e.target.checked; cloud.saveCloud(cc); } })),
    el('button', { className: 'row primary', id: 'cloud-signin', textContent: c.email ? '🔄 Sync now' : '🔑 Sign in with Google & sync', onclick: (e) => run(async () => {
      const cc = cloud.loadCloud(); if (!cloud.validClientId(cc.clientId)) throw new Error('Enter a valid OAuth client ID (…apps.googleusercontent.com)');
      if (!cc.email) await cloud.signIn();
      await doSync(true); e.target.textContent = '🔄 Sync now';
    }, e.target) }),
    status,
    el('button', { className: 'row', id: 'cloud-signout', textContent: 'Sign out', onclick: () => { cloud.signOut(); show(); toast('Signed out of Google Drive'); } }),
    el('button', { className: 'row ghost', textContent: 'Back', onclick: () => $('#btn-settings').click() }));
  show();
}
async function autoCloudSync() {          // only with a token from this app session (no popups); runs after returning from a game
  const c = cloud.loadCloud(); if (c.auto === false || !c.email || !cloud.hasSession()) return;
  try { const r = await cloud.syncNow(); if (r.down) refresh(); if (r.up || r.down) toast(`☁️ Saves synced (↑${r.up} ↓${r.down})`, { soft: true }); } catch (e) { console.warn('cloud sync', e); }
}

function openRA(d) {
  const c = ra.loadRA();
  const status = el('p', { className: 'muted small', id: 'ra-status', textContent: c.user && c.key ? `Logged in as ${c.user}.` : 'Not logged in.' });
  const user = el('input', { id: 'ra-user', value: c.user, placeholder: 'RetroAchievements username', autocomplete: 'username', spellcheck: false });
  const key = el('input', { id: 'ra-key', type: 'password', value: c.key, placeholder: 'Web API key (retroachievements.org → Settings)', autocomplete: 'off' });
  d.replaceChildren(el('h3', { textContent: 'RetroAchievements' }),
    el('p', { className: 'muted small', textContent: 'Log in with your username and your personal Web API key (retroachievements.org → Settings → Keys); your password is never needed. In-game ☰ → 🏆 Achievements then shows the set for the running game and what you have unlocked.' }),
    el('label', { className: 'row field' }, el('span', { textContent: 'Username' }), user),
    el('label', { className: 'row field' }, el('span', { textContent: 'Web API key' }), key),
    el('button', { className: 'row primary', id: 'ra-login', textContent: 'Log in', onclick: async (e) => {
      const b = e.currentTarget; b.disabled = true;
      try { const p = await ra.login(user.value.trim(), key.value.trim()); status.textContent = `Logged in as ${p.User}${p.TotalPoints != null ? ` · ${p.TotalPoints} points (${p.TotalTruePoints || 0} hardcore)` : ''}.`; toast('🏆 RetroAchievements: logged in'); }
      catch (x) { status.textContent = x.message; toast(x.message); } finally { b.disabled = false; }
    } }),
    status,
    el('label', { className: 'row select' }, 'Hardcore mode (no save-state loading, cheats, rewind or slow motion)',
      el('input', { type: 'checkbox', id: 'ra-hardcore', checked: c.hardcore, onchange: (e) => { ra.saveRA({ ...ra.loadRA(), hardcore: e.target.checked }); toast(e.target.checked ? 'Hardcore on (applies when a game starts)' : 'Hardcore off'); } })),
    el('p', { className: 'muted small', textContent: 'Honest limit: RetroAchievements only accepts unlocks from approved emulators (e.g. RetroArch), and its unlock API cannot be used from a browser. Retro Pocket shows your achievements and progress and applies hardcore rules, but playing here does not award new unlocks.' }),
    el('button', { className: 'row', id: 'ra-logout', textContent: 'Log out', onclick: () => { ra.logout(); user.value = ''; key.value = ''; status.textContent = 'Not logged in.'; } }),
    el('button', { className: 'row ghost', textContent: 'Back', onclick: () => $('#btn-settings').click() }));
}

function openCoreDefaults(d) {
  const keys = sortedSystemKeys().filter((k) => !['gb', 'gbc', 'nes', 'nds'].includes(k) && SYSTEMS[k].cores.length > 1);
  d.replaceChildren(el('h3', { textContent: 'Default cores' }),
    el('p', { className: 'muted small', textContent: 'Used for newly added games. You can still change the core per game (⋯ menu).' }),
    ...keys.map((k) => el('label', { className: 'row select' }, SYSTEMS[k].label,
      el('select', { onchange: (e) => { settings.cores = { ...settings.cores, [k]: e.target.value }; saveSettings(settings); } },
        ...SYSTEMS[k].cores.map((c) => el('option', { value: c, textContent: CORE_LABELS[c] || c, selected: defaultCore(k, settings) === c }))))),
    el('button', { className: 'row ghost', textContent: 'Back', onclick: () => $('#btn-settings').click() }));
}

/* ---------- misc ---------- */
$('#search').addEventListener('input', (e) => { query = e.target.value; render(); });

const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches || !!window.Capacitor;
if (isiOS && !standalone && !localStorage.getItem('rp.hintDismissed')) $('#install-hint').hidden = false;
$('#hint-close').onclick = () => { $('#install-hint').hidden = true; localStorage.setItem('rp.hintDismissed', '1'); };

if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
initUpdates();
addEventListener('pageshow', (e) => { if (e.persisted) { refresh(); autoCloudSync(); } });
setTimeout(autoCloudSync, 1500);
refresh().catch((e) => { console.error(e); toast('Could not open local storage (private mode?).'); });
initTopBars();          // Close / Back / Save live in a sticky bar at the TOP of every sheet (bottom = behind phone nav buttons)
initFolders({ importFiles, refresh, getRoms: () => db.allRoms(), toast, report: reportImport });

/* ---------- physical controllers: connect toasts + library navigation ---------- */
let padSig = '';
setInterval(() => {
  const pads = rawPads(), sig = pads.map((g) => g.id + '#' + g.index).join('|');
  if (sig === padSig) return;
  const had = padSig.split('|').filter(Boolean).length; padSig = sig;
  if (pads.length > had) toast(`🎮 ${padName(pads[pads.length - 1].id)} connected — D-pad to move, A to play`);
  else if (pads.length < had) toast('🎮 Controller disconnected');
}, 600);
const openDialog = () => [...document.querySelectorAll('dialog[open]')].pop();
const padNav = startPadNav({
  getFocusables: () => {
    const d = openDialog();
    if (d) return [...d.querySelectorAll('button:not([hidden]):not(:disabled), select, input[type=range], input[type=checkbox], summary, .cv-tile')];
    return [...document.querySelectorAll('#library .card')];
  },
  onBack: () => { const d = openDialog(); if (d) d.close(); },
  onStart: () => { if (openDialog()) return; const c = document.activeElement; if (c && c.classList && c.classList.contains('card')) c.querySelector('.more').click(); },
  onSelect: () => { if (!openDialog()) $('#btn-settings').click(); },
  onL: () => cycleChip(-1), onR: () => cycleChip(1),
  enabled: () => !location.hash.includes('nopad'),
});
function cycleChip(dir) {
  if (openDialog()) return;
  const chips = [...document.querySelectorAll('#chips .chip')]; if (chips.length < 2) return;
  const i = chips.findIndex((c) => c.classList.contains('on'));
  chips[(i + dir + chips.length) % chips.length].click();
  const first = document.querySelector('#library .card'); if (first) padNav.setFocus(first);
}
addEventListener('pointerdown', () => document.querySelectorAll('.pad-focus').forEach((x) => x.classList.remove('pad-focus')), { passive: true });
