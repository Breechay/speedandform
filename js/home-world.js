// Inside FORM (Oct 19, 2026): the contact sheet drifts left as the section crosses the screen,
// so the frames that run off the page come into view. Wide screens only (phones scroll it by
// hand); still with Reduce Motion.
(() => {
  const sheet = document.querySelector('[data-world-sheet]');
  if (!sheet) return;
  const strip = sheet.querySelector('ul');
  const wide = matchMedia('(min-width: 861px)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let raf = 0;
  function update() {
    raf = 0;
    if (!wide.matches || reduce.matches) { strip.style.transform = ''; return; }
    const r = sheet.getBoundingClientRect();
    const travel = Math.max(0, strip.scrollWidth - sheet.clientWidth + 48);
    // 0 when the sheet enters at the bottom of the screen, 1 when it leaves at the top.
    const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height)));
    strip.style.transform = `translate3d(${(-travel * p).toFixed(1)}px,0,0)`;
  }
  const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  wide.addEventListener('change', queue);
  reduce.addEventListener('change', queue);
  update();
})();
