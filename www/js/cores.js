// Data-driven table of every system Retro Pocket supports, the EmulatorJS (RetroArch/libretro) cores that run them,
// file-extension detection, box-art folders, BIOS notes and controller facts.
//
// Verified against the PINNED EmulatorJS release (EJS_VERSION below): its `getCores()` system map, its cores.json and the
// published `cores/*-wasm.data` files. Systems that EmulatorJS 4.2.3 does NOT ship a core for (Magnavox Odyssey 2, Vectrex,
// Pokémon Mini, Intellivision, Neo Geo CD, Channel F, …) are deliberately absent - see README → "Not supported".

// Pinned EmulatorJS release (loader, UI and cores all come from this one version, so a CDN "stable" bump can never mismatch).
export const EJS_VERSION = '4.2.3';
export const EJS_CDN = `https://cdn.emulatorjs.org/${EJS_VERSION}/data/`;

export function normalizeEjsProxy(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  try {
    const url = new URL(text);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;
    return url.origin;
  } catch {
    return null;
  }
}

const R = 'required', REC = 'recommended', OPT = 'optional';
// md5 = checksum libretro publishes (libretro-core-info `notes`) for the usual dump; used to verify what you add / download.
const f = (name, level, note = '', md5 = '') => ({ name, level, note, md5 });

/*
 * Fields: label, short (badge / chip), color, group, cores (first = default, rest = alternates for the per-game picker and
 * for the automatic crash fallback), art (libretro-thumbnails repository name, spaces not underscores), exts (unique
 * extensions that identify the system), heavy (performance warning), players (max controllers), analog (real analog sticks),
 * bios ({ mode: 'extract' | 'raw', files: [...] }), hint (controller / usage notes), experimental.
 */
