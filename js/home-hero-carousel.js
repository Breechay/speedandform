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
  var FILM = 'https://pbgsjjegycacodiltbhn.supabase.co/storage/v1/object/public/collective-films/sessions/adrian-7x800-2026-10-14/9f242ac9-173d-4e76-b203-4304a1d1c1f6.mp4';
  var POSTER = 'https://pbgsjjegycacodiltbhn.supabase.co/storage/v1/object/public/collective-films/sessions/adrian-7x800-2026-10-14/4396f5fd-6fce-4fc0-8841-26b2d02d080e.jpg';

  function show(i){
    slides.forEach(function(s, n){ s.classList.toggle('is-active', n === i); });
    idx = i;
    if(slides[i] === videoSlide && video){
      video.play().catch(function(){});
    } else if(video){
      video.pause();
    }
  }

  function next(){
    var nextIdx = (idx + 1) % slides.length;
    show(nextIdx);
  }

  function start(){
    if(reduce || slides.length < 2) return;
    timer = setInterval(next, 8000);
  }

  function enableFilm(url, poster){
    if(!url || !video || !videoSlide) return;
    if(poster) video.poster = poster;
    video.src = url;
    video.muted = true;
    videoSlide.removeAttribute('hidden');
    videoSlide.setAttribute('data-video-src', url);
    // Sound toggle
    var btn = document.createElement('button');
    btn.className = 'home-hero-sound';
    btn.setAttribute('aria-label', 'Toggle sound');
    btn.textContent = 'Sound off';
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      video.muted = !video.muted;
      btn.textContent = video.muted ? 'Sound off' : 'Sound on';
    });
    root.appendChild(btn);
  }

  window.FORM_HERO = { enableFilm: enableFilm, next: next };

  // Activate the hosted film
  if(FILM) enableFilm(FILM, POSTER);

  start();
})();
