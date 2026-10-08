/**
 * Real Chromium smoke and scripted play session.
 * Usage: npm install && npx playwright install chromium firefox webkit && npm run smoke
 * All screenshots go under this repository's test-results/ directory.
 */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { chromium, firefox, webkit } from 'playwright';

const require = createRequire(import.meta.url);
const axeScript = require.resolve('axe-core/axe.min.js');
const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const output = resolve(root, 'test-results');
await mkdir(output, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const path = resolve(root, '.' + pathname);
    if (!path.startsWith(root + sep)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const bytes = await readFile(path);
    response.writeHead(200, {
      'Content-Type': MIME[extname(path)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    }).end(bytes);
  } catch {
    response.writeHead(404).end('Not found');
  }
});

await new Promise((accept) => server.listen(0, '127.0.0.1', accept));
const url = 'http://127.0.0.1:' + server.address().port + '/';
let browser;
const errors = [];
const externalRequests = [];
function watchNetwork(page, name) {
  page.on('request', (request) => {
    const endpoint = request.url();
    if (/^https?:\/\//.test(endpoint) && new URL(endpoint).origin !== new URL(url).origin) {
      externalRequests.push(name + ': ' + endpoint);
    }
  });
}
const snapshot = (page) => page.evaluate(() => window.__STRIKELINE_DIAGNOSTICS__.snapshot());
const waitBoot = (page) => page.waitForFunction(
  () => typeof window.__STRIKELINE_DIAGNOSTICS__?.snapshot === 'function',
  null, { timeout: 20000 },
);
const delay = (ms) => new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
async function auditAccessibility(page, label) {
  await page.addScriptTag({ path: axeScript });
  const results = await page.evaluate(async () => {
    const report = await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
    });
    return report.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      elements: v.nodes.map((n) => n.target.join(' ')).slice(0, 8),
    }));
  });
  assert.equal(results.length, 0, label + ' WCAG audit: ' + JSON.stringify(results));
  console.log('PASS ' + label + ' axe-core WCAG 2.1 AA automated audit');
}

const waitPlaying = (page) => page.waitForFunction(
  () => window.__STRIKELINE_DIAGNOSTICS__?.snapshot().phase === 'playing',
  null, { timeout: 6000 },
);

