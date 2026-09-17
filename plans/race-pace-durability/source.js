import { resolvePlanAccess } from '/private/plan-access.js';
export { resolvePlanAccess } from '/private/plan-access.js';

export async function publishedPlan(slug) {
  if (slug !== 'race-pace-durability') throw new Error('Unknown plan');
  return (await resolvePlanAccess()).plan;
}

export function showPlanError(error) {
  document.documentElement.dataset.rpdEntitled = 'false';
  document.getElementById('rpdLoading')?.remove();
  document.querySelectorAll('#pdf,#pdfMobile,#rpdPreviewNote').forEach(node => { node.hidden = true; });
  const host = document.getElementById('track') || document.getElementById('edition');
  if (host) {
    host.style.transform = 'none';
    host.innerHTML = `<section class="rpd-access-message" role="status"><h2>${error?.code === 'sign-in' ? 'Sign in to check your access.' : 'We couldn’t check your access.'}</h2><p>Your training has not changed. Try again or open your account. There is no need to make another payment.</p><div><button type="button" class="btn" id="rpdRetry">Try again</button><a class="btn" href="/athlete/">Open account →</a></div></section>`;
    document.getElementById('rpdRetry').addEventListener('click', () => location.reload());
  }
  document.querySelectorAll('#prev,#next').forEach(button => { button.disabled = true; });
  return null;
}

// Remove authorized prescription immediately, before loading the next account.
function clearAndReload() {
  showPlanError({ code: 'account-changed' });
  setTimeout(() => location.reload(), 0);
}
document.addEventListener('form:account-changed', clearAndReload);
document.addEventListener('form:access-unavailable', () => showPlanError());
window.addEventListener('pagehide', () => {
  if (document.documentElement.dataset.rpdEntitled === 'true') {
    const host = document.getElementById('track') || document.getElementById('edition');
    if (host) host.replaceChildren();
  }
});
