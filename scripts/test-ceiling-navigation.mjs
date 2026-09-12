import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

// Exercise the shipped renderer with DOM endpoints, without copying its paging logic.
const manifest = readFileSync('plans/raise-the-ceiling/plan-data.js', 'utf8').replace('export const plan', 'const plan');
const renderer = readFileSync('plans/raise-the-ceiling/render.js', 'utf8').replace(/import .*?;\n/, '');
function page(width, date = '2026-09-12T12:00:00Z') {
  const elements = new Map(), handlers = {};
  const element = id => {
    if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', style: {}, disabled: false });
    return elements.get(id);
  };
  const location = { search: '?athlete=simon', href: 'https://speedandform.com/plans/raise-the-ceiling/?athlete=simon' };
  const window = { innerWidth: width };
  class Clock extends Date { static now() { return Date.parse(date); } }
  vm.runInNewContext(`${manifest}\n${renderer}`, {
    Date: Clock, URL, URLSearchParams, window, location,
    history: { replaceState(_a, _b, url) { location.href = String(url); } },
    document: { getElementById: element, documentElement: { removeAttribute() {} }, addEventListener: (type, fn) => { handlers[type] = fn; } },
    addEventListener: (type, fn) => { handlers[type] = fn; }
  });
  return { element, location,
    click(id) { handlers.click({ target: { closest: selector => selector === `#${id}` ? element(id) : null } }); },
    athlete(id) { handlers.click({ target: { closest: selector => selector === '[data-athlete]' ? { dataset: { athlete: id } } : null } }); },
    resize(width) { window.innerWidth = width; handlers.resize(); }
  };
}
for (const width of [390, 650, 720]) test(`${width}px: every week is reachable and both bounds hold`, () => {
  const p = page(width);
  for (let week = 1; week <= 6; week++) {
    assert.match(p.element('range').textContent, new RegExp(`^W${week} ·`));
    assert.match(p.element('mobileSheet').innerHTML, new RegExp(`<strong>W${week}</strong>`));
    if (week < 6) p.click('next');
  }
  assert.equal(p.element('next').disabled, true);
  for (let week = 5; week >= 1; week--) { p.click('prev'); assert.match(p.element('range').textContent, new RegExp(`^W${week} ·`)); }
  assert.equal(p.element('prev').disabled, true);
});
test('athlete selection preserves the browsed week and the shared Thursday standard', () => {
  const p = page(390); p.click('next'); p.click('next');
  const before = p.element('mobileSheet').innerHTML;
  p.athlete('lisa');
  assert.match(p.element('range').textContent, /^W3 ·/);
  assert.match(p.element('mobileSheet').innerHTML, /25 min continuous/);
  assert.match(before, /2 × 12 min/);
  assert.match(before, /3 × 200m · 29–32s · 30s/);
  assert.match(p.element('mobileSheet').innerHTML, /3 × 200m · 29–32s · 30s/);
  assert.match(p.location.href, /athlete=lisa/);
});
test('the initial live week does not override later browsing or resizing', () => {
  const p = page(390, '2026-09-30T12:00:00Z');
  assert.match(p.element('range').textContent, /^W3 ·/);
  p.click('next'); assert.match(p.element('range').textContent, /^W4 ·/);
  p.resize(650); assert.match(p.element('range').textContent, /^W4 ·/);
});
test('desktop navigation stays within the six-week block', () => {
  const p = page(1280); assert.equal(p.element('range').textContent, 'W1–W5');
  p.click('next'); assert.equal(p.element('range').textContent, 'W2–W6');
  assert.equal(p.element('next').disabled, true);
  p.click('prev'); assert.equal(p.element('range').textContent, 'W1–W5');
});
