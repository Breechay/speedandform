# FORM · ROADMAP

The standing ledger. Every open thread lives here, already decided, in order.

**How to use it.** Work top-down within a track. Do not start a track above its gate.
When you finish an item, change its status in place and add the date — do not delete it.
If you disagree with a decision here, say so before building; do not silently redesign.

`[ ]` open · `[~]` in progress · `[x]` done · `[—]` cut, kept for the record

Last updated: 19 Aug 2026.

---

## GATE 0 — ship 38

- `[ ]` **A1 · Commit and push the FORM-iOS working tree.** Branch `cursor/the-plan-binding-93e5` (Track D is on this branch). The tree must not stay local.
- `[ ]` **A2 · Fresh archive from that commit.** Version 38 / Build 5, device family `1,2`. Upload.
- `[ ]` **A3 · Paste the App Store metadata.** `docs/claude-handoff/APP-STORE-COPY.md` in speedandform, copied into this package as `doctrine/APP-STORE-COPY.md`.
- `[ ]` **A4 · Warn the beta athletes before 38 lands.** Everyone opens at W1 / WEEK 1 while their race clock is unchanged. One line: the week counter starts over because the app did; your race clock and your training did not.
- `[ ]` **A5 · Confirm the intake send path end to end.** Phone submit → FormSubmit confirmation email (check spam) → click → real mail arrives. Until that click, nothing forwards.
- `[x]` **A6 · Merge `/mockupc` to `/`.** Live `/` is the plate (`rd44`). *19 Aug 2026*
- `[ ]` **A7 · Send the link to ten people.** Distribution is still the bottleneck. Do not block Track C on this — Brice authorized Today now.

---

## TRACK B — the website

- `[x]` B1 · Plate 03 THE INSTRUMENT: dial, mask, week marks, scroll assembly. *19 Aug*
- `[—]` **B2 · The race line under the disc.** Built, then parked. It read as a weird underline on the sun. Do not put it back unless asked. *19 Aug*
- `[x]` B3 · The W1 margin tab, the ivory placard, the tell. *19 Aug*
- `[x]` B4 · Intake: success gating, mailto fallback, receipt-scale review, text-size-adjust. *19 Aug*
- `[—]` **B5 · Dragon / weather.** Dragon crop and atmosphere mask stay. Cloud parked (wash = dirt smudge; kumo = right medium, wrong crop — cut off on the right). Do not restore unless asked. Archive: `docs/claude-handoff/cloud-parked/`. *19 Aug*
- `[ ]` **B6 · Thin lines are on notice.** A hairline must carry meaning at a glance or it is noise. Where a divider is only separating things, use space.
- `[ ]` B7 · Record the plate, portrait, one full cycle, for Instagram — after 38 is approved.
- `[ ]` B8 · Decide whether `/notes` should be reachable. Currently orphaned by design.

---

## TRACK C — Today becomes the instrument  ← **you are here**

Gate: Brice authorized this now. Spec: `TRACK-C.md`. Tokens: `TOKENS.md`.

The governing idea: **the plan lives in the placard, so Today can hold less.** Today shows today.

- `[ ]` **C1 · The wordmark.** Site FORM lockup — Fraunces, 17px, weight 380, tracking `.22em`, ink on bone.
- `[ ]` **C2 · The typography rule.** New York inside the sun (session name). Fraunces outside (lockup, placard). SF for everything measured. Never a pace in serif. *Do not put Fraunces inside the disc.*
- `[ ]` **C3 · Kill the header.** `Tuesday / the eighteenth of august` dies. The disc already names the day.
- `[ ]` **C4 · The week recedes.** Static blur, clip MON/SUN, do not light the ring.
- `[ ]` **C5 · FILE SESSION becomes the boxed CTA.** Site Begin on bone. SESSION DETAILS stays secondary.
- `[ ]` **C6 · Ivory placard replaces the brown plan sheet.** Instrument steps aside. Not covered.
- `[ ]` **C7 · Editing moves into the placard, concealed.** Rest = the plan. Edit reveals run days, long day, can’t-run, race/goal. Editable ≠ unbounded.
- `[ ]` **C8 · One language for the four movements.** Keep the struck mark. Delete the rings.

---

## TRACK D — the voice audit

Done on FORM-iOS `cursor/the-plan-binding-93e5`, commit `8f48483b Complete athlete-facing voice audit`. *19 Aug 2026*

- `[x]` D1 · classified → recorded
- `[x]` D2 · condition can’t judge it → this kind of session can’t tell me
- `[x]` D3 · too few sessions to move a number → not enough times to change your paces
- `[x]` D4 · Program Director → Plan changes / Your plan
- `[x]` D5 · athlete-facing **your paces** / **planned pace**
- `[x]` D6 · VoiceOver: filed / not filed / rest / no session
- `[x]` D7 · Sweep + language guard

Do not reopen unless a Track C string fails the guard.

---

## TRACK E — the world with rules

Gate: Track C landed. Atmosphere on a surface still being rebuilt is wasted work.

- `[ ]` **E1 · Wire the chapter close.** Four full-screen takeovers in Brice’s voice, firing when a block binds. Zero production call sites today. Wiring, not design.
- `[ ]` **E2 · The Week Print.** Archive, never recap. No totals as achievement.
- `[ ]` **E3 · Marks as building material.** A type gets a mark in both places or in neither.
- `[ ]` **E4 · Motion grammar.** 30–90s, 2–6px. *Was that there before,* never *there it goes.*
- `[ ]` **E5 · One tactile signature.** Soft haptic on filing. Silent. No sound.
- `[ ]` **E6 · Never show the whole dragon.** Fragments, across surfaces, over years. Never a mascot, never a reward. Reveal on calendar/campaign truth, never on compliance.

---

## DECIDED — do not re-litigate

- **Time makes the marks, not merit.** A day run and a day not run both leave a mark; only the character differs. Nothing may read as a score, a streak, or a completion.
- **Clouds are not weather data and not a plan tier.**
- **No sound.** The haptic is the signature.
- **Depth by focus, not by blurring the page.**
- **The outgoing must be gone before the incoming arrives.**
- **Opacity may transition; filter never does.**
- **Show, don’t tell.** No legends.
- **Payment is Zelle, arranged in the reply.** No cart, no Stripe.
- **Phase changes may alter air, saturation and crop. They may never read as approval or warning.**
- **Brown placard is out.** Ivory on bone.
- **The plan is behind the tab.** Today is not the week.
- **Race line is parked.**

---

## OPEN — needs Brice, not an agent

- `[ ]` Confirm the mark vocabulary against the real dial: do Intervals and Speed actually differ in the app, or did the site invent a distinction?
- `[ ]` Whether `/notes` becomes reachable (B8).
- `[ ]` The Observation Close amendment: for a named-athlete note, is the Close “the sensation to go find, and what produces it” rather than “the decision it changes”?
