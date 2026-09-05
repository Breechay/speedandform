#!/usr/bin/env python3
"""Collect every authored FORM note into one archive. Read-only.

Archaeology, not curation: the writing is copied out exactly as authored, from
wherever it actually lives. Nothing is rewritten, merged, reordered by quality,
or classified into a Journal/Method architecture that does not exist yet.
"""
import html as H, io, json, os, re, subprocess, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

def strip(fragment):
    """HTML fragment → plain text, keeping paragraph breaks."""
    t = re.sub(r'<br\s*/?>', '\n', fragment)
    t = re.sub(r'</(p|h1|h2|h3|div|li|figure|blockquote)>', '\n\n', t)
    t = re.sub(r'<[^>]+>', '', t)
    t = H.unescape(t)
    t = re.sub(r'[ \t]+', ' ', t)
    t = re.sub(r'\n{3,}', '\n\n', t)
    return '\n'.join(line.strip() for line in t.split('\n')).strip()

pieces = []

# ── 1 · /notes — the photographed FORM Note series ─────────────────────────
src = io.open('notes.html', encoding='utf-8').read()
def meta(prop):
    m = re.search(rf'<meta property="{prop}" content="([^"]*)"', src)
    return H.unescape(m.group(1)) if m else None
body = src[src.find('<article'):src.find('</article>')]
pieces.append({
    'title': strip(re.search(r'<h1 class="line">(.*?)</h1>', body, re.S).group(1)),
    'deck': meta('og:description'),
    'status': 'published',
    'date': None,
    'category': 'FORM Note — photographed series',
    'source': 'notes.html  ·  route /notes',
    'slug': 'note-001',
    'subject': strip(re.search(r'<p class="who">(.*?)</p>', body, re.S).group(1)),
    'kicker': strip(re.search(r'<p class="kicker">(.*?)</p>', body, re.S).group(1)),
    'body': strip(re.search(r'<div class="reason">(.*?)</div>', body, re.S).group(1)),
    'close': strip(re.search(r'<p class="close">(.*?)</p>', body, re.S).group(1)),
    'media': re.search(r'<img src="([^"?]+)', body).group(1),
})

# ── 2 · /field-notes — the training-culture essays ─────────────────────────
# The three fields are read individually rather than by slicing the enclosing
# block: `note-num` and `note-title` are spans, so a block slice put the title
# into the body twice, and the closing </div> ran past the last note into the
# page footer, appending the site navigation to Note 08.
src = io.open('field-notes.html', encoding='utf-8').read()
found = re.findall(
    r'<span class="note-num">(.*?)</span>\s*'
    r'<span class="note-title">(.*?)</span>\s*'
    r'<div class="note-body">(.*?)</div>\s*</div>', src, re.S)
declared = src.count('<div class="note">')
if len(found) != declared:
    sys.exit(f'field notes: matched {len(found)} of {declared} blocks')
for num, title, text in found:
    num = strip(num)
    pieces.append({
        'title': strip(title),
        'deck': None, 'status': 'published', 'date': None,
        'category': 'Field Note — training culture',
        'source': 'field-notes.html  ·  route /field-notes',
        'slug': num.lower().replace(' ', '-') or None,
        'subject': None, 'kicker': num,
        'body': strip(text), 'close': None, 'media': None,
    })

# ── 3 · the database — athlete-instance writing ────────────────────────────
QUERY = """
select 'Read' kind, a.slug athlete, r.delivery_state st, r.published_at::text pub,
       r.question_answered title, r.athlete_text body, r.created_at::text made
  from reads r left join athletes a on a.id=r.athlete_id
union all
select 'Direction', a.slug, d.delivery_state, d.published_at::text,
       d.protected_variable, d.athlete_text, d.created_at::text
  from directions d left join athletes a on a.id=d.athlete_id
union all
select 'Decision', a.slug, dc.delivery_state, dc.published_at::text,
       dc.decision_type, dc.athlete_text, dc.created_at::text
  from decisions dc left join athletes a on a.id=dc.athlete_id
union all
select 'Record publication', a.slug, 'published', rp.published_at::text,
       rp.headline, rp.summary, rp.created_at::text
  from record_publications rp left join athletes a on a.id=rp.athlete_id
order by 7
"""
db_rows, db_error = [], None
try:
    raw = subprocess.run(['supabase', 'db', 'query', '--linked', QUERY],
                         capture_output=True, text=True, timeout=180).stdout
    db_rows = json.loads(raw[raw.find('{'):raw.rfind('}') + 1])['rows']
