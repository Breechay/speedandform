# FORM-hosted athlete films · October 14, 2026

The full-length session film and its cover can be hosted in the existing FORM Athlete System Supabase project, without YouTube or a second copy embedded in the iPhone application.

## Live backend (applied and verified)

Migration `20261015013000_collective_native_films.sql` has been applied to production using the Supabase migration tool.
- New `collective-films` public-read bucket, 60 MiB limit, MP4/JPEG/WebP types.
- Only authenticated `collective_is_publisher()` accounts can insert, list, replace or delete objects under `sessions/`.
- `public.collective_sessions.video_path` and `.poster_path` hold **bucket-relative paths**, not arbitrary URLs.
- The existing visibility-gated `collective_session_public` RPC now emits these fields when set, and both athlete profiles and session pages use that same RPC.
- No existing sessions, photos, athlete visibility, title, or YouTube link was changed by the migration.

## Editor

In the authenticated Runs room, open Sessions → Adrian + Tinius 7 × 800 and choose the original 33.82-second H.264/AAC MP4 and the poster JPEG. The form verifies file type/size and requires an affirmative rights confirmation, uploads directly from the browser into the publisher-only Storage namespace, and only then stores its public path on the session. Replacing or explicitly removing a media object clears/replaces the reference and deletes the old object.

**Important:** Until this site branch is merged, built and deployed to Netlify, the current public Runs editor cannot upload files. The backend bucket exists now; the editor code is staged in this branch.

## Consumers

- `js/people.js`: Native HTML5 `video` with controls and `playsinline` on public `/session/:slug`. Cards and athlete profiles use the same poster and play state. YouTube remains a fallback for old sessions.
- iOS: `feature/network-selfhosted-film-20261014` adds `video_path` and `poster_path`, native AVKit `VideoPlayer`, and keeps existing YouTube clips, plus the new Network Media and featured-session film treatment.
- Both clients construct a public Storage URL ONLY from a validated `sessions/<slug>/<uuid>.mp4` or `.jpg/.webp` path on our existing Supabase project. Never accept an arbitrary external URL from user content.
- Supabase Storage public-read URLs work independently of an app update; **but the app version must first contain the native video player**. Once shipped, later media can be changed server-side.

## Media that is available but not uploaded yet

Conversation-mounted files:
- `adrian-tinius-7x800-tight.mp4` — 24,831,039 bytes, 33.821s, H.264 1920×1080 + AAC, SHA-256 `5802bc3a9791e8016e1c4b8c494626f52c320a05643289d39e6699d605113ac8`.
- `adrian-tinius-7x800-poster.jpg` — SHA-256 `404e52fee778acee7d31740ff13790b98a00a8ef554f58b8053a1a061fe27f6f`.

The assistant's GitHub/Supabase connectors **cannot upload local binary files to Supabase Storage**. Its sandbox runtime has no network/DNS route for `curl`, either. This is why the MP4 has NOT been transferred: no fake “published” URL is to be reported until a publisher's actual browser has uploaded and the object returns HTTP 200/range playback.

## Safety and operations

Public buckets are genuinely public by URL even if their session is later hidden by the API. If a subject withdraws permission, remove the hosted file through the publisher flow (which deletes the object), clear its DB reference, and verify the CDN no longer serves it. Simply hiding a profile does not revoke a previously copied raw public URL. A private bucket with expiring URLs is an alternative for sensitive footage but would require an authenticated URL-issuing endpoint.

Publish only material for which the shooter/owner has rights, including any soundtrack license and consent of depicted athletes. Hosting yourself does not grant music rights. Monitor Supabase storage and egress costs.

## Acceptance checks

1. Merge/deploy the site patch, then use the publisher account to upload the MP4 + poster into Adrian + Tinius's existing session. Confirm the stored paths, publicly served URLs and application video playback.
2. Test /session/adrian-7x800-2026-10-14 on Safari iOS and desktop Chrome. Expect built-in controls, poster, and a range-supported MP4, not a blank iframe.
3. Test Adrian and Tinius public profile cards. Their shared session should appear on both via existing person links and policy.
4. Test FORM iPhone Network featured story → Session → Play, plus Media > Films and both profiles. Regress guest/private person rules, fail/offline states and reduced motion.
5. Test an unauthorized nonpublisher cannot upload. Replace/withdraw one test asset and verify old public URL 404, then reupload the authorized file.
6. Full site tests and native Release compile must pass before archive. Do not archive/unpublish the existing app as a shortcut.
