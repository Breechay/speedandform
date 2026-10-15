/* Owner instruction, October 15: the Adrian & Tinius draft stays silent. */
(() => {
  const session = '/adrian-7x800-2026-10-14/';
  const apply = video => {
    if (video.dataset.formSilent || ![video.src, ...Array.from(video.querySelectorAll('source'), s => s.src)].some(url => url.includes(session))) return;
    video.dataset.formSilent = 'true';
    const mute = () => { if (!video.muted) video.muted = true; };
    video.defaultMuted = true; video.muted = true;
    video.addEventListener('volumechange', mute);
    video.addEventListener('play', mute);
  };
  const scan = () => document.querySelectorAll('video').forEach(apply);
  scan(); new MutationObserver(scan).observe(document.documentElement, {subtree:true, childList:true});
})();
