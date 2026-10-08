'use strict';

// Real browser acceptance for the authored, read-only strength companion.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const ROOT = path.resolve(__dirname, '..');
const program = JSON.parse(fs.readFileSync(path.join(ROOT, 'plans/tinius-durable-frame-phase-01/program.json'), 'utf8'));
const BASE = (process.env.TINIUS_QA_ORIGIN || 'http://127.0.0.1:8765').replace(/\/$/, '');
const ROUTE = '/plans/tinius-durable-frame-phase-01/';
const OUT = process.env.TINIUS_QA_OUTPUT || '/tmp/tinius-strength-qa';
const SESSIONS = { frame_a: 7, lower_core: 5, frame_b: 8 };
const report = { origin: BASE, scope: 'Browser emulation, not a physical iPhone or native-app check.', cases: [] };
fs.mkdirSync(OUT, { recursive: true });

const hash = (week, key) => '#week-' + week + '-' + key.replaceAll('_', '-');
const panel = (page, week, key) => page.locator(hash(week, key));
function record(name, detail) { report.cases.push({ name, result: 'passed', ...detail }); console.log('PASS ' + name); }
async function open(page, fragment = '') {
  const response = await page.goto(BASE + ROUTE + fragment, { waitUntil: 'load' });
  if (response) assert.equal(response.status(), 200);
  else assert.equal(new URL(page.url()).pathname, ROUTE, 'Same-document fragment navigation');
  await page.evaluate(() => document.fonts.ready);
}
async function selected(page, week, key) {
  await page.waitForFunction(({ week, key }) => {
    const target = document.getElementById('week-' + week + '-' + key.replaceAll('_', '-'));
    return target && target.getClientRects().length && document.getElementById('week-select').value === String(week);
  }, { week, key });
  assert.equal(await page.locator('article[data-session]:visible').count(), 1, 'One readable session at a time');
  assert.equal(await panel(page, week, key).locator('.exercise-list li.exercise').count(), SESSIONS[key]);
  assert.match(await page.locator('[data-session-link="' + key + '"]').getAttribute('aria-current'), /^(page|true|step)$/);
}
async function choose(page, week, key) {
  await page.locator('#week-select').selectOption(String(week));
  await page.locator('[data-week="' + week + '"]').waitFor({ state: 'visible' });
  await page.locator('[data-session-link="' + key + '"]').click();
  await selected(page, week, key);
  assert.equal(new URL(page.url()).hash, hash(week, key));
}
async function overflow(page, name) {
  const width = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth);
  assert.ok(width <= 2, name + ': horizontal overflow ' + width + 'px');
  return width;
}
async function doseSets(page, week, key) {
  return panel(page, week, key).locator('.exercise-dose').evaluateAll(nodes => nodes.map(node => Number(node.textContent.trim().match(/^\d+/)?.[0])));
}
async function recovery(page, week) {
  const text = await panel(page, week, 'lower_core').innerText();
  assert.match(text, /Tuesday|Tuesday’s|Tuesday's/i, 'Thursday explains recovery from Tuesday');
  assert.match(text, /recover|still tired|fresh/i, 'Recovery condition remains visible beside Thursday');
  assert.match(text, /calf/i);
  assert.match(text, /trunk|core/i);
  assert.match(text, /skip/i, 'Full Thursday running does not force full leg strength');
  assert.doesNotMatch(text, /absorbed|absorption|quality budget|lower.body debt|primary running question/i);
}
async function responsive(browser, engine, width) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1, isMobile: width <= 430, hasTouch: width <= 430 });
  const errors = [], broken = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('response', response => { if (response.url().startsWith(BASE + '/') && response.status() >= 400) broken.push(response.url()); });
  try {
    await open(page);
    assert.equal(await page.locator('input[type="checkbox"],input[type="number"],textarea').count(), 0, 'Companion does not simulate filed work');
    for (let week = 1; week <= 6; week++) {
      for (const key of Object.keys(SESSIONS)) {
        await choose(page, week, key);
        await overflow(page, engine + '-' + width + '-w' + week + '-' + key);
        const exercises = panel(page, week, key).locator('li.exercise');
        for (const selector of ['h3', '.exercise-dose', '.exercise-rest', '.exercise-cue']) {
          assert.equal(await exercises.locator(selector + ':visible').count(), SESSIONS[key], 'Every exercise has readable ' + selector);
        }
        if (key === 'lower_core') await recovery(page, week);
        if (week === 1 && [390, 1440].includes(width) && ['frame_a', 'lower_core'].includes(key)) {
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.screenshot({ path: path.join(OUT, engine + '-' + width + '-w1-' + key + '.png'), fullPage: true, scale: 'css' });
        }
      }
    }
    for (const [week, sets] of [[1, 4], [3, 5], [5, 3]]) {
      await choose(page, week, 'frame_a');
      assert.equal((await doseSets(page, week, 'frame_a'))[0], sets, 'Week ' + week + ' press dose');
    }
    await choose(page, 5, 'lower_core');
    assert.deepEqual(await doseSets(page, 5, 'lower_core'), [2, 2, 2, 2, 1], 'Week 5 lighter leg/trunk dose');
    const fonts = await page.evaluate(() => ({
      family: getComputedStyle(document.body).fontFamily,
      loaded: [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family.replaceAll('"', '')),
      requests: performance.getEntriesByType('resource').filter(entry => /\.woff2?(\?|$)/.test(entry.name)).map(entry => entry.name)
    }));
    assert.match(fonts.family, /Inter Tight/);
    assert.ok(fonts.loaded.includes('Inter Tight') && fonts.loaded.includes('JetBrains Mono'), 'Both local house fonts load');
    assert.ok(fonts.requests.length >= 2 && fonts.requests.every(url => new URL(url).origin === new URL(BASE).origin), 'Fonts come from this site');
    assert.deepEqual(errors, [], 'No uncaught page errors');
    assert.deepEqual(broken, [], 'Local page assets return success');
    record(engine + '-' + width, { weeks: 6, sessions: 18, fonts: fonts.loaded, overflow_px: await overflow(page, 'final') });
  } catch (error) {
    await page.screenshot({ path: path.join(OUT, engine + '-' + width + '-failure.png'), fullPage: true }).catch(() => {});
    throw error;
  } finally { await page.close(); }
}

