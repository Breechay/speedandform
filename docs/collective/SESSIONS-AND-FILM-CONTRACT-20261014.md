# Sessions and film: the shared contract (Oct 14, 2026)

One athlete's own workout that Brice filmed or photographed (Adrian's 7 × 800, say). Server: `supabase/migrations/20261014000000_collective_sessions_and_film.sql` (applied). Builds on [people and tags](PEOPLE-AND-TAGS-CONTRACT-20261013.md).

## Records

- `collective_sessions`: slug, title, detail, `happened_on` (date), place, `youtube_id` (the full film), `clips` (`[{youtube_id, title?}]`, short clips, also YouTube), `poster_library_id`, `library_ids` (site photos), optional `run_id` (a related group run), `published`.
- `collective_session_people`: whose session it is (session_id, person_id).

## Rules

1. A session is never a group run: no "I'm in", no roster, no attendance.
2. Public only when `published` and every linked person's profile is visible. Hiding a profile hides its sessions everywhere: the session page, the profile and any list.
3. Video lives on YouTube; we store ids, never upload. Embed with `youtube-nocookie.com`.
4. Names on a session's photos still come only from confirmed tags.

## Calls

Public (anonymous):
- `collective_session(slug)` → session object or null (title, detail, date, place, youtube_id, clips, poster, library, run, people[slug, name, avatar]).
- `collective_person(slug)` now also returns `sessions` (public ones, newest first, same shape).

Brice (publisher): full table access through RLS. Web authoring is in the Runs room (Sessions: New session / edit; paste a YouTube link or a youtu.be / shorts link, one clip per line as `link | title`, tick whose session, Published).

## Surfaces

- Website: film card on the profile (`/people/<slug>`), session page at `/session/<slug>` (singular, like `/run/<slug>`; `/sessions` is a library article). Owned by Claude Browser.
- App: film card on the profile and a session screen against the same calls. Owned by Claude Code. The app's own album film (uploaded, ≤60 s) is separate and stays as built.

## Seed

`adrian-7x800-2026-10-14`, Adrian's, unpublished, no film yet. Brice adds the YouTube link and publishes after the shoot.
