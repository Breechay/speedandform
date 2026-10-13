"""Labs · Runs (/coach/runs/) against an in-memory stand-in for Supabase. No live account,
no API writes. The stand-in records every write so the checks can hold the room to the
app's contract: Miami-time instants, append-only changes, one roll row per file, and the
publish order save → stage paths → copy unstaged → publish."""
from pathlib import Path
from datetime import datetime, timedelta, timezone
from urllib.parse import urlsplit, unquote
from zoneinfo import ZoneInfo
from io import BytesIO
import json, os
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://form-runs.test'
OUT = Path(os.environ.get('RUNS_ARTIFACTS', '/tmp/coach-runs')); OUT.mkdir(parents=True, exist_ok=True)
MIAMI = ZoneInfo('America/New_York')
photos = sorted((ROOT / 'assets/practice/20261001').glob('*-800.webp'))
assert photos

now = datetime.now(MIAMI)
def at(days, h=6, m=15): return (now + timedelta(days=days)).replace(hour=h, minute=m, second=0, microsecond=0)
def iso(d): return d.astimezone(timezone.utc).isoformat()
FL = dict(meet_name='Flamingo Park Track', meet_address='11 St & Jefferson Ave, Miami Beach, FL 33139')
past = at(-5)
runs = [
    dict(id='u1', author_kind='form', kind='track', series_id='track-thursday', title='Track Thursday', visibility='public', meet_at=iso(at(2, 6, 0)), starts_at=iso(at(2)), group_facts={'workout_session_id': 'speed-demons'}, status='scheduled', **FL),
    dict(id='u2', author_kind='form', kind='long_run', series_id=None, title='Long Run 02', visibility='members', meet_at=None, starts_at=iso(at(4, 6, 30)), meet_name='The Labs', meet_address='425 NE 22nd St, Miami, FL 33137', group_facts={'distance_miles': [12, 15], 'pace': '8:00/mi'}, status='scheduled'),
    dict(id='p1', author_kind='form', kind='track', series_id='track-thursday', title='Track Thursday', visibility='public', meet_at=iso(at(-12, 6, 0)), starts_at=iso(at(-12)), group_facts={'workout_session_id': 'nice-and-easy'}, status='archived', **FL),
    dict(id='p2', author_kind='form', kind='track', series_id='track-thursday', title='Track Thursday', visibility='public', meet_at=iso(at(-5, 6, 0)), starts_at=iso(past), group_facts={'workout_session_id': 'gauntlet'}, status='archived', **FL),
]
roll = [dict(id=f'r{i}', run_id='p2', draft_path=f'runs/p2/r{i}.jpg', width=1600, height=1067,
             taken_at=iso(past + timedelta(minutes=i)), needs_date=(i == 2), kind='photo', deleted_at=None, created_at=iso(past)) for i in range(3)]
galleries = [dict(run_id='p1', object_path=f'runs/p1/a/{i}.webp', position=i) for i in range(9)]


def jpeg_with_exif(when):
    img = Image.open(photos[0]).convert('RGB')
    exif = Image.Exif(); exif.get_ifd(0x8769)[0x9003] = when.strftime('%Y:%m:%d %H:%M:%S')
    b = BytesIO(); img.save(b, 'JPEG', quality=85, exif=exif.tobytes()); return b.getvalue()


