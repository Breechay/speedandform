function checkoutUrl(button) {
  const base = new URL(button.href, window.location.href);
  const source = typeof window.rpdSource === 'function' ? window.rpdSource() : {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach((key) => {
    if (source[key]) base.searchParams.set(key, source[key]);
  });
  return base.toString();
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-rpd-checkout]');
  if (!button) return;
  event.preventDefault();
  if (button.dataset.checkoutBusy === 'true') return;
  button.dataset.checkoutBusy = 'true';
  window.rpdTrack?.checkout?.();
  window.location.assign(checkoutUrl(button));
});
