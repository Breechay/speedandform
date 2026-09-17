import { resolvePlanAccess } from '/private/plan-access.js';

const range = document.getElementById('range');
const shareButtons = ['share', 'shareMobile'].map(id => document.getElementById(id)).filter(Boolean);

function requestedWeek() {
  const value = Number(new URLSearchParams(location.search).get('week'));
  return Number.isInteger(value) && value >= 1 && value <= 15 ? value : null;
}

function visibleWeeks() {
  const text = range?.textContent || '';
  const values = [...text.matchAll(/\d+/g)].map(match => Number(match[0]));
  if (!values.length) return null;
  if (/^\s*Weeks\b/i.test(text) && values.length >= 2) return { first: values[0], last: values[1] };
  return { first: values[0], last: values[0] };
}

function waitForRange(previous = '') {
  return new Promise(resolve => {
    const started = Date.now();
    const check = () => {
      const text = range?.textContent || '';
      if (text && text !== previous) return resolve(text);
      if (Date.now() - started > 1400) return resolve(text);
      requestAnimationFrame(check);
    };
    check();
  });
}

async function openRequestedWeek() {
  const target = requestedWeek();
  if (!target) return;
  // Resolve identity first so the gate knows whether it is opening authored
  // content or the intentionally locked public placeholder. The week parameter
  // itself never grants access.
  await resolvePlanAccess().catch(() => null);
  await waitForRange();

  for (let attempts = 0; attempts < 16; attempts += 1) {
    const visible = visibleWeeks();
    if (!visible || (target >= visible.first && target <= visible.last)) return;
    const direction = target < visible.first ? -1 : 1;
    const button = document.getElementById(direction < 0 ? 'prev' : 'next');
    if (!button || button.disabled) return;
    const before = range.textContent;
    button.click();
    await waitForRange(before);
  }
}

function currentShareWeek() {
  const requested = requestedWeek();
  const visible = visibleWeeks();
  if (requested && visible && requested >= visible.first && requested <= visible.last) return requested;
  return visible?.first || 1;
}

function shareUrl() {
  const url = new URL(location.href);
  url.searchParams.delete('purchase_session');
  url.searchParams.delete('state');
  url.searchParams.set('week', String(currentShareWeek()));
  return url.toString();
}

async function shareCurrentView() {
  const week = currentShareWeek();
  const data = { title: `Race Pace Durability · Week ${week}`, url: shareUrl() };
  if (navigator.share) {
    try { await navigator.share(data); return; }
    catch (error) { if (error?.name === 'AbortError') return; }
  }
  try {
    await navigator.clipboard.writeText(data.url);
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = `Week ${week} link copied`;
      toast.hidden = false;
      clearTimeout(shareCurrentView.timer);
      shareCurrentView.timer = setTimeout(() => { toast.hidden = true; }, 2200);
    }
  } catch {}
}

// Capture before the older plan-level share handler. The URL names the visible
// week/window but never carries identity or entitlement; authorization still
// resolves independently on the receiving device.
document.addEventListener('click', event => {
  if (!shareButtons.some(button => button === event.target.closest('button'))) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  shareCurrentView();
}, true);

openRequestedWeek();
