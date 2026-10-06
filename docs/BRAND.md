# Speed & Form · house system

> **CURRENT AUTHORITY · 6 October 2026**
> This is the active sitewide brand and public-surface doctrine. It supersedes earlier homepage positioning and do-not-regress documents wherever they conflict. Historical files remain in the repo as evidence, not current art direction.

## Current direction and precedence

Brice reaffirmed the new homepage and brand-page direction on October 6 and asked that future work follow it. Read this section before the dated decision history below. Current owner instructions and scoped newer decisions supersede conflicting older palette, display-weight and opening instructions; history is not an invitation to restore an older design.

- **House:** black `#0d0f0e`, bone `#e8e3d9`, ink `#161916`; quiet text `#b8bbb2` on black and `#5e625b` on bone. These match `css/home-commercial.css` and the kit token generator. Forest/chalk below records the earlier direction, not the current public default. FORM app and authored study systems keep their own roles.
- **Type and structure:** Inter Tight, display weight 450, restrained negative tracking; JetBrains Mono for house labels and measurements. Align the emblem and content edges, use rules and space instead of decorative boxes, keep one divider per boundary. Readability and contrast remain acceptance requirements, including at the smallest labels.
- **Paper rooms:** cream and a comfortable reading measure, sans serif, ink structure. The supplied Library treatment uses 450 headings, house edges, mono labels, a ruled starting-point column, large facts above labels and ink weekly bars. It is scoped to the twelve-week plan, readiness guide and pace chart. The remaining Library has not been migrated to this heading weight. No bend or lit headline on these cream pages.
- **Light and imagery:** real photographs carry the room. Only the approved dark-room headline/emblem receive light falloff; decision text stays at full strength. Preserve the documented cloth-rendering exception without treating it as photography or permission to generate athletes.
- **Voice:** say the real thing once. Use the shortest truthful sentence, first person when it is Brice, and the runner's need before the method. No hype, corporate belief language, pseudo-scientific noun piles or repeated reassurance. Keep coaching and evidence qualifications that change the reader's decision.
- **Signature:** use the measured bend from `scripts/sf-bend.cjs`, never redraw, mirror or tile it. One bend per approved piece, clear of type. Kit templates are the reuse path; app use still needs its own design decision.

### Sources and release continuity

`docs/BRAND.md` owns decisions and their scope. `brand/index.html` is the public presentation; `css/home-commercial.css` and the owning room styles implement it. `scripts/build-brand-kit.cjs` owns kit tokens/templates, `scripts/sf-bend.cjs` owns the drawing, and `scripts/render-brand-kit.cjs` renders the PDF/previews/zip. Read current source before using any copied values. Change source and projections together when a public rule changes; do not hand-edit generated output. Documentation-only routing or release corrections do not require regenerating unchanged public assets.

At this review, PR #231 is merged at `0fde9ad3ffb29b5735aa73a3137fb2dec4e0682a`, including the homepage footer link to Brand. The doors and Library work merged in PR #232 as `6184fc9` (`work/doors-and-library`); do not apply the uploaded patch again. Its code is separate from the SEO/share/measurement work in PR #227, but both edit operating documentation, so preserve both records when resolving conflicts. Production publication is a separate check.

The proposed outing-to-run wording, rounded display distances and shorter cautions remain coaching-review items, not changes applied by this documentation update. Exact pace calculations stay exact. The wider Library migration remains open. PR #234 settles the scoped header/footer decisions in the later One house section; it merged as `5db30f7`. Draft details explicitly labeled as proposals below remain proposals; the owner's direction endorsement does not silently settle each open design choice.

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
| Lane | 36px (2.5vw, floor 26px, from 1024 to 1439) | 14px at 390 (3.6vw, 14px to 24px) |
| Radii, inside to outside | 1077px to 1365px | 419px to 531px |
| Line | 2px, the fold's text color | same |
| Strength | lanes 30%, marks 80% | same |
| Start line | left edge of the distance column, 340px in from the content edge. From 1024 to 1439 it sits on the date column, 580px in | on the text margin |
| Outer lane | 104px above the fold's bottom edge | 72px above the fold's bottom edge |
| Clearance | band starts 60px below the study link | band starts 60px below the study link |
| Facts | in a row beside the sentence | stacked in one column, 210px wide, so the bend can rise on the right |
| Dissolve | over the top 180px of the fold | between 250px and 350px above the band |

