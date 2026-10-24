# Athlete portrait publication · regression safeguards
## October 24, 2026 · FORM Running and speedandform.com

An athlete photo can work on the website and still appear as an initial in the iPhone Coach Dashboard or Dossier. On October 24, Marcus's image was valid and his account links were correct, but a CDN cache continued to serve a previously requested 404 at an image URL after the file was published. A new **never-requested, clean filename**, published before being linked in Supabase, restored it on Brice's phone.

## Canonical identity and asset contract

- Reuse **one existing athlete ID**. Do not create a duplicate athlete or Collective member to fix a missing photo.
- Keep `public.athletes.portrait_path` and the linked `public.collective_people.avatar_path` aligned for that same athlete ID.
- An unclaimed sign-in is distinct from a missing portrait; do not falsely mark an account claimed.
- Treat the portrait as private or public according to the athlete's existing visibility/consent; changing a photo must never change roster publication.
- The client may prepend `https://speedandform.com` to an absolute site asset path such as `/assets/athletes/name-date-v2.jpg`. Supabase's avatar-path check rejects query strings; do **not** use `?v=2` for cache busting.

## Publication sequence

1. Choose a **new, never used** clean filename in `assets/athletes/` every time an image changes or a previously missing URL needs repair. Do not overwrite, rename, or delete a published file path; existing devices may cache that URL. Keep original photography/history.
2. Commit the image and pass `node tests/athlete-portrait-integrity.cjs`. The PR workflow rejects modification or removal of existing image paths and detects unsafe cache rules and corrupt/truncated image signatures.
3. Wait for the hosting deploy to be explicitly **published**, not merely built. Production deploys require Brice's authorization under `docs/engineering/DEPLOYMENT_DISCIPLINE_2026-10.md`.
4. **Do not prefetch the unbuilt custom-domain URL.** After publication, request the new URL without a cache-busting query and verify HTTP 200, `Content-Type: image/*`, nonzero bytes, and actual image decoding. A 200 HTML error page is not an image.
5. Only then update the two portrait fields for the exact existing athlete ID through the normal authorized database workflow. Read back both paths and the linked roster projection. Preserve sign-in links, athlete goals, prescriptions and privacy.
6. Open the authenticated iOS Coach Dashboard on the release candidate and verify the avatar circles, featured cards and the same person's Dossier. Confirm the image survives closing/reopening the app, an account switch and navigating back to Coach. If missing, log the effective resolved URL and image load status before editing records again.

## iOS release acceptance

- The Coach portrait loader must remain in the SwiftUI tree while its image is `nil`; do not reintroduce a purely conditional empty `Group` around an image-loading `.task`.
- When a row is reused for a different athlete, clear the old image and load the new athlete's URL. Check that portraits do not cross accounts.
- Check a production-authenticated Coach roster, including newly added people and one athlete whose image was previously missing. A simulator without production authorization cannot close this gate.
- Check the same athlete's Dossier. Coach and Dossier share canonical records but are separate image consumers.
- Mark build/tests, deployment and physical-device checks as separate statuses; neither a HTTP 200 nor a successful Swift compilation alone proves a photo appears on the phone.

## What is automatic, what remains manual

**Automated in the website PR/build:** image signature checks; asset filename preservation on PRs; both Netlify athlete-cache rules. **Manual until authenticated end-to-end automation exists:** publication-order verification; Supabase readback; on-device Coach and Dossier acceptance. Do not substitute public roster visibility for private Coach/Dossier authorization.
