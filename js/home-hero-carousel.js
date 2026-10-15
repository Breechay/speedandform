/* FORM homepage: photographic editorial carousel. The film is silent, decorative,
   lazy, and never exposes a control that could unmute it. No tracking. */
(function(){
  'use strict';
  var root = document.querySelector('[data-hero-carousel="ready"]');
  if(!root) return;
  var videoSlide = root.querySelector('.home-hero-video');
  var video = videoSlide && videoSlide.querySelector('video');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var filmURL = 'https://pbgsjjegycacodiltbhn.supabase.co/storage/v1/object/public/collective-films/sessions/adrian-7x800-2026-10-14/9f242ac9-173d-4e76-b203-4304a1d1c1f6.mp4';
  var posterURL = 'https://pbgsjjegycacodiltbhn.supabase.co/storage/v1/object/public/collective-films/sessions/adrian-7x800-2026-10-14/4396f5fd-6fce-4fc0-8841-26b2d02d080e.jpg';
  var slides = [];
  var idx = 0;
  var timer = null;
  var visible = true;
  var active = !document.hidden;

  function refreshSlides() {
    slides = Array.prototype.slice.call(root.querySelectorAll('.home-hero-slide:not([hidden])'));
  }
  function silence() {
    if(!video) return;
    video.defaultMuted = true;
    video.muted = true;
    video.volume = 0;
    video.controls = false;
  }
  function stopClock() {
    if(timer !== null) clearTimeout(timer);
    timer = null;
  }
  function pauseFilm() {
    if(video) video.pause();
  }
  function queue(ms) {
    stopClock();
    if(!reduce && active && visible && slides.length > 1) {
      timer = setTimeout(next, ms);
    }
  }
  function show(i) {
    if(!slides.length) return;
    idx = (i + slides.length) % slides.length;
    slides.forEach(function(slide, n){ slide.classList.toggle('is-active', n === idx); });
    pauseFilm();
    if(slides[idx] === videoSlide && video && !reduce && !saveData && active && visible) {
      silence();
      video.currentTime = 0;
      video.play().catch(function(){ next(); });
      // If media never finishes, the homepage still advances to the next photograph.
      queue(37000);
    } else {
      queue(8000);
    }
  }
  function next() { show(idx + 1); }
  function enableFilm(url, poster) {
    if(!url || !video || !videoSlide || reduce || saveData) return;
    if(poster) video.poster = poster;
    silence();
    video.preload = 'none';
    video.src = url;
    videoSlide.removeAttribute('hidden');
    videoSlide.setAttribute('data-video-src', url);
    refreshSlides();
  }
  function toggleVisibility() {
    active = !document.hidden;
    if(!active) { stopClock(); pauseFilm(); }
    else if(visible) show(idx);
  }

  if(video) {
    silence();
    video.addEventListener('volumechange', silence);
    video.addEventListener('ended', function(){
      if(slides[idx] === videoSlide) next();
    });
    video.addEventListener('error', function(){
      if(slides[idx] === videoSlide) next();
    });
  }
  refreshSlides();
  enableFilm(filmURL, posterURL);
  document.addEventListener('visibilitychange', toggleVisibility);
  window.addEventListener('pagehide', function(){ active = false; stopClock(); pauseFilm(); });
  if('IntersectionObserver' in window) {
    new IntersectionObserver(function(entries){
      visible = !!(entries[0] && entries[0].isIntersecting);
      if(!visible) { stopClock(); pauseFilm(); }
      else if(active && !reduce) show(idx);
    }, {threshold:0.08}).observe(root);
  }
  if(!reduce) queue(8000);

  // Existing callers only need to advance or enable a new approved, published film.
  window.FORM_HERO = {enableFilm: enableFilm, next: next};
})();
