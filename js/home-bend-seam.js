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
  let pockets = null;
  if (strip) {
    pockets = document.createElement('div');
    pockets.className = 'bend-pockets';
    pockets.setAttribute('aria-hidden', 'true');
    pockets.innerHTML = '<img src="/media/library/night-pair-track-1200.webp" srcset="/media/library/night-pair-track-1200.webp 1200w, /media/library/night-pair-track-2400.webp 2400w" sizes="100vw" alt="" loading="lazy" decoding="async">';
    section.prepend(pockets);
  }
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
    const cx2 = strip ? Math.min(cx, wide ? Math.max(16, W * 0.03) + outer + rin : W - cx) : 0;
    const cy2 = 3 * rin + outer;
    const tall = strip ? 2 * H1 : H1;
    svg.setAttribute('width', W);
    svg.setAttribute('height', tall + top + 2);
    svg.setAttribute('viewBox', `0 ${-top} ${W} ${tall + top + 2}`);
    svg.style.top = (-top) + 'px';
    lanes.replaceChildren();
    const f = (v) => v.toFixed(1);
    for (let n = 0; n < 9; n++) {
      const r = rin + n * lane;
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', `M-40 ${f(cy - r)}H${f(cx)}A${f(r)} ${f(r)} 0 0 1 ${f(cx)} ${f(cy + r)}H${strip && n ? f(cx2) : -40}`);
      lanes.appendChild(p);
    }
    if (strip) {
      strip.style.height = H1 + 'px';
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
    const mw = Math.min(200, rin * 0.62, W * 0.28); const mh = mw * 290 / 798;
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
      infield.style.clipPath = `path('M-2 0H${f(cx)}A${f(rin)} ${f(rin)} 0 0 1 ${f(cx)} ${f(2 * rin)}H-2Z')`;
    }
    // With the second bend below, the photograph from below fills every pocket the lanes leave:
    // down the left outside the second bend, and the corner outside the first bend on the right.
    // The lanes are the only dark on the band.
    if (strip && pockets) {
      const R = rin + outer, B = 2 * H1;
      let d = `M-2 ${f(2 * rin)}H${f(cx2)}`;
      if (cx2 - R >= -2) {
        d += `A${f(R)} ${f(R)} 0 0 0 ${f(cx2 - R)} ${f(cy2)}A${f(R)} ${f(R)} 0 0 0 ${f(cx2)} ${f(B)}H-2Z`;
      } else {
        const h = Math.sqrt(R * R - (cx2 + 2) * (cx2 + 2));
        d += `A${f(R)} ${f(R)} 0 0 0 -2 ${f(cy2 - h)}Z`;
        d += `M-2 ${f(cy2 + h)}A${f(R)} ${f(R)} 0 0 0 ${f(cx2)} ${f(B)}H-2Z`;
      }
      const dx = W + 2 - cx;
      if (dx < R) {
        const yE = cy + Math.sqrt(R * R - dx * dx);
        d += `M${W + 2} ${f(yE)}V${f(H1)}H${f(cx)}A${f(R)} ${f(R)} 0 0 0 ${W + 2} ${f(yE)}Z`;
      } else {
        d += `M${W + 2} ${f(cy)}V${f(H1)}H${f(cx)}A${f(R)} ${f(R)} 0 0 0 ${f(cx + R)} ${f(cy)}Z`;
      }
      pockets.style.height = B + 'px';
      pockets.style.clipPath = `path('${d}')`;
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
  let lens = [], intro = 0, raf = 0;
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
  function paint() {
    raf = 0;
    if (reduce.matches || !lens.length) return;
    const t = span();
    const p1 = Math.max(strip ? clamp(t / 0.5) : t, intro);
    const p2 = strip ? clamp((t - 0.5) / 0.5) : 0;
    let a = 0, b = 0;
    lanes.querySelectorAll('path').forEach((el, i) => {
      let k;
      if (el.classList.contains('bend-seam-start')) k = clamp((p1 - 0.78) / 0.22);
      else if (el.classList.contains('bend-seam-b')) { k = clamp((p2 - b * 0.035) / (1 - 8 * 0.035)); b++; }
      else { k = clamp((p1 - a * 0.035) / (1 - 8 * 0.035)); a++; }
      el.style.strokeDashoffset = (lens[i] * (1 - ease(k))).toFixed(1);
    });
    if (stripField) stripField.style.opacity = clamp((t - 0.4) / 0.2).toFixed(3);
    if (p1 > 0.55 && !drawn) { drawn = true; section.classList.add('bend-in'); }
  }
  const queue = () => { if (!raf) raf = requestAnimationFrame(paint); };

  layout();
  if (!reduce.matches) {
    const t0 = performance.now();
    const tick = (now) => { intro = Math.min(0.42, ((now - t0) / 1400) * 0.42); queue(); if (intro < 0.42) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    addEventListener('scroll', queue, { passive: true });
  }
  let t;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { layout(); prime(); }, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layout(); prime(); });
})();
