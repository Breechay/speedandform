function checkoutUrl(button) {
  const base = new URL(button.href, window.location.href);
  const source = typeof window.rpdSource === 'function' ? window.rpdSource() : {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach((key) => {
    if (source[key]) base.searchParams.set(key, source[key]);
  });
  return base.toString();
}

function installRestoreLink() {
  const heroActions = document.querySelector('.hero .actions');
  if (!heroActions || document.querySelector('.rpd-restore-link')) return;
  const link = document.createElement('a');
  link.className = 'rpd-restore-link';
  link.href = '/plans/race-pace-durability/access/';
  link.textContent = 'Already purchased? Restore access →';
  link.style.cssText = 'display:inline-block;margin-top:6px;font-size:13px;color:var(--muted);text-underline-offset:5px;text-decoration:underline;';
  heroActions.insertAdjacentElement('afterend', link);
}

installRestoreLink();

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-rpd-checkout]');
  if (!button) return;
  event.preventDefault();
  if (button.dataset.checkoutBusy === 'true') return;
  button.dataset.checkoutBusy = 'true';
  window.rpdTrack?.checkout?.();
  window.location.assign(checkoutUrl(button));
});
