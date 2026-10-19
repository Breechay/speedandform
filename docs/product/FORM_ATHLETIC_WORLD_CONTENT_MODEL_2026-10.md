# FORM athletic world · v1 content model for Running and speedandform.com
**Decision and implementation brief · October 19, 2026**  
**Status:** Owner-approved product/editorial direction; **not a claim that native UI or publishing endpoints are shipped.** This describes a small extension of the existing Collective, media and Labs experience, not a new feed service.

**Design law:** [Athletic world standard](../design/FORM_ATHLETIC_WORLD_STANDARD_2026-10.md).  
**Editorial law:** [Publication contract](../editorial/PUBLICATION_CONTRACT.md).

## Product job

A runner may open FORM to execute today's training **or** spend a minute browsing the people, photographs, films and practical ideas around the practice. The app should feel like the athletic team even when no group run is scheduled. Material remains findable after its week passes.

The training prescription stays authoritative and separate. Media gives athletes a reason to return; it never competes with filing a run or rewrites the plan.

## Reuse this inventory, in this order

| Content class | Owning source already present | What is eligible and what it can show |
|---|---|---|
| **Upcoming run** | Published public Collective run occurrence (existing `collective_public_runs` projection and related app path) | Only a real future, non-cancelled published occurrence. Accurate title, date, time, place, public RSVP/going only if supported and authorized. No recurrence inferred from a usual Thursday schedule. |
| **Group album** | Existing published public album and its `collective_roll_assets`; website `/runs/` and `/run/<slug>` | Published live album; legitimate cover, dated run title, photographs, place only if recorded. Pending/unpublished/withdrawn albums are invisible. A generic curated photo collection must not masquerade as an event album. |
| **Session film** | `collective_sessions` and authorized `collective_session(slug)`; published native video or YouTube as supported | Verified published session with visible linked people, poster, real date and actual playback URL. It is **not** a group run and never gets an RSVP or attendance count. App playback must be tested in installed build before claiming ready. |
| **Library photograph** | `/media/library/library.json`, existing size variants, `uses`, `focal`, `alt`, source/consent | A deliberately selected FORM photograph with clear publication rights, current visibility, faithful alt and crop. It can create the enduring atmospheric lead when events are absent. It has no invented run association, date, location or participant list. |
| **Athlete/portrait** | Public `collective_people_directory()`, `collective_person(slug)` | Only opted-in visible public profiles, permitted fields and confirmed tags; public profile can link to published media. Hiding a profile removes it from the selection and all name/tag displays. |
| **Study snapshot** | Published public Labs article, its dated evidence/approved summary and canonical URL | One real question, finding, named session or training decision described accurately. A concise card can stand alone; optional `Study` link is not required for understanding. No private coach notes or draft findings. |
| **Field note** (lightweight next step) | An explicitly approved short editorial entry attached to existing web content/static publishing, not a new social database | One complete practical idea, cue, observation or reminder, original to FORM and tied to actual coaching work. May have a real relevant image. Real authored/published date and source if needed. Archive by topic. No daily cadence or auto-generation requirement. |

**Current asset footing:** the website media catalogue currently lists **46 photographs** (33 track, 8 long run, 4 social, 1 strength) with metadata and multiple image sizes. The specific initial selection can start by reviewing `bw-group-portrait`, `track-curve-group`, `bw-track-talk`, `waterfront-palms-four`, `two-on-the-lanes` and `rooftop-seven`, using their `uses`, `focal`, and rights metadata. These are *candidate IDs*, not auto-publish commands. Preserve their original aspect/skin tone and their existing photo provenance.

**Release caveat:** backend media storage and website/native player rollouts have separate verification states. Do not infer that a documented video or album exists in an installed app simply because a Storage object or source branch exists.

## Minimal selection contract, not a new infrastructure

Every displayed feature needs:

