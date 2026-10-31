"""Group runs (/runs/ and the album template) against fixture server responses.

The Supabase reads are intercepted with fixtures shaped like the live projections
(collective_public_runs, collective_galleries, collective_album). Checks: rendering of
upcoming, canceled and past rows, album composition parity with the app's
FORMAlbumRow.compose, the viewer, no names on public pages, and layout at six widths."""
from pathlib import Path
from datetime import datetime, timedelta, timezone
import http.server, threading, json, re
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent.parent
out = Path('/tmp/group-runs'); out.mkdir(parents=True, exist_ok=True)
photos = sorted((root / 'assets/practice/20261001').glob('*-800.webp'))
assert len(photos) >= 9


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=str(root), **k)
    def log_message(self, *a): pass
    def translate_path(self, path):
        # Netlify rule: /run/* -> /run/template.html.
        p = path.split('?')[0].split('#')[0]
        if re.match(r'^/run/[^/]+/?$', p):
            return str(root / 'run/template.html')
        return super().translate_path(path)


def iso(d): return d.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S+00:00')


now = datetime.now(timezone.utc)
def at(days, hour=10, minute=15): return (now + timedelta(days=days)).replace(hour=hour, minute=minute, second=0, microsecond=0)

FLAMINGO = dict(meet_name='Flamingo Park Track', meet_address='11 St & Jefferson Ave, Miami Beach, FL 33139')
runs = [
    dict(id='u1', kind='track', series_id='track-thursday', title='Track Thursday', meet_at=iso(at(3, 10, 0)), starts_at=iso(at(3)), group_facts={'meet_point': 'Bench by the bleachers', 'workout_session_id': 'speed-demons', 'host': 'Brice'}, status='scheduled', **FLAMINGO),
    dict(id='u2', kind='long_run', series_id=None, title='Long Run 02', meet_at=iso(at(5, 10, 0)), starts_at=iso(at(5, 10, 10)), meet_name=None, meet_address=None, group_facts={'distance_miles': [12, 15], 'pace': '8:00/mi or slower'}, status='scheduled'),
    dict(id='u3', kind='track', series_id='track-thursday', title='Track Thursday', meet_at=iso(at(10, 10, 0)), starts_at=iso(at(10)), group_facts={}, status='cancelled', **FLAMINGO),
    dict(id='p1', kind='track', series_id='track-thursday', title='Track Thursday', meet_at=iso(at(-12, 10, 0)), starts_at=iso(at(-12)), group_facts={'workout_session_id': 'nice-and-easy'}, status='archived', **FLAMINGO),
    dict(id='p2', kind='long_run', series_id=None, title='Long Run 01', meet_at=iso(at(-17, 10, 0)), starts_at=iso(at(-17, 10, 0)), meet_name='The Labs', meet_address='425 NE 22nd St, Miami, FL 33137', group_facts={'together_miles': 12}, status='archived'),
    dict(id='p3', kind='track', series_id='track-thursday', title='Track Thursday', meet_at=iso(at(-19, 10, 0)), starts_at=iso(at(-19)), group_facts={'workout_session_id': 'speed-demons'}, status='archived', **FLAMINGO),
]
galleries = [dict(run_id='p1', object_path=f'runs/p1/{i}.webp', position=i) for i in range(9)] + \
            [dict(run_id='p3', object_path=f'runs/p3/{i}.webp', position=i) for i in range(5)]
shared_workouts = [dict(run_id='u1', lane='thursday', revision=1,
                        session_title='Speed · 1000 / 600 / 400 × 2', sets=[
    dict(reps=1, meters=1000, recovery=120),
    dict(reps=1, meters=600, recovery=90),
    dict(reps=1, meters=400, recovery=180),
    dict(reps=1, meters=1000, recovery=120),
    dict(reps=1, meters=600, recovery=90),
    dict(reps=1, meters=400, recovery=0),
])]
albums = {
    'p1': dict(revision=1, layout='photo_essay', appearance='cream', published_at=iso(at(-11)), film=None,
               items=[dict(asset=f'a{i}', path=f'runs/p1/{i}.webp', width=1600, height=1067 if i != 2 else 1600, focal_x=0.5, focal_y=0.4, fit=False) for i in range(9)]),
    'p3': dict(revision=1, layout='cover_story', appearance='dark', published_at=iso(at(-18)), film=None,
               items=[dict(asset=f'b{i}', path=f'runs/p3/{i}.webp', width=1600, height=1067, focal_x=0.5, focal_y=0.5, fit=False) for i in range(5)]),
}


