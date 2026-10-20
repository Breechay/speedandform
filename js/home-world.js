// A gentle scroll-linked drift. Direct touch, horizontal wheel or keyboard input
// takes over permanently; reduced motion uses the same native photo scroller.
(() => {
  const sheet = document.querySelector('[data-world-sheet]');
  if (!sheet) return;
  const strip = sheet.querySelector('ul');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let raf = 0, manual = false;
  const corner = document.querySelector('.bend-pocket-right img');
  function matchCorner() {
    if (!corner) return;
    const edge = sheet.getBoundingClientRect().right - 1;
    const visible = [...strip.querySelectorAll('img')].find(img => {
      const r = img.getBoundingClientRect();
      return r.left <= edge && r.right >= edge;
    });
    if (visible && corner.dataset.source !== visible.src) {
      corner.dataset.source = visible.src;
      corner.src = visible.src;
      corner.srcset = visible.srcset;
      corner.sizes = visible.sizes;
    }
  }
  sheet.addEventListener('scroll', matchCorner, { passive: true });
  function update() {
    raf = 0;
    matchCorner();
    if (reduce.matches || manual) return;
    const r = sheet.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const travel = Math.min(sheet.clientWidth * 0.65, Math.max(0, strip.scrollWidth - sheet.clientWidth));
    const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height)));
    sheet.scrollLeft = travel * p;
  }
  const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
  sheet.addEventListener('pointerdown', () => { manual = true; }, { passive: true });
  sheet.addEventListener('wheel', e => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) manual = true; }, { passive: true });
  sheet.addEventListener('keydown', e => { if (['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) manual = true; });
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  reduce.addEventListener('change', queue);
  sheet.querySelectorAll('img').forEach(img => img.addEventListener('load', queue, { once: true }));
  update();
})();