- **A stable existing ref** (published Collective run ID, album/asset ref, published session slug, public person slug, library photo ID, public Lab URL, or approved note ID).
- **A kind** (`upcoming_run`, `album`, `film`, `photo`, `athlete`, `study_snapshot`, `field_note`).
- **Editorial placement** (`lead`, `group_media`, `portrait`, `study`, `note`) chosen manually or by the small priority logic below.
- **Display eligibility** checked at read/render time: published, visible, rights/consent, not withdrawn, no private coach records. Cover/media availability and alt text validated.
- **Optional timestamp / location / associated race** only when its owning record has them. No preview values in production.
- **Optional destination** existing deep link or web fallback that actually opens. Notes may be self-contained with no destination.

Don't duplicate authoritative athlete, event, photo-tag or film records in a new CMS. If a small curation map is necessary, use an explicit **versioned list of existing references**, not copied biographies, private feeds, generated descriptions or a new UGC service. No backend migration or new navigation tab is authorized by this brief.

## Selection logic (transparent, bounded)

**Group lead:**
1. If one verified future public run exists and its information is accessible: show that occurrence with a real RSVP if permitted.
2. Otherwise choose one **approved published** visual highlight: most relevant eligible session film or public album with a usable cover. Editorial pin can break a tie; an undated static photo doesn't receive a made-up `latest run` caption.
3. If no film or album is eligible, choose an approved library photo with a truthful descriptive label and a destination such as `Photos and film`.
4. If imagery cannot safely be used, show an existing approved evergreen note or relevant study snapshot (if any), or a neutral `Photos and film` / `Athletes` entry. No fake content, unapproved external photo or broken empty panel.

**What happens to the event slot when there is no event:** no date, `I'm in` or `N going`; show the real lead instead. When the user visits the schedule/details view, state **No group run scheduled** if that is the verified state. A service read error must say **Schedule unavailable**, not imply no upcoming run.

**Secondary content:** show real public athlete portraits; one eligible film if available; an album/media browsing route; at most one featured study/field note. A missing item doesn't leave an empty tile. Don't confuse `last published` with `happened recently`; older dated material may be labelled by its actual year/date.

**Privacy and resilience:** don't cache person names/tags, previously public files or profiles in ways that bypass later hiding/withdrawal. A cached image must be rechecked or removed if permission changes. Handle failed requests, missing assets and offline gracefully; no stale claim that an event is live.

## Running app composition

### A. The Week and cream side door

- **Week** keeps its scheduled sessions, current coaching instructions and filing controls as the first-class instrument. Don't turn it into a media feed.
- Athlete name / left-edge gesture opens the **approved sliding cream side door**, with the Week sliver visible and each tile opening a full page. Preserve the agreed physical gesture, limited edge-start zone and Reduce Motion path.
- The top **race card** uses the assigned race, countdown and block progress. Race-city black-and-white photography (Orlando Lake Eola; West Palm waterfront) is tied to the real race destination and editorially graded per photo. Fallback is the dark card, never stock or imaginary race.
- Existing focus, Plan, Messages, study, Athletes, Photos and film, public profile and Account retain source-backed content.
- **The group tile is always browseable when approved group media exist**; it shows the next published run when one exists, otherwise a verified film/album/photo. Only the run variant has `I'm in`. If nothing eligible, use an honest navigation destination.

### B. The group (full destination)

1. **One large lead**, event or media; rich original FORM photo/film, honest metadata, one primary action.
2. **Athletes:** image-led visible public profiles; two-column portrait grid when space allows, not a list of dividers. Empty only when permissions leave no public profiles, with truthful state.
3. **Film:** a real published session poster/play card, or omitted when not available. Never claim a video from a photograph.
4. **Past runs/albums:** dated, published image-led tiles. Keep accessible even without next run.
5. **A short note or study card** only when something worthwhile is already approved; no filler to hit a quota.
6. **Photos and film:** browse the archive, including photos not tied to a published run when appropriately catalogued.

### C. Photos and film

- Browse **All · Film · You**. `You` is only approved confirmed identity tags with permission, not inferred attendance or facial recognition.
- Group by actual month/run/session/type, preserving discoverability when nothing is new.
- Open album → full photo viewer; `That's me` sends a review request; `Request sent` appears after successful submission.
- Support images and films from their existing distinct sources; don't imply every photograph belongs to an event. Use approved crop, credit if legally required, sharing/opt-out rules.

