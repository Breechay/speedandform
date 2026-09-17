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

// Sharing names the visible week only. Opening a shared week is owned by the
// access gate after identity/entitlement resolves, so this helper cannot race
// the renderer or manufacture access state.
document.addEventListener('click', event => {
  if (!shareButtons.some(button => button === event.target.closest('button'))) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  shareCurrentView();
}, true);
