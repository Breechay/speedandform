# FORM Miami · Shared practice publication

**Owner:** FORM Athlete System. Implemented October 25, 2026. The database, Coach Miami console, public Runs page, private browser athlete inbox and email delivery are separate release surfaces. Native iPhone inbox and Apple push require an app build and APNs configuration; publishing the web does not install an iOS build.

## Two independent records

**Prescribed work:** A coach-authored Week session. Thursday subscribers hold exact dated `form_miami_session_links` to their existing `planned_sessions` rows. A single coach edit appends the next `planned_session_versions` version for eligible linked sessions and writes an immutable `form_miami_publication_receipts` row per athlete. Nothing overwrites the previous prescription. Friday/Saturday plans and completed work are never mass-rewritten. Time/distance split targets only carry forward when the rep shape and work distance/duration still match. Matt uses effort mode and receives no unverified fast split targets. The coach can still revise any athlete's personal version separately.

**Hosted gathering:** A real `collective_runs` occurrence, including its original published date/time/place, changes, cancellation and `collective_run_ins` RSVP. An unhosted Saturday may have six different long-run distances and **no run occurrence whatsoever**. A separately verified hosted occurrence can be linked via `form_miami_run_links`. Changing meetup information emits a notice, but cannot silently alter anyone's mileage. The same existing public Runs read and iOS Collective RSVP continue to own who's coming. A subscription is **not** evidence of attendance.

## Current subscriptions

- Thursday: Brice, David Morales, Jimmy Holmquist, Kevin Helle, Matt Alvarez, Sam Reyes, Tinius. Seed only exact speed sessions October 26–January 31; Tinius's separate threshold record on the same calendar date remains untouched.
- Saturday: Brice, Jimmy, Kevin, Matt, Sam, Tinius; each retains their own mileage, taper, units and status. David's long runs may fall on Sunday, so he isn't subscribed to the initial Saturday lane.
- Coach can add or disable subscribers, then choose the exact Thursday session for that date. A new athlete does not inherit prescriptions merely through email signup or gallery presence.

## Coach workflow

1. Open `/coach/miami/`, select Thursday and the Miami date. The preview includes every subscriber's exact session, version, pace mode, existing individual override and filing status.
2. Edit title, intent, sets, timed recoveries, warm-up and cooldown. Preview again to lock an expected-version map. Only then does Publish become available.
3. One transaction validates all eligible recipients and the current versions, appends each revision, records receipts and queues inbox messages. An individual override, filed workout, withdrawn session or paused link is never revised in bulk. A stale preview stops the whole transaction. Athlete-facing text stays short and clear; private review rationale stays private.
4. When a Saturday gathering is actually arranged, post the real long-run occurrence in `/coach/runs/` with actual date/time/place. Return to Coach Miami, select that date, link the matching occurrence and notify subscribers. RSVP is the preexisting Who's in. On Saturdays without a linked occurrence, the page says there is no linked meetup, and the athletes' Weeks still say exactly what to run.
5. Coach notes/nudges create a private message for each subscribed athlete. Browser athlete inbox and email share the same notification ID. Only claimed, verified athlete owner accounts enter the mail outbox. Every athlete can opt out of email in My training. Web `/runs/` displays the public group workout only if a separately published, public, currently scheduled occurrence is linked to a dated Thursday publication. It never reads a private athlete plan or Saturday mileage.

## Delivery and permission boundary

- RLS enabled and table grants withheld. Named security-definer functions check the signed-in coach's active memberships; athlete inbox verifies athlete-role ownership by `auth.uid()`. Generic users cannot call internal outbox functions. All subscriber data and version receipts remain private.
- Email dispatched via Supabase `form-messages` Edge Function to Resend with a stable idempotency key; the browser only asks the authenticated coach sender to drain already-generated queue rows. Recipients/subjects cannot be selected by the browser. The sender checks coach role and uses service-role-only RPCs.
- Email is transactional, not newsletter subscription. No mail to unclaimed Jimmy or Matt until their invitations are claimed and emails confirmed. App installation and Apple APNs device push are not implied by this feature.
- There is no automatic recurrence or scheduled Saturday meetup. No event reminder is sent without a real linked published occurrence or an explicit coach nudge.

## Release check

- Transactional SQL rollback rehearsal: seven Thursday link recipients, seven new session versions, seven corresponding publication receipts, all rolled back without altering production.
- Verify `form_miami_preview('thursday','2026-10-29')` names, edit eligibility, exact link IDs and no extra Tinius threshold before first real publish.
- Simulate stale expected ID and filed result in a rollback transaction. Verify changed version count is zero on failed publication.
- Verify signed-out user sees no subscriber names and sees only the public calendar projection; verify signed-in athlete sees only their own inbox, can mark read and opt out.
- Verify a real linked run change sends the correct notice once and retains Who's in attendance independently. No automatic meetup when no occurrence was posted.
- Verify edge sender env, email suppression, bounce handling, and check production outbox state after sending. Native Apple push capability remains separate and must not be represented as shipped without an archive and entitlement/device checks.
