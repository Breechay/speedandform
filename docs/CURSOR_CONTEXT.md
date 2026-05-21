# Cursor / agent context — speedandform (web)

**Purpose:** Thin orientation for the **Netlify / static site** and any **SPA sub-apps** (`/form`, `/forge`, etc.) in this repo.  
**Doctrine (canonical, lives in iOS repo):** `FORM-iOS/docs/form_field_doctrine.md`, `FORM-iOS/docs/form_web_spec_v2.md`  
**FORM/Forge architecture:** `FORM-iOS/docs/FORM_FORGE_ARCHITECTURE.md`  
**Workspace operator kernel:** `FORM-iOS/docs/BRICE_OS/BRICE_OPERATOR_KERNEL.md` (cross-repo only — not web implementation detail)  
**Denylist:** `docs/DO_NOT_BUILD.md` (this repo)

**RunCards:** Not in this repo. SoT: `FORM-iOS/docs/BRICE_OS/RUNCARDS_CONTEXT.md` (temporary bridge). Do not add RunCards docs here.

When both **`speedandform`** and **`FORM-iOS`** roots are in the workspace, treat Field doctrine in **FORM-iOS/docs/** as authoritative for **The Field** behavior and copy. Any athlete-visible web copy should match **`FORM-iOS/docs/VOICE_DOCTRINE.md`** (plain language gate), then field specs as listed below.

## What this repo is

- **speedandform.com** — marketing + athlete pages, legacy coach HTML, redirects.
- **Future / adjacent SPAs** — e.g. React under `/form` or `/forge` per `netlify.toml` and internal specs; do not break the static site or production `coach.html` unless a task explicitly says so.

## Defaults for ambiguous work

1. **Smallest change** — preserve existing production pages and deploy shape.  
2. **Evidence** — cite files; trace env vars and auth before “fixing” loading states.  
3. **No new social mechanics** — see `DO_NOT_BUILD.md`.  
4. **Ask** — if Supabase schema or routes are unclear, flag instead of inventing tables or URLs.

## Pointers inside this repo

| Area | Notes |
|------|--------|
| Deploy | `netlify.toml`, `_redirects` |
| Coach | `coach.html` — production; do not replace casually |
| New SPA | Follow internal specs; match tokens in `form_web_spec_v2.md` where applicable |

## Current intent (edit when focus shifts)

_Update this line when your sprint changes._

- Forge / coach console: align with **FORM-iOS** Forge palette + doctrine; **diagnose-then-fix** loading/auth before UI churn.

---

*If this file disagrees with `FORM-iOS/docs/form_field_doctrine.md`, **doctrine wins** — update this file.*
