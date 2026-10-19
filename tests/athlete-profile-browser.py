"""Your public profile (/athlete/profile/) against an in-memory stand-in for the owner calls
(collective_my_person, collective_update_my_person, collective_remove_my_tag). Checks: fields
shown one by one, a draft line kept with "Use this line", a lost response that did save
(reported as saved), a failed save that did not (reported as not saved, never "nothing
changed"), removing a tag, and no inline styles (CSP). No live account or API writes."""
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json, os
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://form-profile.test'
OUT = Path(os.environ.get('PROFILE_ARTIFACTS', '/tmp/athlete-profile')); OUT.mkdir(parents=True, exist_ok=True)

ME = {'id': 'pj', 'slug': 'jose', 'first_name': 'José', 'last_initial': 'S', 'show_last_initial': False, 'visible': False,
      'public_fields': ['instagram'], 'bio': 'Running Orlando with Hope.', 'bio_confirmed': False, 'instagram': 'josefsantosdesoto',
      'strava_url': None, 'discipline': 'Half marathon', 'now': {'title': 'Speed That Endures', 'detail': 'OUC Half'},
      'best': {'event': 'Half marathon', 'time': '1:40:23'}, 'avatar': None, 'preview': {},
      'tags': [{'id': 't1', 'asset_id': None, 'library_id': 'track-dusk', 'status': 'confirmed'},
               {'id': 't2', 'asset_id': 'a9', 'library_id': None, 'status': 'requested'}]}

SDK = r'''
const S = window.__S;
function apply(c) {
  const m = S.me;
  if ('visible' in c) m.visible = c.visible;
  if ('show_last_initial' in c) m.show_last_initial = c.show_last_initial;
  if ('public_fields' in c) m.public_fields = c.public_fields;
  if ('bio' in c) { m.bio = c.bio || null; m.bio_confirmed = !!c.bio; }
  if ('instagram' in c) m.instagram = c.instagram || null;
  if ('strava_url' in c) m.strava_url = c.strava_url || null;
}
export const supabase = {
  auth: { getSession: async () => ({ data: { session: { user: { id: 'u' } } }, error: null }) },
  async rpc(name, args) {
    S.log.push({ rpc: name, args });
    if (name === 'collective_my_person') return { data: JSON.parse(JSON.stringify(S.me)), error: null };
    if (name === 'collective_update_my_person') {
      if (S.mode === 'lost') { apply(args.changes); return { data: null, error: { message: 'Failed to fetch' } }; }
      if (S.mode === 'fail') return { data: null, error: { message: 'Failed to fetch' } };
      apply(args.changes); return { data: JSON.parse(JSON.stringify(S.me)), error: null };
    }
    if (name === 'collective_remove_my_tag') { S.me.tags = S.me.tags.filter((t) => t.id !== args.tag); return { data: null, error: null }; }
    return { data: null, error: { message: 'unexpected ' + name } };
  }
};
'''
AUTH = r'''
export async function getAccessContext() { return { session: { user: { id: 'u' } } }; }
export async function renderDoorway() {}
export function authErrorMessage(e) { return String(e?.message || e); }
'''

checks = []
def check(name, ok):
    assert ok, name
    checks.append(name)

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    for width in (390, 1280):
        ctx = browser.new_context(viewport={'width': width, 'height': 1000})
        ctx.add_init_script('window.__S=' + json.dumps({'me': ME, 'log': [], 'mode': 'ok'}) + ';')
        def route(r):
            path = urlsplit(r.request.url).path
            if path == '/private/supabase-client.js': return r.fulfill(status=200, content_type='text/javascript', body=SDK)
            if path == '/private/auth.js': return r.fulfill(status=200, content_type='text/javascript', body=AUTH)
            if r.request.url.startswith(BASE + '/'):
                name = unquote(path).lstrip('/')
                for n in [name, name.rstrip('/') + '/index.html']:
                    f = (ROOT / n).resolve()
                    if f.is_relative_to(ROOT) and f.is_file(): return r.fulfill(path=str(f))
                return r.fulfill(status=404, body='')
            return r.abort()
        ctx.route('**/*', route)
        page = ctx.new_page(); errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(BASE + '/athlete/profile/'); page.wait_for_selector('#pf')
        S = lambda: page.evaluate('window.__S')
        txt = page.locator('#app').inner_text()
        check(f'{width}: privacy line', 'Only the details you choose appear publicly. Your full plan, workout logs and coach notes stay private.' in txt)
        check(f'{width}: draft is marked as private until kept', 'stays private until you keep it' in txt)
        check(f'{width}: requested tag shown as waiting', 'Request sent' in txt and 'Brice' not in txt and 'Cancel request' in txt)
        check(f'{width}: no inline styles', page.evaluate('document.querySelectorAll("[style]").length') == 0)
        check(f'{width}: no overflow', page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        page.screenshot(path=str(OUT / f'profile-{width}.png'), full_page=True)

        # Use this line: draft becomes theirs and public
        page.locator('[data-keep]').click(); page.wait_for_function('/saved/i.test(document.getElementById("pfNote").textContent)')
        check(f'{width}: Use this line confirms the bio', S()['me']['bio_confirmed'] is True and 'bio' in S()['me']['public_fields'])

        # switch the profile on, show best time
        page.locator('input[name=visible]').check(); page.locator('input[name=show][value=best]').check()
        page.locator('#pf button[type=submit]').click(); page.wait_for_function('/Saved/.test(document.getElementById("pfNote").textContent)')
        check(f'{width}: chosen fields saved', S()['me']['visible'] is True and 'best' in S()['me']['public_fields'])
        check(f'{width}: preview link once visible', page.locator('a[href="/people/jose"]').count() == 1)

        # lost response, but the write landed: reported as saved
        page.evaluate('window.__S.mode="lost"')
        page.fill('input[name=instagram]', 'jose.runs'); page.locator('#pf button[type=submit]').click()
        page.wait_for_function('/Saved/.test(document.getElementById("pfNote").textContent)')
        check(f'{width}: lost response re-read as saved', S()['me']['instagram'] == 'jose.runs')

        # failed write: says it didn't save, never "nothing changed"
        page.evaluate('window.__S.mode="fail"')
        page.fill('input[name=instagram]', 'other.handle'); page.locator('#pf button[type=submit]').click()
        page.wait_for_function('/didn’t save/.test(document.getElementById("pfNote").textContent)')
        check(f'{width}: failed save says so', 'Nothing changed' not in page.locator('#app').inner_text() and page.locator('input[name=instagram]').input_value() == 'jose.runs')
        page.evaluate('window.__S.mode="ok"')

        # bad Strava link is caught before sending
        page.fill('input[name=strava_url]', 'https://strava.app.link/abc'); page.locator('#pf button[type=submit]').click()
        check(f'{width}: Strava link checked', 'strava.com/athletes' in page.locator('#pfNote').inner_text())

        # remove me from a photo
        page.locator('[data-untag="t1"]').click(); page.wait_for_function('/Removed/.test(document.getElementById("pfNote").textContent)')
        check(f'{width}: tag removed, photo kept', not any(t['id'] == 't1' for t in S()['me']['tags']))
        check(f'{width}: no page errors', not errors)
        ctx.close()
    browser.close()
print(f'athlete profile: {len(checks)} checks passed')