def install(page, fail=False, workouts_fail=False):
    def api(route):
        url = route.request.url
        if fail: return route.fulfill(status=503, body='{}')
        if '/rest/v1/collective_public_runs' in url:
            return route.fulfill(status=200, content_type='application/json', body=json.dumps(sorted(runs, key=lambda r: r['starts_at'], reverse=True)))
        if url.endswith('/rpc/form_miami_public_calendar'):
            if workouts_fail: return route.fulfill(status=503, body='{}')
            return route.fulfill(status=200, content_type='application/json', body=json.dumps(shared_workouts))
        if url.endswith('/rpc/collective_galleries'):
            return route.fulfill(status=200, content_type='application/json', body=json.dumps(galleries))
        if url.endswith('/rpc/collective_album'):
            run = json.loads(route.request.post_data or '{}').get('run')
            return route.fulfill(status=200, content_type='application/json', body=json.dumps([albums[run]] if run in albums else []))
        if url.endswith('/rpc/collective_album_people'):
            run = json.loads(route.request.post_data or '{}').get('run')
            rows = [dict(asset='a3', slug='jose', name='José', avatar='/assets/athletes/jose-remote-256.webp', x=None, y=None)] if run == 'p1' else []
            return route.fulfill(status=200, content_type='application/json', body=json.dumps(rows))
        return route.fulfill(status=404, body='[]')
    def media(route):
        n = int(re.search(r'/(\d+)\.webp', route.request.url).group(1))
        route.fulfill(status=200, content_type='image/webp', body=photos[n % len(photos)].read_bytes())
    page.route('**/rest/v1/**', api)
    page.route('**/storage/v1/object/public/collective-media/**', media)


def settle(page):
    page.evaluate('''async()=>{document.querySelectorAll("img").forEach(i=>i.loading="eager");
      await Promise.all([...document.images].map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r})));}''')


def compose(n, layout):  # Python twin of FORMAlbumRow.compose
    rest = list(range(1, n)); rows = []
    if layout == 'contact_sheet': return [('sheet', list(range(i, min(i + 3, n)))) for i in range(0, n, 3)]
    if layout == 'sequence': return [('num', [i]) for i in range(n)]
    rows.append(('lead', [0]))
    if layout == 'cover_story':
        while len(rest) >= 2: rows.append(('pair', rest[:2])); rest = rest[2:]
        if rest: rows.append(('single', rest))
        return rows
    step = 0
    while rest:
        if step % 3 == 1 and len(rest) >= 2: rows.append(('pair', rest[:2])); rest = rest[2:]
        else: rows.append(('single', [rest.pop(0)]))
        step += 1
    return rows


