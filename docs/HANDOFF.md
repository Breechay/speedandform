# Handoff · 2026-08-29

Two repos. `~/Documents/speedandform` is the website and database. `~/FORM-iOS`
is the iOS app. They do not talk to each other and are not supposed to yet.

## Read these first, in this order

1. `docs/COACH_CONSOLE_BRIEF.md` — **Draft, not ratified.** The current authority
   for the desk. Read it before touching the desk.
2. `docs/FORM_MASTER.md` — how Brice coaches, and Part I.5: the app is not law.
3. `docs/VOICE_LAW.md` and `docs/ATHLETE_COACHING_SYSTEM.md` — voice and structure.
4. `docs/ROADMAP.md` — build state. Sections 3 and 5 were corrected on 2026-08-28
   after reading both codebases; earlier text in other docs may still be stale.

Document authority order, highest first: Brice's live decisions and actual athlete
evidence, then `ATHLETE_COACHING_SYSTEM.md`, then `FORM_MASTER.md`, then
`ROADMAP.md`, then the console brief, then anything else. Agent proposals are
input, never authority.

## The single most important fact

**The website is Brice's instrument. It is not an athlete product.**

Athletes train in the FORM app. Brice sends them what they need. Nothing in the
coaching model depends on an athlete opening a web page. Sign-in stays and
Natalie's page stays working, but no design decision is made to serve an athlete's
engagement with the site.

## How work actually gets done here

- **Never deploy casually.** Pushing to `main` triggers a paid Netlify build.
  Branch pushes and deploy previews are off. Batch changes.
- **Run all four checkers before committing**, and know what each does not do:
  - `node scripts/check-syntax.mjs` parses every module as the browser would.
    Plain `node --check` does **not** catch module-level syntax errors.
  - `node scripts/check-modules.mjs` resolves called identifiers to imports.
  - `node scripts/check-dom.mjs` matches `form.elements.x` to real markup.
  - `node scripts/check-copy.mjs` fails on em dashes in rendered copy.
- Migrations: `npx --yes supabase@latest db push --linked`. Project ref
  `pbgsjjegycacodiltbhn`, already linked.
- The app repo is Brice's and is dirty. Keep any change there purely additive and
  commit only the file you touched.

## Standing laws that keep getting rediscovered

**No generated coaching, ever.** Only Brice writes coaching text. Fabricated
coaching was published under his name once and had to be retracted. Silence
beats filler.

**No em dashes in rendered copy.** En dashes are fine for ranges.

**Plain spoken English.** No coach vocabulary: protocol, stimulus, consolidate,
prescribed, taper, held easy. Write like a text message.

**The proof ladder and the block are different shapes.**
`1 · 2 · 5 · 6 · 8 · 10 · 13.1` is how far has become believable, one rung per
capability. `2 · 5 · 6 · 6 · 8 · 8 · 10 · 6 · 4` is what the block asks, in order.
Repeated sixes and eights belong to the evidence, never to the ladder. This was
conflated once and had to be reverted.

**Nothing advances a ladder automatically.** A judgment records what evidence did
to the claim. Moving a rung is a separate explicit decision by Brice.

**No confidence score and no replacement for one.** Not a count, not a density,
not "2 pieces of evidence". Those are all scores in other clothes.

**Never delete and recreate `mark_checkpoints` rows.** A migration did, and it
irreversibly erased every `current` state; the table has no audit trigger. Update
or append in place.

## The recovery inversion, and why it matters

Hope's floats on 25 Aug were recorded as "3:00 each, run hard". Her Garmin says
**10:01 · 12:12 · 12:12** against her own 8:48 easy. She barely ran them, which is
why she could hold 6:19, and it is exactly what Brice meant by "recovered a bit
too much". The record told the opposite story on the one surface whose job is
reading evidence correctly.

**Every outside agent asked about this so far has repeated the inverted version.**
If you see "3:00 hard" or "recoveries too short" anywhere, it is wrong.

The real discriminator is each athlete against **their own easy pace**. Jose's
floats sit within 14s of his 8:16. Hope's run up to 204s slower than her 8:48.
`session_verdicts` computes this; `easy_pace` is exposed on the view.

## Current state

**Done and live:** Apple sign-in and custom SMTP; the shared doorway with
password, magic link and Apple; session authoring, revision, filing and
correction from the desk; the three mechanical verdicts; claim judgments; the
capability ladder; the squad strip; repeated exposures; surface and conditions on
a completion; screenshots as collapsed provenance.

**The filing transaction is server-authoritative.** `file_session` and
`correct_session` are the only way a coach creates or changes a completion; the
insert and update policies are dropped. Both the browser and any agent must go
through them. They validate membership, status, athlete identity of the linked
session, future dates, and piece kinds as a set before writing.

**Waiting on Brice:**
- Ratify the console brief, or amend it further.
- **Restore each athlete's current rung by hand.** A bad migration erased them and
  they cannot be recovered. Click the numeral that should be lime on Hope, Jose
  and Marcus. Natalie's rows were never touched.
- The Apple client secret expires **2027-02-24**. Regenerate with
  `node scripts/apple-client-secret.mjs keys/AuthKey_CQ9529MR2K.p8 | pbcopy`.
  The signing key is in `keys/`, gitignored because `publish = "."` makes the repo
  root the web root.

**Known open, not started:**
- An intake brief for the agent that reads Garmin screenshots.
- A contract test that a judgment cannot move a rung. The law is written and the
  behaviour agrees, but nothing enforces it.
- The app and website seam. See `ROADMAP.md` section 5, corrected.