export const SYSTEMS = {
  // ---- Nintendo
  gb:   { group: 'Nintendo', label: 'Game Boy', short: 'GB', color: '#8bac0f', cores: ['gambatte', 'mgba'], art: 'Nintendo - Game Boy', exts: ['gb', 'dmg', 'sgb'], players: 1,
          bios: { mode: 'extract', files: [f('gb_bios.bin', OPT, 'DMG boot ROM (Gambatte "Use official bootloader")', '32fbbd84168d3482956eb3c5051637f5'), f('dmg_boot.bin', OPT)] } },
  gbc:  { group: 'Nintendo', label: 'Game Boy Color', short: 'GBC', color: '#a05cff', cores: ['gambatte', 'mgba'], art: 'Nintendo - Game Boy Color', exts: ['gbc', 'cgb'], players: 1,
          bios: { mode: 'extract', files: [f('gbc_bios.bin', OPT, 'CGB boot ROM', 'dbfce9db9deaa2567f6a84fde55f9680')] } },
  gba:  { group: 'Nintendo', label: 'Game Boy Advance', short: 'GBA', color: '#4f7cff', cores: ['mgba'], art: 'Nintendo - Game Boy Advance', exts: ['gba'], players: 1,
          bios: { mode: 'extract', files: [f('gba_bios.bin', OPT, 'mGBA has a built-in replacement; the real BIOS improves compatibility', 'a860e8c0b6d573d191e4ec7db1b1e4f6')] } },
  nes:  { group: 'Nintendo', label: 'NES / Famicom', short: 'NES', color: '#e0405a', cores: ['nestopia', 'fceumm'], art: 'Nintendo - Nintendo Entertainment System', exts: ['nes', 'unf', 'unif', 'fds'], players: 2,
          bios: { mode: 'extract', files: [f('disksys.rom', REC, 'only for Famicom Disk System (.fds) games', 'ca30b50f880eb660a320674ed365ef7a')] } },
  snes: { group: 'Nintendo', label: 'SNES / Super Famicom', short: 'SNES', color: '#f0a030', cores: ['snes9x'], art: 'Nintendo - Super Nintendo Entertainment System', exts: ['sfc', 'smc', 'swc', 'fig', 'bs', 'st'], players: 2 },
  n64:  { group: 'Nintendo', label: 'Nintendo 64', short: 'N64', color: '#3aa356', cores: ['mupen64plus_next', 'parallel_n64'], art: 'Nintendo - Nintendo 64', exts: ['n64', 'v64', 'z64', 'ndd'], players: 4, analog: true, heavy: true,
          hint: 'Z = L2/ZL, C-buttons = right stick, analog stick = left stick.' },
  nds:  { group: 'Nintendo', label: 'Nintendo DS', short: 'DS', color: '#2fb6c9', cores: ['desmume2015', 'melonds'], art: 'Nintendo - Nintendo DS', exts: ['nds'], players: 1,
          bios: { mode: 'extract', files: [f('bios7.bin', OPT, 'ARM7 BIOS', 'df692a80a5b1bc90728bc3dfc76cd948'), f('bios9.bin', OPT, 'ARM9 BIOS', 'a392174eb3e572fed6447e956bde4b25'), f('firmware.bin', OPT, 'NDS firmware (dump from your console)')], note: 'Only melonDS uses these (it has a built-in replacement without them). DeSmuME 2015 needs none.' } },
  vb:   { group: 'Nintendo', label: 'Virtual Boy', short: 'VB', color: '#d81f26', cores: ['beetle_vb'], art: 'Nintendo - Virtual Boy', exts: ['vb', 'vboy'], players: 1 },

  // ---- Sony
  psx:  { group: 'Sony', label: 'PlayStation', short: 'PS1', color: '#6b78d6', cores: ['pcsx_rearmed', 'mednafen_psx_hw'], art: 'Sony - PlayStation', exts: ['mdf', 'toc', 'cbn'], players: 2, analog: true, heavy: true,
          bios: { mode: 'extract', files: [f('scph5501.bin', REC, 'US', '490f666e1afb15b7362b406ed1cea246'), f('scph5500.bin', REC, 'Japan', '8dd7d5296a650fac7319bce665a6a53c'), f('scph5502.bin', REC, 'Europe', '32736f17079d0b2b7024407c39bd3050'), f('scph1001.bin', OPT, 'US v2.0'), f('psxonpsp660.bin', OPT, 'PSP-extracted PS1 BIOS', 'c53ca5908936d412331790f4426c6c33')],
                  note: 'PCSX ReARMed runs most games without a BIOS (built-in HLE) but a real BIOS is more compatible. Beetle PSX HW requires one.' },
          hint: 'Multi-disc games: add a .m3u playlist or one .cue per disc. L2/R2 = triggers, analog sticks supported.' },
  psp:  { group: 'Sony', label: 'PlayStation Portable', short: 'PSP', color: '#222a4a', cores: ['ppsspp'], art: 'Sony - PlayStation Portable', exts: ['cso', 'prx', 'elf'], players: 1, analog: true, heavy: true,
          hint: 'Needs threads + WebGL2 (the app turns on cross-origin isolation automatically).' },

  // ---- Sega
  sms:  { group: 'Sega', label: 'Master System', short: 'SMS', color: '#2a6fdb', cores: ['smsplus', 'genesis_plus_gx', 'picodrive'], art: 'Sega - Master System - Mark III', exts: ['sms'], players: 2 },
  gg:   { group: 'Sega', label: 'Game Gear', short: 'GG', color: '#2b3a67', cores: ['genesis_plus_gx', 'smsplus'], art: 'Sega - Game Gear', exts: ['gg'], players: 1 },
  sg1000: { group: 'Sega', label: 'SG-1000', short: 'SG-1000', color: '#4a6fa5', cores: ['genesis_plus_gx', 'smsplus'], art: 'Sega - SG-1000', exts: ['sg'], players: 2 },
  md:   { group: 'Sega', label: 'Genesis / Mega Drive', short: 'MD', color: '#1b1b1b', cores: ['genesis_plus_gx', 'picodrive'], art: 'Sega - Mega Drive - Genesis', exts: ['md', 'smd', 'gen', 'mdx', '68k', 'sgd', 'bms'], players: 2 },
  scd:  { group: 'Sega', label: 'Sega CD / Mega-CD', short: 'SCD', color: '#7a2a8f', cores: ['genesis_plus_gx', 'picodrive'], art: 'Sega - Mega-CD - Sega CD', exts: [], players: 2, heavy: false,
          bios: { mode: 'extract', files: [f('bios_CD_U.bin', R, 'US / Sega CD', '2efd74e3232ff260e371b99f84024f7f'), f('bios_CD_E.bin', R, 'Europe / Mega-CD', 'e66fa1dc5820d254611fdcdba0662372'), f('bios_CD_J.bin', R, 'Japan / Mega-CD', '278a9397d192149e84e820ac621a8edd')], note: 'Upload the one matching your game region.' } },
  s32x: { group: 'Sega', label: 'Sega 32X', short: '32X', color: '#c0392b', cores: ['picodrive'], art: 'Sega - 32X', exts: ['32x'], players: 2 },
  saturn: { group: 'Sega', label: 'Sega Saturn', short: 'SAT', color: '#3b5b92', cores: ['yabause'], art: 'Sega - Saturn', exts: ['mds'], players: 2, heavy: true,
          bios: { mode: 'extract', files: [f('saturn_bios.bin', REC, 'Saturn BIOS (any region)', 'af5828fdff51384f99b3c4926be27762')], note: 'Yabause has an HLE BIOS but most games need the real one.' },
          hint: 'Digital pad: A/B/C = ✕/○/□-style face buttons, X/Y/Z = Y/X + R. Saturn emulation is very heavy.' },

  // ---- Atari
  a2600: { group: 'Atari', label: 'Atari 2600', short: '2600', color: '#a8531a', cores: ['stella2014'], art: 'Atari - 2600', exts: ['a26'], players: 2,
          hint: 'Select = Game Select, Start = Reset.' },
  a5200: { group: 'Atari', label: 'Atari 5200', short: '5200', color: '#8c6d3f', cores: ['a5200'], art: 'Atari - 5200', exts: ['a52'], players: 2,
          bios: { mode: 'extract', files: [f('5200.rom', OPT, 'the core has a built-in open replacement (AltirraOS)', '281f20ea4320404ec820fb7ec0693b38')] } },
  a7800: { group: 'Atari', label: 'Atari 7800', short: '7800', color: '#b5651d', cores: ['prosystem'], art: 'Atari - 7800', exts: ['a78'], players: 2,
          bios: { mode: 'extract', files: [f('7800 BIOS (U).rom', OPT, 'US', '0763f1ffb006ddbe32e52d497ee848ae'), f('7800 BIOS (E).rom', OPT, 'Europe')] } },
  lynx:  { group: 'Atari', label: 'Atari Lynx', short: 'LYNX', color: '#d9a21b', cores: ['handy'], art: 'Atari - Lynx', exts: ['lnx'], players: 1,
          bios: { mode: 'extract', files: [f('lynxboot.img', REC, '', 'fcd403db69f54290b51035d82f835e7b')] } },
  jaguar: { group: 'Atari', label: 'Atari Jaguar', short: 'JAG', color: '#b3262e', cores: ['virtualjaguar'], art: 'Atari - Jaguar', exts: ['j64', 'jag', 'abs', 'cof'], players: 2 },

  // ---- SNK / NEC / Bandai / others
  ngp:  { group: 'SNK', label: 'Neo Geo Pocket', short: 'NGP', color: '#c4364a', cores: ['mednafen_ngp'], art: 'SNK - Neo Geo Pocket', exts: ['ngp'], players: 1 },
  ngpc: { group: 'SNK', label: 'Neo Geo Pocket Color', short: 'NGPC', color: '#e0457b', cores: ['mednafen_ngp'], art: 'SNK - Neo Geo Pocket Color', exts: ['ngc'], players: 1 },
  neogeo: { group: 'SNK', label: 'Neo Geo (AES/MVS)', short: 'NEOGEO', color: '#d4a017', cores: ['fbneo'], art: 'SNK - Neo Geo', exts: [], players: 2, archive: 'zip',
          bios: { mode: 'raw', files: [f('neogeo.zip', R, 'Neo Geo BIOS set (a ZIP, upload it as-is)')] },
          hint: 'Select = Coin, Start = Start. Games are the usual FBNeo/MAME .zip sets.' },
  pce:  { group: 'NEC', label: 'PC Engine / TurboGrafx-16', short: 'PCE', color: '#e8772e', cores: ['mednafen_pce'], art: 'NEC - PC Engine - TurboGrafx 16', exts: ['pce'], players: 2 },
  pcecd: { group: 'NEC', label: 'PC Engine CD / TurboGrafx-CD', short: 'PCE-CD', color: '#d9622b', cores: ['mednafen_pce'], art: 'NEC - PC Engine CD - TurboGrafx-CD', exts: [], players: 2, heavy: false,
          bios: { mode: 'extract', files: [f('syscard3.pce', R, 'Super System Card 3.0', '38179df8f4ac870017db21ebcbf53114'), f('syscard2.pce', OPT, 'CD-ROM System V2'), f('syscard1.pce', OPT, 'CD-ROM System V1'), f('gexpress.pce', OPT, 'Game Express CD card')] } },
  pcfx: { group: 'NEC', label: 'PC-FX', short: 'PC-FX', color: '#9a3b5a', cores: ['mednafen_pcfx'], art: 'NEC - PC-FX', exts: [], players: 2,
          bios: { mode: 'extract', files: [f('pcfx.rom', R, 'PC-FX BIOS v1.00', '08e36edbea28a017f79f8d4f7ff9b6d7')] } },
  ws:   { group: 'Bandai', label: 'WonderSwan', short: 'WS', color: '#1d8f8a', cores: ['mednafen_wswan'], art: 'Bandai - WonderSwan', exts: ['ws', 'pc2'], players: 1 },
  wsc:  { group: 'Bandai', label: 'WonderSwan Color', short: 'WSC', color: '#26b0a8', cores: ['mednafen_wswan'], art: 'Bandai - WonderSwan Color', exts: ['wsc'], players: 1 },
  threedo: { group: 'Other', label: '3DO', short: '3DO', color: '#c97b12', cores: ['opera'], art: 'The 3DO Company - 3DO', exts: [], players: 2, heavy: true,
          bios: { mode: 'extract', files: [f('panafz10.bin', R, 'Panasonic FZ-10', '51f2f43ae2f3508a14d9f56597e2d3ce'), f('panafz1.bin', OPT, 'Panasonic FZ-1', 'f47264dd47fe30f73ab3c010015c155b'), f('goldstar.bin', OPT, 'Goldstar GDO-101M', '8639fd5e549bd6238cfee79e3e749114'), f('sanyotry.bin', OPT, 'Sanyo TRY IMP-21J', '35fa1a1ebaaeea286dc5cd15487c13ea')] } },
  coleco: { group: 'Other', label: 'ColecoVision', short: 'COLECO', color: '#2d62a8', cores: ['gearcoleco'], art: 'Coleco - ColecoVision', exts: ['col', 'cv'], players: 2,
          bios: { mode: 'extract', files: [f('colecovision.rom', R, 'ColecoVision / ADAM OS-7', '2c66f5911e5b42b8ebe113403548eee7'), f('eos.rom', OPT, 'only for ADAM', '01df3140909f09aa9aac4f88890f676c'), f('writer.rom', OPT, 'only for ADAM (SmartWriter)', '4fe4f6800076ea3d897d4285653447bd')] } },
  cdi:  { group: 'Other', label: 'Philips CD-i', short: 'CD-i', color: '#5a5a5a', cores: ['same_cdi'], art: 'Philips - CD-i', exts: [], players: 1, heavy: true, experimental: true,
          bios: { mode: 'raw', files: [f('cdimono1.zip', R, 'MAME cdimono1 BIOS set (a ZIP, upload as-is)')] } },

  // ---- Computers
  c64:  { group: 'Computers', label: 'Commodore 64', short: 'C64', color: '#5f67b0', cores: ['vice_x64sc', 'vice_x64'], art: 'Commodore - 64', exts: ['d64', 'd71', 'd81', 't64', 'prg', 'p00', 'crt', 'tcrt', 'g64', 'x64', 'nib', 'd6z', 'd7z', 'd8z', 'g6z', 'x6z'], players: 2,
          hint: 'Joystick only on mobile; a physical keyboard works on desktop. Auto-starts disks/tapes.' },
  c128: { group: 'Computers', label: 'Commodore 128', short: 'C128', color: '#6a7bbf', cores: ['vice_x128'], art: 'Commodore - 64', exts: [], players: 2, experimental: true },
  vic20: { group: 'Computers', label: 'Commodore VIC-20', short: 'VIC20', color: '#8a7ad0', cores: ['vice_xvic'], art: 'Commodore - VIC-20', exts: [], players: 2 },
  pet:  { group: 'Computers', label: 'Commodore PET', short: 'PET', color: '#7e8a6a', cores: ['vice_xpet'], art: 'Commodore - PET', exts: [], players: 1, experimental: true },
  plus4: { group: 'Computers', label: 'Commodore Plus/4', short: '+4', color: '#6d8fa8', cores: ['vice_xplus4'], art: 'Commodore - Plus-4', exts: [], players: 2 },
  amiga: { group: 'Computers', label: 'Commodore Amiga', short: 'AMIGA', color: '#d0502a', cores: ['puae'], art: 'Commodore - Amiga', exts: ['adf', 'adz', 'dms', 'fdi', 'ipf', 'hdf', 'hdz', 'lha', 'uae', 'slave', 'nrg'], players: 2,
          bios: { mode: 'extract', files: [f('kick34005.A500', REC, 'Kickstart 1.3', '82a21c1890cae844b3df741f2762d48d'), f('kick37175.A500', REC, 'Kickstart 2.04', 'dc10d7bdd1b6f450773dfb558477c230'), f('kick40063.A600', REC, 'Kickstart 3.1 (A600)', 'e40a5dfb3d017ba8779faba30cbd1c8e'), f('kick40068.A1200', OPT, 'Kickstart 3.1 (A1200)', '646773759326fbac3b2311fd8c8793ee')],
                  note: 'PUAE contains the free AROS Kickstart replacement (Retro Pocket selects it automatically while no Kickstart is stored), but many games only run with a real Kickstart.' },
          hint: 'Mouse/keyboard-centric: joystick games work best. Keyboard on desktop.' },
  zx:   { group: 'Computers', label: 'ZX Spectrum', short: 'ZX', color: '#b02f2f', cores: ['fuse'], art: 'Sinclair - ZX Spectrum', exts: ['z80', 'rzx', 'scl', 'trd'], players: 1, experimental: true },
  zx81: { group: 'Computers', label: 'ZX81', short: 'ZX81', color: '#444444', cores: ['81'], art: 'Sinclair - ZX 81', exts: ['t81', 'p'], players: 1, experimental: true },
  cpc:  { group: 'Computers', label: 'Amstrad CPC', short: 'CPC', color: '#2f7d4f', cores: ['cap32', 'crocods'], art: 'Amstrad - CPC', exts: ['dsk', 'sna', 'cdt', 'cpr', 'kcr'], players: 1, experimental: true },
  dos:  { group: 'Computers', label: 'DOS', short: 'DOS', color: '#3d3d3d', cores: ['dosbox_pure'], art: 'DOS', exts: ['conf', 'com', 'bat', 'dosz'], players: 1, heavy: true, experimental: true, archive: 'zip',
          hint: 'Add a game as a .zip (a DOS game folder zipped) or a single .exe/.com/.bat. Needs threads (enabled automatically).' },
  doom: { group: 'Computers', label: 'Doom (PrBoom)', short: 'DOOM', color: '#8a1c1c', cores: ['prboom'], art: 'DOOM', exts: ['wad', 'iwad', 'pwad'], players: 1, experimental: true,
          hint: 'Add your own IWAD (doom.wad, doom2.wad, freedoom…). Not included.' },

  // ---- Arcade
  arcade: { group: 'Arcade', label: 'Arcade (FinalBurn Neo)', short: 'ARCADE', color: '#e0662b', cores: ['fbneo', 'fbalpha2012_cps1', 'fbalpha2012_cps2'], art: 'FBNeo - Arcade Games', exts: [], players: 4, archive: 'zip', biosFrom: 'neogeo',
          hint: 'Select = Coin, Start = Start. Use the exact ROM-set .zip for FBNeo (needs matching version of the set).' },
  mame: { group: 'Arcade', label: 'Arcade (MAME 2003+)', short: 'MAME', color: '#c24a1c', cores: ['mame2003_plus', 'mame2003'], art: 'MAME', exts: [], players: 4, archive: 'zip', biosFrom: 'neogeo',
          hint: 'Select = Coin, Start = Start. Use ROM sets matching MAME 0.78 / 2003-Plus.' },
};