**October 6 owner revision.** Brice mocked the bend larger and heavier in Photoshop after seeing the first release live. The table above is that revision: lanes 1.65 times larger on desktop and about 1.5 times on phones, 2px lines, stronger lanes and marks. His mock let the lanes cross the facts. The build keeps the size and moves the type out of the way instead, so the rule still holds: lanes never cross type.

CSS owns these as `--lane`, `--bend-x`, `--bend-gap`, `--bend-mask`, `--bend-solid`, `--bend-clear` and `--bend-marks` on `.home-evidence` in `css/home-commercial.css`. The drawing scales with `--lane`. The proportion never changes.

### The rest of the homepage follows the same rules

Audited on October 6 against the questions above. Four small corrections, no new elements.

- **One vertical line.** From 1280 wide, the Begin form starts on the date column's left edge, 580px in from the content edge. Under 1440 the bend's start line is on that same line. From 1440 the start line moves one column left, to the distance column, so the curve has room to rise. It always sits on a column edge, never between two.
- **Space separates the three doors.** The entry columns keep one top rule each. The vertical rules between them are gone, as they are in Also.
- **The footer ends on the content edge.** Links sit flush right on desktop. On phones it closes on two lines: links, then the copyright with Top on the right. No link is left alone on a row.
- **A label never breaks after its separator.** The hero label stays on one line on phones.

### Motion

It arrives once. When the fold enters view the lanes run in from the left, then the start marks appear. `js/home-settle.js` arms it, so without script or with reduced motion the bend is simply there. No loop, no parallax, no hover effect.

### Where it may go

- Built: the homepage **From the practice** fold.
- Intended next, not built: 9:16 story frames, study covers and printed pieces, from the standalone asset. One bend per piece, same line weight, same strength.
- Not without a new owner decision: paper or cream rooms, the FORM and Forge apps, any second use on the same page.
- Never: tiled, rotated, mirrored, recolored lime, looped, or used in place of the SF emblem.

### Checked and not checked

Chromium renders at 375, 390, 430, 768, 1024, 1280, 1440 and 1920 wide were reviewed on October 6, with the arrival on and with reduced motion. The whole page was reviewed at 390 and 1440, and the footer also at 360 and 375. Safari, a physical phone, 200% zoom on this fold and production are not checked yet.

## October 6 · Lit, not printed

**Status.** Brice asked for the feel of his Instagram avatar on the homepage and in future video: richness, mystery, closeness, instead of flat white that "hits hard". The headline and emblem treatment below is built on `work/lit-not-printed-20261006` and waits for his review. The closing cloth plate is built on the same branch from the larger image he supplied.

### What the avatar actually does

It is the SF emblem blended into a photograph of black cloth. Measured from the file: the brightest point in the whole image is about 57% gray and the average is near black. The homepage headline was 90% white at over 100px. That gap is the "hit". The richness is three things, and none of them is an effect on letters:

1. **A real material.** Cloth, photographed.
2. **One light, from one side.** The mark is revealed by it, unevenly.
3. **The mark is dimmer than you expect.** It never becomes the brightest thing in the frame.

### Rules

- **The photograph keeps the brightest point.** On a dark field, display type and the emblem fall off in light instead of sitting at flat full strength.
- **Type stays flat and exact. Only its light changes.** No texture, bevel, emboss, glow, shadow or noise on live text, ever.
- **Richness comes from real material.** Cloth, track, skin, concrete, photographed by Brice. Never from interface texture. Film grain stays off the interface, as already ruled.
- **Anything a visitor must read to decide stays at full strength:** body copy, prices, dates, form labels, links. The falloff is for the hero headline and the emblem only.
- **Check contrast where the light is lowest.** Large type must still clear 3:1 against what is behind it.
- **One lit moment per view.** If the headline falls off, nothing else in that fold does.

### Measurements

| | Value |
|---|---|
| Hero headline | full strength to 28% of its width, falling to 60% at 96%, at 100 degrees |
| Header emblem | bone at 18% of its width, falling to `#8f8e88` (about 56% gray) |
| Everything else on the page | unchanged |

### The closing plate

The homepage ends on the cloth: the image above the footer line, the emblem's left tip on the content edge where the page opened with it, the cloth dissolving into black to the right on desktop and running edge to edge on phones.

- Asset: `/assets/home/20261006/sf-cloth.webp`, 1448 by 1086.
- Plate height 300px to 460px (32vw). Cloth width 560px to 900px (62vw). Desktop dissolve runs from 55% to 100% of the cloth's width.
- Source: Brice supplied three large renderings generated from his own Photoshop composition on October 6. The one used is the middle strength, where the emblem sits at roughly 44% to 66% gray. The bright foil version was not used because the mark becomes the brightest thing in the frame. The emblem's shape was compared with the real mark and matches.
- It is a rendering of a garment, not a photograph of one. That is acceptable for a brand object. It is not permission to generate people, sessions or places. When the real printed piece exists, photograph it and replace this file at the same path and proportions.

