# App design direction · October 12, 2026

Owner: Brice. Scope: the current supplied Running and Strength design decisions and their website presentation. This is a concise cross-surface authority record, not a replacement native implementation brief or a release receipt.

## Ownership and precedence

Brice supplied revised app briefs during the website/menu audit and said Claude Code is implementing them. **Claude owns the native work.** Website work may use the approved assets and reconcile its own copy and documentation; it must not create another native implementation stream.

The latest content, confirmed by the supplied implementation screenshot, takes precedence:

1. `RUNNING-design-calls-20261012 (2).md` supersedes Running `(1)` and the bare filename.
2. `STRENGTH-design-calls-20261012 (1).md` supersedes the bare Strength filename by adding the graphite app icon.
3. These newer scoped owner decisions supersede older brand-history statements that native app bends still need a decision. Other paper rooms and apps do not inherit the exception.

## Current design calls

| Surface | Current direction |
|---|---|
| Public product names | Speed & Form: Running; Speed & Form: Strength. FORM remains the practice/team identity. Forge is a legacy project name. Breechay Sculpt is a program within Strength. |
| Running icon | Exact supplied `icon-run-cream-1024.png`: ink emblem on cream `#F2EEE5`, every appearance, no bend. |
| Running opening and sign-in | Cream `#F2EEE5`, ink `#121310`, full unmasked ink bend. Signed-in opening rolls upward to reveal the dark Week. Signed-out opening stays as the sign-in surface. Respect skip and Reduce Motion behavior from the native brief. |
| Running Week | Remains dark field `#07110f`, with restrained lime `#c9ff36` bend. Key-session labels keep lime; ordinary labels become quiet. Remove duplicated total presentation. |
| Running Dossier | Cream shade opening from the athlete's name, clear goal/countdown hierarchy and plain navigation rows. Tap-name, gesture and accessibility escape replace the root close capsule. |
| Strength icon | Exact supplied `icon-str-graphite-lit-1024.png`: graphite gradient emblem on `#080807`, every appearance. Bronze remains the internal accent. |
| Strength opening | Ghost emblem alone on `#080807`; cloth is removed from the native launch and splash. |
| Strength Today and Controls | Figure black points match the ground, with a local movement-table scrim. Controls becomes a full dark page with plain grouped rows and readable, wrapping values. |
| Strength Programs and language | Family name once; plain phase names and authored descriptions; clear active position. Remove athlete-facing Forge labels. Do not substitute internal source labels for missing descriptions. |

The existing native briefs own exact geometry, timing and implementation measurements. Their design changes do not authorize changes to authentication, identity, access, program/workout logic, data or the server.

**Open:** Strength's “numbers instead of phases” comment remains unresolved. The ghost numeral retains its current phase meaning until Brice clarifies the intended change. Draft phase descriptions remain drafts rather than new program facts.

## Website application

- Use the supplied icons directly at `assets/brand/apps/icon-run-cream-1024.png` and `assets/brand/apps/icon-str-graphite-lit-1024.png`. Do not generate substitutes or recolor the original files.
- Running's landing page retains the dark field/lime treatment that represents the Week. The cream native opening does not require a cream website page.
- Strength's landing page retains black, bone and bronze. The approved cloth in its author fold is website editorial material; it is no longer described as the native splash.
- Preserve current product/program distinctions, App Store destinations, billing terms and the existing truthful labels on website demonstrations and store screenshots. A new icon or design reference does not establish a newly downloadable app version.
- Use verified final native captures when available. Do not present the supplied design boards as released-app screenshots or copy their athlete-specific examples into public marketing.
- Keep website typography and responsive/accessibility rules. Fixed native reference measurements and tiny reference labels do not become website sizing rules.

The public house uses bone `#e8e3d9`; Running's native paper is `#F2EEE5`. The homepage menu uses house bone. These are scoped values, not a sitewide palette replacement.

## Source provenance

SHA-256 values identify the exact attachments reviewed. The original briefs and audit boards remain source references; this repository summary omits their athlete examples.

| Source filename | SHA-256 | Authority |
|---|---|---|
| `RUNNING-design-calls-20261012 (2).md` | `4ee8f3871cd8b83e15a6b0ddcc5030b6eb8ae7b552a1b0687d5842472bdf9fd7` | Latest Running brief. |
| `RUNNING-design-calls-20261012 (1).md` | `b0b3ffd5bbd841555f5955d7f92c47d7a35eecc8275daeec6e3102eb045d3c8c` | Superseded: masked cream bend and photographic sign-in. |
| `RUNNING-design-calls-20261012.md` | `710d9d279299aedbde6b9c8869f6bd93a9f976094e16f5e32efbdcb49f2ee9ec` | Superseded: dark/lime opening and icon. |
| `STRENGTH-design-calls-20261012 (1).md` | `650cce8c63e498da80fc9f12ef2fcfa1e72a8f1b1f10418c995f2f848f1017f8` | Latest Strength brief, including graphite icon. |
| `STRENGTH-design-calls-20261012.md` | `e26ec7a4d417c72eeeb691aa9240ed80bb5c44a6f0267058110295215657895a` | Superseded by the icon addition; other decisions retained. |
| `icon-run-cream-1024.png` | `5434078c002673b22553f7bf13f6b3c27b9c07f35c9c549ed31cb870c6fd8b27` | Approved exact Running icon. |
| `icon-str-graphite-lit-1024.png` | `bb14d5cdf4b976b820d8274729a8a3720bf99fea0125d8c5ea26dff43ff53464` | Approved exact Strength icon. |
| `running-signin-icons.png` | `e9da88ba7c9256d5a50ed925ff6f1c082a28d36ff2a262a5093fd54d84a3af90` | Latest visual reference for full ink bend, sign-in and icon pair. |

`running-audit.png` retains useful Week/Dossier references but shows the superseded dark opening. `running-opening-frames.png` and `running-opening-frames(1).png` are byte-identical intermediate references with a masked cream bend; the latest brief's full unmasked bend wins. `strength-audit.png` supports the ghost opening and simplified surfaces but predates the standalone graphite icon addition. None is a release receipt.

## Release state and next evidence

This record establishes **owner design direction and source reconciliation only**. It does not verify a native commit, build, simulator capture, installed icon, physical-device acceptance, App Store metadata or release.

The website's earlier app-page release and the new menu/icon refinement are separate states. [The website roadmap](../roadmap/FORM-ROADMAP.md#october-12--homepage-menu-refinement-and-app-design-alignment) and PR #273 own the final tested revision, hosted checks, merge and production readback for this pass. At this record's creation those new verification and publication steps are pending. Native evidence remains in Claude's existing release stream.
