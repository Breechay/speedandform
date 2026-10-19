/* Two-scene FORM entrance: Brice's original still then the published Adrian + Tinius
   film. The still holds the hero until video ACTUALLY plays. Silent, no film controls.
   Reduced Motion and Save-Data render one static photograph. */
(function () {
  'use strict';
  var root = document.querySelector('[data-hero-carousel="ready"]');
  if (!root) return;

  var still = root.querySelector('.home-hero-slide.is-active');
  var filmSlide = root.querySelector('.home-hero-video');
  var video = filmSlide && filmSlide.querySelector('video');
  if (!still || !filmSlide || !video) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var videoURL = 'https://pbgsjjegycacodiltbhn.supabase.co/storage/v1/object/public/collective-films/sessions/adrian-7x800-2026-10-14/9f242ac9-173d-4e76-b203-4304a1d1c1f6.mp4';
  var posterURL = 'https://pbgsjjegycacodiltbhn.supabase.co/storage/v1/object/public/collective-films/sessions/adrian-7x800-2026-10-14/4396f5fd-6fce-4fc0-8841-26b2d02d080e.jpg';
  var visible = true;
  var active = !document.hidden;
  var filmDisabled = reduce || saveData;
  var waiting = false;
  var filmVisible = false;
  var timer = null;
  var watchdog = null;

  function silence() {
    video.defaultMuted = true;
    video.muted = true;
    video.volume = 0;
    video.controls = false;
  }
  function clearTimers() {
    clearTimeout(timer);
    clearTimeout(watchdog);
    timer = null;
    watchdog = null;
  }
  function canPlayHere() { return !filmDisabled && active && visible; }
  function showStill(schedule) {
    waiting = false;
    filmVisible = false;
    clearTimers();
    still.classList.add('is-active');
    filmSlide.classList.remove('is-active');
    video.pause();
    if (schedule && canPlayHere()) timer = setTimeout(startFilm, 8000);
  }
  function startFilm() {
    clearTimers();
    if (!canPlayHere() || waiting || filmVisible) return;
    waiting = true;
    silence();
    if (video.getAttribute('src') !== videoURL) video.src = videoURL;
    video.currentTime = 0;
    var p = video.play();
    if (p && p.catch) p.catch(function () { filmDisabled = true; showStill(false); });
    // No blank hero if a remote video stalls. A later 'playing' event cannot reveal it.
    watchdog = setTimeout(function () {
      if (waiting) { filmDisabled = true; showStill(false); }
    }, 12000);
  }
  function setFilm(url, poster) {
    if (!url || reduce || saveData) return;
    videoURL = url;
    if (poster) video.poster = poster;
    silence();
    video.preload = 'none';
    filmSlide.hidden = false;
    video.removeAttribute('src');
    filmDisabled = false;
    showStill(true);
  }
  video.addEventListener('playing', function () {
    if (!waiting || !canPlayHere()) return;
    clearTimeout(watchdog);
    watchdog = null;
    waiting = false;
    filmVisible = true;
    filmSlide.classList.add('is-active');
    still.classList.remove('is-active');
    timer = setTimeout(function () { showStill(true); }, 37000);
  });
  video.addEventListener('ended', function () { showStill(true); });
  video.addEventListener('error', function () { filmDisabled = true; showStill(false); });
  video.addEventListener('volumechange', silence);
  video.addEventListener('waiting', function () {
    if (filmVisible) {
      // Preserve the photograph rather than freeze on a stalled frame.
      showStill(true);
    }
  });
  document.addEventListener('visibilitychange', function () {
    active = !document.hidden;
    showStill(active && visible);
  });
  window.addEventListener('pagehide', function () {
    active = false;
    showStill(false);
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = !!(entries[0] && entries[0].isIntersecting);
      showStill(visible && active);
    }, { threshold: 0.08 }).observe(root);
  }
  silence();
  if (!filmDisabled) setFilm(videoURL, posterURL);
  else { filmSlide.hidden = true; showStill(false); }

  window.FORM_HERO = {
    enableFilm: setFilm,
    next: function () { if (!filmVisible) startFilm(); else showStill(true); }
  };
})();