async function navigation(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await open(page, '#week-3-frame-b'); await selected(page, 3, 'frame_b');
    await page.reload(); await selected(page, 3, 'frame_b');
    await choose(page, 3, 'lower_core');
    await page.goBack(); await selected(page, 3, 'frame_b');
    await page.goForward(); await selected(page, 3, 'lower_core');
    await open(page, '#week-99-missing'); await selected(page, 1, 'frame_a');
    const link = page.locator('[data-session-link="frame_b"]');
    await link.focus(); await page.keyboard.press('Enter'); await selected(page, 1, 'frame_b');
    await page.locator('#week-select').focus(); await page.keyboard.press('Tab');
    const focus = await page.evaluate(() => ({
      tag: document.activeElement.tagName,
      outline: getComputedStyle(document.activeElement).outlineStyle,
      width: parseFloat(getComputedStyle(document.activeElement).outlineWidth)
    }));
    assert.ok(focus.tag !== 'BODY' && focus.outline !== 'none' && focus.width >= 1, 'Keyboard focus is visible');
    for (const element of await page.locator('#week-select,[data-session-link],.share-session:visible').all()) {
      const box = await element.boundingBox(); assert.ok(box && box.height >= 44 && box.width >= 44, 'Controls have usable touch targets');
    }
    record('hash-history-keyboard', { direct_link: true, reload: true, back_forward: true, invalid_hash: true, keyboard: true });
  } finally { await page.close(); }
}

async function shares(browser) {
  for (const mode of ['native', 'clipboard', 'manual']) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    try {
      await page.addInitScript(mode => {
        window.__shareCalls = [];
        Object.defineProperty(navigator, 'share', { configurable: true, value: mode === 'native' ? async data => window.__shareCalls.push(data.url) : undefined });
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => {
          if (mode === 'manual') throw new Error('Clipboard denied for acceptance test');
          window.__shareCalls.push(text);
        } } });
        if (mode === 'manual') document.execCommand = () => false;
      }, mode);
      await open(page, '#week-4-frame-b'); await selected(page, 4, 'frame_b');
      await page.locator('.share-session:visible').click();
      const expected = BASE + ROUTE + '#week-4-frame-b';
      if (mode === 'manual') {
        const input = page.locator('input.copy-link-fallback:visible,.copy-link-fallback input:visible').first();
        await input.waitFor({ state: 'visible' }); assert.equal(await input.inputValue(), expected);
      } else {
        await page.waitForFunction(() => window.__shareCalls.length === 1);
        assert.deepEqual(await page.evaluate(() => window.__shareCalls), [expected]);
      }
      record('share-' + mode, { selected_session_link: expected, boundary: 'Browser API mocked; no external share sent.' });
    } finally { await page.close(); }
  }
}

