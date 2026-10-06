# Speed & Form · house system

> **CURRENT AUTHORITY · 1 October 2026**
> This is the active sitewide brand and public-surface doctrine. It supersedes earlier homepage positioning and do-not-regress documents wherever they conflict. Historical files remain in the repo as evidence, not current art direction.

**One house, many rooms.** Speed & Form should feel authored. A study may feel like a marked-up research sheet, a guide may feel like a quiet book, and the homepage is a personal introduction to Brice and his work. The visitor should still know whose house they are in.

## The house

**Speed & Form** is the public house. **FORM** remains the identity of the running app, coaching practice, studies and related products. The public homepage and service pages use forest and chalk; lime does not have to define the entire ecosystem.

The primary public doors are:

- **Home** — running and strength coaching with Brice, with paths to his other work.
- **Run Miami** — the current community offer.
- **Thursday** — the live weekly public session.
- **Plans** — self-guided training products.
- **Labs** — studies, experiments and proof.
- **Library / Field Notes** — teaching and thinking.
- **Contact** — the front desk. Every public room should make it possible to get here.

Retired doors may keep their URLs for continuity, but they redirect into the current house instead of displaying an old offer.

## Marks

| Mark | Use |
|---|---|
| **SF emblem** · `/assets/brand/sf-seal.svg` | Public header and footer, alone. Also favicon, merch, stamps and sign-offs. |
| **FORM.** · product wordmark, lime period | Existing application and product identity where it already belongs. |
| **Italic FORM** | Authored study and field-sheet identity inside the room. |

The public home link is the emblem alone, with an accessible name. Do not place “Speed & Form” or a second wordmark beside it, including in the footer. Product titles, editorial copy and copyright may still name the house or product.

## Constants

- Public house palette: forest `#283c32`, chalk `#f2ecdd`, warm chalk actions `#e7e3c9`, supporting sage `#bdc7b8`. Keep ordinary headline punctuation the same color as the headline.
- Existing FORM app, Labs and study colors retain their role. Lime `#c9ff36` is a product signal, not a required public-house accent. Avoid recoloring every room.
- Measured things — prices, dates, weeks, paces, coordinates, technical captions — use a monospace when the room supports it.
- Brice's voice is short, specific and human. First person when it is him. No corporate "we believe" language.
- Approved coaching descriptor: **RUN DEVELOPMENT · GAIT RETRAINING · PROGRAMMING**. Use it as a quiet supporting line on coaching surfaces after the main promise is clear. `Run Development` stays the umbrella; `gait retraining` names deliberate movement change; `programming` names the authored training structure.
- Photography is real: real athletes, real sessions, real Miami. No stock. The homepage introduction uses Brice’s original black-and-white hands-on-hips track photograph (`assets/home/practice/coaching-track.webp`), framed by CSS. Marcus and Saul’s side-by-side track photograph remains in the practice section. Do not regenerate, retouch identity, or invent a photograph of Brice.
- October 1 final opening decision: Brice retired the track background. The homepage opening/header uses the same solid forest `#283c32` as the footer. Keep the original photograph and its approved top-left-only corner (160px desktop, 100px phone); the other three corners are square. The supplied background remains archived as an asset, not active art direction. The sweeping SVG mask, offset chalk backing and chamfer remain rejected. Do not borrow regenerated portraits or unapproved slogans.

- Motion arrives once and then gets out of the way.
- No decorative glitch, HUD or scanline systems. **Exception:** the homepage hero film may retain a subtle scanline/grain treatment when it materially improves imperfect source footage. That exception belongs to the film, not the interface.
- Plain punctuation in new authored copy. Avoid ornamental em dashes when a period, comma or colon reads better.
- Absence is never rendered as deficiency. A return does not require an apology.

## Schedule doctrine

There are two different things and they must never be confused.

**Public schedule:** dated Thursday gathering confirmation, time/place changes and cancellation come from the existing public Collective projection. `/js/community-schedule.js` owns usual recurring logistics and explicitly authored workout descriptions. A pending workout never cancels a published gathering; a failed or absent dated record never becomes a confirmation. See `FORM_CONNECTED_SURFACES.md`. Monthly long runs are announced only when confirmed.

**Authored training architecture:** a plan may deliberately prescribe Tuesday, Thursday and Saturday. Those weekdays belong to that program. They do **not** become the public FORM schedule.

