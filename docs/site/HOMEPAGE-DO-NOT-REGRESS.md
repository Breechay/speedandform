# HOMEPAGE — DO-NOT-REGRESS

> **2026-08-18:** `/` is now the Run Development instrument (`index.html` + `home.css` + `home.js`): 01 film, 02 film, 03 first question, then Begin. The counts below are the **July 2026 marketing homepage**, archived in `docs/site/archive/`. Do not use them to “fix” the live instrument back into that page.

**Baseline captured:** 2026-07-15, against `index.html` @ 67,611 bytes / 810 lines.
**v2 applied:** 2026-07-15. File now 69,905 bytes. All invariants below verified held
post-change; the five deltas verified applied. Counts in the table are the **live**
numbers and remain the list to verify against.
**Companion to:** `HANDOFF.md` (site-wide), `HOMEPAGE-DECISION-RECORD.md` (rulings).

> **Verify against THIS list, before your diff, and paste the counts.**
> A checklist built from what you changed will always pass.
> — `NORTH-STAR-ADOPTION.md`, after the FORGE demo was deleted on 2026-07-15.

---

## ⚠ grep is UNSOUND for CSS on this file

`index.html` has **two CSS regimes** in one `<style>` block:

1. **minified, single-line** rules near the top (~lines 27–100)
2. **hand-formatted, multi-line** rules below (~line 105+) — these come **later
   and win the cascade**

`grep -o '\.foo\{[^}]*\}'` is **line-based**. It only ever sees regime 1.

On 2026-07-15 this produced **three consecutive false verifications**: `.start`
was confirmed `background:transparent` three times, and reported as fixed three
times, while a multi-line rule below set `var(--paper2)` and won. The edits were
real; they were applied to dead CSS. The seam stayed on screen throughout.

**Never confirm a CSS property with grep here. Resolve the cascade:**

```bash
python3 - <<'EOF'
import re
s=open('index.html').read()
css=''.join(re.findall(r'<style>(.*?)</style>', s, re.S))
rules=re.findall(r'([^{}@]+)\{([^{}]*)\}', css, re.S)
TARGET, PROP = '.start', 'background'          # <- edit these
for sel, body in rules:
    sels=[x.strip().split('*/')[-1].strip() for x in sel.split(',')]
    if TARGET in sels and PROP in body:
        print(sel.strip().replace('\n',' ')[:60], '->',
              re.search(PROP+r':[^;]*', body, re.S).group(0).replace('\n',' ')[:90])
EOF
```

**The last line printed is the one that renders.** Everything above it is noise.

## ⚠ substring presence is not a structure check

`'class="start"' in html[hero_index:product_index]` is **true whether `.start` is
a child or a sibling** of `.hero`. It cannot fail, so it verifies nothing. This
was used — and passed — while the question was open. Walk the ancestor chain with
a real parser instead:

```bash
python3 - <<'EOF'
from html.parser import HTMLParser
class P(HTMLParser):
    def __init__(s): super().__init__(); s.stack=[]; s.found=None
    def handle_starttag(s,t,a):
        if t in ('img','meta','link','br','input','hr','source'): return
        s.stack.append((t, dict(a).get('class','')))
        if dict(a).get('class')=='start' and not s.found:
            s.found=[f'{x}.{y}' for x,y in s.stack]
    def handle_endtag(s,t):
        for i in range(len(s.stack)-1,-1,-1):
            if s.stack[i][0]==t: del s.stack[i:]; break
p=P(); p.feed(open('index.html').read()); print(' > '.join(p.found))
EOF
```

**Substring counts (`sfTrack`, `data-sf-event`) are unaffected** by the
line-based bug — `grep -o` finds every occurrence on every line. It is only
*rule* matching (`selector{...}`) that breaks. The table below is still sound.

## Baseline counts

```
grep -o 'PATTERN' index.html | wc -l
```