/** Display order of groups (chips / system picker). */
export const GROUPS = ['Nintendo', 'Sony', 'Sega', 'Atari', 'SNK', 'NEC', 'Bandai', 'Other', 'Computers', 'Arcade'];

/** Cores that need SharedArrayBuffer (EmulatorJS `requiresThreads`) and cores that need WebGL2. */
export const THREAD_CORES = ['ppsspp', 'dosbox_pure'];
export const needsThreads = (core) => THREAD_CORES.includes(core);

export const CORE_LABELS = {
  gambatte: 'Gambatte (accurate GB/GBC)', mgba: 'mGBA (GB/GBC/GBA)',
  fceumm: 'FCEUmm (fast NES)', nestopia: 'Nestopia (accurate NES)',
  snes9x: 'Snes9x (SNES)',
  desmume2015: 'DeSmuME 2015 (faster, best for phones)', melonds: 'melonDS (more accurate, heavier)',
  mupen64plus_next: 'Mupen64Plus-Next (accurate)', parallel_n64: 'ParaLLEl N64 (lighter, older)',
  pcsx_rearmed: 'PCSX ReARMed (fast, runs without BIOS)', mednafen_psx_hw: 'Beetle PSX HW (accurate, needs BIOS + WebGL2)',
  ppsspp: 'PPSSPP (PSP)',
  smsplus: 'SMS Plus GX (Master System / Game Gear)', genesis_plus_gx: 'Genesis Plus GX (accurate Sega 8/16-bit + CD)', picodrive: 'PicoDrive (fast, Mega Drive / CD / 32X)',
  yabause: 'Yabause (Saturn)',
  stella2014: 'Stella 2014 (Atari 2600)', a5200: 'a5200 (Atari 5200)', prosystem: 'ProSystem (Atari 7800)', handy: 'Handy (Atari Lynx)', virtualjaguar: 'Virtual Jaguar (Atari Jaguar)',
  mednafen_ngp: 'Beetle NeoGeo Pocket', mednafen_pce: 'Beetle PCE (PC Engine / CD)', mednafen_pcfx: 'Beetle PC-FX', mednafen_wswan: 'Beetle WonderSwan', beetle_vb: 'Beetle VB (Virtual Boy)',
  opera: 'Opera (3DO)', gearcoleco: 'Gearcoleco (ColecoVision)', same_cdi: 'SAME_CDi (Philips CD-i, experimental)',
  vice_x64sc: 'VICE x64sc (accurate C64)', vice_x64: 'VICE x64 (fast C64)', vice_x128: 'VICE x128 (C128)', vice_xvic: 'VICE xvic (VIC-20)', vice_xpet: 'VICE xpet (PET)', vice_xplus4: 'VICE xplus4 (Plus/4)',
  puae: 'PUAE (Amiga)', fuse: 'Fuse (ZX Spectrum)', '81': 'EightyOne (ZX81)', cap32: 'Caprice32 (Amstrad CPC)', crocods: 'CrocoDS (Amstrad CPC)',
  dosbox_pure: 'DOSBox Pure (DOS)', prboom: 'PrBoom (Doom)',
  fbneo: 'FinalBurn Neo (arcade)', fbalpha2012_cps1: 'FB Alpha 2012 CPS-1', fbalpha2012_cps2: 'FB Alpha 2012 CPS-2',
  mame2003_plus: 'MAME 2003-Plus (arcade)', mame2003: 'MAME 2003 (arcade)',
};

