(() => {
  const title = document.getElementById('handoffTitle');
  const status = document.getElementById('handoffStatus');
  const retry = document.getElementById('handoffRetry');

  const fail = (message) => {
    title.textContent = 'That link did not open.';
    status.textContent = message;
    retry.hidden = true;
  };

  try {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const action = hash.get('continue');
    if (!action) {
      fail('Request a new FORM sign-in link.');
      return;
    }

    const url = new URL(action);
    const allowedHost = 'pbgsjjegycacodiltbhn.supabase.co';
    if (url.protocol !== 'https:' || url.hostname !== allowedHost || url.pathname !== '/auth/v1/verify') {
      fail('Request a new FORM sign-in link.');
      return;
    }

    // Same-tab, same-origin storage survives the short Supabase verification hop.
    // The callback removes this marker after it has handed the verified session to iOS.
    window.sessionStorage.setItem('form-app-signin-handoff', '1');
    window.history.replaceState({}, '', '/auth/app-signin/');
    window.location.replace(action);
  } catch {
    fail('Request a new FORM sign-in link.');
  }
})();