| Pattern | Count | Why it can't go |
|---|---:|---|
| `sfTrack` | **5** | Analytics. Never rename events. |
| `data-sf-event` | **11** | JS selects on these. Silent death if removed. |
| `apps.apple.com` | **2** | The primary conversion. FORM's real store link. |
| `forge-sculpt` | **3** | FORGE routing. Route is frozen (`HANDOFF.md`). |
| `Cormorant` | **4** | Hero signature face. **Signed in POSITIONING-V7.** Not the app's face — this page's face. |
| `Jost` | **20** | Explanatory voice. |
| `JetBrains` | **25** | Structure + instrumentation. |
| `prefers-reduced-motion` | **2** | A11y. Non-negotiable. |
| `loading="lazy"` | **17** | Perf. |
| `aria-` | **20** | A11y. |
| `glass` | **9** | `--glass-light` / `--glass-dark`. **In use.** Do not "ban glass" without reading this. |
| `The next challenge` | **1** | **Documented in POSITIONING-V7** as a deliberate post-chapter placement, not an upsell. Cutting it overrules a signed decision — permitted, but say so. |
| `<script` | **1** | Single block @ line 751. |
| `addEventListener` | **6** | — |

## Real invariants

- Both `apps.apple.com` links resolve and still point at `id6761313085`.
- `sfTrack` fires under unchanged event names.
- Every `data-sf-event` still resolves for the JS that selects on it.
- Reduced-motion path still disables all motion, no degraded meaning.
- The page renders and both doors are usable with **JS disabled**.
- Cormorant still carries the hero italic on *is done*.

## Design tokens — read from `index.html`, never invented

```
--cream       #efe9df      ground
--paper2      #f3ede3
--ink         #29251f      text
--body        #635c52
--muted       #8f877b
--faint       #aaa193
--line        rgba(41,37,31,.09)

--plum        #72506f      FORM conversion accent
--blue        #3c5e7b      FORM instrument palette
--copper      #b56f39
--green       #2e5938

--black       #050608      FORGE ground
--panel       #0d0e11
--panel2      #111216
--bone        #eee8dc      FORGE type
--gold        #c79a3e      FORGE notation
--gold2       #e0b848
--dline       rgba(238,232,220,.1)

--glass-light         rgba(247,243,236,.68)
--glass-light-strong  rgba(247,243,236,.88)
--glass-dark          rgba(8,9,11,.72)

--display-sans  'Jost', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif
--ease-premium  cubic-bezier(.22,1,.36,1)
--nav           76px
```

---

## The five deltas — status

| # | Change | Verified |
|---|---|---|
| 1 | `Start Week 1` → `See the program →` | ✅ `Start Week 1` → **0** |
| 2 | FORGE status label on door + chapter | ✅ `Coming to the App Store` → **2** |
| 3 | `og:image` → `/og/default.jpg` + `og:site_name` | ✅ **4** / **1** |
| 4 | Skip-to-content link | ✅ `.skip-link` → **3** |
| 5 | `srcset` on the 17 lazy images | ❌ **DEFERRED.** Needs generated width variants (640/960/1280/1920). Cannot be added without an image pipeline; adding the attribute without the assets is worse than omitting it. |

**Also applied in v2** (approved in the build brief, beyond the five):
`.hero-device` removed and `.hero` min-height released · router merged into hero ·
`why` → §7 with the 2017 line, "FORM is the group", Hideout credited ·
`method` copy absorbed into FORM's lead · `growth-bridge` cut · §5 added (two
consented athletes) · Library 8 → 4 · `Sculpt your physique` → `See the physique
program` · `/the-field` footer link removed.

### Structural guard for #1 and #2

```yaml
products:
  - id: form
    status: shipped
    store_url: https://apps.apple.com/us/app/form-training/id6761313085
  - id: forge
    status: in_development
    store_url: null
```

Template decides the CTA. Never the author.
**Build fails** if `status != shipped` and the rendered CTA matches
`/download|start week|get the app|install/i`.

This exists because `Start Week 1` survived on a live page while `/forge-sculpt/`
protected `Coming to the App Store` ×3 as an invariant. One page was honest and the
other was not, and only vigilance connected them. Vigilance already lost once.

---

## Not approved without an explicit decision

- Restructuring section order (merging the router into the hero is **proposed**, not approved)
- Cutting `The next challenge` (overrules POSITIONING-V7)
- Any athlete name, quote, or outcome (consent unverified for all 13 `/athletes/` pages)
- Removing glass, Cormorant, or the FORM instrument palette (all signed)
- Renaming anything. The app has been renamed 3×; the group 2×. The budget is spent.
