(() => {
  const figure = document.querySelector('[data-hero-film]');
  if (!figure) return;
  const frame = figure.querySelector('.home-portrait');
  const video = figure.querySelector('.home-portrait-film');
  const play = figure.querySelector('.home-portrait-play');
  const controls = figure.querySelector('.home-film-controls');
  const sound = figure.querySelector('[data-film-sound]');
  const still = figure.querySelector('[data-film-still]');
  const caption = figure.querySelector('[data-film-caption]');
  const place = figure.querySelector('[data-film-place]');
  if (!frame || !video || !play) return;

  const reset = () => {
    try { video.pause(); video.currentTime = 0; } catch {}
    frame.dataset.filmPlaying = 'false';
    controls.hidden = true;
    play.hidden = false;
    video.muted = true;
    if (sound) {
      sound.textContent = 'Sound';
      sound.setAttribute('aria-label', 'Turn sound on');
    }
    if (caption) caption.textContent = 'Brice · Coach';
    if (place) place.textContent = 'Miami, FL';
  };

  const start = async () => {
    frame.dataset.filmPlaying = 'true';
    play.hidden = true;
    controls.hidden = false;
    video.muted = true;
    if (caption) caption.textContent = 'From the practice';
    if (place) place.textContent = 'Miami';
    try {
      video.currentTime = 0;
      await video.play();
    } catch {
      reset();
    }
  };

  play.addEventListener('click', start);
  still?.addEventListener('click', reset);
  video.addEventListener('ended', reset);
  video.addEventListener('error', reset);

  sound?.addEventListener('click', () => {
    video.muted = !video.muted;
    sound.textContent = video.muted ? 'Sound' : 'Mute';
    sound.setAttribute('aria-label', video.muted ? 'Turn sound on' : 'Mute practice film');
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && frame.dataset.filmPlaying === 'true') video.pause();
  });
})();