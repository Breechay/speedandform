(function(){
  'use strict';
  var root = document.querySelector('[data-hero-carousel="ready"]');
  if(!root) return;
  var slides = Array.prototype.slice.call(root.querySelectorAll('.home-hero-slide'));
  var videoSlide = root.querySelector('.home-hero-video');
  var video = videoSlide && videoSlide.querySelector('video');
  var idx = 0;
  var timer;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function show(i){
    slides.forEach(function(s, n){ s.classList.toggle('is-active', n === i); });
    idx = i;
  }

  function next(){
    var nextIdx = (idx + 1) % slides.length;
    // Skip hidden video until it has a source
    if(slides[nextIdx] === videoSlide && !videoSlide.getAttribute('data-video-src')){
      nextIdx = (nextIdx + 1) % slides.length;
    }
    show(nextIdx);
  }

  function start(){
    if(reduce || slides.length < 2) return;
    timer = setInterval(next, 7000);
  }

  // Activate film when the published URL is set
  function enableFilm(url){
    if(!url || !video || !videoSlide) return;
    video.src = url;
    videoSlide.removeAttribute('hidden');
    videoSlide.setAttribute('data-video-src', url);
    // Optional: start muted
    video.play().catch(function(){});
  }

  // Public hook for later: window.FORM_HERO.enableFilm(url)
  window.FORM_HERO = { enableFilm: enableFilm, next: next };

  // If a URL is already in the data attribute, activate it
  var preset = videoSlide && videoSlide.getAttribute('data-video-src');
  if(preset) enableFilm(preset);

  start();
})();
