"""Athletes (/people/ and /people/<slug>) against fixture server responses shaped like
collective_people_directory() and collective_person(slug) (20261013230000). Checks: the
directory and search, a full profile (chosen fields only, grouped photos, run links in the
app's address form), a hidden or unknown profile, a failed load, and layout at phone and
desktop widths. No live account or API writes."""
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json, os, re
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://form-people.test'
OUT = Path(os.environ.get('PEOPLE_ARTIFACTS', '/tmp/people')); OUT.mkdir(parents=True, exist_ok=True)

DIRECTORY = [
    {'person': {'slug': 'adrian', 'name': 'Adrian', 'avatar': '/assets/athletes/adrian-256.webp', 'instagram': 'fit_with_adrian', 'discipline': 'Marathon'}},
    {'person': {'slug': 'hope', 'name': 'Hope', 'avatar': '/assets/athletes/hope-256.webp', 'instagram': 'hope_finnane', 'discipline': 'Half marathon'}},
    {'person': {'slug': 'jose', 'name': 'José', 'avatar': '/assets/athletes/jose-remote-256.webp', 'instagram': 'josefsantosdesoto', 'discipline': 'Half marathon', 'bio': 'Running Orlando with Hope.'}},
    {'person': {'slug': 'tinius', 'name': 'Tinius', 'avatar': '/assets/athletes/tinius-256.webp', 'instagram': 'tiniusms'}},
]
JOSE = {'slug': 'jose', 'name': 'José', 'avatar': '/assets/athletes/jose-remote-256.webp',
        'hero': {'path': '/media/library/track-dusk-2400.webp', 'focal_x': 0.56, 'focal_y': 0.45},
        'bio': 'Running Orlando with Hope.', 'instagram': 'josefsantosdesoto', 'discipline': 'Half marathon',
        'now': {'title': 'Speed That Endures', 'detail': 'OUC Half · Orlando · December 5', 'url': '/labs/speed-that-endures/'},
        'best': {'event': 'Half marathon', 'time': '1:40:23', 'place': 'Key Biscayne', 'date': '2026-04-12'},
        'library': ['track-dusk'],
        'album': [{'run_id': 'r1', 'run_title': 'Track Thursday', 'starts_at': '2026-10-15T10:15:00+00:00', 'series_id': 'track-thursday',
                   'path': 'runs/r1/a/x.jpg', 'width': 1600, 'height': 1067, 'focal_x': 0.5, 'focal_y': 0.4}]}
SESSION = {'slug': 'adrian-7x800-2026-10-14', 'title': '7 × 800 at 2:44', 'detail': '5:30 a mile · 2:00 jog between', 'date': '2026-10-14',
           'youtube_id': 'dQw4w9WgXcQ', 'clips': [{'youtube_id': 'abcdefghijk', 'title': 'Rep 4'}], 'library': ['dune-path'],
           'people': [{'slug': 'adrian', 'name': 'Adrian', 'avatar': '/assets/athletes/adrian-256.webp'}]}
ADRIAN = {'slug': 'adrian', 'name': 'Adrian', 'avatar': '/assets/athletes/adrian-256.webp', 'instagram': 'fit_with_adrian',
          'hero': {'path': '/media/library/dune-path-2400.webp', 'focal_x': 0.75, 'focal_y': 0.3}, 'library': ['dune-path'], 'album': [],
          'sessions': [SESSION]}
TINIUS = {'slug': 'tinius', 'name': 'Tinius', 'avatar': '/assets/athletes/tinius-256.webp', 'instagram': 'tiniusms',
          'hero': {'path': '/media/library/bw-lead-runner-2400.webp', 'focal_x': 0.6, 'focal_y': 0.35}, 'library': ['bw-lead-runner'], 'album': []}

