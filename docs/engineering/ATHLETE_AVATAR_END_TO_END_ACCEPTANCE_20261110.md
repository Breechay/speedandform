# FORM athlete identity and avatar acceptance

**Owner:** FORM engineering and every agent editing athlete onboarding, portraits, Coach, Dossier, Collective or public Athletes. **Incident:** November 10, 2026, Anthony Keeling's Coach card repeatedly rendered an initial after the portrait had been uploaded and the website displayed it.

## What went wrong

- We verified storage, public URLs and database rows several times, then said the issue was fixed without seeing the *reported app card* render the image.
- The roster also included another Anthony, Maldonado. His working photo in a separate circle was mistakenly treated as evidence for Anthony Keeling. Same first name never proves identity.
- The native `FORMPeopleRules.avatarURL` in the installed release accepts a website-root image path (`/assets/...`) or a public-bucket key (`avatars/<person-id>/<filename>.jpg`). A full `https://...supabase.co/storage/...` URL can work on the website but fail this native resolver. The private `athletes.portrait_path` is a separate original and is not automatically a displayable public avatar.
- Different screens may read `form_team_roster`, `coach_preview_roster`, `athlete_dossier`, `collective_people` directly or `collective_people_directory`; a fix to one reader need not fix the others. Local or persistent caches can retain a previously unusable value.

## Required execution for every photo or app-visibility request

1. **Pin the person and the screen.** Record the immutable `athletes.id`, `collective_people.athlete_id`, slug, signed-in role, exact screenshot region and installed version/build. Compare the selected detail card with its own identity, not a neighboring circle or another same-name athlete.
2. **Trace the actual reader before changing data.** Name the RPC or direct query and the native component/URL resolver that consumes it. Check public/coach/athlete projection differences, production storage object, expected MIME and both display conventions. Read latest code and deployed function definitions, not only a prior migration file.
3. **Keep one compatible media contract.** An app-owned public bucket image is stored as `avatars/<person-id>/<filename>.<ext>` where the native resolver expects it; a website can be served a full public URL through its public projection. Verify both. Never replace the private original merely to make a thumbnail work or weaken visibility, consent, photo opt-out, RLS or identity checks.
4. **Verify in layers:** exact-ID linked row; storage object and reachable image bytes; each relevant live RPC/direct read; native resolver output; correct portrait and crop in the *same signed-in screen* the user reported, after refreshing and again after a cold launch. Compare at least one unaffected athlete. Verify the public website if a shared avatar source changes.
5. **Report exact status.** Say `source prepared`, `database updated`, `public site verified`, `native code tested`, `build distributed` and `device verified` separately. Never say “fixed on the app” from SQL, HTTP 200, an Xcode build, or another athlete's circle alone. When physical-device access is unavailable, explicitly leave device acceptance pending and give one small verification action.

## Repeated-failure rule

The first “still broken” report invalidates the claimed end-to-end closure. Reopen the exact component, inspect the screenshot and the installed client contract, compare the returned value with what that component accepts, and fix that mismatch. Do not keep uploading the same photo, changing unrelated profiles, issuing new invites, or asking the user to repeat information already present. Escalate to a native release only when a server-compatible path or refresh is not sufficient; follow [deployment discipline](DEPLOYMENT_DISCIPLINE_2026-10.md).

This is a mandatory release/incident gate, not permission to publish private athletes or deploy every small edit.
