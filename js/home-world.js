// A gentle scroll-linked drift. Direct touch, horizontal wheel or keyboard input
// sets a new position; the next page scroll carries on from there.
(() => {
  const sheet = document.querySelector('[data-world-sheet]');
  if (!sheet) return;
  const strip = sheet.querySelector('ul');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let raf = 0, previousProgress = null, drag = null;
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
    const r = sheet.getBoundingClientRect();
    const travel = Math.min(sheet.clientWidth * 0.65, Math.max(0, strip.scrollWidth - sheet.clientWidth));
    const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height)));
    if (!reduce.matches && previousProgress !== null && !drag) {
      sheet.scrollLeft += travel * (p - previousProgress);
    }
    previousProgress = p;
  }
  const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
  // Native touch and trackpad scrolling; mouse users can grab the strip.
  sheet.querySelectorAll('img').forEach(img => { img.draggable = false; });
  sheet.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { x: e.clientX, left: sheet.scrollLeft };
    sheet.setPointerCapture(e.pointerId);
    sheet.classList.add('is-dragging');
  });
  sheet.addEventListener('pointermove', e => {
    if (drag) sheet.scrollLeft = drag.left + drag.x - e.clientX;
  });
  const release = () => { drag = null; sheet.classList.remove('is-dragging'); };
  sheet.addEventListener('pointerup', release);
  sheet.addEventListener('pointercancel', release);
  sheet.addEventListener('lostpointercapture', release);
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  reduce.addEventListener('change', queue);
  sheet.querySelectorAll('img').forEach(img => img.addEventListener('load', queue, { once: true }));
  update();
})();
