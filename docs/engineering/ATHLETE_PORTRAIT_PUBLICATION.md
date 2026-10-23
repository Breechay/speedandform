# FORM athlete portrait publication

**Owner rule · October 23, 2026 · Website + Running app + Coach Console**

An image upload is **not** an athlete portrait publication. The portrait is complete only after the production image, canonical Supabase person record, public-visibility decision and consuming surfaces agree. A GitHub commit, successful Netlify deploy, Supabase write and physical-iPhone check are separate states.

## One identity, two responsibilities

| Source | Responsibility |
| --- | --- |
| `athletes.id` | Canonical coached-athlete identity. Never infer it from the person's name, email or picture. |
| `athlete_memberships` | Verified athlete sign-in relationship. A coach membership does not prove that the athlete has claimed an account. |
| `collective_people.athlete_id` + `avatar_path` | Canonical approved portrait mapping for the public `/athletes/` directory, native FORM Dossier and Coach Console. One person per athlete ID. |
| `collective_people.account_id` | Optional verified direct account link, only when an active athlete membership proves ownership. The Dossier can also resolve through `athlete_id`. |
| `collective_people.visible` | Independent coach-approved publication decision. Do not set it to `true` just because an athlete is coached or has signed in. |
| `/assets/athletes/<slug>-<revision>.jpg` | One permitted site-hosted image location. The website is the file host; Supabase is the identity and visibility source. |
| `athletes.portrait_path` + private `athlete-portraits` bucket | Legacy private coach portrait fallback. Never treat this as publication to the native Dossier or public athlete roster. |

**Privacy boundary:** `visible = false` removes a profile from the public directory; it does **not** make a site-hosted photo URL private. Only place images approved for public hosting under `/assets/athletes/`. Keep restricted/private coaching images in private storage until an authenticated delivery flow exists for them.

The Coach Console first reads `collective_people.avatar_path` **by `athlete_id`**, with the legacy private signed portrait as fallback. The native app must follow the same identity relationship. Do not create a second manual avatar map, use a name lookup, or silently turn a private photo into a public profile.

## Required release sequence

1. **Confirm the subject and permission.** Identify the actual person in the supplied photo, canonical `athletes.id`, consent for the intended use, existing `collective_people` row, and any active `athlete_memberships` with `role = 'athlete'`. Decide separately whether the public `/athletes/` listing should include the person.
2. **Stage the immutable image.** Save a versioned filename in `assets/athletes/` and merge only after the usual site checks. Never overwrite an old URL served with `Cache-Control: immutable`; a replacement gets a new filename. A private signed bucket object is not a substitute for a public Dossier URL.
3. **Verify production publication.** Read the Netlify deploy ID, state `ready`, production commit and published timestamp. Request the *exact* new image URL without a cache-busting query. Confirm HTTP 200, `Content-Type: image/jpeg` (or correct image type) and a decodable image. A successful GitHub merge is not this check. If the build fails, fix the blocker, rebuild, and do not point Supabase at a 404.
4. **Link Supabase.** Insert or update the single `collective_people` row with the verified `athlete_id` and new `avatar_path`. Reuse a verified `account_id` only when the active athlete membership matches; leave it null if unclaimed. Set `visible` to the coach's explicit choice. Never overwrite biography, tags, sessions, consent or other profile fields while changing only a portrait.
5. **Read back and audit.** Query by canonical athlete ID, not slug alone. Check no duplicate people, path equals the production image, public directory lists only visible people with the same avatar, and any account link belongs to that athlete. Use the read-only verifier below. A database write receipt alone is insufficient.
6. **Check consumers separately.** Open the public athlete directory and profile on desktop/phone if published; refresh FORM Dossier on a signed-in athlete or coach device. Record which surfaces were actually tested. A repository source check does not prove a released installed iOS build renders the image.

## Repeatable verification command

Run from the website repository after the Netlify production deploy and Supabase update. Use a signed-in **Collective publisher** access token with normal RLS, not a service-role or secret key. Supply environment variables in the execution environment; never put tokens in a commit, command argument, screenshot or output.

```sh
FORM_SUPABASE_URL="https://YOUR_PROJECT.supabase.co" \
FORM_SUPABASE_PUBLISHABLE_KEY="YOUR_PUBLISHABLE_KEY" \
FORM_PUBLISHER_ACCESS_TOKEN="YOUR_PUBLISHER_JWT" \
node scripts/verify-athlete-portrait.cjs \
  --athlete-id "YOUR_CANONICAL_ATHLETE_UUID" \
  --slug "person-slug" \
  --path "/assets/athletes/person-20261023.jpg" \
  --visibility public
```

Use `--visibility private` when the coach does not approve public listing **but has separately approved the image being hosted at a publicly accessible URL**. Otherwise retain a private-bucket portrait and do not run this public-site publication workflow. The command is read-only. It exits non-zero on missing or mismatched Supabase identity, incorrect visibility, bad account ownership, missing public directory entry, HTTP 404 or non-image content. It cannot verify visual crop quality, identity likeness, consent documentation, or physical-device display; those remain actual release checks.

## Avoid the October 23 failure modes

- **Wrong destination:** uploading only to the `athlete-portraits` private bucket or only setting `athletes.portrait_path` does not give FORM Dossier its canonical photo. The linked `collective_people` row owns that mapping.
- **Broken site deployment:** a gallery catalogue mismatch blocked several site deploys while source assets existed on GitHub. Keep the Photos gallery catalogue parity test green; do not attach a new site URL to Supabase before the site actually serves it.
- **Stale coach photo:** the Coach Console previously signed every `athletes.portrait_path` as a private object, including site URLs that could never be signed. It now prefers the same `collective_people.avatar_path` lookup as FORM; legitimate private portraits remain a fallback.
- **Cache trap:** a rejected or cached 404 before deploy is not proof a new file is published. Check the exact URL after successful deployment from a fresh HTTP client. New replacements get new immutable paths.
- **Publication scope:** portrait approval for private coaching does not automatically approve a public directory entry. Preserve `visible = false` until the coach explicitly requests visibility.

**Status vocabulary:** file staged → source merged → Netlify ready → production image verified → Supabase mapped → website verified → iOS device verified. Use the exact last reached state in a handoff; never shorten the chain to “live” prematurely.
