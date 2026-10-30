# The Athletic Life · Idea Shelf

Captured October 29, 2026 · Owner-requested preservation · Uncommitted concepts, not a roadmap or approved tests

## Purpose

Keep worthwhile ideas from the race-experience / Athletic Life design conversation available when Brice and FORM have room to choose an opportunity. This is a **reserve of possibilities**, not a task list, public claim, automatic experiment, athlete preference survey, or authorization to build, send, book, purchase, publish media, or change a prescription.

Start from the question in [The Athletic Life](../../the-athletic-life/brief.md): **What could FORM make possible in an athlete's life that probably would not have happened, or would have been significantly harder, without FORM?**

Use the [research companion](../../the-athletic-life/discoveries/article.md), [editorial assessment](../../the-athletic-life/research/editorial-assessment.md), and [opportunity action wiring](ATHLETIC_LIFE_ACTION_WIRING_20261029.md) when returning to an idea. The companion records research interpretation; this shelf records untested design possibilities; the private opportunities register records a deliberately scoped experiment only after Brice chooses one.

## Design thesis

The race calendar should remain **people-first**. An event becomes interesting when someone you know is preparing for it. FORM may then help someone choose their own challenge, enjoy the place and occasion, handle logistics when help is wanted, and preserve something meaningful afterward.

Do not turn that insight into an assumption that everyone wants a trip, a running companion, public attention, coaching, or another race. Independent and remote athletes should have a complete relationship with FORM on their own terms. Beauty, enjoyment, memory and autonomy can be worthwhile without increasing app engagement.

## Six experience possibilities

### 1 · An athlete's reason for choosing a race
- **Experience:** A person may voluntarily share a short, approved reason for a particular event: a first marathon, a return to competition, a place they want to experience, or another reason in their own words.
- **Presentation:** An optional detail behind or beside their circular portrait, not a mandatory essay or generic AI story.
- **Integrity:** Athlete-authored or explicitly approved; never inferred from private training notes, injury history, entry status, or an algorithm.
- **Related existing idea:** One New Door / Race You Never Considered.
- **Open question:** Would anyone choose to share this, and with whom?

### 2 · A real FORM occasion around a race
- **Experience:** A confirmed optional shakeout, meeting point, host-led route, after-race table, or a small shared activity in the destination city.
- **Presentation:** A compact race-weekend section appears **only if** a real hosted occurrence exists. Otherwise the event page remains clean.
- **Integrity:** Collective owns an occurrence, actual RSVP and attendance. Organizer race records stay separate. No inferred travel, hotel, group commitment or availability.
- **Related existing ideas:** City Is the Course, Table After Practice, 48-Hour Escape, Athlete's Dinner.
- **Open question:** Which modest service removes real friction, and who does the hosting?

### 3 · Curiosity without a registration
- **Experience:** Someone can privately save a race or express interest in learning about it after seeing familiar people involved.
- **Presentation:** A personal shortlist or quiet inquiry, never a public promise to go.
- **Integrity:** Distinguish considering, target, registered, actual attendance and voluntary travel sharing. Existing race entries remain canonical; no ghost registration.
- **Related existing idea:** Race You Never Considered.
- **Open question:** Is a saved list useful, or would one human conversation work better?

### 4 · The afterlife of a race
- **Experience:** The same event page can change with time: anticipation before; verified course/logistics and voluntary support during; confirmed results, approved photographs, a chosen reflection and continuing athlete history after.
- **Presentation:** A beautiful archive that is still useful when the event passes. No forced “achievement” graphic or fake finish.
- **Integrity:** Official result evidence, athlete filing and editorial media rights are different sources. Dossier links to the real owning records. The archive must never publish private goals or results without the appropriate permissions.
- **Related existing ideas:** Race After Race, Year in Motion, Ordinary Greatness.
- **Open question:** Which artifact would someone actually want to keep, privately or publicly?

### 5 · Support only when welcomed
- **Experience:** A competitor can opt into a personal good-luck note, a friend cheering in person, or an agreed support arrangement.
- **Presentation:** Quiet, human, event-specific; no public cheer counts, gamified reactions, notification campaigns, or pressure to race socially.
- **Integrity:** An athlete chooses what support is welcome; a request does not expose their location, hotel or travel plans. Automated messages never impersonate Brice's observation.
- **Related existing idea:** Support Crew.
- **Open question:** What support is actually useful to a particular athlete?

### 6 · Athletic adventure without a race
- **Experience:** A scenic long run outside the usual routes, a morning in nature, a special training weekend, a new discipline, a specialist visit or a creative occasion. The change of setting may be valuable on its own.
- **First plausible example:** One carefully checked, optional FORM long run at a more natural location reachable from Miami. Confirm a real route, travel cost, safety, host and date before invitation.
- **Integrity:** A group event never replaces someone's personal workout. RSVP is not attendance. An athlete can enjoy the place without buying coaching or joining a trip.
- **Related existing ideas:** City Is the Course, Athletic Curiosity, 48-Hour Escape, One New Door.
- **Open question:** Does a new place create real enjoyment worth the time and logistics?

