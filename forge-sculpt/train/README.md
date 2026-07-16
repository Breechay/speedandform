# FORGE Athlete Portal — `/forge-sculpt/train/`

Temporary web portal that gives current FORGE athletes their training back while the
standalone FORGE app ships, and doubles as an open, shareable preview of the app.

Lives at **https://speedandform.com/forge-sculpt/train/**

## What's in this folder

```
forge-sculpt/train/
├── index.html                        the portal (HTML + CSS + JS, no build step)
├── README.md                         this file
└── data/
    ├── forge-portal-programs.json    single source of truth — Forge Sculpt (P1–4) + Rod
    ├── forge-portal-programs.schema.json
    └── validate.py                   fail-closed validator (python3 validate.py)
```

The portal **fetches `./data/forge-portal-programs.json` at runtime** and renders
everything from it. There is no inlined program content. If the JSON is missing or
invalid, the portal shows a clean "temporarily unavailable" state — it never renders
placeholder training.

Anatomy art is referenced from the existing repo assets (`/assets/forge/*`,
`/assets/home/forge/*`) — dark mode only. Light mode is intentionally typographic
(the app has no cream-native anatomy on the web side).

## Configuration (top of the `<script>` in index.html)

| Const | Now | Meaning |
|---|---|---|
| `ACCESS_MODE` | `'open-preview'` | Everything open; Phase IV unlocked; no gate. Set to `'account-required'` to gate the full curriculum behind sign-in (leaves the sample session public). |
| `PUBLIC_ACCESS_UNTIL` | `2026-07-23…` | **Informational only.** The gate is flag-driven, never clock-driven — flipping the date does nothing on its own. |
| `ACCESS_CODE` | `'forge2026'` | Only used if `ACCESS_MODE === 'account-required'` (interim shared code before real accounts land). |

To gate after the open week: change one line, `ACCESS_MODE = 'account-required'`, commit, push.

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

Static; Netlify auto-publishes the repo root on push to `main`. No build. See the
commit/verify/rollback block in the deploy handoff.
