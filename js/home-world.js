// The photo stream (Oct 19, 2026): one continuous run of frames inside the second bend, drifting
// left into the curve as the section crosses the screen, on every width. With Reduce Motion it
// stays still and scrolls by hand. The bend itself is drawn by home-bend-seam.js.
(() => {
  const sheet = document.querySelector('[data-world-sheet]');
  if (!sheet) return;
  const strip = sheet.querySelector('ul');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let raf = 0;
  function update() {
    raf = 0;
    if (reduce.matches) { strip.style.transform = ''; return; }
    const r = sheet.getBoundingClientRect();
    const travel = Math.max(0, strip.scrollWidth - sheet.clientWidth);
    // 0 when the sheet enters at the bottom of the screen, 1 when it leaves at the top.
    const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height)));
    strip.style.transform = `translate3d(${(-travel * p).toFixed(1)}px,0,0)`;
  }
  const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  reduce.addEventListener('change', queue);
  update();
})();
