# FORM Perception Manual — source of truth

## Canonical files (repo only)

| What | Path |
|------|------|
| **HTML** | `perception-manual.html` |
| **Images** | `assets/perception-manual/01.jpg` … `13.jpg` |
| **Live URL** | https://speedandform.com/perception-manual |
| **Studio hub** | https://speedandform.com/studio — private dashboard; see `docs/STUDIO.md` |

Edit **only** these paths. Push to `main` → Netlify deploys.

There is no second HTML in the repo. Downloads / Claude exports with `data:image/...;base64` are **not** source of truth — they are disposable imports.

## Day-to-day editing

1. Open `perception-manual.html` in Cursor (or paste **this file** into Claude — not a Downloads export).
2. Change copy, layout, CSS. Leave `src="/assets/perception-manual/NN.jpg"` paths as-is unless you are replacing an image file.
3. Commit `perception-manual.html` and any changed `.jpg` files under `assets/perception-manual/`.
4. Push.

Images load from the repo on the live site. Claude does not need embedded base64 for normal edits.

**Hideout capture note:** ch.04b documents how Hideout looks on camera (opening, service, gathering). Business identity lives in `hideout-ops-console/docs/HIDEOUT_HOUSE_DOCTRINE.md` — neighborhood infrastructure, stewardship, conditions.

## When Claude gives you a new full export (rare)

Use only when Claude rebuilt the page and sent a **new** `FORM_Perception_Manual_*.html` with embedded images (e.g. new photos or reordered images).

```bash
cd ~/Documents/speedandform
python3 scripts/import_claude_perception_export.py ~/Downloads/"FORM_Perception_Manual_v10 (3).html"
git add perception-manual.html assets/perception-manual/
git commit -m "Import perception manual from Claude export"
git push
```

That script **overwrites** the canonical HTML and re-extracts all JPGs. Review the diff before commit.

## Do not

- Treat `~/Downloads/FORM_Perception_Manual_*.html` as the file you maintain.
- Paste the 1.3MB base64 export into chat for small copy tweaks (use repo HTML instead).
- Duplicate HTML elsewhere in BRICE-OS or FORM-iOS — link to speedandform.com.
