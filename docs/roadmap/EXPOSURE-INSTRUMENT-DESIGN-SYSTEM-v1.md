# Exposure Instrument Design System v1
## Post-freeze handoff · September 20, 2026

### Why this exists

Marathon Durability / The Last 10K are now method-frozen. The next problem is not training theory. It is making the theory instantly legible across web, share previews and the FORM app.

### Canonical idea

**Act I:** more distance at capability.  
**Act II:** more distance before capability.

### Master primitive

A horizontal strip with:
- neutral field = prior / controlled running;
- FORM lime = capability / reserve segment;
- optional secondary line for marathon rhythm only when the surface needs it.

The strip is not a score, readiness bar or progress meter.

### Required static states

#### 1. Act I → Act II explainer
Act I: runway stable, lime block grows.  
Act II: lime block approximately stable, runway before it grows.

#### 2. Key-week plan progression
Show only the phases that teach the method: Access, Embed, Re-access, Closing 10K, Rhythm, Confirm.

#### 3. Athlete current week
One strip + one question:

`PRIOR RUNNING ───────── RESERVE`

Support hierarchy:
- Tue · Remember
- Thu · Protect
- Sat · Ask

Saturday dominates only when Saturday carries the governing question.

#### 4. Filed week
Prescribed strip becomes filed strip.

Below it, only filed facts:
- Output
- Cost
- Context
- Recovery
- Coach Read
- Next

No composite score.

#### 5. Historical week
Same strip, smaller and desaturated. Tap/open reveals the filed record. Do not turn history into a new dashboard.

#### 6. Share card · 1200×630

Marathon Durability:
- headline: `MARATHON DURABILITY`
- subhead: `KEEP THE SPEED. MOVE IT DEEPER.`
- left: Act I · 13.1
- right: Act II · 26.2
- the visual idea itself is the image; no athlete photo required.

The Last 10K:
- same visual grammar
- title: `THE LAST 10K`
- subtitle describes the question, not an outcome promise.

### Motion that earns its place

Allowed:
- Act I block grows → locks → Act II runway extends;
- week-to-week block shifts later;
- prescribed outline fills into filed result;
- first 20 miles quiet when Closing-10K lens enters view.

Not allowed:
- looping background motion;
- progress celebration;
- flashing final 10K;
- animated gauges;
- gratuitous parallax.

### Surfaces

1. `/labs/the-last-10k/`
2. `/plans/marathon-durability/`
3. dedicated OG cards
4. FORM athlete-home mockups
5. Coach Mirror only after the athlete version is clear

### Dependencies / guardrails

- Read `docs/MARATHON_DURABILITY_PLAN03_FREEZE_20260920.md`.
- Read `docs/FORM_CONNECTED_SURFACES.md`.
- Native implementation must consume canonical assigned/session data; mockups may use sample values only when clearly sample.
- Do not modify current FORM-iOS acceptance branches merely to prototype the visual.
- Do not reopen programming architecture.

### Acceptance

A first-time runner understands Act I→Act II in under 10 seconds without a paragraph.
A coached athlete understands the current week's question without learning the whole study.
A filed week shows what happened without turning into a score.
A 1200×630 card remains legible at WhatsApp/iMessage thumbnail size.

### Next action

Create three visual comps before code:
1. public study/plan Exposure Instrument;
2. FORM phone current + filed state;
3. Marathon Durability 1200×630 share card.

Choose the simplest visual grammar that survives all three.
