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