### For video and future content (draft for Brice to edit)

- Start close and in the dark. Let one light find the subject.
- The mark arrives late and small, at about half strength, on something real.
- Titles and captions in bone, never pure white, and never the brightest thing in the frame.
- Black stays black. Do not lift the shadows to show more.

## October 6 · The brand page and kit

**Status.** Brice asked for a public page that lets partners, marketers, media and future agents make things the way these decisions were made, with every file to download. It is built at `/brand/` on a branch from `main` at `c03ac67` and waits for his review. It is not linked from the homepage yet and is not in the sitemap. All copy on it is a first draft for him to edit.

**What it is.** The public form of this document. Same house as the homepage: it loads the homepage stylesheets and adds only `css/brand.css`. Opening on the cloth, three doors, the bend fold with its real measurements, the seven questions in order, then the mark, color, type, light, photography, voice, film and social, the bend in use, and the files.

**Where things live.**

- Page: `brand/index.html`. Its bend is injected by the kit builder. Never hand-edit it.
- `node scripts/build-brand-kit.cjs` writes the kit's text assets from the site's own sources: emblem and bend vectors, `tokens.css`, `tokens.json`, the README and four editable templates (story 9:16, invite 4:5, document cover, email header).
- `node scripts/render-brand-kit.cjs` needs a browser, qpdf and zip. It writes the PNGs, the avatar, the template previews, the guidelines PDF (one page per fold of the brand page) and the zip. Its results are committed. Run it again whenever the brand page or the kit changes, or the PDF goes stale.
- `node tests/brand-kit.cjs` checks every link, the single generated bend, plain punctuation and that generated files match their generator.
- Page images are right-sized copies in `/assets/brand/page/` so the PDF stays light. They are the same public photographs the site already shows.

**Where the bend may go now.** Brice approved it as the signature for invites, posts, stories, email and document covers. The four templates are the approved way to do that: one bend per piece, start line on the text margin, type clear of the lanes, never mirrored. He is open to it in the FORM app; that is not designed and needs its own decision. Paper and cream rooms still need a decision.

**Drafts, not rulings.** These were proposed in the build and are his to change: clear space of half the emblem's height, the 62px minimum width, the story safe zones (top 14%, bottom 20%), the film and social rows, "no exclamation points", and the rule to ask before using a photograph.

**Keep it true.** If a rule changes here, change the page, then rebuild and re-render the kit in the same release. A brand page that disagrees with the house is worse than none.

## October 6 · Doors off the homepage

**Status.** Brice asked for the doors a visitor reaches from the homepage to be audited against it, starting with Contact, whose header sat on a black bar and whose opening did not feel like the home. Built on `work/doors-20261006`, on top of the brand page branch. Owner review pending.

**The rule.** Every house door opens like the home: the header sits bare on the photograph, the emblem alone on the left, one link on the right. The emblem's left edge is the copy's left edge. The right link's right edge is the form's right edge. The headline is lit, not printed.

**What changed.**

- Contact, Analysis, Strength and Plans share the split door (photograph and promise on the left, the form or the shelf on the right). Their black header bar is gone and the header now sits on the page. Shared rules live at the end of `css/commercial-journey.css`.
- On desktop these doors no longer show the "jump to the form" link in the photograph panel, because the form is already beside it. Phones keep it. Plans already worked this way.
- Contact uses two photographs, like the home: the track frame on desktop and Brice alone on phones.
- Contact's details are in one place, under the promise: email, then Instagram. The second "prefer email" line under the form is gone. In its place, one line sends press, partners and brands to `/brand/`, which makes Contact the brand page's first way in.

**Left alone on purpose.** FORM House and Thursday already open like the home. The plan page and the study are their own rooms and keep their own headers. No offer, price, schedule or form behavior changed.

**Open, for Brice.**

- One footer for every house door. Today the home, the split doors, Plans and Thursday each end differently.
- FORM House sets its name in capitals. The type rule drafted for the brand page says sentence case. Either write the exception (a room may set its own name in capitals) or set it as "FORM House."
- The header's right link is Contact on the home and Thursday, Home on the split doors, and The morning on FORM House. Decide whether that link is always the way to Contact.

## October 6 · The Library on house rules

