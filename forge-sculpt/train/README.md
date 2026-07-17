# FORGE Athlete Portal — `/forge-sculpt/train/`

Temporary web portal that gives current FORGE athletes their training back while the
standalone FORGE app ships, and doubles as an open, shareable preview of the app.

Lives at **https://speedandform.com/forge-sculpt/train/**

## What's in this folder

```
forge-sculpt/train/
├── index.html                        the portal (HTML + CSS + JS, no build step)
├── continuity-store.js               account-scoped IndexedDB/cache/queue boundary
├── session-model.js                  shared draft, Focus truth, and receipt model
├── README.md                         this file
├── HANDOFF-ACCOUNTS.md               account/auth boundary and current audit status
├── supabase-auth-audit.sql           read-only remote auth failure preflight
├── supabase-continuity-audit.sql     read-only account/schema authority preflight
└── data/
    ├── forge-portal-programs.json    single source of truth — Forge Sculpt (P1–4) + Rod
    ├── forge-portal-programs.schema.json
    ├── validate.py                   fail-closed validator (python3 validate.py)
    ├── test_session_model.js         draft/receipt truth tests
    └── test_continuity_contract.js   revision/receipt uniqueness tests
```

The portal **fetches `./data/forge-portal-programs.json` at runtime** and renders
everything from it. There is no inlined program content. If the JSON is missing or
invalid, the portal shows a clean "temporarily unavailable" state — it never renders
placeholder training.

### Prescription identity

The browser preserves every authored set. It derives immutable-version context from:

```text
program version → stable session id → movement occurrence → authored set sequence
```

It also computes a SHA-256 prescription fingerprint for each phase/program payload.
Drafts and future receipts must carry the version, stable set identity, fingerprint,
and prescription snapshot. A later content edit may never rewrite an older receipt.
Any authored prescription change requires a new program version.

Anatomy art is referenced from the existing repo assets (`/assets/forge/*`,
`/assets/home/forge/*`). Dark and light are authored separately: the portal hero uses
`anatomy-reveal.webp` in dark and the cream-native `hero-light.webp` in light. Surfaces
without an approved light-native asset remain typographic; dark assets are never
filtered into light.

## Configuration (top of the `<script>` in index.html)

| Const | Now | Meaning |
|---|---|---|
| `ACCESS_MODE` | `'open-preview'` | Everything open; Phase IV unlocked; no gate. The only other value, `'shared-code-demo'`, hides the *interface* behind a code — it is **not security**. |
| `PUBLIC_ACCESS_UNTIL` | `2026-07-23…` | **Informational only.** The gate is flag-driven, never clock-driven — flipping the date does nothing on its own. |
| `ACCESS_CODE` | `'forge2026'` | Demo code for `'shared-code-demo'` only. |

**The real gate is not a flag.** A client-visible `ACCESS_CODE` and a publicly-fetchable
`data/forge-portal-programs.json` mean anyone can read the full program regardless of
`ACCESS_MODE`. Actual protection = server-backed accounts + entitlements (Supabase),
which is Cursor's build — see `HANDOFF-ACCOUNTS.md`. Do **not** treat `shared-code-demo`
as authentication. Keep `open-preview` until Supabase entitlements land.

Rod is **unlisted, not private** — out of nav/metadata, but anyone with the direct URL
(or the JSON URL) can read it. Fine for the preview; not a privacy guarantee.

## Modes

- **Session** — the editorial training sheet (default; sells FORGE). Computed stats,
  key-lift treatment from `isPrimeMover`, cues/subs one tap away.
- **Focus** — mirrors the app's audited Focus contract: per-**set** square marks
  (`SET n OF m`), prescribed values always visible (a tick asserts them), laterality
  preserved (`/ side`), **no rest timer**, cues behind the `?`, completion **never
  automatic** (explicit "Finish session"). Mode + checked sets persist per device.

## Signup

The "Send me the link" form submits to **Netlify Forms** (`name="forge-launch"`).
Submissions appear in Netlify → your site → **Forms**. It **fails closed** — success
only shows on a real 200. (It cannot succeed on `localhost`; that's expected.)

## Rod

Rod's coached track is **unlisted** — not in nav, cards, or metadata. It's reachable
only by direct URL: `…/forge-sculpt/train/#/rod`. Give that link to Rod directly.

## Local preview

```
cd forge-sculpt/train && python3 -m http.server 8080
# open http://localhost:8080/  (signup will fail-closed locally — expected)
```

## Deploy

Static; Netlify auto-publishes the repository root on push to `main`. There is no
portal build step.

**Gate status:** implementation foundation complete; ratification remains pending the
Supabase preflight/reconciliation and iPhone Safari runtime proof.

From the repository root:

```bash
python3 forge-sculpt/train/data/validate.py
node forge-sculpt/train/data/test_session_model.js
node forge-sculpt/train/data/test_continuity_contract.js
git add \
  forge-sculpt/train/index.html \
  forge-sculpt/train/continuity-store.js \
  forge-sculpt/train/session-model.js \
  forge-sculpt/train/README.md \
  forge-sculpt/train/HANDOFF-ACCOUNTS.md \
  forge-sculpt/train/supabase-continuity-audit.sql \
  forge-sculpt/train/data/validate.py \
  forge-sculpt/train/data/test_session_model.js \
  forge-sculpt/train/data/test_continuity_contract.js
git diff --cached --check
git commit \
  -m "Establish FORGE local continuity and receipt truth foundation" \
  -m "Pending:
- Supabase schema/RLS reconciliation
- iPhone Safari runtime proof
- production account wiring"
git push origin main
```

Expected URLs:

```text
https://speedandform.com/forge-sculpt/train/
https://speedandform.com/forge-sculpt/train/#/sculpt
https://speedandform.com/forge-sculpt/train/#/sculpt/1/1/0
https://speedandform.com/forge-sculpt/train/#/rod
```

Post-deploy verification:

```bash
curl -fsSI https://speedandform.com/forge-sculpt/train |
  grep -Ei 'HTTP/|location:'
curl -fsS https://speedandform.com/forge-sculpt/train/ |
  grep -F "const ACCESS_MODE='open-preview'"
curl -fsS https://speedandform.com/forge-sculpt/train/data/forge-portal-programs.json |
  python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["schemaVersion"], [p["id"] for p in d["programs"]])'
```

Then submit one real email and confirm it appears under Netlify → Forms →
`forge-launch`. Localhost intentionally cannot prove that integration.

Rollback the deployment commit without rewriting history:

```bash
git revert <portal-deploy-commit>
git push origin main
```
