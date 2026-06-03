# FORM Studio — private operator dashboard

## Canonical files

| What | Path |
|------|------|
| **Studio hub** | `studio.html` · https://speedandform.com/studio |
| **Films list** | `films.html` · https://speedandform.com/films |
| **Perception manual** | `perception-manual.html` · https://speedandform.com/perception-manual |
| **Cinema doctrine (markdown)** | `INCREMENTS/Docs/CINEMATIC_DOCTRINE.md` |
| **Cinema doctrine (PDF)** | `INCREMENTS/cinematic_doctrine_v11.pdf` |

**Unlisted.** `noindex` on studio + films — not linked from marketing site. Bookmark the URLs.

## What it is

One scroll, fixed sidebar, six collapsible sections (keys 1–6):

1. **The Map** — how perception manual, cinema doctrine, and studio relate
2. **Perception** — compressed doctrine + link to full manual
3. **Cinema** — When It Matters extracts inline + link to full markdown
4. **Field Guide** — pre-shoot checklist, protocols (self, athletes, Hideout), eye training, culling
5. **File System** — drive folder structure, naming, archive logic
6. **Films** — quick picks inline; **full list at `/films`**

Use **Field Guide** most often. Use **Perception** for quick recall; open `/perception-manual` for full chapters. Use **`/films`** for expanded watch list with tiers.

## Stack

| Layer | Surface | Job |
|-------|---------|-----|
| Frame | Perception manual | How to see, shoot, edit, grade |
| People | Cinema doctrine | Conduct, ensemble, inference on screen |
| Practice | Studio field guide | What to do before/during/after shoot |
| Archive | File system section | Where files live on disk |
| Frequency | Films | Sunday nourishment — context, not hype |

## Day-to-day editing

1. Edit `studio.html` or `films.html` in Cursor.
2. Edit `INCREMENTS/Docs/CINEMATIC_DOCTRINE.md` for doctrine changes (markdown canonical).
3. Commit + push to `main` → Netlify deploys.

## Do not

- Link `/studio` or `/films` from public marketing unless you intend discovery.
- Duplicate operator / Hideout business doctrine here — compress and link only.
- Treat `~/Downloads/studio.html` as source of truth after import.

## Related

| Doc | Location |
|-----|----------|
| Perception manual notes | `docs/PERCEPTION_MANUAL.md` |
| Operator manual § Cinema | `FORM-iOS/docs/BRICE_OS/BRICE_OPERATOR_MANUAL.md` |
| Film recommendations (legacy) | `INCREMENTS/film_recommendations.html` → points to `/films` |
