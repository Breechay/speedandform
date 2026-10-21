/* FORM Photos: reshuffle once per page visit; immersive, accessible viewer. */
(() => {
  'use strict';
  const wall = document.getElementById('photo-wall');
  if (!wall) return;

  const frames = Array.from(wall.querySelectorAll('.photo-frame')).filter(frame =>
    frame.querySelector('a[href] img')
  );
  if (!frames.length) return;

  // A fresh order each visit, never while someone is browsing the gallery.
  const randomIndex = (length) => {
    if (window.crypto && window.crypto.getRandomValues) {
      const values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      return values[0] % length;
    }
    return Math.floor(Math.random() * length);
  };
  for (let i = frames.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [frames[i], frames[j]] = [frames[j], frames[i]];
  }

  // The generous opening image always uses a real landscape frame, without cropping.
  const featuredIndex = frames.findIndex(frame => {
    const img = frame.querySelector('img');
    const width = Number(img.getAttribute('width'));
    const height = Number(img.getAttribute('height'));
    return width >= 1400 && height > 0 && width / height >= 1.22;
  });
  if (featuredIndex > 0) frames.unshift(frames.splice(featuredIndex, 1)[0]);
  frames.forEach(frame => frame.classList.remove('photo-featured'));
  frames[0].classList.add('photo-featured');
  const firstImage = frames[0].querySelector('img');
  firstImage.loading = 'eager';
  firstImage.setAttribute('fetchpriority', 'high');
  // The rotating wide lead must use the original high-resolution image,
  // not a 600px card thumb stretched across the whole page.
  firstImage.removeAttribute('srcset');
  firstImage.removeAttribute('sizes');
  firstImage.src = frames[0].querySelector('a').href;
  const fragment = document.createDocumentFragment();
  frames.forEach(frame => fragment.appendChild(frame));
  wall.appendChild(fragment);

  const viewer = document.getElementById('photo-viewer');
  if (!viewer || typeof viewer.showModal !== 'function') return;
  const viewerImage = viewer.querySelector('.photo-viewer-image');
  const counter = viewer.querySelector('.photo-viewer-count');
  const previous = viewer.querySelector('.photo-viewer-previous');
  const next = viewer.querySelector('.photo-viewer-next');
  const close = viewer.querySelector('.photo-viewer-close');
  if (!viewerImage || !counter || !previous || !next || !close) return;

  let position = 0;
  let opener = null;
  let startTouch = null;
  const isOpen = () => viewer.open;
  // Cache only adjacent full-size frames to make swipes responsive without
  // downloading the entire collection or retaining unbounded image objects.
  const nearby = new Map();
  const warm = index => {
    const i = (index + frames.length) % frames.length;
    const url = frames[i].querySelector('a').href;
    if (nearby.has(url)) return;
    const preloader = new Image();
    preloader.decoding = 'async';
    preloader.src = url;
    nearby.set(url, preloader);
    while (nearby.size > 4) nearby.delete(nearby.keys().next().value);
  };
  const show = (index) => {
    position = (index + frames.length) % frames.length;
    const link = frames[position].querySelector('a');
    const thumbnail = frames[position].querySelector('img');
    viewerImage.src = link.href;
    viewerImage.alt = thumbnail.alt || 'FORM photograph';
    counter.textContent = (position + 1) + ' / ' + frames.length;
    previous.disabled = next.disabled = frames.length < 2;
    if (frames.length > 1) { warm(position + 1); warm(position - 1); }
  };
  const navigate = (step) => { if (isOpen()) show(position + step); };

  frames.forEach((frame, index) => {
    const link = frame.querySelector('a');
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      show(index);
      viewer.showModal();
      document.body.classList.add('photo-viewer-open');
      close.focus({ preventScroll: true });
    });
  });

  close.addEventListener('click', () => viewer.close());
  previous.addEventListener('click', () => navigate(-1));
  next.addEventListener('click', () => navigate(1));
  viewer.addEventListener('click', event => {
    if (event.target === viewer) viewer.close();
  });
  viewer.addEventListener('close', () => {
    document.body.classList.remove('photo-viewer-open');
    if (opener && opener.isConnected) opener.focus({ preventScroll: true });
  });

  document.addEventListener('keydown', event => {
    if (!isOpen()) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      navigate(event.key === 'ArrowRight' ? 1 : -1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      viewer.close();
    }
  });

  // Horizontal touch swipes navigate. Vertical movement and pinch gestures remain native.
  viewer.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) { startTouch = null; return; }
    const touch = event.touches[0];
    startTouch = { x: touch.clientX, y: touch.clientY };
  }, { passive: true });
  viewer.addEventListener('touchend', event => {
    if (!startTouch || !event.changedTouches.length) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - startTouch.x;
    const dy = touch.clientY - startTouch.y;
    startTouch = null;
    if (Math.abs(dx) >= 55 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      navigate(dx < 0 ? 1 : -1);
    }
  }, { passive: true });
  viewer.addEventListener('touchcancel', () => { startTouch = null; }, { passive: true });
})();
