# FORGE — Portal status + Accounts handoff (Sign in with Apple / Supabase)

Two audiences: this documents what's **shipped in the portal now**, and what
**Cursor should build next** (auth + accounts), since Cursor holds the FORM, FORGE,
and website workstations and can run migrations, native builds, and Apple/Supabase config.

---

## Part 1 — What's shipped in the portal (done)

`/forge-sculpt/train/` — deployable, self-contained, wired to
`data/forge-portal-programs.json` (the real export). No placeholder content.

- **Real data**: Forge Sculpt Phases 1–4 (15 weeks) + Rod, rendered from the JSON. Fail-closed if it doesn't load.
- **Session + Focus modes.** Focus mirrors the audited app contract (`ForgeFocusLogging.swift`): per-**set** square marks `SET n OF m`, values always visible, laterality `/ side`, cues behind `?`, **no rest timer**, completion **never automatic**. Mode + ticks persist locally (`forge_portal_v2`).
- **Open-preview** (`ACCESS_MODE='open-preview'`): all phases/weeks/sessions open, Phase IV unlocked, stable shareable hash URLs that survive refresh, `document.title` per route.
- **Rod unlisted**: direct URL only (`#/rod`), out of nav/cards/metadata.
- **Signup** → Netlify Forms (`forge-launch`), fail-closed.
- **Persistence is honest**: local completion/resume/ticks; the copy says "saved to this browser."

### The seam for accounts
Everything the account system must eventually sync is already a clean local object
(`STATE` in index.html): `done` (session completion), `sets` (focus ticks),
`mode` (Session/Focus preference), `email`. Swapping local persistence for
Supabase-backed, per-user state is a contained change.

---

## Part 2 — Division of labor for accounts

**Cursor (has the workstations):** everything server/native/secret —
Supabase auth repair, Apple Developer identifiers, Supabase provider + RLS tables,
Apple JS ↔ `signInWithIdToken` on the site, native `AuthenticationServices` in FORGE,
entitlement checks, env/secrets, Hide My Email.

**Portal (front-end):** Apple identity is now wired. Session restore and the `STATE`
sync remain local-only until the progress schema and RLS tests are signed.

---

## Part 3 — Cursor task list (build order matters)

**0. COMPLETE — Repair the existing Supabase signup path FIRST.** There was a prior
`500 Database error saving new user`. Apple auth also inserts into `auth.users`, so
prove a brand-new user can be created cleanly before touching Apple. Audit every
trigger/function/policy on `auth.users`; add a passing new-user insertion test.

Repository audit completed Jul 16 2026:

- checked-in SQL references `auth.users`, but no checked-in migration defines an
  `auth.users` trigger;
- this checkout has no linked Supabase CLI project configuration;
- Supabase and Netlify CLIs are not installed locally.

The failing trigger therefore lives in remote database state or an uncommitted
migration and cannot be diagnosed from this repository alone. Run the read-only
`supabase-auth-audit.sql` in the Training Phases Supabase SQL editor and save its
results before changing Apple identifiers or providers.

Remote proof completed Jul 16 2026: a new Supabase user was created successfully;
the earlier `Database error saving new user` did not reproduce.

**1. COMPLETE — Audit Apple Developer state before changing anything.** Record FORM's App ID,
FORGE's standalone App ID, whether either has Sign in with Apple enabled, whether either
already has Apple-authenticated users, and which should be the long-term **primary**.
Do not regroup identifiers after users exist.

**2. COMPLETE — Design one Sign in with Apple group (one account system, Apple as first method):**
```
Primary App ID (Speed & Form)
├── FORGE iOS App ID
├── FORM iOS App ID   (only if shared S&F accounts are in scope)
└── Website Services ID   e.g. com.speedandform.account.web
```
Website Services ID domains: `speedandform.com`, `www.speedandform.com`.
Return URL: `https://speedandform.com/auth/apple/callback`.

Configured:
- Primary: FORM (`com.speedandform.app`)
- Grouped native client: FORGE (`com.speedandform.forge`)
- Web Services ID: `com.speedandform.account.web`

**3. COMPLETE — Configure Supabase Apple provider** to accept: the web Services ID + FORGE bundle
ID (+ FORM later). Web method: **Sign in with Apple JS → `supabase.auth.signInWithIdToken`**
(not redirect OAuth) — it captures the name on first authorization and avoids web-secret
rotation. Use random `state` + `nonce`; verify signature/audience/expiry/nonce. Never put
Apple private keys or the Supabase service-role key in browser code.

Supabase accepts all three client IDs. The portal uses Apple JS popup authorization,
random state + nonce, then exchanges the ID token through `signInWithIdToken`.
The Apple name is copied into Supabase user metadata when Apple provides it on first
authorization. No account trigger or duplicate profile table was added.

**4. NEXT — Data model (RLS: user may only read/write their own rows):**
```
profiles(user_id, display_name, given_name, family_name, created_at)
product_access(user_id, product, access_level, source, valid_until)   -- entitlements
forge_progress(user_id, program_id, phase_number, week_number, current_session_id, updated_at)
forge_session_completion(user_id, program_id, session_id, completed_at)
forge_session_draft(user_id, session_id, checked_movement_ids, updated_at)  -- focus ticks
forge_preferences(user_id, preferred_session_mode, theme)             -- Tinius = 'focus'
```
Use the Supabase user UUID as the identity key — not the email (Hide My Email gives a
relay address; store it as contact info only). Accept relay domains
`privaterelay.appleid.com`, `icloud.com`, `private.icloud.com`.

**5. Entitlements are the *real* gate — the portal flag is not.** The portal's
`ACCESS_MODE`/`ACCESS_CODE` only hide the interface; the code is client-visible and the
program JSON is publicly fetchable. Real protection = auth + server-backed
`product_access` (Henry → Sculpt; Tinius → Sculpt + focus preference; Rod → his track),
with the full data served only to entitled users. The public sample session stays open
with no account. Until this lands, the portal stays `open-preview`.

**6. Native FORGE later** uses native `AuthenticationServices` → `signInWithIdToken` on
the **same** Supabase project → same user → same progress. Provide an explicit
"Connected Accounts" link action; use Supabase identity linking only while signed in.
Never merge two accounts because emails match.

**7. Keep auth ≠ marketing.** After account creation, a **separate** optional checkbox:
"Email me when the standalone FORGE app launches." Don't turn Continue with Apple into consent.

### Focus Mode parity (carry across platforms)
`forge_preferences.preferred_session_mode` and `forge_session_draft.checked_movement_ids`
must sync so Tinius reopens in Focus with his in-progress ticks on both web and app. The
portal already models mode + per-set ticks locally — map them 1:1.

---

## Part 4 — What Cursor should return
Supabase migration SQL + RLS tests, Apple identifiers/domains/return URLs, required env
vars, and passing new-account / returning-account / Hide-My-Email tests — plus the
Supabase URL + anon key so the portal's Apple button can be wired. First deliverable
is the **auth.users repair proof**, before any Apple config.