SDK = r'''
const S = window.__S;
const log = (op) => { S.log.push(op); };
function q(table) {
  const st = { table, filters: [], op: 'select', row: null, single: false, maybe: false, after: null };
  const run = async () => {
    if (S.fail && S.fail[table]) return { data: null, error: { message: S.fail[table] } };
    const rows = S.tables[table] || (S.tables[table] = []);
    const match = (r) => st.filters.every(([k, v]) => (v === null ? r[k] == null : r[k] === v));
    if (st.op === 'insert') {
      const rec = Object.assign({ id: st.row.id || ('n' + (rows.length + 1) + Math.random().toString(16).slice(2, 6)) }, st.row);
      if (rows.some((r) => r.id === rec.id)) return { data: null, error: { message: 'duplicate key value' } };
      log({ insert: table, row: rec }); rows.push(rec);
      if (S.loseInsertResponse && table === 'collective_roll_assets') { S.loseInsertResponse = false; return { data: null, error: { message: 'Failed to fetch' } }; }
      return { data: st.single ? rec : [rec], error: null };
    }
    if (st.op === 'update') { const hit = rows.filter(match); hit.forEach((r) => Object.assign(r, st.row)); log({ update: table, row: st.row, n: hit.length }); return { data: hit, error: null }; }
    let out = rows.filter(match);
    if (st.order) out = out.slice().sort((a, b) => (a[st.order[0]] < b[st.order[0]] ? -1 : 1) * (st.order[1] ? 1 : -1));
    if (st.single || st.maybe) return { data: out[0] || null, error: null };
    return { data: out, error: null };
  };
  const b = {
    select() { if (st.op !== 'insert' && st.op !== 'update') st.op = 'select'; return b; },
    eq(k, v) { st.filters.push([k, v]); return b; }, is(k, v) { st.filters.push([k, v]); return b; },
    order(k, o) { st.order = [k, o?.ascending !== false]; return b; }, limit() { return b; },
    insert(row) { st.op = 'insert'; st.row = row; return b; }, update(row) { st.op = 'update'; st.row = row; return b; },
    single() { st.single = true; return b; }, maybeSingle() { st.maybe = true; return b; },
    then(ok, no) { return run().then(ok, no); }
  };
  return b;
}
export const supabase = {
  auth: { getUser: async () => ({ data: { user: { id: 'coach-uid' } }, error: null }), getSession: async () => ({ data: { session: { user: { id: 'coach-uid' } } }, error: null }) },
  from: q,
  async rpc(name, args) {
    log({ rpc: name, args });
    if (S.rpcFail && S.rpcFail[name]) return { data: null, error: { message: S.rpcFail[name] } };
    if (name === 'collective_is_publisher') return { data: S.publisher, error: null };
    if (name === 'collective_galleries') return { data: S.galleries, error: null };
    if (name === 'collective_photo_opt_outs') return { data: S.optOuts, error: null };
    if (name === 'collective_album_draft') return { data: S.drafts[args.run] ? [S.drafts[args.run]] : [], error: null };
    if (name === 'collective_album_save_draft') {
      const d = S.drafts[args.run] || { version: 0 };
      if (d.version !== args.expected) return { data: null, error: { message: 'draft_conflict' } };
      S.drafts[args.run] = Object.assign({}, d, { version: d.version + 1, items: args.items, layout: args.layout, appearance: args.appearance });
      return { data: d.version + 1, error: null };
    }
    if (name === 'collective_album_stage_paths') return { data: args.assets.map((a, i) => ({ asset: a, kind: 'photo', source_bucket: 'collective-gallery-drafts', source_path: `runs/${args.run}/${a}.jpg`, path: `runs/${args.run}/a/${a}.jpg`, staged: i === 0 })), error: null };
    if (name === 'collective_album_publish') { const d = S.drafts[args.run]; if (d.version !== args.expected) return { data: null, error: { message: 'draft_conflict' } }; d.live_revision = (d.live_revision || 0) + 1; return { data: d.live_revision, error: null }; }
    return { data: null, error: { message: 'unexpected rpc ' + name } };
  },
  storage: { from: (bucket) => ({
    async upload(path, blob, opts) { log({ upload: bucket, path, size: blob.size, type: opts.contentType, upsert: opts.upsert }); return { data: { path }, error: null }; },
    async createSignedUrls(paths) { return { data: paths.map((p, i) => ({ signedUrl: S.thumb })), error: null }; },
    async copy(from, to, opts) { log({ copy: bucket, from, to, dest: opts?.destinationBucket }); return { data: {}, error: null }; }
  }) }
};
'''
AUTH = r'''
export async function getAccessContext() { return window.__S.signedIn ? { session: { user: { id: 'coach-uid' } } } : { session: null }; }
export function authErrorMessage(e) { return String(e?.message || e); }
'''

checks = []
def check(name, ok):
    assert ok, name
    checks.append(name)


