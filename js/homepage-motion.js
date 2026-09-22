/* Motion supports the page; it never gates its content.
   Native muted autoplay is the primary start path. Reduced motion and data
   saving still prevent automatic loading/playback; manual play remains available. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var entries = [];

  function autoAllowed() {
    return !reduce.matches && !(connection && connection.saveData);
  }

  function inViewport(el) {
    var r = el.getBoundingClientRect();
    var h = window.innerHeight || document.documentElement.clientHeight || 0;
    return r.bottom > 0 && r.top < h;
  }

  function install(videoId, buttonSelector, label, hero) {
    var video = document.getElementById(videoId), button = document.querySelector(buttonSelector);
    if (!video || !button) return;

    var state = {
      video: video,
      button: button,
      visible: inViewport(video),
      pausedByUser: false,
      manual: false,
      attempt: 0,
      pending: false
    };
    entries.push(state);

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

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

    function stop() {
      state.attempt++;
      video.pause();
      paint();
    }

    function play() {
      if (document.hidden || state.pausedByUser || state.pending || !video.paused) return;
      load();
      video.autoplay = true;
      var attempt = ++state.attempt;
      state.pending = true;
      try {
        var playing = video.play();
        if (playing && typeof playing.then === 'function') {
          playing.then(function () {
            state.pending = false;
            if (attempt !== state.attempt || document.hidden || state.pausedByUser || !state.visible) {
              video.pause();
            }
            if (hero && !video.paused) video.classList.add('is-playing');
            paint();
          }).catch(function () {
            state.pending = false;
            paint();
          });
        } else {
          state.pending = false;
        }
      } catch (_) {
        state.pending = false;
        paint();
      }
    }

    state.sync = function () {
      if (state.visible && !document.hidden && !state.pausedByUser && (autoAllowed() || state.manual)) {
        play();
      } else {
        stop();
      }
    };

    button.hidden = false;
    button.addEventListener('click', function () {
      if (!video.paused) {
        state.pausedByUser = true;
        state.manual = false;
        stop();
      } else {
        state.pausedByUser = false;
        state.manual = true;
        state.visible = true;
        // Keep play in the gesture call stack for mobile browser policy.
        play();
      }
    });

    video.addEventListener('playing', function () {
      if (hero) video.classList.add('is-playing');
      paint();
    });
    video.addEventListener('pause', paint);
    video.addEventListener('error', function () {
      if (hero) video.classList.remove('is-playing');
      paint();
      button.setAttribute('aria-label', 'Retry ' + label);
    });

    // Give Safari/iOS a native autoplay path: set the source while the element
    // already carries autoplay + muted + playsinline. JS then manages visibility.
    if (autoAllowed()) {
      video.autoplay = true;
      load();
      if (state.visible && !document.hidden) play();
    } else {
      video.autoplay = false;
      video.removeAttribute('autoplay');
    }

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (changes) {
        state.visible = changes[0].isIntersecting && changes[0].intersectionRatio >= (hero ? .08 : .2);
        state.sync();
      }, { threshold: [0, .08, .2, .5] });
      observer.observe(video);
    } else {
      state.sync();
    }

    paint();
  }

  install('filmA', '.film-toggle', 'background video', true);

  document.addEventListener('visibilitychange', function () {
    entries.forEach(function (s) { s.sync(); });
  });

  function preferenceChanged() {
    entries.forEach(function (s) {
      if (reduce.matches) s.manual = false;
      if (!autoAllowed() && !s.manual) {
        s.video.autoplay = false;
        s.video.removeAttribute('autoplay');
      }
      s.sync();
    });
  }

  if (reduce.addEventListener) reduce.addEventListener('change', preferenceChanged);
  else if (reduce.addListener) reduce.addListener(preferenceChanged);
  if (connection && connection.addEventListener) connection.addEventListener('change', preferenceChanged);
}());