async function progressiveEnhancement(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  try {
    await open(page);
    assert.equal(await page.locator('body').getAttribute('data-program-id'), program.program_id);
    assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex,nofollow');
    const attrs = { 'data-movement-id': 'movement_id', 'data-position': 'position', 'data-sets': 'sets', 'data-rep-low': 'rep_low',
      'data-rep-high': 'rep_high', 'data-target-seconds': 'target_seconds', 'data-rest-sec': 'rest_seconds', 'data-per-side': 'per_side' };
    const expected = program.weeks.flatMap(week => week.days.map(day => ({
      id: hash(week.week_number, day.session_key).slice(1), session: day.session_id,
      exercises: day.exercises.map(exercise => ({ name: exercise.movement_name,
        attributes: Object.fromEntries(Object.entries(attrs).map(([attribute, field]) => [attribute, String(exercise[field] ?? '')])) }))
    })));
    const actual = await page.locator('article[data-session]').evaluateAll((nodes, attrs) => nodes.map(node => ({
      id: node.id, session: node.getAttribute('data-session-id'), exercises: [...node.querySelectorAll('li.exercise')].map(exercise => ({
        name: exercise.querySelector('h3').textContent,
        attributes: Object.fromEntries(Object.keys(attrs).map(attribute => [attribute, exercise.getAttribute(attribute)]))
      }))
    })), attrs);
    assert.deepEqual(actual, expected, 'Every rendered exercise preserves the authored program/session/movement and dose metadata');
    assert.equal(await page.locator('article[data-session]:visible').count(), 18);
    assert.equal(await page.locator('.exercise-list li.exercise:visible').count(), 120, 'All six authored weeks remain readable without scripts');
    for (let week = 1; week <= 6; week++) {
      for (const [key, count] of Object.entries(SESSIONS)) assert.equal(await panel(page, week, key).locator('li.exercise:visible').count(), count);
      await recovery(page, week);
    }
    assert.equal(await page.locator('.share-session:visible').count(), 0, 'Unavailable script controls are hidden');
    await overflow(page, 'no-javascript'); record('no-javascript-source-parity', { weeks: 6, exercises: 120, program_id: program.program_id });
  } finally { await page.close(); }
  const zoom = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await open(zoom, '#week-1-lower-core'); await selected(zoom, 1, 'lower_core');
    await zoom.evaluate(() => {
      const sizes = [...document.querySelectorAll('body *')].map(element => [element, parseFloat(getComputedStyle(element).fontSize)]);
      for (const [element, size] of sizes) element.style.fontSize = (size * 2) + 'px';
    });
    await overflow(zoom, '200-percent-text');
    await recovery(zoom, 1);
    await zoom.screenshot({ path: path.join(OUT, 'chromium-390-text-200.png'), fullPage: true, scale: 'css' });
    record('200-percent-text', { width: 390, method: 'Computed font sizes doubled; CSS text enlargement emulation.' });
  } finally { await zoom.close(); }
}

async function main() {
  const launch = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox'] } : {};
  const chromium = await playwright.chromium.launch(launch);
  try {
    for (const width of [375, 390, 430, 768, 1440]) await responsive(chromium, 'chromium', width);
    await navigation(chromium); await shares(chromium); await progressiveEnhancement(chromium);
  } finally { await chromium.close(); }
  if (process.env.TINIUS_QA_WEBKIT === '0') report.cases.push({ name: 'webkit', result: 'not run', reason: 'Local browser binary unavailable; CI requires WebKit.' });
  else {
    const webkit = await playwright.webkit.launch();
    try { await responsive(webkit, 'webkit', 390); } finally { await webkit.close(); }
  }
  report.result = 'passed';
}
main().catch(error => { report.result = 'failed'; report.error = error.stack; console.error(error.stack); process.exitCode = 1; })
  .finally(() => fs.writeFileSync(path.join(OUT, 'browser-report.json'), JSON.stringify(report, null, 2) + '\n'));
