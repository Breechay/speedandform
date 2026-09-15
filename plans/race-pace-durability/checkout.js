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
  link.textContent = document.body.dataset.rpdLocale === 'es'
    ? '¿Ya compraste? Recupera tu acceso →'
    : 'Already purchased? Restore access →';
  link.style.cssText = 'display:inline-block;margin-top:6px;font-size:13px;color:var(--muted);text-underline-offset:5px;text-decoration:underline;';
  heroActions.insertAdjacentElement('afterend', link);
}

function installPracticeProof() {
  const section = document.querySelector('main > section.pair[aria-label]');
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