try {
  browser = await chromium.launch({ headless: true });
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  watchNetwork(desktop, 'desktop');
  desktop.on('pageerror', (error) => errors.push('desktop: ' + error.message));
  desktop.on('console', (message) => { if (message.type() === 'error') errors.push('desktop console: ' + message.text()); });

  const response = await desktop.goto(url, { waitUntil: 'networkidle' });
  await waitBoot(desktop);
  assert.equal(response.status(), 200);
  assert.match(await desktop.title(), /STRIKELINE/);
  assert.equal(await desktop.locator('#game-canvas').count(), 1);
  assert.equal((await snapshot(desktop)).phase, 'idle');
  await desktop.screenshot({ path: resolve(output, '01-desktop-home.png'), fullPage: true });
  await auditAccessibility(desktop, 'desktop');
  console.log('PASS desktop page loads and initial screenshot captured');

  await desktop.keyboard.press('Enter');
  await waitPlaying(desktop);
  const beforeUp = (await snapshot(desktop)).paddles.left.y;
  await desktop.keyboard.down('w');
  await delay(260);
  await desktop.keyboard.up('w');
  const afterUp = (await snapshot(desktop)).paddles.left.y;
  assert(afterUp < beforeUp - 25, 'W should move player paddle upward');
  console.log('PASS keyboard input moves left paddle:', beforeUp.toFixed(1), '->', afterUp.toFixed(1));

  await desktop.locator('#pause-button').click();
  const paused = await snapshot(desktop);
  assert.equal(paused.phase, 'paused');
  await delay(220);
  assert.deepEqual((await snapshot(desktop)).ball, paused.ball, 'pause must freeze ball coordinates');
  await desktop.locator('#primary-action').click();
  assert.equal((await snapshot(desktop)).phase, 'playing');
  console.log('PASS pause preserves ball, and resume works');

  await desktop.locator('[data-mode="local"]').click();
  assert.equal((await snapshot(desktop)).mode, 'local');
  assert.equal((await snapshot(desktop)).phase, 'idle');
  assert.equal(await desktop.locator('[data-difficulty="legend"]').isDisabled(), true);
  await desktop.locator('#primary-action').click();
  await waitPlaying(desktop);
  const beforeRight = (await snapshot(desktop)).paddles.right.y;
  await desktop.keyboard.down('ArrowDown');
  await delay(260);
  await desktop.keyboard.up('ArrowDown');
  const afterRight = (await snapshot(desktop)).paddles.right.y;
  assert(afterRight > beforeRight + 25, 'ArrowDown should move right paddle in local mode');
  await desktop.screenshot({ path: resolve(output, '02-desktop-duel.png'), fullPage: true });
  console.log('PASS local two-player arrow controls and screenshot');

  await desktop.locator('[data-mode="cpu"]').click();
  await desktop.locator('[data-difficulty="rookie"]').click();
  assert.equal((await snapshot(desktop)).difficulty, 'rookie');
  await desktop.locator('#sound-button').click();
  assert.equal((await snapshot(desktop)).sound, false);
  await desktop.locator('#motion-button').click();
  assert.equal((await snapshot(desktop)).effects, false);
  await desktop.locator('#motion-button').click();
  assert.equal((await snapshot(desktop)).effects, true);
  console.log('PASS mode, difficulty, sound and effects settings');
  await desktop.reload({ waitUntil: 'networkidle' });
  await waitBoot(desktop);
  const persisted = await snapshot(desktop);
  assert.equal(persisted.mode, 'cpu');
  assert.equal(persisted.difficulty, 'rookie');
  assert.equal(persisted.sound, false);
  assert.equal(persisted.effects, true);
  assert.equal(persisted.phase, 'idle');
  console.log('PASS persisted user preferences after reload');

  // An automated paddle controller *plays* the game in a real browser.
  await desktop.locator('#primary-action').click();
  await waitPlaying(desktop);
  const board = desktop.locator('#game-canvas');
  await board.scrollIntoViewIfNeeded();
  const box = await board.boundingBox();
  let peakRally = 0;
  let tracked = 0;
  for (let i = 0; i < 190; i++) {
    const state = await snapshot(desktop);
    if (state.phase === 'gameover') break;
    const ball = state.ball;
    const y = Math.min(0.96, Math.max(0.04, ball.y / 540));
    await desktop.mouse.move(box.x + box.width * 0.15, box.y + box.height * y);
    await delay(40);
    peakRally = Math.max(peakRally, state.rally, state.bestRally);
    tracked++;
  }
  const postPlay = await snapshot(desktop);
  assert(tracked >= 60, 'scripted session should interact for several seconds');
  assert(postPlay.elapsed > 2, 'game physics must make progress');
  await desktop.screenshot({ path: resolve(output, '03-desktop-played.png'), fullPage: true });
  console.log('PASS scripted Chromium game session', JSON.stringify({ tracked, peakRally, elapsed: Math.round(postPlay.elapsed), score: postPlay.score }));

  await desktop.keyboard.press('r');
  const restarted = await snapshot(desktop);
  assert.equal(restarted.phase, 'ready', 'R must immediately restart into serve countdown');
  assert.deepEqual(restarted.score, { left: 0, right: 0 });
  await waitPlaying(desktop);
  console.log('PASS instant keyboard restart and score reset');
  await desktop.keyboard.press('p');
  assert.equal((await snapshot(desktop)).phase, 'paused');
  await desktop.keyboard.press('Space');
  assert.equal((await snapshot(desktop)).phase, 'playing');
  console.log('PASS P and Space hotkeys');

  // Real complete match in Chromium. Park opposite paddles so rallies terminate
  // naturally, then verify the final-score overlay and the rematch contract.
  await desktop.locator('[data-mode="local"]').click();
  await desktop.locator('#primary-action').click();
  await waitPlaying(desktop);
  await desktop.keyboard.down('w');
  await desktop.keyboard.down('ArrowDown');
  await desktop.waitForFunction(
    () => window.__STRIKELINE_DIAGNOSTICS__?.snapshot().phase === 'gameover',
    null,
    { timeout: 100000, polling: 500 },
  );
  await desktop.keyboard.up('w');
  await desktop.keyboard.up('ArrowDown');
  const finished = await snapshot(desktop);
  assert.equal(finished.phase, 'gameover');
  assert(
    Math.max(finished.score.left, finished.score.right) >= 7 &&
    Math.max(finished.score.left, finished.score.right) <= 11,
    'a complete match must finish on a valid score',
  );
  assert.equal(await desktop.locator('#primary-action-label').innerText(), 'PLAY AGAIN');
  await desktop.waitForTimeout(350); // Let the end-of-match overlay finish its entry animation.
  await desktop.screenshot({ path: resolve(output, '03b-desktop-final-score.png'), fullPage: true });
  await auditAccessibility(desktop, 'game-over');
  await desktop.locator('#primary-action').click();
  const rematch = await snapshot(desktop);
  assert.equal(rematch.phase, 'ready');
  assert.deepEqual(rematch.score, { left: 0, right: 0 });
  console.log('PASS complete in-browser match and rematch', JSON.stringify({ finalScore: finished.score, winner: finished.score.left > finished.score.right ? 'left' : 'right' }));


  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  });
  const mobile = await mobileContext.newPage();
  watchNetwork(mobile, 'mobile');
  mobile.on('pageerror', (error) => errors.push('mobile: ' + error.message));
  mobile.on('console', (message) => { if (message.type() === 'error') errors.push('mobile console: ' + message.text()); });
  await mobile.goto(url, { waitUntil: 'networkidle' });
  await waitBoot(mobile);
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow < 3, 'mobile page must not have horizontal scrolling: ' + overflow);
  await mobile.screenshot({ path: resolve(output, '04-mobile-home.png'), fullPage: true });
  await auditAccessibility(mobile, 'mobile');
  await mobile.locator('#primary-action').click();
  await waitPlaying(mobile);
  await mobile.locator('#game-canvas').scrollIntoViewIfNeeded();
  const mobileBox = await mobile.locator('#game-canvas').boundingBox();
  const touchX = mobileBox.x + mobileBox.width * 0.15;
  const touchY = mobileBox.y + mobileBox.height * .90;
  const beforeTouch = (await snapshot(mobile)).paddles.left.y;
  const cdp = await mobileContext.newCDPSession(mobile);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: touchX, y: touchY, id: 1 }] });
  await delay(350);
  const afterTouch = (await snapshot(mobile)).paddles.left.y;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert(afterTouch > beforeTouch + 25, 'touch must move paddle down');
  await mobile.screenshot({ path: resolve(output, '05-mobile-play.png'), fullPage: true });
  console.log('PASS mobile layout (no sideways scroll), real touch input and screenshots');

  // Two people must be able to touch separate sides *simultaneously*.
  await mobile.locator('[data-mode="local"]').click();
  await mobile.locator('#primary-action').click();
  await waitPlaying(mobile);
  await mobile.locator('#game-canvas').scrollIntoViewIfNeeded();
  const duelBox = await mobile.locator('#game-canvas').boundingBox();
  const pairBefore = await snapshot(mobile);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [
      { id: 11, x: duelBox.x + duelBox.width * .15, y: duelBox.y + duelBox.height * .1 },
      { id: 12, x: duelBox.x + duelBox.width * .85, y: duelBox.y + duelBox.height * .9 },
    ],
  });
  await delay(320);
  const pairAfter = await snapshot(mobile);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert(pairAfter.paddles.left.y < pairBefore.paddles.left.y - 15, 'first touch should move left paddle up');
  assert(pairAfter.paddles.right.y > pairBefore.paddles.right.y + 15, 'second touch should move right paddle down');
  console.log('PASS simultaneous two-player multi-touch');

  await mobile.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal((await snapshot(mobile)).effects, false, 'OS reduced-motion preference must suppress effects');
  await mobile.locator('#motion-button[aria-pressed="false"]').waitFor({ state: 'visible', timeout: 5000 });
  assert.equal(await mobile.locator('#motion-button').getAttribute('aria-pressed'), 'false');
  assert.equal(await mobile.locator('#motion-button').isDisabled(), true);
  console.log('PASS OS reduced-motion preference and accurate disabled controls');
  await mobile.setViewportSize({ width: 844, height: 390 });
  const landscapeOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(landscapeOverflow < 3, 'mobile landscape must not scroll horizontally: ' + landscapeOverflow);
  await mobile.screenshot({ path: resolve(output, '05b-mobile-landscape.png'), fullPage: true });
  console.log('PASS responsive 844px mobile landscape and screenshot');

  const tinyContext = await browser.newContext({ viewport: { width: 320, height: 740 }, deviceScaleFactor: 1 });
  const tiny = await tinyContext.newPage();
  watchNetwork(tiny, 'narrow-phone');
  tiny.on('pageerror', (error) => errors.push('tiny: ' + error.message));
  await tiny.goto(url, { waitUntil: 'networkidle' });
  await waitBoot(tiny);
  const tinyOverflow = await tiny.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(tinyOverflow < 3, '320px viewport must not scroll horizontally: ' + tinyOverflow);
  await tiny.screenshot({ path: resolve(output, '06-small-phone.png'), fullPage: true });
  await tinyContext.close();
  console.log('PASS narrow 320px viewport and screenshot');

  // Cover Firefox and Safari's rendering engine as well as Chromium.
  for (const [engineName, engine] of [['Firefox', firefox], ['WebKit', webkit]]) {
    const alternate = await engine.launch({ headless: true });
    try {
      const other = await alternate.newPage({ viewport: { width: 1280, height: 800 } });
      watchNetwork(other, engineName);
      other.on('pageerror', (error) => errors.push(engineName + ': ' + error.message));
      await other.goto(url, { waitUntil: 'networkidle' });
      await waitBoot(other);
      assert.equal((await snapshot(other)).phase, 'idle', engineName);
      await other.locator('#primary-action').click();
      await waitPlaying(other);
      const yBefore = (await snapshot(other)).paddles.left.y;
      await other.keyboard.down('w');
      await other.waitForTimeout(210);
      await other.keyboard.up('w');
      const yAfter = (await snapshot(other)).paddles.left.y;
      assert(yAfter < yBefore - 22, engineName + ' keyboard controls must move left paddle');
      await other.locator('#pause-button').click();
      assert.equal((await snapshot(other)).phase, 'paused', engineName);
      await other.waitForTimeout(350); // Avoid photographing an overlay at opacity 0.
      await other.screenshot({ path: resolve(output, '07-' + engineName.toLowerCase() + '.png'), fullPage: true });
      console.log('PASS ' + engineName + ' game boot, playing, pause and screenshot');
    } finally {
      await alternate.close();
    }
  }

  // Focus and labels are part of the interaction contract.
  assert(await desktop.locator('button[aria-pressed]').count() >= 5);
  assert(await desktop.locator('#announcer[aria-live="polite"]').count() === 1);
  assert.equal(errors.length, 0, errors.join('\n'));
  assert.equal(externalRequests.length, 0, externalRequests.join('\n'));
  console.log('PASS accessible toggle semantics, zero page errors, and zero external network requests');
  console.log('SMOKE RESULT: ALL CHECKS PASSED');
} finally {
  if (browser) await browser.close();
  await new Promise((done) => server.close(done));
}
