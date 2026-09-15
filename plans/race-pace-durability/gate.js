// Race Pace Durability public access gate.
// Weeks 1–4 remain open. Attempting to move beyond the free preview routes to
// the purchase page unless a Stripe purchase has been verified. Navigation moves
// by the number of weeks currently visible so trackpad / swipe / arrows feel like
// turning a sheet, not nudging one column.

const FREE_THROUGH = 4;
const PURCHASE_URL = '/plans/race-pace-durability/support/';
const ENTITLEMENT_ENDPOINT = 'https://pbgsjjegycacodiltbhn.supabase.co/functions/v1/rpd-entitlement';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

let bypass = false;
let gesture = null;
let wheelLock = 0;
let entitled = false;
let entitlementChecked = false;

function purchaseSession() {
  const query = new URLSearchParams(window.location.search).get('purchase_session');
  if (query && /^cs_[A-Za-z0-9_]+$/.test(query)) return query;
  try {
    const stored = window.localStorage.getItem('rpd_purchase_session') || '';
    return /^cs_[A-Za-z0-9_]+$/.test(stored) ? stored : '';
  } catch (_) {
    return '';
  }
}

async function verifyPurchase() {
  if (entitlementChecked) return entitled;
  entitlementChecked = true;
  const sessionId = purchaseSession();
  if (!sessionId) return false;

  try {
    const response = await fetch(ENTITLEMENT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', session_id: sessionId })
    });
    const data = await response.json().catch(() => ({}));
    entitled = Boolean(response.ok && data.ok && data.status === 'paid');
    if (entitled) {
      try {
        window.localStorage.setItem('rpd_purchase_session', sessionId);
        window.localStorage.setItem('rpd_purchase_verified_at', new Date().toISOString());
      } catch (_) {}
      document.documentElement.dataset.rpdEntitled = 'true';
    }
  } catch (error) {
    console.error('RPD entitlement verify', error);
  }
  return entitled;
}

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
  if (!direction) return;
  const left = leftWeek();
  const size = pageSize();

  if (!entitled && direction > 0 && left + size > FREE_THROUGH) {
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

    head.classList.add('rpd-locked-head');
    head.innerHTML = `<b>W${week}</b><span>FULL PLAN</span>`;

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
    sheet.innerHTML = `<button class="rpd-mobile-lock" type="button" aria-label="Unlock the full plan"><span>WEEK ${week}</span><strong>Full plan · $79</strong><em>Unlock weeks ${FREE_THROUGH + 1}–15 →</em></button>`;
  });
}

function lockAll() {
  if (entitled) return;
  $$('#track .matrix').forEach(lockTable);
  lockMobile();
}

function normalizeToPreview() {
  if (entitled) return;
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
  if (!$('#viewport') || !$('#range')) return window.setTimeout(init, 60);

  await verifyPurchase();
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
