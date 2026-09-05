// The published plan, read from the one public door.
//
// `public_plan` is the only way in: the plan tables themselves are behind RLS,
// so an unpublished or revoked plan is not readable even with this key. A plain
// fetch rather than the Supabase SDK — a public page should not ship an auth
// client to render a table.
const URL = 'https://pbgsjjegycacodiltbhn.supabase.co';
const KEY = 'sb_publishable_5Dg5TUvnh2mEo-zCYAbgmw_WHNXKDqj';

export async function publishedPlan(slug) {
  const response = await fetch(`${URL}/rest/v1/rpc/public_plan`, {
    method: 'POST',
    headers: { apikey: KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_slug: slug })
  });
  if (!response.ok) throw new Error(`the plan could not be read (${response.status})`);
  const plan = await response.json();
  if (!plan) throw new Error('no published plan at that address');
  return plan;
}
