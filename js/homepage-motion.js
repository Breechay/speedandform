/* Motion supports the page; it never gates its content.
   User pause wins. No automatic playback for reduced motion or data saving. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var entries = [];
  function autoAllowed() { return !reduce.matches && !(connection && connection.saveData); }
  function install(videoId, buttonSelector, label, hero) {
    var video = document.getElementById(videoId), button = document.querySelector(buttonSelector);
    if (!video || !button) return;
    var state = { video:video, button:button, visible:false, pausedByUser:false, manual:false, attempt:0, pending:false };
    entries.push(state);
    video.muted = true; video.defaultMuted = true;
    button.hidden = false;
    function paint() {
      var playing = !video.paused && !video.ended;
      button.setAttribute('aria-label', (playing ? 'Pause ' : 'Play ') + label);
      button.setAttribute('title', (playing ? 'Pause ' : 'Play ') + label);
      button.setAttribute('data-action', playing ? 'pause' : 'play');
      if (!hero) button.textContent = playing ? 'Pause' : 'Play';
    }
    function load() {
      if (!video.getAttribute('src') && video.dataset.src) {
        video.src = video.dataset.src;
        video.load();
      }
    }
    function stop() { state.attempt++; video.pause(); paint(); }
    function play() {
      if (document.hidden || state.pausedByUser || state.pending || !video.paused) return;
      load();
      var attempt = ++state.attempt;
      state.pending = true;
      try {
        var playing = video.play();
        if (playing && typeof playing.then === 'function') playing.then(function () {
          state.pending = false;
          if (attempt !== state.attempt || document.hidden || state.pausedByUser || !state.visible) {
            video.pause();
          }
          paint();
        }).catch(function () { state.pending = false; paint(); });
        else state.pending = false;
      } catch (_) { state.pending = false; paint(); }
    }
    state.sync = function () {
      if (state.visible && !document.hidden && !state.pausedByUser && (autoAllowed() || state.manual)) play();
      else stop();
    };
    button.addEventListener('click', function () {
      if (!video.paused) { state.pausedByUser = true; state.manual = false; stop(); }
      else {
        state.pausedByUser = false; state.manual = true; state.visible = true;
        // Keep play in the gesture call stack for mobile browser policy.
        play();
      }
    });
    video.addEventListener('playing', function () { if (hero) video.classList.add('is-playing'); paint(); });
    video.addEventListener('pause', paint);
    video.addEventListener('error', function () {
      if (hero) video.classList.remove('is-playing');
      paint();
      button.setAttribute('aria-label', 'Retry ' + label);
    });
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (changes) {
        state.visible = changes[0].isIntersecting && changes[0].intersectionRatio >= (hero ? .08 : .2);
        state.sync();
      }, { threshold: [0, .08, .2, .5] });
      observer.observe(video);
    }
    // Without an observer, leave a usable poster and manual Play control.
    paint();
  }
  install('filmA', '.film-toggle', 'background video', true);
  document.addEventListener('visibilitychange', function () { entries.forEach(function (s) { s.sync(); }); });
  function preferenceChanged() {
    entries.forEach(function (s) { if (reduce.matches) s.manual = false; s.sync(); });
  }
  if (reduce.addEventListener) reduce.addEventListener('change', preferenceChanged);
  else if (reduce.addListener) reduce.addListener('change', preferenceChanged);
  if (connection && connection.addEventListener) connection.addEventListener('change', preferenceChanged);
}());