except Exception as failure:                      # noqa: BLE001 — reported, not swallowed
    db_error = str(failure)

for row in db_rows:
    pieces.append({
        'title': row.get('title') or '(untitled)',
        'deck': None, 'status': row.get('st'), 'date': row.get('pub') or row.get('made'),
        'category': f"{row['kind']} — athlete-instance writing",
        'source': f"database  ·  {row['kind'].lower().replace(' ', '_')}s",
        'slug': None, 'subject': row.get('athlete'), 'kicker': None,
        'body': row.get('body') or '', 'close': None, 'media': None,
    })

# ── 4 · the archive ────────────────────────────────────────────────────────
today = datetime.date.today().strftime('%-d %B %Y')
out = [f"""# The FORM notes — everything already written

Collected {today}. **Archaeology, not curation.** Every authored note, copied out
exactly as written, from wherever it actually lives. Nothing has been rewritten,
merged, reordered by quality, or sorted into a Journal/Method architecture — that
decision comes after reading this, not before.

{len(pieces)} pieces, from {len({p['source'].split('·')[0].strip() for p in pieces})} sources.

---
"""]

for n, p in enumerate(pieces, 1):
    out.append(f"\n## {n:02d} · {p['title']}\n")
    if p['deck']: out.append(f"*{p['deck']}*\n")
    facts = [f"**{p['category']}**"]
    if p['subject']: facts.append(f"Subject: {p['subject']}")
    if p['status']: facts.append(f"Status: {p['status']}")
    if p['date']: facts.append(f"Date: {p['date'][:10]}")
    out.append('  ·  '.join(facts) + '\n')
    if p['kicker']: out.append(f"`{p['kicker']}`\n")
    out.append('\n' + p['body'] + '\n')
    if p['close']: out.append(f"\n> {p['close']}\n")
    bits = [f"Source: `{p['source']}`"]
    if p['slug']: bits.append(f"Slug: `{p['slug']}`")
    if p['media']: bits.append(f"Media: `{p['media']}`")
    out.append(f"\n<sub>{'  ·  '.join(bits)}</sub>\n\n---\n")

out.append(f"""
# Archaeology

## Found

{len(pieces)} pieces. Two are bodies of editorial writing; the rest is
athlete-instance coaching writing that reads like notes but is not addressed to
a reader.

| | | |
| --- | --- | --- |
| **FORM Note** — photographed series | 1 | `notes.html` · route `/notes` |
| **Field Notes** — training culture | 8 | `field-notes.html` · route `/field-notes` |
| Reads · Directions · Decisions | 4 | database, all Natalie, all `draft` |
| Record publication | 1 | database, published Aug 24 |

## Sources searched

Migrations for every table whose name touches note / read / journal / essay /
editorial / publication / excerpt. The database itself for `reads`,
`directions`, `decisions`, `record_publications`, `movement_reads`,
`coach_private_notes`, `athlete_standing_observations`. `_redirects` for routes
that no longer appear in navigation. The repository for static HTML, Markdown,
JSON and hard-coded content. Git history for deleted note files.

## Orphans

**The FORM Note series has one entry and a series structure.** `notes.html` is a
single note — 001, Hope, a photograph, a kicker, a closing instruction — with
`og/note-001.jpg` and `media/note-001.jpg` beside it. The numbering, the
per-note OG image and the `?v=rd28` asset versioning are all built for a series
that never got a second piece. There is no index; `/notes` IS note 001.

**`coach_private_notes` is empty.** Table, RLS and a panel exist; nothing was
ever written.

**The four database drafts have never been delivered.** Natalie's Read,
Direction and two Decisions sit at `delivery_state = draft`, authored around
23–24 August. The Record publication derived from one of them IS published.

## Ambiguities — yours to rule on

**Two different visual worlds already exist.** `/notes` is dark, Fraunces and
JetBrains Mono, photograph-led, one note per page. `/field-notes` is cream, ink
on paper, Cormorant Garamond and Jost, eight essays stacked on one page. Neither
resembles the FORM Labs language. They are not variations of one system; they
are two designs.

**Is athlete-instance writing part of the Journal at all?** A Read is written to
one athlete about one question. It is some of the best prose in the system, and
publishing it means publishing Natalie. `record_publications` already carries
`consent_recorded_at` for exactly this. Included here so you can see it; not
claimed as Journal material.

**Method-adjacent pages, deliberately NOT extracted.** These are authored, but
they are instructional rather than editorial, and pulling them in would have
decided the Method/Journal split before you have read anything:

| | |
| --- | --- |
| `principles.html` | Operating principles, aphoristic. Closest to a Note. |
| `the-method.html` | 18 KB — how the practice is organised. |
| `the-field.html` | The training group and its field. |
| `perception-manual.html` | 100 KB, twelve chapters, on photography. The largest authored document in the repo. |

Beyond those, `library.html` indexes roughly fifty reference guides — threshold,
easy running, pacing, fuelling, shoes. Instructional, not editorial. Not here.

## Not done, on purpose

No categorisation into Journal or Method. No deduplication. No copy improved.
Nothing migrated, moved or deleted. Both `/notes` and `/field-notes` still serve
exactly what they served before this ran.
""")