checks = []
def check(name, ok):
    assert ok, name
    checks.append(name)

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)

    def make(width, fail=False):
        ctx = browser.new_context(viewport={'width': width, 'height': 1000}, reduced_motion='reduce')
        seen = []
        def route(r):
            url = r.request.url; path = urlsplit(url).path
            if 'supabase.co' in url:
                if '/storage/' in url:
                    return r.fulfill(path=str(ROOT / 'media/library/canopy-street-600.webp'), content_type='image/webp')
                body = json.loads(r.request.post_data or '{}'); seen.append((path, body, r.request.headers.get('authorization')))
                if fail: return r.fulfill(status=503, body='{}')
                if path.endswith('/rpc/collective_people_directory'):
                    return r.fulfill(status=200, content_type='application/json', body=json.dumps(DIRECTORY))
                if path.endswith('/rpc/collective_person'):
                    p = {'jose': JOSE, 'tinius': TINIUS, 'adrian': ADRIAN}.get(body.get('slug'))
                    return r.fulfill(status=200, content_type='application/json', body=json.dumps(p))
                if path.endswith('/rpc/collective_session'):
                    se = SESSION if body.get('slug') == SESSION['slug'] else None
                    return r.fulfill(status=200, content_type='application/json', body=json.dumps(se))
                return r.fulfill(status=404, body='[]')
            if url.startswith(BASE + '/'):
                name = unquote(path).lstrip('/')
                if re.match(r'^people/[^/]+/?$', name): name = 'people/template.html'
                if re.match(r'^session/[^/]+/?$', name): name = 'session/template.html'
                for n in [name, name.rstrip('/') + '/index.html']:
                    f = (ROOT / n).resolve()
                    if f.is_relative_to(ROOT) and f.is_file(): return r.fulfill(path=str(f))
                return r.fulfill(status=404, body='')
            return r.abort()
        ctx.route('**/*', route)
        page = ctx.new_page(); errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        return ctx, page, errors, seen

    for w in (390, 1440):
        ctx, page, errors, seen = make(w)
        page.goto(BASE + '/people/'); page.wait_for_function('window.FORM_PEOPLE')
        check(f'{w}: directory lists everyone', page.evaluate('FORM_PEOPLE.total') == 4 and page.locator('#pp-list li').count() == 4)
        check(f'{w}: anonymous reads only', all(a is None for _, _, a in seen))
        page.fill('#pp-find', 'hope'); check(f'{w}: search by name', page.locator('#pp-list li').count() == 1)
        page.fill('#pp-find', '@tiniusms'); check(f'{w}: search by Instagram', page.locator('#pp-list li').count() == 1 and 'Tinius' in page.locator('#pp-list').inner_text())
        page.fill('#pp-find', 'zzz'); check(f'{w}: nobody found says so', 'No one' in page.locator('#pp-note').inner_text())
        page.fill('#pp-find', '')
        check(f'{w}: directory no overflow', page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        page.screenshot(path=str(OUT / f'directory-{w}.png'), full_page=True)

        page.goto(BASE + '/people/jose'); page.wait_for_function('window.FORM_PERSON')
        txt = page.locator('#pp-profile').inner_text()
        check(f'{w}: profile name, bio, best, now', 'José' in txt and 'Running Orlando with Hope.' in txt and '1:40:23' in txt and 'Speed That Endures' in txt)
        check(f'{w}: Instagram link', page.locator('a[href="https://instagram.com/josefsantosdesoto"]').count() == 1)
        check(f'{w}: no Strava without a link', 'Strava' not in txt)
        check(f'{w}: study link', page.locator('a[href="/labs/speed-that-endures/"]').count() == 1)
        check(f'{w}: album photos link to the run, app address', page.locator('a[href="/run/track-thursday-2026-10-15"]').count() == 1)
        check(f'{w}: library photos grouped by kind', page.evaluate('FORM_PERSON.groups') == 2 and 'Track' in txt)
        check(f'{w}: no attendance language', not re.search(r'attend|runs together|at the run', txt, re.I))
        check(f'{w}: profile no overflow', page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        page.evaluate('''async()=>{document.querySelectorAll("img").forEach(i=>i.loading="eager");await Promise.all([...document.images].map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r})));}''')
        page.screenshot(path=str(OUT / f'jose-{w}.png'), full_page=True)

        page.goto(BASE + '/people/tinius'); page.wait_for_function('window.FORM_PERSON')
        t = page.locator('#pp-profile').inner_text()
        check(f'{w}: sections without content are absent', 'Now' not in t and 'Best' not in t and 'Tinius' in t)

        page.goto(BASE + '/people/adrian'); page.wait_for_function('window.FORM_PERSON')
        check(f'{w}: film on the profile links to its session', page.evaluate('FORM_PERSON.sessions') == 1 and page.locator('a.pp-film[href="/session/adrian-7x800-2026-10-14"]').count() == 1)
        check(f'{w}: film labelled', 'film' in page.locator('.pp-sessions').inner_text().lower() and '7 × 800 at 2:44' in page.locator('.pp-sessions').inner_text())
        page.screenshot(path=str(OUT / f'adrian-{w}.png'), full_page=True)
        page.goto(BASE + '/session/adrian-7x800-2026-10-14'); page.wait_for_function('window.FORM_SESSION')
        check(f'{w}: session page plays the film from YouTube (no cookies)', page.locator('iframe[src^="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"]').count() == 1)
        check(f'{w}: clips and people', page.evaluate('FORM_SESSION.clips') == 1 and page.locator('.pp-who a[href="/people/adrian"]').count() == 1)
        check(f'{w}: session no attendance language', not re.search(r'attend|I.m in|at the run', page.locator('#pp-session').inner_text(), re.I))
        check(f'{w}: session no overflow', page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        page.screenshot(path=str(OUT / f'session-{w}.png'), full_page=True)
        page.goto(BASE + '/session/not-published'); page.wait_for_function('window.FORM_SESSION')
        check(f'{w}: unpublished or hidden session is not here', 'isn’t here' in page.locator('#pp-session').inner_text())

        page.goto(BASE + '/people/someone-hidden'); page.wait_for_function('window.FORM_PERSON')
        check(f'{w}: hidden or unknown profile is not here', 'isn’t here' in page.locator('#pp-profile').inner_text())
        check(f'{w}: no page errors', not errors)
        ctx.close()

    ctx, page, errors, _ = make(390, fail=True)
    page.goto(BASE + '/people/'); page.wait_for_function('window.FORM_PEOPLE')
    check('failed directory offers a retry', page.locator('[data-pp-retry]').count() == 1)
    page.goto(BASE + '/people/jose'); page.wait_for_function('window.FORM_PERSON')
    check('failed profile says so, never "not here"', 'can’t be loaded' in page.locator('#pp-profile').inner_text())
    ctx.close(); browser.close()

print(f'people: {len(checks)} checks passed')