server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'
report = []
with sync_playwright() as p:
    b = p.chromium.launch()
    # compose parity across sizes and layouts
    page = b.new_page(); install(page); page.goto(base + '/runs/', wait_until='domcontentloaded'); page.wait_for_function('window.FORM_GROUP_RUNS')
    for layout in ['photo_essay', 'cover_story', 'sequence', 'contact_sheet']:
        for n in range(1, 13):
            js = page.evaluate('([n,l])=>FORM_GROUP_RUNS_COMPOSE(Array.from({length:n},(_,i)=>i),l).map(r=>r.f)', [n, layout])
            assert js == [r[1] for r in compose(n, layout)], (layout, n, js)
    # the app's share address (FORMCollectiveComposer.slug)
    assert page.evaluate("FORM_GROUP_RUNS_SLUG({title:'Track Thursday',series_id:'track-thursday',starts_at:'2026-10-01T10:15:00+00:00'})") == 'track-thursday-2026-10-01'
    assert page.evaluate("FORM_GROUP_RUNS_SLUG({title:'Long Run 01',series_id:null,starts_at:'2026-09-26T10:00:00+00:00'})") == 'long-run-01'
    assert page.evaluate("FORM_GROUP_RUNS_SLUG({title:'Track Thursday',series_id:'x',starts_at:'2026-10-02T02:30:00+00:00'})") == 'track-thursday-2026-10-01', 'Miami date, not UTC'
    page.close(); report.append({'compose_parity': 'pass', 'slug_parity': 'pass'})

    for w in [375, 390, 430, 768, 1024, 1440]:
        page = b.new_page(viewport={'width': w, 'height': 900}, reduced_motion='reduce')
        errors = []; page.on('pageerror', lambda e: errors.append(str(e)))
        install(page); page.goto(base + '/runs/', wait_until='networkidle'); page.wait_for_function('window.FORM_GROUP_RUNS')
        rows = page.locator('#gr-next-rows .gr-row')
        assert rows.count() == 3, rows.count()
        first = rows.nth(0).inner_text()
        assert 'AM meet' in first and 'Speed · 1000 / 600 / 400 × 2' in first and '1 × 1000m / 120s rest' in first and 'Bench by the bleachers' in first, first
        assert 'Place to be confirmed' in rows.nth(1).inner_text() and '12–15 mi' in rows.nth(1).inner_text()
        assert 'is-off' in rows.nth(2).get_attribute('class') and 'Add to calendar' not in rows.nth(2).inner_text()
        assert page.locator('#gr-mornings .gr-card').count() == 2 and page.locator('#gr-mornings .gr-card.is-lead').count() == 1
        assert page.locator('#gr-mornings .gr-plain').count() == 1
        lead = page.locator('#gr-mornings .gr-card.is-lead')
        assert 'Nice and Easy' in lead.inner_text() and '9 photographs' in lead.inner_text()
        assert re.search(r'^/run/track-thursday-\d{4}-\d{2}-\d{2}/$', lead.get_attribute('href')), lead.get_attribute('href')
        body = page.locator('body').inner_text()
        assert 'Brice' not in body.replace('Brice’s coaching', ''), 'host name leaked'
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'), f'overflow /runs/ {w}'
        if w in (390, 1440): settle(page); page.screenshot(path=str(out / f'runs-{w}.png'), full_page=True)
        assert not errors, errors
        href = lead.get_attribute('href')
        page.goto(base + href, wait_until='networkidle'); page.wait_for_function('window.FORM_GROUP_ALBUM')
        assert page.evaluate('FORM_GROUP_ALBUM.photos') == 9
        assert page.locator('#gr-title').inner_text() == 'Nice and Easy'
        assert page.locator('#gr-sub').inner_text() == 'Flamingo Park Track · 200 / 800 / 400'
        assert page.locator('.gr-essay .gr-lead').count() == 1 and page.locator('.gr-essay .gr-pair.is-wide').count() == len([r for r in compose(9, 'photo_essay') if r[0] == 'pair'])
        assert page.locator('#gr-next-album').is_visible() and 'speed demons' in page.locator('#gr-next-album').inner_text().lower()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'), f'overflow album {w}'
        if w in (390, 1440): settle(page); page.screenshot(path=str(out / f'album-{w}.png'), full_page=True)
        page.locator('.gr-f').nth(3).click()
        assert page.locator('#gr-viewer.is-open').count() == 1 and page.locator('[data-count]').inner_text() == '4 / 9'
        assert page.evaluate('location.hash') == '#a3', page.evaluate('location.hash')
        page.wait_for_selector('[data-people] a[href="/people/jose"]')
        assert 'José' in page.locator('[data-people]').inner_text()
        page.keyboard.press('ArrowRight'); assert page.locator('[data-count]').inner_text() == '5 / 9'
        assert page.locator('[data-people]').is_hidden(), 'tag shown on an untagged photo'
        page.keyboard.press('Escape'); assert page.locator('#gr-viewer.is-open').count() == 0
        assert not errors, errors
        report.append({'width': w, 'status': 'pass'}); page.close()

    # dark cover-story album, deep link to a photo
    page = b.new_page(viewport={'width': 390, 'height': 844}); install(page)
    page.goto(base + '/runs/', wait_until='networkidle'); page.wait_for_function('window.FORM_GROUP_RUNS')
    href = page.locator('#gr-mornings .gr-card').nth(1).get_attribute('href')
    page.goto(base + href + '#b1', wait_until='networkidle'); page.wait_for_function('window.FORM_GROUP_ALBUM')
    assert 'is-dark' in page.locator('body').get_attribute('class')
    assert page.locator('.gr-pair.is-equal').count() == 2 and page.locator('[data-count]').inner_text() == '2 / 5'
    page.keyboard.press('Escape'); settle(page); page.screenshot(path=str(out / 'album-dark-390.png'), full_page=True)
    report.append({'dark_cover_story': 'pass'})
    # an upcoming run's own page: details, no photographs
    page.goto(base + '/runs/', wait_until='networkidle'); page.wait_for_function('window.FORM_GROUP_RUNS')
    run_href = page.locator('#gr-next-rows .gr-row h2 a').first.get_attribute('href')
    page.goto(base + run_href, wait_until='networkidle'); page.wait_for_function('window.FORM_GROUP_ALBUM')
    assert page.evaluate('FORM_GROUP_ALBUM.run') is True and 'add to calendar' in page.locator('#gr-album').inner_text().lower()
    assert page.locator('#gr-workout-title').inner_text() == 'Speed · 1000 / 600 / 400 × 2'
    assert page.locator('.gr-workout-sets li').count() == 6
    assert '2:00 recovery' in page.locator('.gr-workout-sets li').first.inner_text()
    assert '1:30 recovery' in page.locator('.gr-workout-sets li').nth(1).inner_text()
    assert '3:00 recovery' in page.locator('.gr-workout-sets li').nth(2).inner_text()
    assert page.locator('.gr-row .gr-work').count() == 0, 'avoid duplicating the workout summary'
    assert 'Brice' not in page.locator('#gr-album').inner_text(), 'do not expose private names'
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.screenshot(path=str(out / 'run-upcoming-390.png'), full_page=True)
    detail_desktop = b.new_page(viewport={'width': 1440, 'height': 900}); install(detail_desktop)
    detail_desktop.goto(base + run_href, wait_until='networkidle'); detail_desktop.wait_for_function('window.FORM_GROUP_ALBUM')
    assert detail_desktop.locator('.gr-workout-sets li').count() == 6
    assert detail_desktop.evaluate('document.documentElement.scrollWidth<=innerWidth')
    detail_desktop.screenshot(path=str(out / 'run-upcoming-1440.png'), full_page=True)
    detail_desktop.close()
    fallback = b.new_page(viewport={'width': 390, 'height': 844}); install(fallback, workouts_fail=True)
    fallback.goto(base + run_href, wait_until='networkidle'); fallback.wait_for_function('window.FORM_GROUP_ALBUM')
    assert fallback.locator('.gr-workout').count() == 0
    assert 'Speed Demons' in fallback.locator('#gr-album').inner_text(), 'legacy session fallback remains visible'
    fallback.close()
    # unknown address is honest, never another run's album
    page.goto(base + '/run/not-a-run/', wait_until='networkidle'); page.wait_for_function('window.FORM_GROUP_ALBUM')
    assert 'isn’t here' in page.locator('#gr-album').inner_text()
    report.append({'run_page': 'pass', 'unknown_run': 'pass'}); page.close()

    # failure states are never empty-looking
    page = b.new_page(viewport={'width': 390, 'height': 844}); install(page, fail=True)
    page.goto(base + '/runs/', wait_until='networkidle'); page.wait_for_function('window.FORM_GROUP_RUNS')
    assert 'Can’t load runs right now.' in page.locator('#gr-next-rows').inner_text()
    page.goto(base + '/run/track-thursday-2026-10-01/', wait_until='networkidle'); page.wait_for_function('window.FORM_GROUP_ALBUM')
    assert 'can’t be loaded' in page.locator('#gr-album').inner_text()
    report.append({'failure_states': 'pass'}); page.close()

    # 200% text on a phone
    page = b.new_page(viewport={'width': 390, 'height': 844}); install(page)
    page.goto(base + '/runs/', wait_until='networkidle'); page.wait_for_function('window.FORM_GROUP_RUNS')
    page.add_style_tag(content='html{font-size:200%} .gr-what h2{font-size:56px!important} .gr-what p{font-size:32px!important}')
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'), '200% overflow'
    report.append({'enlarged_text': 'pass'})
    b.close()
server.shutdown()
print(json.dumps(report, indent=1))
