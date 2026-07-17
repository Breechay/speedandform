# FORGE — Portal status + Accounts handoff (Sign in with Apple / Supabase)

Two audiences: this documents what's **shipped in the portal now**, and what
**Cursor should build next** (auth + accounts), since Cursor holds the FORM, FORGE,
and website workstations and can run migrations, native builds, and Apple/Supabase config.

---

## Part 1 — What's shipped in the portal (done)

`/forge-sculpt/train/` — deployable, self-contained, wired to
`data/forge-portal-programs.json` (the real export). No placeholder content.

- **Real data**: Forge Sculpt Phases 1–4 (15 weeks) + Rod, rendered from the JSON. Fail-closed if it doesn't load.
- **Portal Session + Focus modes.** The temporary web Focus contract uses per-**set** square marks `SET n OF m`, visible values, `/ side`, cues behind `?`, no rest timer, and explicit completion. It does not ratify native Focus truth granularity; native behavior follows the FORM-iOS logging-mode contracts. Mode + ticks persist locally (`forge_portal_v2`).
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

**4. NEXT — Account current-state + immutable receipt foundation.**

Schema, authority, constraints, and RLS are defined only in
`FORM-iOS/docs/FORGE_ACCOUNT_CONTINUITY_MASTER.md` §§16–18. This handoff does not
define a competing database model.

Before writing migration SQL, run `supabase-continuity-audit.sql` against the remote
Training Phases project and preserve every result set. The existing
`athlete_profiles`, coach-console `program_assignments`, views, policies, triggers, and
foreign keys must be mapped—not duplicated or replaced blindly.

Portal mapping into that contract:

- local session completion → canonical `session_completions`
- each local Focus set mutation → normalized current set state plus a whitelisted
  `training_events` receipt
- local Session/Focus choice and theme → `user_preferences`
- local resume position → validated assignment-position mutation
- Apple/Supabase user UUID → owner identity; email remains contact data only

Current-state rows are the v1 cross-device read model. Immutable events are
idempotency/audit/recovery receipts, not a replay requirement.

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

### Portal mode parity (carry across platforms)
The portal already models mode and per-set ticks locally. Cross-device mapping follows
the continuity master: preferences use current-state rows; checks use independently
versioned stable set keys so an explicit uncheck cannot be lost through array union.

---

## Part 4 — Next architecture deliverable

Generate migration SQL only after the continuity master and walkable state prototype
are countersigned together. Return per-table authority policies, constraints,
idempotency tests, offline queue tests, new/returning-account tests, and explicit
same-email / Hide-My-Email identity-linking tests.