Never copy a public time or location into a new page when it can be read from the shared source. Never advertise an old venue because it survives in an archive.

## Rooms

| Room | Type | Field |
|---|---|---|
| House: home, contact, coaching, analysis, work | Inter Tight + JetBrains Mono | Forest `#283c32`, chalk `#f2ecdd`, existing warm paper sections |
| Labs, paper studies | Archivo + Space Mono + handwriting | Paper `#e9e3d6`, annotation blue/red |
| Labs, dark studies | Inter / Inter Tight | Dark field + lime |
| Library and guides | Inter Tight + existing numeric mono | Cream `#ece6da`, lighter paper `#f4efe7` |
| Miami + Thursday | Archivo + Space Mono | Paper field sheet; Thursday is the compact live-session sibling of Run Miami |
| Athlete plans | Their authored training-sheet system | Usually cream, restrained accent |

A new room may choose its own type and composition. It keeps the house constants.

### October 6 owner correction: Library typography

Brice removed serif type from the Library. Library discovery, tools, guides and nested articles use the locally hosted Inter Tight family with a system sans-serif fallback. Keep the cream reading room and SF emblem. Body copy stays 17–18px with comfortable line spacing; headings use a clear 600–650 weight and restrained negative tracking. Openings are compact enough to reveal the next useful action. Existing numeric monospace remains distinct. `css/cream-reading.css` owns this room's type; `scripts/build-cream-reading.cjs` applies it and refreshes marked pages. The historical `--reading-serif` token is a sans alias for older layout sheets, not permission to restore a serif.

## Public product states

Customer-facing product language uses three states only:

- **Paid plan** — show the preview, full price and direct path to the product.
- **Free plan** — say free plainly. Do not make the visitor infer that from a missing price.
- **Open plan** — the full plan is available to read without a purchase. Say that plainly.

Internal labels such as *frozen*, *inspect*, *candidate*, *implementation*, *live PR* or *method state* belong in operating documents, never on the Plans shelf.

## Doorways and footers

A public room should answer three questions without hunting:

1. **Where am I?**
2. **What can I do here?**
3. **How do I reach Brice or the next live thing?**

The preferred footer frame is: home/seal, the room's adjacent destination, **Contact**, Privacy. Do not add a global mega-navigation that erases the room.

## Truth before polish

A beautiful house that lies about its schedule is not beautiful.

- Do not publish "coming soon" or "email alerts are being prepared" unless the feature is actually ready.
- Do not leave a past venue or time in structured data.
- Do not let an archive look like a current instruction.
- If a current fact has one source of truth, link to it instead of duplicating it.

## October 1: expressive public continuation

Brice approved the study/typography exploration and authorized extending it across recent reachable public surfaces with supplied real photographs and athlete consent. Display typography is bold Inter Tight with deliberate scale and tighter heading tracking; body copy stays quiet and readable. House pages alternate forest/chalk, with a distinct dark/lime public study feature. Homepage introduction retains the original B&W Brice photograph and top-left-only round corner. No generated or retouched athlete identities. Community schedule and FORM product/study rooms keep their owning sources.

## October 1 owner correction: reader first, photograph with purpose

Start public service sections with what the visitor wants: run farther, feel smoother, improve their form, get stronger, build muscle or get leaner. Then show what Brice does and what the visitor receives. Preserve the actual coaching philosophy in the deeper explanation; do not assemble coach quotations as a substitute for a buyer’s reason to care. A community section should clearly invite a local runner and link to the next confirmed gathering, not add abstract photo captions. Do not promise a pain cure or guaranteed body-composition result.

The owner rejected the sky-heavy IMG_8047 portrait crop. Use his Strava selection IMG_8069 for the practice photograph, preserving central athletes’ complete bodies in a wide frame. Give the photo a deliberate relationship to the copy; show it before the detail on phones.

## October 1 owner portrait and emblem proportion refinement
Use owner-supplied Photoshop Brice portrait (`assets/home/20261001/`), retaining the elbow and original pixels. Responsive WebP encoding only; no regenerated person. Full portrait uses CSS cover/left-center in the existing3:4frame with top-left-only160desktop/100phone corner. Public header SF emblem76×32desktop/62×28phone; footer174×64retained after actual render review. Keep emblem-only links.

## October 6 · The bend: the house signature, and how to decide like this

