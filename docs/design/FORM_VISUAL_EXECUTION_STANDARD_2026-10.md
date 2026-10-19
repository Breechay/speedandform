# FORM visual execution standard · October 14, 2026

**Owner approved and current.** Read with `AGENTS.md`, the opening of `docs/BRAND.md` and `brand/index.html`. This governs FORM's public website, Collective, photography/film and relevant brand extensions. Native training screens still use their functional product requirements. Older blanket statements against decorative design cannot be used to remove Brice's approved theatrical atmosphere.

## Running, Group and the photo-rich athletic world

**Current October 19 authority:** [FORM athletic world product/design standard](FORM_ATHLETIC_WORLD_STANDARD_2026-10.md) and [content model for native Running + homepage](../product/FORM_ATHLETIC_WORLD_CONTENT_MODEL_2026-10.md). Photography/film are primary interface material. The Group retains browseable media and real people even without a scheduled run. The October 19 cream left-side door and visual tiles supersede older plain-row Dossier navigation, while the approved cream ink-bend native launch is preserved. No invented content or forced social feed. Do not confuse unconfirmed media in the source with a shipped/reachable viewer.

## Creative intention

The brand should create **anticipation, wow, memory, curiosity and a desire to explore**. Athletic editorial photography meets cinema; sophisticated, dramatic and elegant rather than a sterile utility page. Theatrical is not gaudy. Originality matters more than minimalism. Cream reading surfaces can coexist with black screening rooms and dramatic imagery.

**Do:** keep photographic strips, rich overlays, gradients, visual depth, atmospheric shadows, cinema-inspired transitions, unusual compositions, immersive entrances, artful rhythm and decoratively compelling real photographs. Sometimes beauty itself is the function. Not every photo needs a link.

**Don't:** strip visual treatments because they aren't operational, convert every gallery into a plain card list, erase atmosphere for a narrow notion of luxury, introduce generic stock people, fake run evidence, UI confetti, fake material effects on letters, noisy auto-playing sound, or autoplay behavior that hurts access/performance.

## Photographic grading and composition

- Work from originals/published consented assets in `media/library/library.json`, not an invented substitute. Keep approved source media unmodified; CSS grades are reversible and distinct video crops/edits have separate filenames.
- For black-and-white hero frames, evaluate **black point, highlight rolloff, facial definition, luminous skin, midtone texture and foreground separation**. A measured baseline might be `grayscale(1) contrast(1.10–1.20) brightness(.87–1.04)`, but **do not blanket-apply it to every image**: source exposure, editorial job and copy placement vary. Avoid clipping skin or reducing eyes/faces to black.
- Put contrast/shade **behind foreground text**, never on letters. Use bottom-up gradients plus a localized radial falloff or side vignette. On mobile, always check the full three-line headline and introduction over both the darkest and brightest slides. A dramatic background is welcome; illegible body copy is not.
- Keep the subject's face and motion visible. Check object-position separately for desktop/mobile and avoid cropping heads/feet unnecessarily.
- On cream surfaces, preserve generous image area and variation: a large editorial lead, small closeups, color/B&W alternation, tactile caption, rhythm. Avoid making the entire site monochrome by default.
- Do not process athlete features to alter identity/physique. Contrast and brightness improve the photograph, not the person.

## Motion and film

- Movement may be choreographed and atmospheric, but navigation must remain immediately usable. Native reduced-motion and explicit pause/visibility semantics take priority. No forced long intro, no sound surprise.
- Homepage film is **permanently muted**, no sound toggle, lightweight, pauses when out of view and respects Reduce Motion and Save-Data. It is a decorative prologue, not a substitute for the full session film.
- Use smooth cuts/crossfades to carry atmosphere. Rapid training edits may live inside session media, but the homepage loop should prefer a short, smooth derivative. Never silently overwrite the full archival master.
- Keep published photos/films privacy-gated and tied to actual athletes/sessions; withdrawn assets must not be redisplayed.

## Cross-page hierarchy

- **Home:** dramatic rotating photographic hero with legible type, commercial single door Run Development, editorial strips for atmospheric transitions, and meaningful entry points to Collective.
- **Network/Collective:** immersive photographic entrance, image-led athletes, runs, events, archive and media; cream editorial reading surfaces with cinematic individual story treatments.
- **Plans & coaching:** real photography with distinct tonal grades and intentional caption rhythm, while prices, duration and CTAs remain fully readable.
- **Thursday & runs:** genuine track imagery and documentary character, no fabricated session inventory; galleries are allowed to be decorative.
- **Brand page:** demonstrate the theatrical philosophy visually, with real frames, examples, contrasts and short plainly written rules. Update both page and doctrine together.

## Executable acceptance checklist for an agent

1. Fetch active `main`, current PR heads and brand rules; isolate your changes to avoid overwriting parallel work.
2. Identify each selected image by its real library ID or approved asset path, rights/visibility and crop.
3. Capture current desktop/mobile screenshots and inspect frames. Capture the proposed screenshots with same breakpoints.
4. Grade multiple bright/dark photos, preserving anatomy/skin/highlights and readable type. Check heading + body contrast, particularly below 430px width.
5. Test tap targets, keyboard focus, reduced motion, Save-Data, performance and silent video. No hidden audio.
6. Confirm photo strips, gallery, visual transitions and cinematic treatments were *preserved or enhanced*, not removed as 'mere decoration'.
7. Run available build/tests; report failures as baseline/new, and show exact branch SHA. Compile/build is not visual signoff and does not equal production deployment.
8. Do not merge/publish until release gates and approved visual snapshots pass.

**Agency question:** after five seconds, does the experience make an athlete want to explore, return, share or be pictured here? If not, refine the creative rather than merely simplifying it.
