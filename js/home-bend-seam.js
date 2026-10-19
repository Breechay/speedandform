// The bend as the seam (Oct 19, 2026). The nine lanes run along the bottom of the hero photograph,
// curve around "Train with me" on the right and run back out underneath, with the emblem at the
// goal: the same geometry as the Running app's opening (inner radius = 29.92 lane widths, emblem
// at center + 0.40 x inner radius). Desktop: the bend holds the whole section. Phone: it holds the
// heading, and the three offers start below the lanes. Drawn once on arrival; still with Reduce Motion.
(() => {
  const section = document.querySelector('[data-bend-seam]');
  if (!section) return;
  const heading = section.querySelector('h2');
  const grid = section.querySelector('.home-entry-grid');
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'bend-seam');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const lanes = document.createElementNS(NS, 'g');
  lanes.setAttribute('class', 'bend-seam-lanes');
  svg.appendChild(lanes);
  const mark = document.createElement('img');
  mark.className = 'bend-seam-mark';
  mark.src = '/assets/brand/kit/emblem/sf-emblem-bone.svg';
  mark.alt = '';
  mark.width = 220; mark.height = 80;
  section.prepend(svg);
  section.prepend(mark);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let drawn = false;

  function layout() {
    const W = section.clientWidth;
    const desktop = W >= 1024;
    grid.style.marginTop = '';
    let rin, lane, H;
    if (desktop) {
      H = section.offsetHeight;
      rin = H / 2;
    } else {
      rin = Math.min(W * 0.58, 240);
    }
    lane = rin / 29.92;
    const outer = lane * 8;
    const apex = W - (desktop ? Math.max(48, W * 0.045) : 10);
    const cx = apex - rin;
    const cy = rin;
    if (!desktop) {
      // Offers start under the outer bottom lane.
      const want = 2 * rin + outer + 36;
      const have = grid.getBoundingClientRect().top - section.getBoundingClientRect().top;
      if (have < want) grid.style.marginTop = (want - have + parseFloat(getComputedStyle(grid).marginTop || 0)) + 'px';
    }
    const top = outer + 2;
    svg.setAttribute('width', W);
    svg.setAttribute('height', 2 * rin + 2 * top);
    svg.setAttribute('viewBox', `0 ${-top} ${W} ${2 * rin + 2 * top}`);
    svg.style.top = (-top) + 'px';
    lanes.replaceChildren();
    for (let n = 0; n < 9; n++) {
      const r = rin + n * lane;
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', `M-40 ${cy - r}H${cx}A${r} ${r} 0 0 1 ${cx} ${cy + r}H-40`);
      lanes.appendChild(p);
    }
    const start = document.createElementNS(NS, 'path');
    start.setAttribute('d', `M${cx} ${cy + rin}V${cy + rin + outer}`);
    start.setAttribute('class', 'bend-seam-start');
    lanes.appendChild(start);
    const mw = desktop ? Math.min(220, rin * 0.62) : Math.min(120, rin * 0.5);
    const mh = mw * 290 / 798;
    let gx = cx + 0.40 * rin, gy = cy;
    if (!desktop && heading) gy = Math.max(cy, heading.getBoundingClientRect().bottom - section.getBoundingClientRect().top + mh / 2 + 28);
    mark.style.width = mw + 'px';
    mark.style.left = (gx - mw / 2) + 'px';
    mark.style.top = (gy - mh / 2) + 'px';
    if (!drawn) prime();
  }

  function prime() {
    if (reduce.matches || !('IntersectionObserver' in window)) { section.classList.add('bend-in'); drawn = true; return; }
    lanes.querySelectorAll('path').forEach((p) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });
  }

  function draw() {
    if (drawn) return;
    drawn = true;
    section.classList.add('bend-in');
    lanes.querySelectorAll('path').forEach((p, i) => {
      p.style.transition = `stroke-dashoffset 1400ms cubic-bezier(.30,.10,.20,1) ${i * 45}ms`;
      p.style.strokeDashoffset = 0;
    });
  }

  layout();
  if ('IntersectionObserver' in window && !reduce.matches) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { draw(); io.disconnect(); }
    }, { threshold: 0.25 });
    io.observe(section);
  }
  let t;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => {
    const wasDrawn = drawn; layout();
    if (wasDrawn) lanes.querySelectorAll('path').forEach((p) => { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; p.style.transition = ''; });
  }, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!drawn) layout(); else { layout(); lanes.querySelectorAll('path').forEach((p) => { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; }); } });
})();
