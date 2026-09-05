// Review-package only. Not part of the product, and nothing in coach/labs
// imports it.
//
// `viewAs` is deliberately not a route in the real surface — an athlete's
// identity decides their lens, not their URL. But a design review needs both
// lenses to be linkable and screenshot-able, so the package adds `?as=athlete`
// on top of the real toggle by pressing it. It presses the control the coach
// presses; it does not reach into the renderer's state.
const wanted = new URLSearchParams(location.search).get('as');
if (wanted === 'athlete' || wanted === 'coach') {
  const press = () => {
    const button = document.querySelector(`[data-view-as="${wanted}"]`);
    if (!button || document.querySelector('.loading')) return false;
    if (!button.classList.contains('on')) button.click();
    return true;
  };
  const timer = setInterval(() => { if (press()) clearInterval(timer); }, 60);
  setTimeout(() => clearInterval(timer), 8000);
}

// ── Stylesheet variants ────────────────────────────────────────────────
// `?css=v1` layers a design pass on top of the shipped stylesheet. Layering
// rather than replacing is deliberate: a variant that forks labs.css stops
// being comparable the moment production moves, and the whole point of this
// package is that the two are the same renderer.
//
// To try your own: drop a file in assets/css/ and load it with ?css=<name>.
const variant = new URLSearchParams(location.search).get('css');
if (variant && /^[a-z0-9-]{1,32}$/.test(variant)) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `assets/css/design-${variant}.css`;
  document.head.appendChild(link);
}
