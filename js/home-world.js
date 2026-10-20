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

// The track's other end (Oct 19): the second bend opens to the right, the photographs slide through
// its infield. Same measured proportions as the first (inner radius = 29.92 lanes, 9 lines).
(() => {
  const section = document.querySelector('[data-bend-strip]');
  if (!section) return;
  const infield = section.querySelector('.strip-infield');
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'strip-bend'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
  section.prepend(svg);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const LANES = 36.5 / 1.22;
  let drawn = false;
  function layout() {
    const W = section.clientWidth, H = section.clientHeight;
    const rin = H / (2 * (1 + 8 / LANES));
    const lane = rin / LANES, outer = 8 * lane;
    const cy = H / 2;
    const cx = Math.max(16, W * 0.03) + outer + rin;
    svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    let d = '';
    for (let n = 0; n < 9; n++) {
      const r = rin + n * lane;
      d += `<path d="M${W + 40} ${(cy - r).toFixed(1)}H${cx.toFixed(1)}A${r.toFixed(1)} ${r.toFixed(1)} 0 0 0 ${cx.toFixed(1)} ${(cy + r).toFixed(1)}H${W + 40}"/>`;
    }
    d += `<path class="strip-bend-start" d="M${cx.toFixed(1)} ${(cy - rin).toFixed(1)}V${(cy - rin - outer).toFixed(1)}"/>`;
    svg.innerHTML = d;
    infield.style.clipPath = `path('M${W + 2} ${(cy - rin).toFixed(1)}H${cx.toFixed(1)}A${rin.toFixed(1)} ${rin.toFixed(1)} 0 0 0 ${cx.toFixed(1)} ${(cy + rin).toFixed(1)}H${W + 2}Z')`;
    if (!drawn && !reduce.matches && 'IntersectionObserver' in window) {
      svg.querySelectorAll('path').forEach((p) => { const l = p.getTotalLength(); p.style.strokeDasharray = l; p.style.strokeDashoffset = l; });
    }
  }
  function draw() {
    drawn = true;
    svg.querySelectorAll('path').forEach((p, i) => {
      p.style.transition = `stroke-dashoffset 1400ms cubic-bezier(.30,.10,.20,1) ${i * 45}ms`;
      p.style.strokeDashoffset = 0;
    });
  }
  layout();
  if (!reduce.matches && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { draw(); io.disconnect(); } }, { threshold: 0.2 });
    io.observe(section);
  }
  let t;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { layout(); if (drawn) svg.querySelectorAll('path').forEach((p) => { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; }); }, 120); });
})();
