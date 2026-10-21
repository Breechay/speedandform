// The bend as the seam (Oct 19, 2026). The nine lanes run along the bottom of the hero photograph,
// curve around "Train with me" on the right and run back out underneath, with the emblem at the
// goal: the same geometry as the Running app's opening (inner radius = 29.92 lane widths, emblem
// at center + 0.40 x inner radius). Desktop: the bend holds the whole section. Phone: it holds the
// whole chapter too, larger than the screen so the lanes sweep out past the right edge. Drawn once on arrival; still with Reduce Motion.
(() => {
  const section = document.querySelector('[data-bend-seam]');
  if (!section) return;
  const NS = 'http://www.w3.org/2000/svg';
  const infield = section.querySelector('.bend-infield');
  const strip = section.nextElementSibling && section.nextElementSibling.matches('[data-bend-strip]') ? section.nextElementSibling : null;
  const stripField = strip && strip.querySelector('.strip-infield');
  // Each exposed corner belongs to its adjacent photographic chapter.
  // A shared photographic exposure beneath the first lane band makes the
  // spaces between the rails translucent, rather than a solid black gasket.
  const trackExposure = infield && infield.cloneNode(true);
  if (trackExposure) {
    trackExposure.className = 'bend-track-exposure';
    trackExposure.setAttribute('aria-hidden', 'true');
    section.prepend(trackExposure);
  }
  const pockets = {};
  const evidence = document.querySelector('.home-evidence');
  function pocket(name, source) {
    if (!source) return null;
    const frame = document.createElement('div');
    frame.className = 'bend-pockets bend-pocket-' + name;
    frame.setAttribute('aria-hidden', 'true');
    const img = source.cloneNode(true);
    img.alt = '';
    frame.appendChild(img);
    section.prepend(frame);
    return frame;
  }
  if (strip) {
    pockets.upper = pocket('upper', infield && infield.querySelector('img'));
    pockets.right = pocket('right', strip.querySelector('img'));
    pockets.lower = pocket('lower', evidence && evidence.querySelector('img'));
  }
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'bend-seam');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const lanes = document.createElementNS(NS, 'g');
  lanes.setAttribute('class', 'bend-seam-lanes');
  const paper = document.createElementNS(NS, 'path');
  paper.setAttribute('class', 'bend-seam-paper');
  const defs = document.createElementNS(NS, 'defs');
  defs.innerHTML = '<linearGradient id="bend-return-paper" gradientUnits="userSpaceOnUse"><stop stop-color="#F4F2EC"/><stop offset="1" stop-color="#F4F2EC" stop-opacity="0"/></linearGradient><linearGradient id="bend-return-ink" gradientUnits="userSpaceOnUse"><stop stop-color="#0B0B0B" stop-opacity=".38"/><stop offset="1" stop-color="#0B0B0B" stop-opacity="0"/></linearGradient>';
  svg.appendChild(defs);
  const returnPaper = document.createElementNS(NS, 'path');
  returnPaper.setAttribute('fill', 'url(#bend-return-paper)');
  svg.appendChild(returnPaper);
  svg.appendChild(paper);
  svg.appendChild(lanes);
  const returnLines = document.createElementNS(NS, 'g');
  svg.appendChild(returnLines);
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
    if (!W) return;
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
    const H1 = 2 * rin + outer;
    // The track runs on: the first bend's home straight is the second bend's back straight, so the
    // lanes swap inner for outer and turn the other way around the photographs below (an S).
    // Keep a real shared straight on phones too. Coincident bend centers
    // collapse the material gradient into a hard cream/ink cut.
    const blendRun = Math.min(112, W * 0.22);
    const cx2 = strip ? Math.min(cx - blendRun, wide ? Math.max(16, W * 0.03) + outer + rin : W * 0.46) : 0;
    const cy2 = 3 * rin + outer;
    const tall = strip ? 2 * H1 : H1;
    svg.setAttribute('width', W);
    svg.setAttribute('height', tall + top + 2);
    svg.setAttribute('viewBox', `0 ${-top} ${W} ${tall + top + 2}`);
    svg.style.top = (-top) + 'px';
    lanes.replaceChildren();
    returnLines.replaceChildren();
    const f = (v) => v.toFixed(1);
    for (let n = 0; n < 9; n++) {
      const r = rin + n * lane;
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', `M-40 ${f(cy - r)}H${f(cx)}A${f(r)} ${f(r)} 0 0 1 ${f(cx)} ${f(cy + r)}H${strip ? f(cx2) : -40}`);
      lanes.appendChild(p);
    }
    if (strip) {
      strip.style.height = H1 + 'px';
      // The shared straight changes material gradually, without a vertical cut.
      defs.querySelectorAll('linearGradient').forEach(g => {
        g.setAttribute('x1', cx2); g.setAttribute('x2', cx);
        g.setAttribute('y1', 0); g.setAttribute('y2', 0);
      });
      returnPaper.setAttribute('d', `M${f(cx2)} ${f(2 * rin)}H${f(cx)}V${f(H1)}H${f(cx2)}Z`);
      for (let n = 0; n < 9; n++) {
        const line = document.createElementNS(NS, 'path');
        line.setAttribute('class', 'bend-seam-return');
        line.setAttribute('d', `M${f(cx2)} ${f(2 * rin + n * lane)}H${f(cx)}`);
        returnLines.appendChild(line);
      }
      // A true offset ribbon: concentric arcs retain identical lane gaps at every width.
      const R = rin + outer;
      paper.setAttribute('d', `M${f(cx2)} ${f(2 * rin)}A${f(R)} ${f(R)} 0 0 0 ${f(cx2)} ${f(2 * H1)}H${W + 2}V${f(2 * H1 - outer)}H${f(cx2)}A${f(rin)} ${f(rin)} 0 0 1 ${f(cx2)} ${f(H1)}Z`);
      for (let n = 0; n < 9; n++) {
        const r2 = rin + (8 - n) * lane;
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('class', 'bend-seam-b');
        p.setAttribute('d', `M${f(cx2)} ${f(cy2 - r2)}A${f(r2)} ${f(r2)} 0 0 0 ${f(cx2)} ${f(cy2 + r2)}H${W + 40}`);
        lanes.appendChild(p);
      }
      if (stripField) {
        stripField.style.height = (2 * rin) + 'px';
        stripField.style.clipPath = `path('M${W + 2} 0H${f(cx2)}A${f(rin)} ${f(rin)} 0 0 0 ${f(cx2)} ${f(2 * rin)}H${W + 2}Z')`;
      }
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
    const mw = Math.min(160, rin * 0.48, W * 0.24); const mh = mw * 290 / 798;
    const gx = Math.min(cx + 0.40 * rin, W - mw / 2 - 24); const gy = cy;
    mark.style.width = mw + 'px';
    mark.style.left = (gx - mw / 2) + 'px';
    mark.style.top = (gy - mh / 2) + 'px';
    if (hero) hero.style.setProperty('--seam-outer', Math.ceil(outer) + 'px');
    section.style.setProperty('--seam-outer', Math.ceil(outer) + 'px');
    // The infield holds the photograph: clipped to the inner lane, so the track is its frame. With
    // the second bend below, the same photograph also fills every pocket the lanes leave: down the
    // left, outside the second bend, and the corner outside the first bend on the right. The lanes
    // are the only dark left on the page.
    if (infield) {
      infield.style.height = (2 * rin) + 'px';
      if (trackExposure) {
        trackExposure.style.top = -outer + 'px';
        trackExposure.style.height = (H1 + outer) + 'px';
        trackExposure.style.clipPath = `path('M-2 0H${f(cx)}A${f(rin + outer)} ${f(rin + outer)} 0 0 1 ${f(cx)} ${f(H1 + outer)}H-2Z')`;
        trackExposure.querySelector('img').style.top = '0px';
      }
      infield.style.clipPath = `path('M-2 0H${f(cx)}A${f(rin)} ${f(rin)} 0 0 1 ${f(cx)} ${f(2 * rin)}H-2Z')`;
    }
    // Split the outside of the second curve at its apex. The upper corner is
    // the first chapter; the lower corner belongs to the evidence below.
    if (strip) {
      const R = rin + outer, B = 2 * H1;
      const x = Math.max(-2, cx2 - R);
      const h = cx2 - R >= -2 ? 0 : Math.sqrt(R * R - (cx2 + 2) ** 2);
      const upper = `M-2 ${f(2 * rin)}H${f(cx2)}A${f(R)} ${f(R)} 0 0 0 ${f(x)} ${f(cy2 - h)}H-2Z`;
      const lower = `M-2 ${f(cy2 + h)}H${f(x)}A${f(R)} ${f(R)} 0 0 0 ${f(cx2)} ${f(B)}H-2Z`;
      const dx = W + 2 - cx;
      const y = dx < R ? cy + Math.sqrt(R * R - dx * dx) : cy;
      const right = `M${W + 2} ${f(y)}V${f(H1)}H${f(cx)}A${f(R)} ${f(R)} 0 0 0 ${f(Math.min(W + 2, cx + R))} ${f(y)}Z`;
      for (const [name, d] of Object.entries({upper, lower, right})) {
        const frame = pockets[name];
        if (!frame) continue;
        frame.style.height = B + 'px';
        frame.style.clipPath = `path('${d}')`;
      }
      // Share the upper photograph's render plane with its corner. No unrelated
      // track-color slivers and no different zoom on the two halves.
      const photoHeight = cy2 + (W > 760 ? 10 : 0);
      section.style.setProperty('--infield-photo-height', photoHeight + 'px');
      if (pockets.upper) pockets.upper.querySelector('img').style.height = photoHeight + 'px';
      if (pockets.right) {
        const img = pockets.right.querySelector('img');
        img.style.top = cy + 'px';
        img.style.height = (2 * rin) + 'px';
      }
      if (pockets.lower) {
        const img = pockets.lower.querySelector('img');
        img.style.top = cy2 + 'px';
        img.style.height = (B - cy2 + (evidence ? evidence.offsetHeight : 0)) + 'px';
      }
    }
    maskHero({ cx, cy, R: rin + outer });
    prime();
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

  // The lanes draw with the scroll, like the app's opening: inner lane first, each outer lane a beat
  // behind, the start line last. A short arrival on load so the first screen already shows the track.
  let lens = [], intro = 0, raf = 0, progress = 0, target = 0, lastPaint = 0;
  function prime() {
    if (reduce.matches) { section.classList.add('bend-in'); drawn = true; if (stripField) stripField.style.opacity = 1; return; }
    lens = [...lanes.querySelectorAll('path')].map((p) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.transition = 'none';
      return len;
    });
    paint();
  }
  // One run through both bends: the first draws until its last lane reaches the bottom of the
  // screen, the second picks up at the same point and finishes as its photographs settle.
  function span() {
    const r = section.getBoundingClientRect(), vh = innerHeight;
    if (!strip) return Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.55 + r.height * 0.55)));
    return Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.8 + r.height)));
  }
  const ease = (k) => 1 - Math.pow(1 - k, 3);
  const clamp = (v) => Math.min(1, Math.max(0, v));
  function paint(now = performance.now()) {
    raf = 0;
    if (reduce.matches || !lens.length) return;
    target = Math.max(target, span());
    const elapsed = Math.min(64, lastPaint ? now - lastPaint : 16);
    lastPaint = now;
    progress += (target - progress) * (1 - Math.exp(-elapsed / 90));
    if (target - progress < 0.0005) progress = target;
    const t = progress;
    const p1 = Math.max(strip ? clamp(t / 0.5) : t, intro);
    const p2 = strip ? clamp((t - 0.5) / 0.5) : 0;
    lanes.querySelectorAll('path').forEach((el, i) => {
      let k;
      if (el.classList.contains('bend-seam-start')) k = clamp((p1 - 0.78) / 0.22);
      else if (el.classList.contains('bend-seam-b')) { k = p2; }
      else { k = p1; }
      el.style.strokeDashoffset = (lens[i] * (1 - ease(k))).toFixed(1);
    });
    // Photographs remain present while their lane outlines arrive.
    if (p1 > 0.55 && !drawn) { drawn = true; section.classList.add('bend-in'); }
    if (target > progress) queue();
  }
  const queue = () => { if (!raf) raf = requestAnimationFrame(paint); };

  layout();
  if (!reduce.matches) {
    const t0 = performance.now();
    const tick = (now) => { intro = Math.min(0.42, ((now - t0) / 1400) * 0.42); queue(); if (intro < 0.42) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);

  }
  addEventListener('scroll', queue, { passive: true });
  reduce.addEventListener('change', () => {
    if (reduce.matches) {
      lanes.querySelectorAll('path').forEach(p => { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; });
    }
    prime();
  });
  let t;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { layout(); prime(); }, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layout(); prime(); });
})();
