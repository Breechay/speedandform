# People and photo tags: the shared contract (Oct 13, 2026)

One record for the website and the Running app. Server: `supabase/migrations/20261013230000_collective_people_and_photo_tags.sql`. Design: the Oct 13 athletes canvas (directory, profile, owner controls, tagging, photo view).

## Records

- `collective_people`: one row per person. A coached athlete links to `athletes.id` (`athlete_id`); anyone else can have a profile with `account_id` and no training account. Nothing here touches plans, logs or coach notes.
- `collective_person_tags`: a person in a photo. Either an album photo (`asset_id`, a `collective_roll_assets` row) or a site library photo (`library_id`, an id in `/media/library/library.json`). Optional `x`, `y` (0–1) for the face. `status`: `confirmed` or `requested`.

## Rules

1. Public fields are chosen one by one (`public_fields`: bio, instagram, strava, discipline, now, best). A field not chosen never leaves the server.
2. A bio is a draft until its owner writes or confirms it (`bio_confirmed`). Drafts are never public.
3. Hidden (`visible = false`) is hidden everywhere: directory, search, the profile address, and name tags on photos.
4. Removing a tag deletes the person–photo row. The photo stays.
5. Only confirmed tags show. "That's me" files a `requested` tag that Brice confirms.
6. A tag says who is in a photo. It never says someone attended a run or did a workout.
7. Album photos count only while their album is live and public and the copy isn't withdrawn.

## Calls

Public (anonymous):
- `collective_people_directory()` → rows of `person` (slug, name, avatar, bio, instagram, discipline when chosen).
- `collective_person(slug)` → profile object or null (`hero`, `now`, `best`, `library` ids, `album` photos with run title, start and series for the run link).
- `collective_album_people(run)` → asset, slug, name, avatar, x, y, for a live album.
- `collective_library_people()` → library_id, slug, name, avatar.

Owner (signed in, the person's own account or the athlete account of the linked athlete):
- `collective_my_person()` → editable fields, `preview` (exactly what the public sees) and every tag, requested ones included.
- `collective_update_my_person(changes)` → only `visible`, `show_last_initial`, `public_fields`, `bio`, `instagram`, `strava_url`. Writing a bio confirms it.
- `collective_remove_my_tag(tag)`.
- `collective_request_tag(asset | library)`.

Brice (publisher): full table access through RLS, plus `collective_confirm_tag(tag)`.

## Copy

Owner screen intro: "Only the details you choose appear publicly. Your full plan, workout logs and coach notes stay private."

## Surfaces

- Website: `/people/` (directory and search), `/people/<slug>` (profile), name tags in the album viewer at `/run/<slug>`. Owned by Claude Browser.
- App: the same screens from the canvas, against these calls. Owned by Claude Code.
- Not built yet: owner controls on the web, and tagging inside the web Runs room. Brice can tag through the app or the table until then.
