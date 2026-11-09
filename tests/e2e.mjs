// End-to-end test in headless Chrome: add ROM -> library -> launch EmulatorJS -> start -> exit -> resume.
// Needs network access to cdn.emulatorjs.org, or set EJS_PROXY to a deployed proxy origin. Usage: node tests/e2e.mjs
import puppeteer from 'puppeteer-core';
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const PORT = Number(process.env.PORT || 18000 + Math.floor(Math.random() * 20000)), base = `http://localhost:${PORT}/`;
mkdirSync('tests/fixtures', { recursive: true }); mkdirSync('tests/out', { recursive: true });
execFileSync('python3', ['scripts/make-test-rom.py', 'tests/fixtures/homebrew-test.gb']);
execFileSync('python3', ['scripts/make-test-rom.py', 'tests/fixtures/nes-test.nes']);
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', 'www'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const step = async (n, f) => { try { const v = await f(); console.log('PASS', n, v ?? ''); } catch (e) { failed++; console.log('FAIL', n, '->', e.message); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
await sleep(800);
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: 'new', protocolTimeout: 300000, timeout: 120000, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  if (process.env.EJS_PROXY) await page.evaluateOnNewDocument((proxy) => localStorage.setItem('rp.ejsProxy', proxy), process.env.EJS_PROXY);
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });

  await page.goto(base + 'index.html', { waitUntil: 'networkidle0' });
  await step('empty state visible', async () => assert(await page.$eval('#empty', (e) => !e.hidden)));
  await step('service worker registers + shell cached', async () => {
    await page.evaluate(() => navigator.serviceWorker.ready); await sleep(800);
    const n = await page.evaluate(async () => (await (await caches.open((await caches.keys()).find((k) => k.startsWith('retro-pocket-shell-')))).keys()).length);
    assert(n >= 10, 'cached ' + n); return n + ' files';
  });
  await step('manifest + apple meta', async () => {
    const r = await page.evaluate(async () => ({ m: await (await fetch(document.querySelector('link[rel=manifest]').href)).json(), a: !!document.querySelector('link[rel=apple-touch-icon]'), c: document.querySelector('meta[name=apple-mobile-web-app-capable]').content }));
    assert(r.m.display === 'standalone' && r.a && r.c === 'yes');
  });
  await step('add ROM via file picker', async () => {
    const input = await page.$('#file-input'); await input.uploadFile('tests/fixtures/homebrew-test.gb');
    await page.waitForSelector('.card', { timeout: 5000 });
    const t = await page.$eval('.card .name', (e) => e.textContent); assert(t === 'homebrew-test', t);
    assert(await page.$eval('.badge', (e) => e.textContent) === 'GB');
  });
  await step('duplicate ROM is not added twice', async () => {
    const input = await page.$('#file-input'); await input.uploadFile('tests/fixtures/homebrew-test.gb'); await sleep(600);
    assert((await page.$$('.card')).length === 1);
  });
  await step('library persists after reload', async () => { await page.reload({ waitUntil: 'networkidle0' }); await page.waitForSelector('.card'); });
  await step('launch player (gambatte core) and start game', async () => {
    await page.click('.card'); await page.waitForFunction(() => location.pathname.endsWith('player.html'), { timeout: 8000 });
    await page.waitForSelector('.ejs_start_button', { visible: true, timeout: 90000 });
    await page.click('.ejs_start_button');
    await page.waitForFunction(() => window.EJS_emulator && window.EJS_emulator.started, { timeout: 90000 });
    await sleep(2500);
    const info = await page.evaluate(() => ({ core: window.EJS_emulator.getCore(), data: window.EJS_pathtodata, canvas: !!document.querySelector('canvas'), w: document.querySelector('canvas')?.width }));
    assert(info.core === 'gambatte' && info.canvas, JSON.stringify(info)); await page.screenshot({ path: 'tests/out/player.png' });
    if (process.env.EJS_PROXY) assert(info.data === `${new URL(process.env.EJS_PROXY).origin}/emulatorjs/4.2.3/data/`, info.data);
    return JSON.stringify(info);
  });
  await step('exit saves auto-resume state', async () => {
    await page.evaluate(() => document.getElementById('back').click()); await page.waitForFunction(() => location.pathname.endsWith('index.html'), { timeout: 8000 });
    await page.waitForSelector('.resume', { timeout: 5000 });
    await page.screenshot({ path: 'tests/out/library.png' });
  });
  await step('resume launches with saved state', async () => {
    await page.click('.card'); await page.waitForFunction(() => location.search.includes('resume=1'));
    await page.waitForSelector('.ejs_start_button', { visible: true, timeout: 90000 });
    await page.click('.ejs_start_button');
    await page.waitForFunction(() => window.EJS_emulator && window.EJS_emulator.started, { timeout: 90000 });
  });
  await step('NES ROM auto-detects nestopia (new default) and boots', async () => {
    await page.goto(base + 'index.html', { waitUntil: 'networkidle0' });
    await (await page.$('#file-input')).uploadFile('tests/fixtures/nes-test.nes');
    await page.waitForFunction(() => document.querySelectorAll('.card').length === 2, { timeout: 5000 });
    await page.evaluate(() => [...document.querySelectorAll('.card')].find((c) => c.querySelector('.badge').textContent === 'NES').click());
    await page.waitForSelector('.ejs_start_button', { visible: true, timeout: 90000 });
    await page.click('.ejs_start_button');
    await page.waitForFunction(() => window.EJS_emulator && window.EJS_emulator.started, { timeout: 90000 });
    const core = await page.evaluate(() => window.EJS_emulator.getCore()); assert(core === 'nestopia', core); return core;
  });
  await step('no uncaught JS errors', async () => assert(!errs.length, errs.join(' | ')));
} finally { await browser.close(); srv.kill(); }
process.exit(failed ? 1 : 0);
