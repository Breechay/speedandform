// Race Pace Durability public access gate.
// Weeks 1–4 remain open. Attempting to move beyond the free preview routes to
// the purchase page unless account or purchase access has been verified. A
// shared ?week= link may open the redacted locked placeholder for that week;
// the query parameter never grants prescription access.

const FREE_THROUGH = 4;
const PURCHASE_URL = '/plans/race-pace-durability/support/';
const requested = Number(new URLSearchParams(location.search).get('week'));
const SHARED_WEEK = Number.isInteger(requested) && requested >= 1 && requested <= 15 ? requested : null;
import { resolvePlanAccess } from './source.js';
import { accountDestination } from '/private/plan-access.js';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

let bypass = false;
let gesture = null;
let wheelLock = 0;
let entitled = false;
let available = true;
const suspend = () => { available = false; };
document.addEventListener('form:account-changed', suspend);
document.addEventListener('form:access-unavailable', suspend);
function leftWeek() {
  const text = $('#range')?.textContent || '';
  const hit = text.match(/\d+/);
  return hit ? Number(hit[0]) : 1;
}

function pageSize() {
  const matrix = $('#curSheet .matrix');
  if (!matrix) return 1;
  return Math.max(1, matrix.querySelectorAll('thead th').length - 1);
}

function purchase() {
  if (!available) return;
  window.location.assign(PURCHASE_URL);
}

function baseClick(direction, times) {
  const button = direction > 0 ? $('#next') : $('#prev');
  if (!button) return;
  bypass = true;
  for (let i = 0; i < times; i += 1) button.click();
  bypass = false;
  window.setTimeout(lockAll, 420);
}

function navigate(direction) {
  if (!direction || !available) return;
  const left = leftWeek();
  const size = pageSize();

  if (!entitled && direction > 0 && left + size > FREE_THROUGH) {
    // A deliberate shared week is allowed to reveal only the locked/redacted
    // placeholder. Ordinary preview navigation still goes directly to purchase.
    if (SHARED_WEEK && SHARED_WEEK > FREE_THROUGH) {
      baseClick(direction, size);
      return;
    }
    purchase();
    return;
  }

  baseClick(direction, size);
}

function lockTable(table) {
  if (entitled) return;
  const heads = $$('thead tr th', table).slice(1);
  heads.forEach((head, index) => {
    const hit = head.textContent.match(/W\s*(\d+)/i);
    const week = hit ? Number(hit[1]) : null;
    if (!week || week <= FREE_THROUGH) return;

    if (!head.classList.contains('rpd-locked-head')) {
      head.classList.add('rpd-locked-head');
      head.innerHTML = `<b>W${week}</b><span>FULL PLAN</span>`;
    }

    $$('tbody tr', table).forEach((row, rowIndex) => {
      const cell = row.children[index + 1];
      if (!cell || cell.dataset.rpdLocked === 'true') return;
      cell.dataset.rpdLocked = 'true';
      cell.classList.add('rpd-locked-cell');
      cell.innerHTML = rowIndex === 0
        ? `<button class="rpd-lock" type="button" aria-label="Unlock weeks ${FREE_THROUGH + 1} through 15"><span>LOCKED</span><strong>Full plan · $79</strong><em>Unlock weeks ${FREE_THROUGH + 1}–15 →</em></button>`
        : '<div class="rpd-lock-quiet" aria-hidden="true"></div>';
    });
  });
}

function lockMobile() {
  if (entitled || pageSize() !== 1) return;
  const left = leftWeek();
  const sheets = [
    ['#prevSheet', left - 1],
    ['#curSheet', left],
    ['#nextSheet', left + 1],
  ];

  sheets.forEach(([selector, week]) => {
    const sheet = $(selector);
    if (!sheet || week <= FREE_THROUGH || week < 1) return;
    if (sheet.dataset.lockedWeek === String(week) && sheet.querySelector('.rpd-mobile-lock')) return;
    sheet.dataset.lockedWeek = String(week);
    sheet.innerHTML = `<button class="rpd-mobile-lock" type="button" aria-label="Unlock the full plan"><span>WEEK ${week}</span><strong>Full plan · $79</strong><em>Unlock weeks ${FREE_THROUGH + 1}–15 →</em></button>`;
  });
}

function lockAll() {
  if (!available || entitled) return;
  $$('#track .matrix').forEach(lockTable);
  lockMobile();
}

function normalizeToPreview() {
  if (entitled || (SHARED_WEEK && SHARED_WEEK > FREE_THROUGH)) return;
  const left = leftWeek();
  if (left <= FREE_THROUGH) return;
  baseClick(-1, left - FREE_THROUGH);
}

function installStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .rpd-locked-head{background:rgba(201,255,54,.08)!important}
    .rpd-locked-head span{color:var(--lime)!important;letter-spacing:.08em}
    td.rpd-locked-cell{padding:0!important;background:
      repeating-linear-gradient(135deg,rgba(201,255,54,.035) 0,rgba(201,255,54,.035) 8px,transparent 8px,transparent 16px)!important}
    .rpd-lock,.rpd-mobile-lock{width:100%;min-height:100%;border:0;background:transparent;color:inherit;text-align:left;padding:18px;display:flex;flex-direction:column;justify-content:center;gap:5px}
    .rpd-lock span,.rpd-mobile-lock span{font-family:var(--mono);font-size:9px;letter-spacing:.14em;color:var(--lime)}
    .rpd-lock strong,.rpd-mobile-lock strong{font-family:var(--serif);font-size:20px;font-weight:400;line-height:1.05}
    .rpd-lock em,.rpd-mobile-lock em{font-family:var(--mono);font-size:9px;font-style:normal;letter-spacing:.08em;color:var(--muted)}
    .rpd-lock-quiet{min-height:64px}
    .rpd-mobile-lock{min-height:340px;padding:28px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:repeating-linear-gradient(135deg,rgba(201,255,54,.035) 0,rgba(201,255,54,.035) 10px,transparent 10px,transparent 20px)}
    .rpd-mobile-lock strong{font-size:30px}
  `;
  document.head.appendChild(style);
}

async function init() {
  let access;
  try { access = await resolvePlanAccess(); } catch { return; }
  if (!$('#range')?.textContent) return window.setTimeout(init, 60);
  if (!available) return;
  entitled = access.entitled;
  $('#rpdLoading')?.remove();
  $$('#pdf,#pdfMobile,#rpdPreviewNote').forEach(node => { node.hidden = false; });
  document.documentElement.dataset.rpdEntitled = String(entitled);
  if (entitled) {
    $('.rpd-mobile-account').hidden = true;
    const destination = access.signedIn ? accountDestination(access) : { href: '/plans/race-pace-durability/support/', label: 'Plan details' };
    $$('#pdf,#pdfMobile').forEach(link => {
      link.textContent = `${destination.label} →`;
      link.href = destination.href;
      link.classList.remove('lime');
    });
    const note = $('#rpdPreviewNote');
    if (note) {
      note.innerHTML = '<h3>All 15 weeks are available.</h3><p></p>';
      note.querySelector('p').textContent = access.mode === 'purchased' ? 'Your full web plan is ready to read. Use the week arrows to browse the training.' : 'This is the published plan. Individual paces and coach-authored changes remain in the athlete’s assigned training.';
    }
  }
  $('#next').setAttribute('aria-label', entitled ? 'Next weeks' : 'Next weeks or unlock full plan');
  installStyles();
  normalizeToPreview();
  lockAll();

  const observer = new MutationObserver(() => window.requestAnimationFrame(lockAll));
  observer.observe($('#track'), { childList: true, subtree: true });

  document.addEventListener('click', (event) => {
    if (!entitled && event.target.closest('.rpd-lock,.rpd-mobile-lock,[data-rpd-locked="true"]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      purchase();
      return;
    }

    const button = event.target.closest('#prev,#next');
    if (!button || bypass) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    navigate(button.id === 'next' ? 1 : -1);
  }, true);

  const viewport = $('#viewport');
  viewport.addEventListener('pointerdown', (event) => {
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0, dy: 0 };
  }, true);
  viewport.addEventListener('pointermove', (event) => {
    if (!gesture || event.pointerId !== gesture.id) return;
    gesture.dx = event.clientX - gesture.x;
    gesture.dy = event.clientY - gesture.y;
  }, true);
  viewport.addEventListener('pointerup', (event) => {
    if (!gesture || event.pointerId !== gesture.id) return;
    const { dx, dy } = gesture;
    gesture = null;
    const threshold = Math.min(110, viewport.clientWidth * 0.2);
    if (Math.abs(dx) <= threshold || Math.abs(dx) <= Math.abs(dy)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    navigate(dx < 0 ? 1 : -1);
  }, true);
  viewport.addEventListener('pointercancel', () => { gesture = null; }, true);

  viewport.addEventListener('wheel', (event) => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 18) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const now = Date.now();
    if (now - wheelLock < 820) return;
    wheelLock = now;
    navigate(event.deltaX > 0 ? 1 : -1);
  }, { capture: true, passive: false });

  $('#plan')?.addEventListener('keydown', (event) => {
    if (event.target.closest('button,a,input,textarea,select')) return;
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    navigate(event.key === 'ArrowRight' ? 1 : -1);
  }, true);
}

window.requestAnimationFrame(init);