## Website homepage composition

Keep the existing commercial homepage, its artistic hero and the explicit Run Development door. **Do not bolt on another social feed or duplicate the existing athlete/film/photo sections.**

- **Opening:** preserve current authentic FORM photography, the bend and hero motion rules; reinforce the feeling of a real team through existing imagery, not a new explanatory manifesto.
- **Athlete/Collective entrance:** use the existing `Meet the athletes. The faces of FORM.` destination with real, visible public athlete portraits and an unambiguous link to `/people/`.
- **The work on film / photo strips:** curate actual approved media from the catalogue and published sessions. Give clear routes to `/photos/`, `/runs/` and existing session pages. Vary hero/crop/strip rhythm rather than adding uniform cards.
- **Current public gathering (when actually scheduled):** if an eligible public future occurrence exists, show its time/place and route into the existing run page. **If none:** swap that *feature* for a recent eligible published album/film or evergreen image, but keep actual schedule truth discoverable on `/runs/` or `/thursday`.
- **A small useful idea** may rotate into an *existing* editorial/photographic module once approved; standalone 40–100-word field note or verified study excerpt, optionally linked to Labs. Don't require clicking through. No daily publishing calendar.
- Existing commercial links and native-app status must remain accurate; editorial atmosphere is not permission to crowd out the primary coaching offer or advertise an unshipped app feature.

## Field note format (optional; first small experiment)

A field note is not a blog or influencer carousel. Keep it **one meaningful thought, fully consumable on a card**:
- Headline (roughly 3–8 words), 1–3 short sentences (typically 25–90 words), topic (`pacing`, `form`, `recovery`, `mental game` or `training`), actual publication date.
- Optional related original FORM photograph, only when relevant; typography-led cards are also valid.
- Optional `Read the study` or `View the run` link only to an existing relevant approved resource.
- Source support inside editorial metadata for factual/scientific claims and proper attribution. Don't reuse unlicensed screenshots, text or image assets from others.
- No public reaction, comment, daily-streak or notification requirement. Archive and browse by topic; keep original date rather than rewriting it as new.

Example *candidate topic*, **not approved publication copy**: a real coaching observation about responding to discomfort in a session, connected to the athlete's training decision. It must be newly written from FORM experience and grounded, not rephrased as a claim that all elite athletes respond identically.

## Implementation passes (no surprise build)

1. **Contract review:** Code inventory the real read paths already supported by the installed Running build and website. Record which of run/album/session/photo/public people/notes is genuinely reachable; say `not verified` otherwise.
2. **Media curation pass:** select a tiny high-quality group of permitted existing assets and link to real destinations. No upload/duplication of raw originals; update catalogue `used_on` when actually shipped.
3. **Existing surface refinement:** render Group lead fallback in the *current* side door and Group page, with album/film browse. Update existing homepage photo/film placements rather than adding a generic new section.
4. **Optional field note pilot:** 3–5 explicitly approved, evergreen FORM-specific notes, each a complete card. Introduce no new publishing platform unless current static editorial pathways demonstrably cannot support this.
5. **Device + web QA:** future run, none, canceled, fetch error, withdrawn photo, hidden athlete, film unavailable, no recent content, long text, slow images, Reduce Motion, privacy, real video playback. Capture actual app/video and mobile/desktop site evidence.
6. **Release discipline:** commit and QA in batches, do not deploy or archive based on this doc. Existing native Code workstream owns implementation; website team coordinates rather than starting a conflicting native branch.

## What we are explicitly NOT building

A social media clone; feed ranking; posting tools for athletes; follows, reactions or comments; leaderboard; daily content quotas; new public-athlete tables; automatic motivational writing; a second plan source; stock photography; synthetic moments; a new full-time production system.

**Product acceptance:** an athlete can open FORM without a scheduled group run and still find authentic permitted people, photos, film and/or useful training material, with dated source truth and no empty dead-ends. The next scheduled event, when real, is still clear and easy to join.
