import { accountDestination, hasAccountHint, resolvePlanAccess } from './plan-access.js';
const spanish = document.documentElement.lang.startsWith('es');
const links = [...document.querySelectorAll('a[data-form-account]')];
let access = null;

async function render() {
  access = null;
  links.forEach(link => {
    link.setAttribute('aria-busy', 'true');
    if (hasAccountHint()) link.textContent = spanish ? 'Cuenta →' : 'Account →';
  });
  try {
    access = await resolvePlanAccess();
    const destination = accountDestination(access, spanish);
    links.forEach(link => {
      link.href = destination.href;
      link.textContent = `${destination.label} →`;
      link.setAttribute('aria-label', destination.label);
    });
    document.documentElement.dataset.formAccount = access.signedIn ? 'signed-in' : 'signed-out';
  } catch {
    links.forEach(link => {
      link.textContent = spanish ? 'Cuenta →' : 'Account →';
      link.href = '/athlete/';
      link.setAttribute('aria-label', spanish ? 'Abrir cuenta' : 'Open account');
    });
  } finally { links.forEach(link => link.removeAttribute('aria-busy')); }
}
document.addEventListener('form:account-changed', render);
render();
