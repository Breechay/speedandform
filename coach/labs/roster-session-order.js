// loadCoachRoster owns the durable order. This tiny layer only keeps a drag from
// snapping back while the current Console tab is still open; after reload the
// database preference is authoritative again.
const KEY = 'form-console-roster-order-this-tab';
let applying = false;

function roster() { return document.querySelector('.ccRoster'); }
function orderOf(node) { return [...node.querySelectorAll('.ccAthlete[data-slug]')].map((item) => item.dataset.slug); }

function rememberAfterDrop() {
  setTimeout(() => {
    const node = roster();
    if (!node) return;
    try { sessionStorage.setItem(KEY, JSON.stringify(orderOf(node))); } catch {}
  }, 0);
}

document.addEventListener('drop', (event) => {
  if (event.target.closest?.('.ccRoster')) rememberAfterDrop();
}, true);

function apply() {
  if (applying) return;
  const node = roster();
  if (!node) return;
  let order = null;
  try { order = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch {}
  if (!Array.isArray(order) || !order.length) return;
  const bySlug = new Map([...node.querySelectorAll('.ccAthlete[data-slug]')].map((item) => [item.dataset.slug, item]));
  if (!order.some((slug) => bySlug.has(slug))) return;
  applying = true;
  order.forEach((slug) => { const item = bySlug.get(slug); if (item) node.appendChild(item); });
  // Athletes added after the drag remain where the canonical bench placed them.
  applying = false;
}

new MutationObserver(apply).observe(document.documentElement, { childList: true, subtree: true });
apply();
