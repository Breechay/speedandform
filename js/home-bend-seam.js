// The bend as the seam (Oct 19, 2026). The nine lanes run along the bottom of the hero photograph,
// curve around "Train with me" on the right and run back out underneath, with the emblem at the
// goal: the same geometry as the Running app's opening (inner radius = 29.92 lane widths, emblem
// at center + 0.40 x inner radius). Desktop: the bend holds the whole section. Phone: it holds the
// whole chapter too, larger than the screen so the lanes sweep out past the right edge. Drawn once on arrival; still with Reduce Motion.
(() => {
  const section = document.querySelector('[data-bend-seam]');
  if (!section) return;
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
  const wideQuery = matchMedia('(min-width: 1180px)'); // same breakpoint as the CSS
  let drawn = false;

  // Real track proportions, as scripts/sf-bend.cjs: 36.5 m radius, 1.22 m lanes, 400 m stagger.
  const RADIUS_IN_LANES = 36.5 / 1.22;
  const staggerAngle = (n) => 2 * Math.PI * ((n - 1) * 1.22 - 0.1) / (36.5 + (n - 1) * 1.22 + 0.2);

  function layout() {
    const W = section.clientWidth;
    const wide = wideQuery.matches;
    section.classList.toggle('bend-wide', wide);
    // The bend holds the whole chapter, outer lane included: inner diameter + one lane band = the
    // section's height, so no lane spills onto the paper below.
    const rin = section.offsetHeight / (2 + 8 / RADIUS_IN_LANES);
    const lane = rin / RADIUS_IN_LANES;
    const outer = lane * 8;
    // Wide: the full bend sits inside the page, apex near the right edge. Narrow: the bend is
    // larger than the screen, so the lanes sweep down and out past the right edge, as on a track.
    // Narrow: never let the apex land inside the screen, so the lanes always run out past the edge.
    const cx = wide ? W - Math.max(48, W * 0.045) - rin : Math.round(Math.max(W * 0.46, W - rin * 0.9));
    const cy = rin;
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
    const marks = [`M${cx} ${cy + rin}V${cy + rin + outer}`];
    for (let n = 2; n <= 8; n++) {
      const t = staggerAngle(n), sn = Math.sin(t), cs = Math.cos(t);
      const a1 = rin + (n - 1) * lane, a2 = rin + n * lane;
      marks.push(`M${(cx + a1 * sn).toFixed(1)} ${(cy + a1 * cs).toFixed(1)}L${(cx + a2 * sn).toFixed(1)} ${(cy + a2 * cs).toFixed(1)}`);
    }
    marks.forEach((d) => {
      const m = document.createElementNS(NS, 'path');
      m.setAttribute('d', d); m.setAttribute('class', 'bend-seam-start');
      lanes.appendChild(m);
    });
    // The emblem at the goal on every width, inside the bend, clear of the edge.
    const mw = Math.min(200, rin * 0.62, W * 0.28); const mh = mw * 290 / 798;
    const gx = Math.min(cx + 0.40 * rin, W - mw / 2 - 24); const gy = cy;
    mark.style.width = mw + 'px';
    mark.style.left = (gx - mw / 2) + 'px';
    mark.style.top = (gy - mh / 2) + 'px';
    if (hero) hero.style.setProperty('--seam-outer', Math.ceil(outer) + 'px');
    maskHero({ cx, cy, R: rin + outer });
    if (!drawn) prime();
  }

  // The hero photograph ends on the outer lane: straight along the bottom, then following the
  // curve down the right side, so the lanes are the photo's edge instead of drawn across it.
  const hero = document.querySelector('.sf-home-hero-immersive');
  const media = hero && hero.querySelector('.home-hero-media');
  function maskHero({ cx, cy, R }) {
    if (!hero || !media) return;
    hero.classList.add('has-bend-seam');
    media.style.bottom = '0px';
    const W = hero.clientWidth;
    const heroTop = hero.getBoundingClientRect().top;
    const seamTop = section.getBoundingClientRect().top - heroTop;
    const cyH = seamTop + cy;
    const dx = W - cx;
    const exitY = dx < R ? cyH - Math.sqrt(R * R - dx * dx) : cyH;
    const H = Math.max(hero.offsetHeight, Math.ceil(exitY) + 2);
    media.style.bottom = (hero.offsetHeight - H) + 'px';
    // If the outer lane does not reach the right edge, the photo runs down to the bend's middle and
    // follows the lane back from its apex.
    const d = dx < R
      ? `M0 0H${W}V${exitY.toFixed(1)}A${R.toFixed(1)} ${R.toFixed(1)} 0 0 0 ${cx.toFixed(1)} ${(cyH - R).toFixed(1)}H0Z`
      : `M0 0H${W}V${cyH.toFixed(1)}H${(cx + R).toFixed(1)}A${R.toFixed(1)} ${R.toFixed(1)} 0 0 0 ${cx.toFixed(1)} ${(cyH - R).toFixed(1)}H0Z`;
    const svgMask = `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}' viewBox='0 0 ${W} ${H}'><path d='${d}' fill='black'/></svg>`;
    const url = `url("data:image/svg+xml,${encodeURIComponent(svgMask)}")`;
    media.style.webkitMaskImage = url; media.style.maskImage = url;
    media.style.webkitMaskSize = '100% 100%'; media.style.maskSize = '100% 100%';
    media.style.webkitMaskRepeat = 'no-repeat'; media.style.maskRepeat = 'no-repeat';
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
