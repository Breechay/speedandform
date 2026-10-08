/* A reading interface over static, versioned sessions. No workout is filed. */
(() => {
  'use strict';
  const root = document.documentElement;
  const select = document.getElementById('week-select');
  const groups = Array.from(document.querySelectorAll('[data-week]'));
  const links = Array.from(document.querySelectorAll('[data-session-link]'));
  const notes = Array.from(document.querySelectorAll('[data-week-note]'));
  if (!select || groups.length !== 6 || links.length !== 3) return;
  const keys = ['frame_a','lower_core','frame_b'];
  const slug = key => key.replaceAll('_','-');
  let state = {week:1,session:'frame_a'};
  function parseHash() {
    const match = /^#week-([1-6])-(frame-a|lower-core|frame-b)(?:-move-([1-8]))?$/.exec(location.hash);
    if (!match) return {week:1,session:'frame_a'};
    const value = {week:Number(match[1]),session:match[2].replaceAll('-','_')};
    if (match[3]) value.exercise = Number(match[3]);
    return value;
  }
  function render(next) {
    state = next;
    select.value = String(next.week);
    document.querySelector('.skip-link').href = `#week-${next.week}-${slug(next.session)}`;
    for (const group of groups) {
      const activeWeek = Number(group.dataset.week) === next.week;
      group.hidden = !activeWeek;
      for (const panel of group.querySelectorAll('[data-session]')) {
        panel.hidden = !activeWeek || panel.dataset.session !== next.session;
      }
    }
    for (const note of notes) note.hidden = Number(note.dataset.weekNote) !== next.week;
    for (const link of links) {
      link.href = `#week-${next.week}-${slug(link.dataset.sessionLink)}`;
      if (link.dataset.sessionLink === next.session) link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    }
    for (const output of document.querySelectorAll('.share-status')) output.textContent = '';
    for (const fallback of document.querySelectorAll('.copy-link-fallback')) fallback.hidden = true;
  }
  function navigate(week, session) {
    const hash = `#week-${week}-${slug(session)}`;
    if (location.hash === hash) { render({week,session}); return; }
    history.pushState(null,'',hash);
    render({week,session});
  }
  select.addEventListener('change', () => navigate(Number(select.value),state.session));
  window.addEventListener('hashchange', () => render(parseHash()));
  window.addEventListener('popstate', () => render(parseHash()));
  window.addEventListener('pageshow', () => render(parseHash()));
  for (const link of links) {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      navigate(state.week,link.dataset.sessionLink);
    });
    link.addEventListener('keydown', event => {
      if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const index = links.indexOf(link);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1
        : (index + (['ArrowRight','ArrowDown'].includes(event.key) ? 1 : -1) + links.length) % links.length;
      links[next].focus();
      navigate(state.week,keys[next]);
    });
  }
  for (const button of document.querySelectorAll('[data-share-session]')) {
    button.addEventListener('click', async () => {
      const row = button.closest('.session-bottom');
      const status = row.querySelector('.share-status');
      const fallback = row.querySelector('.copy-link-fallback');
      const url = new URL(location.pathname,location.origin);
      url.hash = button.dataset.shareSession;
      const title = `Tinius · Week ${state.week} · ${links.find(link=>link.dataset.sessionLink===state.session).querySelector('.session-name').textContent}`;
      fallback.hidden = true;
      status.textContent = '';
      try {
        if (typeof navigator.share === 'function') {
          await navigator.share({title,url:url.href});
          return;
        }
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(url.href);
        status.textContent = 'Link copied.';
      } catch (error) {
        if (error?.name === 'AbortError') return;
        const input = fallback.querySelector('input');
        input.value = url.href;
        fallback.hidden = false;
        status.textContent = 'Copy the link below.';
        input.focus();
        input.select();
      }
    });
  }
  const initial = parseHash();
  if (!/^#week-[1-6]-(frame-a|lower-core|frame-b)(?:-move-[1-8])?$/.test(location.hash)) {
    history.replaceState(null,'',`#week-${initial.week}-${slug(initial.session)}`);
  }
  render(initial);
  root.dataset.strengthEnhanced = 'true';
  for (const element of document.querySelectorAll('[data-enhanced-only]')) element.hidden = false;
})();
