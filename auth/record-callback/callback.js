import { authErrorMessage, finishAuthCallback } from '/private/auth.js';

const title = document.getElementById('callbackTitle');
const status = document.getElementById('callbackStatus');
const retry = document.getElementById('callbackRetry');

try {
  const destination = await finishAuthCallback();
  status.textContent = 'Signed in. Taking you there…';
  window.location.replace(destination);
} catch (error) {
  title.textContent = 'That link did not open.';
  status.textContent = authErrorMessage(error);
  status.className = 'status-message error';
  retry.hidden = false;
}