with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)

    def make(width=1440, publisher=True, signed_in=True, drafts=None, opt_outs=None):
        ctx = browser.new_context(viewport={'width': width, 'height': 1000}, reduced_motion='reduce')
        state = dict(log=[], publisher=publisher, signedIn=signed_in, galleries=galleries, optOuts=opt_outs if opt_outs is not None else [],
                     drafts=drafts or {}, tables={'collective_runs_current': runs, 'collective_roll_assets': [dict(r) for r in roll],
                     'collective_run_changes': [], 'collective_run_details': [], 'collective_runs': []},
                     thumb=BASE + '/assets/practice/20261001/' + photos[0].name)
        ctx.add_init_script('window.__S=' + json.dumps(state) + ';')
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
        page.on('console', lambda m: m.type == 'error' and 'Failed to load resource' not in m.text and errors.append(m.text))
        page.goto(BASE + '/coach/runs/'); page.wait_for_selector('.row, #rows .pad >> nth=0')
        return ctx, page, errors

    S = lambda page: page.evaluate('window.__S')
    no_inline = lambda page: page.evaluate('document.querySelectorAll("[style]").length') == 0

    # --- the list
    ctx, page, errors = make()
    rows = page.locator('.row')
    check('lists four runs', rows.count() == 4)
    text = page.locator('#rows').inner_text()
    check('upcoming before past, upcoming ascending', text.index('UPCOMING') < text.index('PAST') and text.index('Track Thursday') < text.index('Long Run 02'))
    check('live album counted', '9 photos · live' in text)
    check('draft roll counted', 'Draft · 3' in text)
    check('members-only marked', 'Members' in text)

    # --- change time: Miami wall clock → instant
    page.locator('[data-run="u1"]').click()
    check('upcoming pane shows workout', 'Speed Demons' in page.locator('#pane').inner_text())
    page.locator('[data-act="time"]').click()
    d = at(3).strftime('%Y-%m-%d')
    page.fill('input[name=date]', d); page.fill('input[name=meet]', '05:50'); page.fill('input[name=run]', '06:05')
    page.locator('#sheetSave').click(); page.wait_for_function('!document.getElementById("sheet").open')
    ch = [o for o in S(page)['log'] if o.get('insert') == 'collective_run_changes'][-1]['row']
    want = datetime.fromisoformat(d + 'T06:05').replace(tzinfo=MIAMI)
    check('time change in Miami time', datetime.fromisoformat(ch['starts_at'].replace('Z', '+00:00')) == want and ch['kind'] == 'time' and ch['issued_by'] == 'coach-uid')

    # meet after run is refused before it reaches the server
    page.locator('[data-act="time"]').click()
    page.fill('input[name=meet]', '07:00'); page.fill('input[name=run]', '06:15'); page.locator('#sheetSave').click()
    check('meet after run refused', 'before the run' in page.locator('#sheetNote').inner_text())
    page.locator('#sheetCancel').click()

    # --- place, workout, cancel
    page.locator('[data-act="place"]').click(); page.locator('[data-place="The Labs"]').click(); page.locator('#sheetSave').click()
    page.wait_for_function('!document.getElementById("sheet").open')
    ch = [o for o in S(page)['log'] if o.get('insert') == 'collective_run_changes'][-1]['row']
    check('place preset fills name and address', {k: v for k, v in ch.items() if k != 'id'} == dict(run_id='u1', issued_by='coach-uid', kind='place', meet_name='The Labs', meet_address='425 NE 22nd St, Miami, FL 33137'))
    page.locator('[data-act="workout"]').click(); page.select_option('select[name=session]', 'pyramid-intervals'); page.locator('#sheetSave').click()
    page.wait_for_function('!document.getElementById("sheet").open')
    det = [o for o in S(page)['log'] if o.get('insert') == 'collective_run_details'][-1]['row']
    check('workout appended as a detail', det['group_facts'] == {'workout_session_id': 'pyramid-intervals'})
    page.locator('[data-act="cancel"]').click()
    check('cancel says it is final', 'can’t be brought back' in page.locator('#sheetBody').inner_text())
    page.locator('#sheetSave').click(); page.wait_for_function('!document.getElementById("sheet").open')
    ch = [o for o in S(page)['log'] if o.get('insert') == 'collective_run_changes'][-1]['row']
    check('cancel appended', ch['kind'] == 'cancelled')
    page.screenshot(path=str(OUT / 'runs-upcoming-1440.png'))

    # --- new run
    page.locator('#newRun').click()
    nd = at(9).strftime('%Y-%m-%d')
    page.fill('input[name=date]', nd)
    page.locator('#sheetSave').click(); page.wait_for_function('!document.getElementById("sheet").open')
    nr = [o for o in S(page)['log'] if o.get('insert') == 'collective_runs'][-1]['row']
    check('new run shape', nr['author_kind'] == 'form' and nr['kind'] == 'track' and nr['series_id'] == 'track-thursday' and nr['visibility'] == 'public'
          and nr['meet_name'] == 'Flamingo Park Track' and datetime.fromisoformat(nr['starts_at'].replace('Z', '+00:00')) == datetime.fromisoformat(nd + 'T06:15').replace(tzinfo=MIAMI))
    page.locator('#newRun').click(); page.locator('[data-pick="long_run"]').click()
    check('long run hides track fields', page.locator('#trackOnly').is_hidden())
    page.fill('input[name=title]', 'Long Run 03'); page.fill('input[name=date]', nd); page.fill('#fPlaceName', '')
    page.locator('#sheetSave').click()
    check('place required', page.locator('#sheet').evaluate('d=>d.open'))
    page.locator('#sheetCancel').click()
    check('no inline styles (CSP)', no_inline(page))
    check('no page errors (list)', not errors)
    ctx.close()

    # --- album: confirm a date, choose, publish in the app's order
    ctx, page, errors = make(opt_outs=[{'first_name': 'Lisa', 'last_initial': 'M'}])
    page.locator('[data-run="p2"]').click(); page.wait_for_selector('#grid .cell')
    head = page.locator('#albumHead').inner_text()
    check('album named for the workout', 'Gauntlet' in head)
    check('opt-outs named', 'Lisa M.' in head)
    check('publish disabled with nothing chosen', page.locator('#publish').is_disabled())
    for i in range(3): page.locator(f'[data-toggle="r{i}"]').click()
    page.wait_for_function('/Saved/.test(document.getElementById("saveStatus").textContent)')
    check('autosaved with expected version', [o for o in S(page)['log'] if o.get('rpc') == 'collective_album_save_draft'][-1]['args']['expected'] == 0)
    check('date blocks publish', page.locator('#publish').is_disabled() and 'need' in page.locator('.foot').inner_text())
    page.locator('[data-confirm="r2"]').click()
    upd = [o for o in S(page)['log'] if o.get('update') == 'collective_roll_assets'][-1]
    check('date confirm patches needs_date', upd['row']['needs_date'] is False and upd['n'] == 1)
    page.locator('[data-cover="r2"]').click()
    page.wait_for_function('/Saved/.test(document.getElementById("saveStatus").textContent)')
    check('cover moves first', [i['asset'] for i in S(page)['drafts']['p2']['items']] == ['r2', 'r0', 'r1'])
    page.select_option('#layout', 'cover_story'); page.wait_for_function('/Saved/.test(document.getElementById("saveStatus").textContent)')
    page.screenshot(path=str(OUT / 'runs-album-1440.png'), full_page=True)
    mark = len(S(page)['log'])
    page.locator('#publish').click()
    page.wait_for_function('/Live in the app/.test(document.getElementById("saveStatus").textContent)')
    seq = [o for o in S(page)['log'][mark:] if o.get('rpc', '').startswith('collective_album') or 'copy' in o]
    names = [o.get('rpc') or 'copy' for o in seq]
    check('publish order', names == ['collective_album_save_draft', 'collective_album_stage_paths', 'copy', 'copy', 'collective_album_publish'])
    copies = [o for o in seq if 'copy' in o]
    check('copies only unstaged, into the public bucket', all(c['dest'] == 'collective-media' and c['to'].startswith('runs/p2/a/') for c in copies) and len(copies) == 2)
    check('publish uses the saved version', seq[-1]['args']['expected'] == S(page)['drafts']['p2']['version'])
    check('site link after publish', page.locator('#albumHead a[href^="/run/track-thursday-"]').count() == 1)

    # nine at most
    page.evaluate('''()=>{const S=window.__S;for(let i=3;i<12;i++)S.tables.collective_roll_assets.push({id:"x"+i,run_id:"p2",draft_path:"runs/p2/x"+i+".jpg",width:1600,height:1067,taken_at:S.tables.collective_roll_assets[0].taken_at,needs_date:false,kind:"photo",deleted_at:null,created_at:"2026"});}''')
    page.locator('[data-run="p2"]').click(); page.wait_for_selector('[data-toggle="x11"]')
    for i in range(3, 9): page.locator(f'[data-toggle="x{i}"]').click()
    page.locator('[data-toggle="x9"]').click()
    check('nine is the limit', 'nine at most' in page.locator('#saveStatus').inner_text().lower() and len(page.evaluate('window.FORM_RUNS.state().items')) == 9)

    # upload: EXIF on the run day → no date flag; a lost insert response is looked up, not duplicated
    page.wait_for_function('/Saved/.test(document.getElementById("saveStatus").textContent)')
    page.evaluate('window.__S.loseInsertResponse=true')
    page.set_input_files('#files', files=[{'name': 'DSC0001.JPG', 'mimeType': 'image/jpeg', 'buffer': jpeg_with_exif(past + timedelta(minutes=20))}])
    page.wait_for_function('window.FORM_RUNS.state().roll.length===13')
    s = S(page)
    up = [o for o in s['log'] if 'upload' in o][-1]
    ins = [o for o in s['log'] if o.get('insert') == 'collective_roll_assets']
    check('upload to drafts, JPEG, upsert', up['upload'] == 'collective-gallery-drafts' and up['type'] == 'image/jpeg' and up['upsert'] and up['path'].startswith('runs/p2/'))
    check('one roll row, same id as the file', len(ins) == 1 and up['path'] == f"runs/p2/{ins[0]['row']['id']}.jpg")
    row = ins[0]['row']
    check('EXIF read in Miami time', datetime.fromisoformat(row['taken_at'].replace('Z', '+00:00')) == (past + timedelta(minutes=20)).replace(second=0) and row['needs_date'] is False)
    check('prepared at most 3000 px', max(row['width'], row['height']) <= 3000)

    # conflict
    page.evaluate('window.__S.drafts.p2.version+=5')
    page.locator('[data-toggle="x8"]').click()
    page.wait_for_selector('[data-conflict="theirs"]')
    check('conflict banner, publish held', page.locator('#publish').is_disabled() and 'not saved' in page.locator('#saveStatus').inner_text().lower())
    page.locator('[data-conflict="mine"]').click()
    page.wait_for_function('/Saved/.test(document.getElementById("saveStatus").textContent)')
    check('keep mine saves over the latest', page.locator('[data-conflict]').count() == 0)
    check('no inline styles (album)', no_inline(page))
    check('no page errors (album)', not errors)
    ctx.close()

    # --- opt-outs unreadable is said, never zero
    ctx, page, errors = make()
    page.evaluate('window.__S.rpcFail={collective_photo_opt_outs:"boom"}')
    page.locator('[data-run="p2"]').click(); page.wait_for_selector('#grid .cell')
    page.wait_for_function('/can’t be loaded/.test(document.getElementById("albumHead").textContent)')
    check('opt-out failure is not shown as none', 'no photo opt-outs' not in page.locator('#albumHead').inner_text())
    ctx.close()

    # --- access
    ctx, page, _ = make(publisher=False)
    check('non-publisher told', 'can’t publish' in page.locator('#rows').inner_text())
    ctx.close()
    ctx = browser.new_context(); ctx.add_init_script('window.__S={signedIn:false,log:[]};')
    def r2(r):
        p = urlsplit(r.request.url).path
        if p == '/private/auth.js': return r.fulfill(status=200, content_type='text/javascript', body=AUTH)
        if p == '/private/supabase-client.js': return r.fulfill(status=200, content_type='text/javascript', body=SDK)
        if p.startswith('/coach/runs/'):
            f = ROOT / (p.lstrip('/') if not p.endswith('/') else p.lstrip('/') + 'index.html')
            return r.fulfill(path=str(f))
        return r.fulfill(status=200, body='console')
    ctx.route('**/*', r2); page = ctx.new_page(); page.goto(BASE + '/coach/runs/')
    page.wait_for_url('**/coach/console/')
    check('signed out goes to the console sign-in', True)
    ctx.close()

    # --- phone
    ctx, page, errors = make(width=390)
    check('phone: list only', page.locator('#list').is_visible() and page.locator('#pane').is_hidden())
    page.screenshot(path=str(OUT / 'runs-list-390.png'), full_page=True)
    page.locator('[data-run="p2"]').click(); page.wait_for_selector('#grid .cell')
    check('phone: pane only', page.locator('#list').is_hidden() and page.locator('.back').first.is_visible())
    check('phone: no horizontal scroll', page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    page.screenshot(path=str(OUT / 'runs-album-390.png'), full_page=True)
    page.locator('[data-back]').first.click()
    check('phone: back to list', page.locator('#list').is_visible())
    page.locator('[data-run="u1"]').click()
    check('phone: upcoming no horizontal scroll', page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    page.screenshot(path=str(OUT / 'runs-upcoming-390.png'), full_page=True)
    page.locator('[data-back]').first.click(); page.locator('#newRun').click()
    page.screenshot(path=str(OUT / 'runs-new-390.png'))
    check('no page errors (phone)', not errors)
    ctx.close()
    browser.close()

print(f'coach runs: {len(checks)} checks passed')
for c in checks: print(' ·', c)
