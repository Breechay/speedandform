# Speed & Form · house system

> **CURRENT AUTHORITY · 23 September 2026**  
> This is the active sitewide brand and public-surface doctrine. It supersedes earlier homepage positioning and do-not-regress documents wherever they conflict. Historical files remain in the repo as evidence, not current art direction.

**One house, many rooms.** FORM should feel authored, not templated. A study may feel like a marked-up research sheet, a guide may feel like a quiet book, and the homepage may feel like a film. The visitor should still know whose house they are in.

## The house

People say **FORM**. **Speed & Form** is the full house name used for the seal, legal language, email signatures and formal references.

The primary public doors are:

- **Home** — what FORM is and how to work with Brice.
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
| **S+F seal** · `/assets/brand/sf-seal.svg` | Heritage mark. Favicon, footer, merch, stamps, video bug, sign-offs. |
| **FORM.** · plain heavy wordmark, lime period | Dark rooms: home, contact, coaching, apps, dark Labs. |
| **Italic FORM** | Paper rooms: studies and field sheets where the italic mark already belongs. |

One wordmark per surface. The seal may sit with either wordmark.

## Constants

- Lime `#c9ff36` is a signal, not decoration. Usually one meaningful use per view: the period, a live state, or one focal accent. Never a full background.
- Measured things — prices, dates, weeks, paces, coordinates, technical captions — use a monospace when the room supports it.
- Brice's voice is short, specific and human. First person when it is him. No corporate "we believe" language.
- Photography is real: real athletes, real sessions, real Miami. No stock.
- Motion arrives once and then gets out of the way.
- No decorative glitch, HUD or scanline systems. **Exception:** the homepage hero film may retain a subtle scanline/grain treatment when it materially improves imperfect source footage. That exception belongs to the film, not the interface.
- Plain punctuation in new authored copy. Avoid ornamental em dashes when a period, comma or colon reads better.
- Absence is never rendered as deficiency. A return does not require an apology.

## Schedule doctrine

There are two different things and they must never be confused.

**Public schedule:** Thursday logistics and session selection come only from `/js/community-schedule.js`. If the time, place or authored session changes there, every public surface should follow it. The HTML fallback must be neutral rather than naming a potentially stale session. Monthly long runs are announced only when confirmed.

**Authored training architecture:** a plan may deliberately prescribe Tuesday, Thursday and Saturday. Those weekdays belong to that program. They do **not** become the public FORM schedule.

Never copy a public time or location into a new page when it can be read from the shared source. Never advertise an old venue because it survives in an archive.

## Rooms

| Room | Type | Field |
|---|---|---|
| House: home, contact, coaching | Inter Tight + JetBrains Mono | Dark field `#07110f` / cream `#f4f1e9` |
| Labs, paper studies | Archivo + Space Mono + handwriting | Paper `#e9e3d6`, annotation blue/red |
| Labs, dark studies | Inter / Inter Tight | Dark field + lime |
| Library and guides | Cormorant Garamond + Jost | Cream `#f5f2ec` |
| Miami + Thursday | Archivo + Space Mono | Paper field sheet; Thursday is the compact live-session sibling of Run Miami |
| Athlete plans | Their authored training-sheet system | Usually cream, restrained accent |

A new room may choose its own type and composition. It keeps the house constants.

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
