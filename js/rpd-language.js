(() => {
  const current = document.documentElement.lang?.toLowerCase().startsWith('es') ? 'es' : 'en';
  const switcher = document.querySelector('[data-rpd-language-target]');

  if (switcher) {
    const target = switcher.getAttribute('data-rpd-language-target');
    try {
      const url = new URL(switcher.getAttribute('href'), window.location.origin);
      url.search = window.location.search;
      url.hash = window.location.hash;
      switcher.setAttribute('href', `${url.pathname}${url.search}${url.hash}`);
    } catch {}

    switcher.addEventListener('click', () => {
      try { window.localStorage.setItem('rpd-language', target); } catch {}
    });
  }

  try {
    const stored = window.localStorage.getItem('rpd-language');
    if (!stored) window.localStorage.setItem('rpd-language', current);
  } catch {}
})();