## Engineering foundations worth revisiting

These are design/architecture opportunities, **not all missing features**. Verify the current native branch, database and shipped build before creating tasks.

| Foundation | Desired capability | State at capture / boundary |
| --- | --- | --- |
| Coach-side remote race editor | Edit copy, facts, official links, optional rights-cleared images; preview, review and publish without an app binary | Remote fields and athlete-safe reads are in draft native PR #172 / database; polished coach editor not verified |
| Information provenance and freshness | Source, checked date, unknown state, and ideally field-level verification for volatile start, wave, venue and route facts | Event-level source-check fields exist; do not invent missing specifics |
| Separate intentions | Registered, targeted, considering, attending and travel-sharing are distinct states | The existing entry/status system must not imply travel or confirmed registration from target |
| Event-linked occasions | Connect a canonical race to zero or more real hosted Collective occurrences, routes or gatherings without copying RSVP | Concept only until a real occasion and ownership contract exist |
| Result and memory linkage | Official result or athlete-filed outcome, permissioned photography and reflections linked to Dossier and Archive | Result/publication schema is a draft foundation; no automatic result import or consent assumption |
| Global event correctness | Local IANA time zones, multi-day event windows, athlete-specific wave/day, different race disciplines and distances | Check the current model before scaling; Miami-local date assumptions are not globally sufficient |

**A premium admin capability is likely more useful than another athlete control:** Brice should be able to open an event, revise editorial information, attach an approved photograph, preview exactly what the athlete sees, and publish remotely. A race with no approved photograph must still have a complete typography-led design, never an empty placeholder.

## Multiple doors, one canonical race

Keep the current **People** presentation as the default. If event density earns it, provide additional ways into the same records:

- **People:** Familiar athletes and their chosen events; the emotional center.
- **Calendar:** A functional date view and chronology.
- **Places:** Selective editorial destination/grouping when there are actual races or FORM experiences to show.

Do not build an empty global city directory, a separate travel marketplace, or three disconnected race databases. Miami can establish the initial language; real events will supply future cities.

## One complete event as a design test

Life Time Miami, January 31, 2027, is a natural example because several FORM athletes are associated with its full and half. Do not presume every entry is registered or that everyone wants a shared trip.

- **Before:** people first, true entry status, confirmed organizer information and optional hosted plan.
- **During:** verified practical details and only the support an athlete welcomes.
- **After:** result provenance, approved photographic work and continuity in the athlete's private history.

The essential relationship is **race ↔ person ↔ optional Collective occasion ↔ evidence ↔ memory**, with each source still authoritative and each permission separately checked.

## What not to build by default

- A travel-booking business or full racecation marketplace before one genuine demand and costed service is established.
- Automatic athlete matching, introductions or contact suggestions drawn from proximity/private schedules.
- A cheer-feed or generalized social-engagement surface that rewards attention over actual care.
- Public results, goals, travel, health context or portraits inferred to be shareable from group membership.
- An editor that forces photography on every race, fills unknown organizer facts, or requires App Store updates for content changes.
- An automatic post-race “next goal” or training rewrite. The athlete and coach decide what follows.

## When FORM needs an idea

1. Review the current person or group need, capacity, and existing work; don't select a feature because it sits on this shelf.
2. Check actual owner decisions, race records, Collective, Archive, current native PRs and the research caveats above.
3. Choose **one** narrowly testable hypothesis with a named beneficiary, practical barrier, time/direct cost, permissions and a meaningful outcome.
4. If Brice explicitly approves exploration, use the existing private [Athletic Life opportunity register](ATHLETIC_LIFE_ACTION_WIRING_20261029.md) and its two-active-experiment cap. Do not seed all of this shelf as tasks.
5. Execute only in the owning system after the separate authorization; file the actual evidence and decide continue, revise or park.

## Provenance and status

- Captured from Brice's October 29 discussion and attached text, *Athletic Life race-experience ideas*; authored as a retrieval note, not a customer-research finding.
- [Public founding brief](https://speedandform.com/the-athletic-life/) and [First Discoveries companion](https://speedandform.com/the-athletic-life/discoveries/) provide context.
- [Editorial assessment](https://speedandform.com/the-athletic-life/research/assessment/) warns that convergent reports do not constitute independent demand evidence; no FORM athlete interviews were supplied in that research.
- [FORM-iOS PR #172](https://github.com/Breechay/FORM-iOS/pull/172): draft photo-optional race detail and remote editorial source.
- [FORM-iOS PR #174](https://github.com/Breechay/FORM-iOS/pull/174): draft restoration of the coach calendar's large people-first portrait hierarchy and shorter published event briefs.
- Neither draft PR is a verified native release. Existing photo, result and race-experience proposals are not automatic shipped behaviors.
- No new opportunity, calendar occurrence, athlete communication, booking, training prescription or public publication is authorized by this document.