/* ---------------- extensions ---------------- */
export const EXT_TO_SYSTEM = {};
for (const [k, s] of Object.entries(SYSTEMS)) for (const e of s.exts) EXT_TO_SYSTEM[e] = k;

/** Ambiguous extensions -> the systems that can use them (a picker is shown; content sniffing pre-selects the likely one). */
export const AMBIGUOUS = {
  bin: ['md', 'sms', 'a2600', 'a5200', 'a7800', 'coleco', 'jaguar', 'n64', 'vb', 'pce', 'psx', 'scd', 'saturn', 'pcecd', 'threedo'],
  rom: ['coleco', 'a5200', 'jaguar', 'a7800', 'sms'],
  iso: ['psx', 'psp', 'scd', 'saturn', 'threedo', 'pcecd', 'pcfx', 'cdi', 'md', 'amiga', 'dos'],
  cue: ['psx', 'scd', 'saturn', 'threedo', 'pcecd', 'pcfx', 'cdi', 'amiga', 'md'],
  chd: ['psx', 'psp', 'scd', 'saturn', 'threedo', 'pcecd', 'pcfx', 'cdi', 'amiga'],
  ccd: ['psx', 'saturn', 'pcecd', 'pcfx', 'amiga'],
  m3u: ['psx', 'saturn', 'scd', 'pcecd', 'amiga', 'cpc', 'c64'],
  pbp: ['psp', 'psx'],
  exe: ['dos', 'psx'],
  zip: ['arcade', 'neogeo', 'mame', 'dos', 'a2600', 'amiga', 'saturn', 'cpc'],
  '7z': ['arcade', 'neogeo', 'mame', 'amiga', 'dos'],
  gz: ['c64'],
  tap: ['zx', 'c64', 'cpc'],
  tzx: ['zx', 'zx81'],
  img: ['psx', 'pcecd', 'amiga'],
};

