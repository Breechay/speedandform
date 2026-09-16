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

function installPracticeProof() {
  const section = document.querySelector('main > section.pair[aria-label="FORM runners and the plan"], main > section.pair[aria-label="Corredores FORM y el plan"]');
  if (!section || section.dataset.photoInstalled === 'true') return;
  const spanish = document.body.dataset.rpdLocale === 'es';
  section.dataset.photoInstalled = 'true';
  section.className = 'practice-proof';
  section.setAttribute('aria-label', spanish ? 'Corredores FORM y Race Pace Durability' : 'FORM runners and Race Pace Durability');
  section.innerHTML = spanish ? `
    <figure class="practice-figure">
      <img class="practice-photo" src="/assets/rpd/form-runners-miami.webp" alt="Corredores de FORM en Miami después de entrenar" width="540" height="665" loading="eager" decoding="async">
      <figcaption class="practice-caption"><strong>Corredores FORM · Miami</strong><span>Corredores reales. Entrenamiento real.</span></figcaption>
    </figure>
    <div class="practice-copy">
      <p class="eyebrow">FORM</p>
      <h2>Esto es FORM.</h2>
      <p class="plain-proof">Race Pace Durability es uno de los planes que usamos con corredores FORM que se preparan para la media maratón.</p>
      <p>No necesitas aprender la teoría del coaching. Necesitas saber qué correr, hacer el trabajo y ver qué pasa. El resultado nos dice qué sigue.</p>
      <p>Hope y José están usando este bloque de 15 semanas ahora. Sus ritmos son distintos. El objetivo es el mismo: mantener el ritmo de carrera por más tiempo.</p>
    </div>` : `
    <figure class="practice-figure">
      <img class="practice-photo" src="/assets/rpd/form-runners-miami.webp" alt="FORM runners in Miami after training" width="540" height="665" loading="eager" decoding="async">
      <figcaption class="practice-caption"><strong>FORM runners · Miami</strong><span>Real runners. Real training.</span></figcaption>
    </figure>
    <div class="practice-copy">
      <p class="eyebrow">FORM</p>
      <h2>This is FORM.</h2>
      <p class="plain-proof">Race Pace Durability is one of the plans we use with FORM runners preparing for the half marathon.</p>
      <p>You do not need to learn the coaching theory. You need to know what to run, do the work, and see what happens. The result tells us what comes next.</p>
      <p>Hope and José are using this 15-week block now. Their paces are different. The goal is the same: hold race pace for longer.</p>
    </div>`;
}

installPracticeProof();
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
