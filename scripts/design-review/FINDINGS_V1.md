# Design pass V1 — audit

> Superseded by **V2** (`?css=v2`, `SPEC_V2.md`), which closes all three defects
> below and both judgment calls. V1 stays loadable — the arrow joining
> `2 MI YOU OWN` to `NEXT ASK` and the shallow landscape composition are its
> ideas, and V2 keeps both.

Brice's first pass, 4 September. Loaded with **`?css=v1`**. 215 lines of CSS
appended to the stylesheet; no markup, data, routing or permission logic touched
(verified — `labs.css` was the only file that differed).

Compare: `#/a/jose/week/8` against `?css=v1#/a/jose/week/8`.

---

## What it solved

**The progression reads as one statement.** `2 MI YOU OWN → NEXT ASK 5 mi`, joined
by an arrow on `.wOwned::after`. This was the top item on the compromises list —
the two halves previously shared neither baseline nor scale and read as two
controls that happened to be adjacent. Solved.

**The summary stopped being a dashboard.** Five equal cards became one factual
strip with hairline dividers, and the lime cell carries a faint gradient instead
of competing on equal footing.

**Landscape went from zero days visible to four.** A shallow hero and a compact
composition, rather than portrait squashed sideways. The most valuable idea in
the pass.

## Three defects

**1 · `CAN ESTABLISH` disappears between 761px and ~1020px.**
`@media (max-width:1100px)` sets `.wSum{overflow-x:auto}` with `flex:0 0 190px`.
Five cells are then 950px of fixed width inside a narrower container, so the
strip scrolls horizontally and the fifth cell is off-screen: **190px hidden at
800, 90px at 900.** It fits again at exactly 1024, which is why the tablet
screenshot looks fine and the bug is easy to miss.

That is the lime cell — the one that says what the week can prove — silently gone
on iPad portrait. Under the frozen lime rule this is the most serious item here.

**2 · The question is clipped under the nav in landscape.**
Measured at 844 × 390: question top 48px, nav bottom 61px, overlapping
horizontally (question 513–830, nav 289–555). The first line of *"How far can you
hold 6:30–6:45"* runs beneath the Plan pill. The shallow hero bought the days
their space by pushing the question into the chrome — which inverts the editorial
spine.

**3 · `body[data-view-as="athlete"] .weekv .wHero{padding-top:72px}` never
applies.** `labs.js` keeps `viewAs` in a module variable and only toggles button
classes; `document.body.getAttribute('data-view-as')` is `null`. The rule is
inert. If an athlete-specific rule is wanted, the attribute has to be added to
the renderer — a markup change, not a CSS one.

## Two judgment calls, not defects

**Removing the rail moved the emptiness rather than removing it.** Rows are now
1440px wide; the session block caps at 920 and the ink ends around 1106. **Every
row carries ~334px of empty background**, where the rail previously occupied that
column. The full-width row *background* is what makes it read as void. Compromises
1 and 2 were traded, not closed.

**`MOVES → 8 MI` became a bordered pill.** It reads as a status badge rather than
a statement about what the session can establish. Lime semantics are frozen, so
this is worth deciding deliberately rather than inheriting.

## Untouched by V1, still open

The Full Plan, the session drawer, the bench and the brief. The phone summary's
fifth tile still leaves a hole beside it in both versions.

---

## A correction about the earlier screenshots

Every phone-width PNG produced before this audit was wrong. **Chrome headless
clamps its layout viewport to a 500px minimum** — `--window-size=390` lays out at
500 and crops the image to 390, returning a plausible 390 × 844 picture of the
wrong layout. Proved with a probe page: window 390 and window 430 both report
`innerWidth=500`.

It surfaced because the live emulated render at 390 had no overflow while the PNG
looked clipped. `shots.sh` now renders anything under 500px inside `frame.html`,
an exactly-sized iframe with its own layout viewport, and crops the frame back
out. Verified `innerWidth 390, scrollWidth 390`. Every screenshot in
`screenshots/` was recaptured through it.
