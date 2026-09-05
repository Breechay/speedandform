# The athlete experience — audit before building

4 September. **Nothing built. Nothing shipped.** Traced against the real app
source and José's and Hope's production records.

---

## A · What José and Hope see today

The app has four tabs: **Today · Week · Progress · Profile**
(`formModeTabOrder = [.practice, .plan, .ledger, .profile]`).

| | state | source |
|---|---|---|
| First screen after sign-in | **EXISTS** — Today | `formResolvedWeekPlans` via `FORMSequenceResolutionCoordinator` |
| Today's session | **EXISTS** | coached feed when Gate A resolves, otherwise the app's own planner |
| A week view | **EXISTS** — the Week tab, labelled *All Days* | `formResolvedWeekPlans` via `FORMWeekGenerator` |
| **Future weeks** | **PARTIAL** | only Progress reads ahead, scanning up to 12 weeks for its runway — there is no athlete-facing "the rest of my block" |
| Session detail on tap | **EXISTS** | same day plan |
| Filing | **EXISTS** | `record_session_from_form` |
| After filing | **EXISTS** — receipt | local ledger |
| Race, goal, block position | **PARTIAL** | Progress has a race screen with a goal label; not on Today or Week |
| **The coaching question** | **MISSING, and it cannot arrive** | `athlete_plan_feed` does not send it — see below |
| **What they own** | **MISSING, and it cannot arrive** | same |

### The payload gap

`FORMPlanFeed` decodes athlete, block, weeks, sessions, versions and components.
That is the prescription and nothing else. **`athlete_plan_feed` sends no mark,
no current question, no checkpoint, no established value.** So:

> `How far can you hold 6:30–6:45 without it coming apart?` and `2 MI YOU OWN`
> — the two things we just spent the day making the athlete-facing centre of the
> plan — **physically cannot reach the phone today.** It is a server change, not
> an app change.

`block.purpose` and `block.name` do arrive, so *Race Pace Durability* can appear
now. The question and the ownership cannot.

## B · Gap map — reuse versus build

**Reusable as-is:** the four-tab shell, Today, the Week tab, session detail,
filing, the receipt, and `formResolvedWeekPlans` as the single authority. The
whole Gate A dispatcher is right and does not need touching.

**Server, before any UI work:** extend `athlete_plan_feed` with the mark, its
question, its established value and its checkpoints. Small, additive, and it
unblocks everything athlete-facing we designed today.

**Build:** a *Full Plan* surface. Nothing in the app shows the block beyond the
current week.

**Do not build:** a second plan model, a preview renderer, or an athlete copy of
the matrix fed from different data.

## C · Proposed navigation

Athlete: **Today → This Week → Full Plan**, with `THIS WEEK | FULL PLAN` as a
switch inside the existing Week tab rather than a fifth tab. The tab bar stays
four wide, Today stays the opening screen, and *Full Plan* is a second scale of
the same surface — which is exactly what it is.

Labs: **Bench → Brief → Plan → Session**, unchanged.

## D · Coach/athlete parity — the honest problem

You asked for `COACH VIEW | ATHLETE VIEW` in Labs using **the same renderer as
production, not a mock**. That is right, and it is not currently possible:
**Labs is JavaScript in a browser and the athlete app is Swift on a phone.**
There is no shared component to render.

Three options, and only one is honest:

1. **Reimplement the athlete view in Labs.** Fast, and it is exactly the mock
   that drifts — the thing you said you did not want.
2. **Make the phone the athlete view.** Labs links to a simulator or device
   session. Truthful, useless as a daily coaching tool.
3. **Make the athlete surfaces web, served from the same code Labs uses**, with
   the app embedding them. One renderer, one data projection, genuinely no
   drift. Largest change, and the only one that keeps the promise.

I would not decide this quietly. Option 3 is a real architectural direction and
option 1 is what everyone builds and then regrets.

What is available cheaply and honestly today: an **athlete projection in Labs**
that renders from `athlete_plan_feed` — the *actual payload the phone receives*,
not the Labs record. It cannot drift on data, only on presentation, and it would
have caught the payload gap in §A immediately.

## E · Build 41

Unshipped, and 40 does not contain the wiring: `MARKETING_VERSION = 40` was set
**31 August**, the Gate A commit is **1 September**.

Before José and Hope receive Labs-authored prescriptions:

1. **Ship 41.** The code is complete and all three funnels resolve through it.
2. **Run `docs/BUILD_41_ACCEPTANCE.md`** on a real phone. Item 4 is the one to
   watch: `prescribed_distance` changed meaning today, so a Tuesday now reads
   10.4 where it read 7.
3. **Extend the feed** with the mark, before any of today's athlete-facing
   design can land.

Server-side is otherwise green: both switches on since 3 September, undated rows
filtered, all 66 easy days published, 72 sessions served for José.

Simon is unaffected by all of it — no app, no identity, and his loop runs
entirely inside Labs. Nothing here regresses that.
