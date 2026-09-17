function sourceToken(value, max = 60) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[_-]+|[_-]+$/g, '')
    .slice(0, max);
}

function clientReferenceId(source) {
  const parts = [
    ['s', sourceToken(source.utm_source, 24)],
    ['m', sourceToken(source.utm_medium, 24)],
    ['c', sourceToken(source.utm_campaign, 60)],
    ['x', sourceToken(source.utm_content, 60)],
  ].filter(([, value]) => value);
  if (!parts.length) return '';
  return ['rpd', ...parts.map(([key, value]) => `${key}_${value}`)].join('__').slice(0, 200);
}

function checkoutSource() {
  const source = typeof window.rpdSource === 'function' ? window.rpdSource() : {};
  const query = new URLSearchParams(window.location.search);
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach((key) => {
    if (!source[key] && query.get(key)) source[key] = query.get(key).slice(0, 240);
  });
  return source;
}

function checkoutUrl(button) {
  const base = new URL(button.href, window.location.href);
  const source = checkoutSource();
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach((key) => {
    if (source[key]) base.searchParams.set(key, source[key]);
  });
  const reference = clientReferenceId(source);
  if (reference) base.searchParams.set('client_reference_id', reference);
  return base.toString();
}

function installCheckoutLinks() {
  document.querySelectorAll('[data-rpd-checkout]').forEach((button) => {
    button.href = checkoutUrl(button);
  });
}

installCheckoutLinks();

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-rpd-checkout]');
  if (!button) return;
  event.preventDefault();
  if (button.dataset.checkoutBusy === 'true') return;
  button.dataset.checkoutBusy = 'true';
  window.rpdTrack?.checkout?.();
  window.location.assign(button.href);
});