**Status.** Brice approved the direction from a canvas review on October 6 and asked for it stronger ("thicker") and written down, so the next person or agent reaches the same kind of answer without him. It is built on `work/the-bend-20261006`. His own review of the real page and the production check are still open. See the roadmap entry for the exact state.

### What it is

One drawn object: the first bend of a standard 400 m track, to true proportion. Bend radius 36.5 m, lane width 1.22 m, nine lines for eight lanes, the start line, and the seven staggered 400 m start marks. The straight comes in from the left and the bend rises on the right, because runners turn left. Do not mirror it.

- Source of truth: `scripts/sf-bend.cjs`. Every number in it is a real track measurement.
- Homepage use: generated into the **From the practice** fold by `scripts/public-study-preview.cjs`. Never hand-edit the SVG in `index.html`.
- Standalone asset for story frames, covers and print: `/assets/brand/the-bend.svg` (run `node scripts/sf-bend.cjs` to rebuild it).
- Check: `node tests/sf-bend.cjs`.

### How the decision was made

The request was: the lower folds feel flat, maybe subtle contour lines as a signature. The answer was not a better contour. Ask these in order before adding anything to a surface.

1. **What is the real object?** A pattern is what you reach for when you have not found the object. Contours belong to hiking brands. The track belongs to this practice and is already in the hero photograph.
2. **Can you name every number?** If a line cannot say what it measures, it is decoration. Take the geometry from the real thing and leave it alone.
3. **What does it line up with?** The start line sits on a text edge: the left margin on phones, the left edge of the date column on desktop. The straight passes under the question "Can you hold it?"
4. **What does it replace?** Adding the bend removed the boxed three-column grid. Also is now a plain index: one row per offer, price on the right in mono. If nothing comes out, do not put something in.
5. **Is it one thing?** One accessory per fold. One bend per page.
6. **Is it found, not announced?** It should read clearly once noticed and never compete with type. Lanes never cross type. They dissolve before they reach it.
7. **Does the photograph still have the room?** See below.

### What expensive means here

- **The photograph is the luxury.** Space, type and the bend exist so a real photograph has somewhere to land. Brice is reshooting at higher quality. Build every room ready to receive a frame, and leave the space empty until a real one exists. Never fill it with stock, a generated image or ornament.
- **Fewer things, each one exact.** Alignment, one rule per boundary, tabular figures and real measurements do the work.
- **Agreed off the table on October 6:** topographic or contour textures, film grain, a serif display face, gold accents, boxed offer cards and a custom cursor.
- **Not ruled:** capacity or invitation language such as "limited roster". The existing rule already applies. Do not publish it unless it is true.

### Measurements

| | Desktop, 1440 and wider | Phone and tablet, under 1024 |
|---|---|---|
| Lane | 22px (1.53vw, floor 16px, from 1024 to 1439) | 9px at 390 (2.31vw, 9px to 16px) |
| Radii, inside to outside | 658px to 834px | 269px to 341px |
| Line | 1.5px, the fold's text color | same |
| Strength | lanes 22%, marks 60% | same |
| Start line | left edge of the date column, 580px in from the content edge | on the text margin |
| Outer lane | 104px above the fold's bottom edge | 72px above the fold's bottom edge |
| Clearance | band starts 60px below the study link | inside lane 23.5 lanes below the study link |
| Dissolve | over the 158px below the bend's center height | fully clear by the top of the study link |

CSS owns these as `--lane`, `--bend-x`, `--bend-gap`, `--bend-solid` and `--bend-clear` on `.home-evidence` in `css/home-commercial.css`. The drawing scales with `--lane`. The proportion never changes.

### Motion

It arrives once. When the fold enters view the lanes run in from the left, then the start marks appear. `js/home-settle.js` arms it, so without script or with reduced motion the bend is simply there. No loop, no parallax, no hover effect.

### Where it may go

- Built: the homepage **From the practice** fold.
- Intended next, not built: 9:16 story frames, study covers and printed pieces, from the standalone asset. One bend per piece, same line weight, same strength.
- Not without a new owner decision: paper or cream rooms, the FORM and Forge apps, any second use on the same page.
- Never: tiled, rotated, mirrored, recolored lime, looped, or used in place of the SF emblem.

### Checked and not checked

Chromium renders at 375, 390, 430, 768, 1024, 1280, 1440 and 1920 wide were reviewed on October 6, with the arrival on and with reduced motion. Safari, a physical phone, 200% zoom on this fold and production are not checked yet.