**Status.** After the homepage, the brand page and the doors, Brice asked for the same audit of the new half-marathon Library pages (the 12-week plan, the pace chart and the timeline guide). Built on `work/library-20261006`, stacked on the brand page and doors branches. Owner review pending. Style only: `css/half-marathon-library.css`. No content, schedule, pace math, generator or tracking change.

**The rule.** A paper room is the same house on paper. It keeps its own field and its reading measure, and takes everything else from the house.

**What changed on the three pages.**

- **House edges.** The page sits on the same content edges as the home, 1280px wide with the house gutter, so the emblem is where it is everywhere else.
- **Display weight.** Headlines are 450 with tight tracking, as on the home, and larger. This replaces the 600 to 650 heading weight for these three pages. The rest of the Library still follows the earlier October 6 note until Brice decides to bring it across.
- **Mono for labels and measured things.** Header links, eyebrows and fact labels use the mono at 11px, as on the home.
- **Rules instead of boxes.** The starting-point panel in the opening is a ruled column, not a tinted card. Day cells inside a week keep their tint because they are a calendar.
- **Facts read like the home.** The value is large and the label sits under it.
- **Ink instead of an accent.** The weekly bars were forest green. They are ink, a lighter ink for step-back weeks and full ink for the race.
- **One rule per row.** The first cell of each table row carried the header's darker rule and an underlined link, which read as two dividers. Each row now has one.

**Not on paper yet.** The bend and the lit headline belong to dark rooms. On these pages the weekly bars are the one drawn object.

**Copy, for Brice's coaching read. Not changed.**

- "Outing" appears throughout. A coach would say run, and say once that run and walk both count.
- 13.1094 mi, 10.54875 km and "approximately 17.1094 miles" read like software. Show 13.1 mi and 21.1 km and keep the exact figure in the math.
- Several cautions explain themselves twice. Example: "That is a reason to adapt this plan, not a universal danger threshold or an instruction to replace the long outing with 150 minutes." One plain sentence does the job: "If 10 miles would take you much longer than 2½ hours, ask me for a version built on time."

## October 6 · One house: header link, footer line, FORM House

**Status.** Brice said go on the three open calls from “Doors off the homepage”. Built on `work/one-house-20261006` from `main` at `6184fc9`. Owner review pending.

- **The header's right link is Contact.** Boxed, as on the home, on Analysis, Strength and Plans. Contact itself shows Home. FORM House points to its own front desk, `/form-house/contact`; A FORM Morning stays in its footer and its page. Thursday already had it.
- **Every door closes on the home's footer line.** Same type, same edges, copyright on the left, links on the right, Top last. Each room keeps one or two of its own adjacent links first, then the same tail everywhere: Instagram, Brand, Privacy, Top. This keeps the earlier rule that a footer names the room's next destination and does not become a global menu. Applied to Contact, Analysis, Strength, Plans and Thursday. FORM House keeps its own closing with the emblem.
- **FORM House is set in sentence case** in its headline. Mono labels may still be capitals.
- **One copy change.** The Analysis form asked “What’s on your mind?”, the same words as Contact. It now says “Ask one clear question.”, which is what the page asks for.

**Still to walk, in this order.** Run Development (`/coaching/miami/`), the Work pages, FORM House contact and mornings, Run Miami, the track gallery, the Library index and the rest of the reading room, the plan page, the Labs entrance, the FORM and Sculpt product pages, privacy and the 404. Same method each time: open like the home where it is a house door, keep the room where it is a room, one rule per boundary, plain voice.

## October 6 · Run Development and public preview continuation

The owner asked for `/coaching/miami/` to be ready as its own destination while the homepage remains the primary landing page. The homepage coaching door still targets `#begin`; the standalone page hands inquiries to that same intake. The forced retirement redirect is removed. `css/run-development.css` owns the black/bone room, local Inter Tight 450, mono labels, real coaching photograph and ruled sections. No new offer or form backend.

The six-, eight- and sixteen-week half-marathon pages and faster-half guide reuse the established paper-room shell. This extends that scoped 450-heading treatment to these four resources, not the whole older Library. Every plan has its own starting point; the sixteen-week path has a transition gate and may take longer.

Public share cards now have a reviewed file allowlist in `data/public-share.json`. `scripts/render-public-share.cjs` renders the local-font cards; `scripts/build-public-share.cjs` applies metadata after page generators. The eight Library resource/tool cards retain their separate half-marathon generator. Preserve dedicated study/product art outside this refresh and never sweep private or noindex rooms into the allowlist.