io.open('docs/FORM_NOTES_ARCHIVE.md', 'w', encoding='utf-8').write('\n'.join(out))

# ── 5 · the neutral HTML, for reading the body of work end to end ──────────
esc = lambda s: H.escape(s or '')
cards = []
for n, p in enumerate(pieces, 1):
    paras = ''.join(f'<p>{esc(x)}</p>' for x in p['body'].split('\n\n') if x.strip())
    cards.append(f"""<article>
  <div class="meta">{n:02d} &middot; {esc(p['category'])}{
    ' &middot; ' + esc(p['subject']) if p['subject'] else ''}{
    ' &middot; ' + esc(p['status']) if p['status'] else ''}</div>
  <h2>{esc(p['title'])}</h2>
  {f'<p class="deck">{esc(p["deck"])}</p>' if p['deck'] else ''}
  {paras}
  {f'<p class="close">{esc(p["close"])}</p>' if p['close'] else ''}
  <div class="src">{esc(p['source'])}</div>
</article>""")

os.makedirs('design-review/form-notes-archive', exist_ok=True)
io.open('design-review/form-notes-archive/index.html', 'w', encoding='utf-8').write(f"""<!doctype html>
<meta charset="utf-8">
<title>FORM notes — complete archive</title>
<!-- Deliberately plain. This is the body of work laid out for reading, not a
     design for it. Any styling here would start deciding what the Journal is. -->
<style>
  body{{max-width:38em;margin:0 auto;padding:64px 24px 120px;
    font:16px/1.62 Georgia,serif;color:#1b1b1a;background:#faf9f7}}
  h1{{font-size:26px;font-weight:400;margin:0 0 6px}}
  .lede{{color:#666;font-size:14px;margin:0 0 48px}}
  article{{padding:36px 0;border-top:1px solid #e3e0da}}
  h2{{font-size:21px;font-weight:400;line-height:1.3;margin:6px 0 14px}}
  .meta,.src{{font:11px/1.5 ui-monospace,Menlo,monospace;letter-spacing:.06em;
    text-transform:uppercase;color:#8a867e}}
  .src{{margin-top:18px;text-transform:none}}
  .deck{{color:#666;font-style:italic}}
  .close{{padding-left:16px;border-left:2px solid #d8d4cc;color:#444}}
</style>
<h1>The FORM notes</h1>
<p class="lede">{len(pieces)} pieces, collected {today}. Exactly as authored.</p>
{''.join(cards)}
""")

print(f"{len(pieces)} pieces → docs/FORM_NOTES_ARCHIVE.md + design-review/form-notes-archive/index.html")
if db_error: print(f"DATABASE NOT READ: {db_error}", file=sys.stderr)
for p in pieces: print(f"  · {p['category'][:34]:36} {p['title'][:60]}")
