// A gentle scroll-linked drift. Direct touch, horizontal wheel or keyboard input
// sets a new position; the next page scroll carries on from there.
(() => {
  const sheet = document.querySelector('[data-world-sheet]');
  if (!sheet) return;
  const strip = sheet.querySelector('ul');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let raf = 0, previousProgress = null, drag = null, preciseLeft = null, lastApplied = null, touching = false;
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
  function pageProgress() {
    const r = sheet.getBoundingClientRect();
    return Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height)));
  }
  function rebase() {
    preciseLeft = sheet.scrollLeft;
    lastApplied = preciseLeft;
    previousProgress = pageProgress();
  }
  function update() {
    raf = 0;
    matchCorner();
    const travel = Math.min(sheet.clientWidth * 0.65, Math.max(0, strip.scrollWidth - sheet.clientWidth));
    const p = pageProgress();
    if (!reduce.matches && previousProgress !== null && !drag && !touching) {
      // Preserve subpixel movement even in engines that round scrollLeft reads.
      // A native/manual change becomes the new origin on the next page frame.
      if (preciseLeft === null || Math.abs(sheet.scrollLeft - lastApplied) > 0.5) preciseLeft = sheet.scrollLeft;
      preciseLeft = Math.max(0, Math.min(strip.scrollWidth - sheet.clientWidth, preciseLeft + travel * (p - previousProgress)));
      sheet.scrollLeft = preciseLeft;
      lastApplied = sheet.scrollLeft;
    }
    previousProgress = p;
  }
  const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
  // A finger owns the strip until it leaves. Never compete with diagonal touch scrolling.
  sheet.addEventListener('touchstart', () => { touching = true; rebase(); }, { passive: true });
  sheet.addEventListener('touchend', e => { touching = e.touches.length > 0; rebase(); }, { passive: true });
  sheet.addEventListener('touchcancel', () => { touching = false; rebase(); }, { passive: true });
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
  const release = () => { drag = null; rebase(); sheet.classList.remove('is-dragging'); };
  sheet.addEventListener('pointerup', release);
  sheet.addEventListener('pointercancel', release);
  sheet.addEventListener('lostpointercapture', release);
  addEventListener('scroll', queue, { passive: true });
  const resized = () => { previousProgress = null; queue(); };
  addEventListener('resize', resized);
  // The bend recalculates after resize; observe its final dimensions too.
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resized).observe(sheet);
  reduce.addEventListener('change', () => { rebase(); queue(); });
  sheet.querySelectorAll('img').forEach(img => img.addEventListener('load', queue, { once: true }));
  update();
})();