export const sortedSystemKeys = () => Object.keys(SYSTEMS).sort((a, b) => GROUPS.indexOf(SYSTEMS[a].group) - GROUPS.indexOf(SYSTEMS[b].group));

export function extOf(name) {
  const m = /\.([^.\/\\]+)$/.exec(name || '');
  return m ? m[1].toLowerCase() : '';
}
/** Single system for a file name, or null when unknown or ambiguous. */
export function systemFor(name) { return EXT_TO_SYSTEM[extOf(name)] || null; }
/** Candidate systems for an ambiguous/unknown file name (empty = every system). */
export function candidatesFor(name) { return AMBIGUOUS[extOf(name)] || []; }
export function titleFrom(name) {
  return (name || 'Untitled').replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ')
    .replace(/\s*[\(\[][^\)\]]*[\)\]]/g, '').replace(/\s+/g, ' ').trim() || name;
}

/* ---------------- settings / default cores ---------------- */
export const DEFAULT_SETTINGS = { gbCore: 'gambatte', nesCore: 'nestopia', dsCore: 'desmume2015', cores: {}, autoResume: true, v: 3 };

const isiOS = () => typeof navigator !== 'undefined' && (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

/** The other core of a system (used for crash fallback), or null when there is only one. */
export function altCore(system, core) {
  const list = (SYSTEMS[system] || {}).cores || [];
  return list.find((c) => c !== core) || null;
}
export function defaultCore(system, settings = DEFAULT_SETTINGS) {
  const s = SYSTEMS[system]; if (!s) return 'snes9x';
  const pick = settings.cores && settings.cores[system];
  if (pick && s.cores.includes(pick)) return pick;
  if ((system === 'gb' || system === 'gbc') && s.cores.includes(settings.gbCore)) return settings.gbCore;
  if (system === 'nes' && s.cores.includes(settings.nesCore)) return settings.nesCore;
  if (system === 'nds' && s.cores.includes(settings.dsCore)) return settings.dsCore;
  if (system === 'n64' && isiOS()) return 'parallel_n64';             // EmulatorJS itself prefers ParaLLEl N64 on iOS Safari (memory)
  return s.cores[0];
}
export function loadSettings() {
  try {
    const s = { ...DEFAULT_SETTINGS, cores: {}, ...JSON.parse(localStorage.getItem('rp.settings') || '{}') };
    let dirty = false;
    if (!s.v || s.v < 2) { s.nesCore = 'nestopia'; dirty = true; }   // v2: NES default moved to Nestopia (more stable)
    if (!s.v || s.v < 3) { s.cores = s.cores || {}; dirty = true; }
    if (dirty) { s.v = 3; saveSettings(s); }
    return s;
  } catch { return { ...DEFAULT_SETTINGS, cores: {} }; }
}
export function saveSettings(s) { localStorage.setItem('rp.settings', JSON.stringify(s)); }
