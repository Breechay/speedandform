# FORM — ECOSYSTEM STATE

> **Historical:** Superseded by `FORM_ECOSYSTEM_STATE_v4.md` on September 20, 2026. Keep this file for release history; do not use it as current route/product state.

## v3 · 2026-09-09 · the public site is closed. The work moves to the app.

Supersedes `FORM_ECOSYSTEM_STATE_v2.md`. Status words are used literally, per v2 §0:
`LIVE` means a person can reach it in production and someone checked.

**This document is STATE — what is true right now.** For the full execution sequence, the athlete-app semantic hierarchy, and the iOS authority-sweep rulings, see `FORM_ECOSYSTEM_MASTER_ROADMAP_v1_2026-09-08.md` (`FORM APP Redesign/`) — ROADMAP, what happens next. The two are cross-referenced, not merged: this document does not restate the roadmap's iOS-side findings, and the roadmap's public-site status claims should be read as of 2026-09-08, one day before this document. (2026-09-09 stabilization pass.)

---

# 1. THE PUBLIC SITE — `LIVE`

Verified against `https://speedandform.com`, not against the repo.

| route | what it is |
|---|---|
| `/` | Run Development. Referral-first: the offer, the practice, the instrument, the intake |
| `/plates` | the film + dial + placard page, preserved, still the instrument recording |
| `/plans/` | the plans room |
| `/plans/race-pace-durability/` | Plan 01 · 15 weeks · sub-1:30 half · reads canonical data |
| `/plans/raise-the-ceiling/` | Plan 02 · 6 weeks · 10K · one plan, two athlete views |
| `/labs/` | The Bridge |
| `/labs/speed-that-endures/` | Living Study 01 · Hope + José |
| `/labs/raise-the-ceiling/` | Living Study 02 · Simon + Lisa |
| `/404.html` | rebuilt in the site's own language |

The `FORM.` mark, `#c9ff36` on the dark field and `--lime-ink` `#6b8a0f` on paper
are on every one of them.

## The link graph is closed

No dead ends in either direction:

```
/plans/            → both plans
plan               → its study, and back to /plans/
study              → its plan, and back to /labs/
/labs/ (Bridge)    → both studies and both plans
homepage           → Plans · Labs · Library · Open FORM · Sign in
```

Athlete share links resolve directly:
`/plans/raise-the-ceiling/?athlete=simon` opens in kilometres,
`?athlete=lisa` in her authored mile band.

## `REQUIRES A HUMAN` — the one thing not proven

The homepage intake gates on FormSubmit's `success === "true"`. A 200 from that
relay is not delivery — it answers 200 while waiting for a one-time address
confirmation. Nobody has yet submitted the live form and confirmed the message
arrived in Brice's inbox **and** in Netlify Forms.

This is the only surface on the site that has already failed silently once, and
it is now the front door for every referral. Until a real submission is checked,
treat the intake as `UNVERIFIED`, not `LIVE`.

---

# 2. RAISE THE CEILING — the architecture note that matters

The public plan reads a structured manifest in the repo
(`plans/raise-the-ceiling/plan-data.js`), **not** the canonical `public_plan`
RPC. That is deliberate and it is temporary.

Why: the published-plan shape has no athlete dimension. Verified against the
live RPC — one session per day, per week, and nowhere to put two. Raise the
Ceiling's whole point is that Simon and Lisa share the method and do not share
a Tuesday.

> **Raise the Ceiling is one Plan with two athlete views. It is not two Plans,
> and it must never be recorded as two Plans.**

The manifest is shaped like the object that does not exist yet — `shared` is the
Plan Version, `athletes[]` are the Assignments — so it migrates without the
public page changing.

Target architecture:

```
Plan → Plan Version → Assignment → resolved athlete prescription
```

The Assignment owns what is athlete-specific: working band, effective dates,
deliberate overrides, and divergence from the shared progression. The Plan stays
the reusable method. `public_plan()` stays the reusable-plan projection; a
resolved-plan projection is added rather than contaminating it with athlete data.

Full transcription packet: `docs/FORM_RAISE_THE_CEILING_SPEC_v1.md` in the site
repo (renamed 2026-09-09 from `RAISE_THE_CEILING_CANONICAL_v1.md` — its own text said "NOT canonical yet"), derived from `RAISE_THE_CEILING_plan_v4.md`.

---

# 3. WHAT THE SITE TAUGHT US ABOUT THE APP

The Assignment model is no longer abstract architecture. Raise the Ceiling is a
live product requirement for it: one shared method, two athletes, different
resolved work, published. That moved it up the app sequence.

---

# 4. THE APP — SEQUENCE FROM HERE

1. **Coach Return on Today** — return present / genuinely absent / older return
   that still applies. Designed as RC_01.
2. **Integrated real-phone pass on the José loop** — end to end, on a device.
3. **Assignment model** — the object the site just proved we need.
4. **Delivery of coach-authored plans and overrides** — still the one true
   blocker for the coach's observation reaching the athlete.
5. **Week / Plan / Memory continuity.**
6. **Record.**

Standing laws unchanged: Brice owns prescription; FORM may assemble guidance
from authored material; `pending` is never shown to the athlete; filed receipts
are never re-keyed.

---

# 5. DESIGN-SYSTEM DELTA FOUND WHILE SHIPPING

Lime has no paper value. `#c9ff36` on `#ece6da` measures **1.06:1** — the mark's
period was not dim, it was absent on every paper surface. `--lime` stays the
dark-field colour (16.28:1 on `#07110f`); `--lime-ink` `#6b8a0f` (3.21:1) carries
the same hue onto paper.

This pairing is in use on `/`, `/plans/` and `/404.html`. It needs ratifying into
the design system as a paired token rather than remaining one agent's call.

---

# 6. THE SITE IS CLOSED FOR THIS TRANCHE

> **FORM has a front door → two Plans → two Studies → a Bridge → an intake.**

That is enough infrastructure to support the work. Further polishing of the
public side is displacement. The next thing built is app work.
