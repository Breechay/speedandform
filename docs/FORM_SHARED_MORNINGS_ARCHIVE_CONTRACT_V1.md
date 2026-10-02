# FORM — Shared Mornings + Archive Contract
## Pass 03 · v1 · 2026-10-02

This is the implementation contract for the next FORM product pass. It narrows the October ecosystem plan into one end-to-end loop:

**Upcoming occurrence → RSVP → morning → host closeout → Archive → selected public proof.**

It applies to Track Thursday and Saturday long runs. It does not reopen FORM Private's broader social/village architecture.

## 1. Product promise

Shared Mornings makes group training dependable. Archive makes the morning worth keeping.

The product is not a feed. The unit is a real occurrence with a time, place, host, people and an afterlife.

## 2. One occurrence model

Thursday and Saturday must use the same occurrence object type.

Required identity:
- stable occurrence ID;
- optional stable series ID;
- occurrence kind: track_thursday | saturday_long_run | future bounded kinds;
- title;
- starts_at;
- optional meet_at;
- meet name/address/point;
- host member ID;
- public/private publication state;
- scheduled | cancelled | completed;
- public group facts;
- workout/session reference when applicable.

Rules:
- A series is not an occurrence.
- A workout is not an occurrence.
- A public page never creates or confirms an occurrence.
- A changed time/place edits the occurrence and triggers the existing “notify only on change” behavior.
- Saturday receives a dedicated canonical series ID before its public projection is considered permanent.

## 3. RSVP and attendance stay separate

RSVP answers: **Who said they were coming?**
Attendance answers: **Who was actually here?**

RSVP states:
- in
- out
- no response

Host closeout attendance:
- here
- absent
- unknown

Never infer attendance from RSVP.
Never infer RSVP from attendance.
A member can arrive without RSVP and be marked Here.
A member can RSVP In and be marked Absent.

## 4. Member surface

Upcoming card/page:
- cover/location image when available;
- day/date;
- meet time + run time;
- place + meet point;
- workout summary when published;
- level/group facts;
- Who’s in;
- primary action: I’M IN;
- joined state: glass “You’re in” + lime dot;
- Board/change note;
- “Last Thursday” / prior occurrence archive preview when useful.

No feed, follows, leaderboard, streak or directory.

## 5. Host closeout

Closeout appears only to an authorized host after the occurrence starts.

Header:
- occurrence;
- scheduled RSVP count;
- closeout state: Open / Closed.

Roster:
- Here;
- Absent;
- Unknown;
- FIRST RUN marker where membership history supports it.

Host actions:
1. mark attendance;
2. add people who attended without RSVP through existing membership identity;
3. write one optional witness line / morning note;
4. attach or select photo candidates;
5. close occurrence.

Close must be idempotent and recoverable by authorized coach/host. Closing attendance must not publish photos.

## 6. Archive handoff

Closing an occurrence creates or exposes one Archive draft keyed to the occurrence ID.

Archive draft contains:
- occurrence identity + date/place;
- attendance snapshot/reference;
- host witness line;
- private photo candidate Roll;
- editorial state;
- published album reference when one exists.

No duplicate Archive draft for the same occurrence.

## 7. Roll → Nine editorial flow

Private by default.

### Roll
All imported/attached candidate photos for this occurrence.
Each candidate can be:
- Keep;
- Maybe;
- Set aside.

This is editorial state, not deletion.

### Select
Choose 1–9 published photographs.
Nine is a maximum/format, not a quota.
Reorder by drag or explicit move controls.

### Cover
Choose one selected photograph as cover.
Store crop/focal treatment separately from the original asset.

### Appearance
Album appearance:
- cream;
- dark.

This changes presentation only, never source media.

### Preview
Before publish, show the exact public/member-facing album:
- cover;
- order;
- crop;
- caption/date/place;
- appearance.

### Publish
Publishing creates a versioned published album from the draft.
The private Roll remains private.
Set-aside images remain private.
Publication does not make attendance records public.
Undo means unpublish/revert publication state without destroying the editorial draft or originals.

