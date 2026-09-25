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
    window.history.replaceState({}, '', '/auth/app-signin/');
    if (hash.getAll('continue').length !== 1 || !action) {
      fail('Request a new FORM sign-in email.');
      return;
    }
    const url = new URL(action);
    const allowedHost = 'pbgsjjegycacodiltbhn.supabase.co';
    const allowedTypes = new Set(['invite', 'magiclink', 'signup', 'email']);
    const redirect = new URL(url.searchParams.get('redirect_to'));
    if (url.protocol !== 'https:' || url.hostname !== allowedHost || url.port
        || url.username || url.password || url.pathname !== '/auth/v1/verify' || url.hash
        || url.searchParams.getAll('token').length !== 1 || !url.searchParams.get('token')
        || url.searchParams.getAll('type').length !== 1 || !allowedTypes.has(url.searchParams.get('type'))
        || url.searchParams.getAll('redirect_to').length !== 1
        || redirect.origin !== 'https://speedandform.com'
        || redirect.pathname !== '/auth/record-callback/' || redirect.search || redirect.hash) {
      fail('Request a new FORM sign-in email.');
      return;
    }
    title.textContent = 'Open FORM.';
    status.textContent = 'Tap Continue to sign in. Then open the app.';
    retry.textContent = 'Continue →';
    retry.href = '#';
    retry.hidden = false;
    let opening = false;
    // An email scanner/page preview must not consume a one-use credential.
    // Only this explicit click starts verification; double taps are ignored.
    retry.addEventListener('click', (event) => {
      event.preventDefault();
      if (opening) return;
      opening = true;
      try {
        window.sessionStorage.setItem('form-app-signin-handoff', '1');
        if (window.sessionStorage.getItem('form-app-signin-handoff') !== '1') throw new Error('storage');
        status.textContent = 'Signing in…';
        retry.setAttribute('aria-disabled', 'true');
        window.location.replace(url.toString());
      } catch {
        fail('Open this email in Safari to finish signing in.');
      }
    });
  } catch {
    fail('Request a new FORM sign-in email.');
  }
})();