## 8. Public proof boundary

Website may consume only explicitly published album material intended for public use.

Public package can include:
- occurrence title/date/place;
- cover;
- selected 1–9 photos;
- approved short caption/witness line;
- public occurrence URL.

It must not include:
- private Roll;
- Maybe/Set-aside state;
- attendance labels;
- member contact/profile data;
- private host notes;
- unpublished media.

Instagram export and website package are exports from the same published selection, not separate editorial truths.

## 9. Permissions

Member:
- read eligible occurrence;
- RSVP self;
- read allowed attendee names according to current Collective policy;
- read published archive.

Host:
- member permissions;
- closeout for hosted occurrence;
- attendance marking;
- Archive draft/edit for hosted occurrence if authorized.

Coach/operator:
- recovery/correction;
- publish/unpublish archive;
- resolve identity exceptions.

Anonymous web:
- published public occurrence projection only;
- explicitly published public album package only.

## 10. Notifications

Notify only on meaningful change:
- occurrence time/place/status change;
- optional reminder when explicitly opted in.

Do not notify for:
- someone else RSVP’ing;
- attendance edits;
- photo culling;
- archive draft edits.

## 11. Data integrity

- occurrence_id is the join key from Shared Morning to Archive.
- media assets keep stable IDs and original provenance.
- editorial operations are reversible.
- publish is explicit.
- closeout is explicit.
- public/private are explicit states.
- no title parsing as authority when a stable ID exists.
- historical completed occurrence remains historically accurate after a series template changes.

## 12. Pass 03 implementation order

### P03.1 · Occurrence parity
- define Saturday canonical series;
- prove Thursday + Saturday render through same app occurrence model;
- preserve public Thursday contract;
- update Saturday public projection to stable series filter.

Finish: two real occurrence fixtures, one Thursday and one Saturday, pass the same read/RSVP/change/cancel tests.

### P03.2 · Host closeout
- host authorization;
- Here/Absent/Unknown;
- FIRST RUN;
- witness line;
- close/reopen/recovery.

Finish: host can close a real occurrence without changing RSVP history.

### P03.3 · Archive draft
- one draft per occurrence;
- occurrence metadata;
- candidate Roll;
- no automatic public publication.

Finish: closing a fixture occurrence exposes exactly one private Archive draft.

### P03.4 · Roll → Nine
- Keep/Maybe/Set aside;
- select ≤9;
- reorder;
- cover/crop;
- cream/dark;
- exact preview;
- publish/unpublish.

Finish: one real Thursday photo set moves end-to-end from private Roll to published album and back without data loss.

### P03.5 · Public package
- website/public album projection;
- Instagram export package;
- privacy checks.

Finish: public consumer can see only explicitly published selection and metadata; unrelated/private data remains inaccessible.

## 13. Acceptance tests

1. RSVP In then attendance Absent remains two distinct facts.
2. No RSVP then attendance Here works.
3. Changed meeting time does not rewrite historical occurrence.
4. Cancelled occurrence cannot be closed as completed without explicit recovery.
5. Repeated close call does not duplicate Archive draft.
6. Nine rejects a tenth selected photo until one is removed.
7. Set aside never deletes original.
8. Cover crop never mutates original.
9. Unpublish preserves draft and media.
10. Anonymous read cannot see Roll, attendance or private notes.
11. Public album contains only selected published media.
12. Saturday and Thursday use the same occurrence behavior, differing only in content/group facts.

## 14. Explicit non-goals

Not in this pass:
- social feed;
- member-created runs;
- broad DMs;
- likes/comments;
- leaderboard;
- public athlete dossier;
- auto-coaching;
- generalized event marketplace;
- complex photo editing.

## 15. Next engineering action

Audit the actual Collective schema/migrations and native app models before writing a migration. Map each field above to an existing source. Add only the smallest additive schema required for:
1. Saturday series identity;
2. attendance closeout if absent;
3. occurrence-keyed Archive draft;
4. reversible editorial photo state.

Do not create parallel people, occurrence or media identity tables when an authoritative one already exists.
