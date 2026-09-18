# FORM / Human Performance Studies

**Working identity:** FORM / Human Performance Studies  
**URL namespace:** `/labs/`  
**Purpose:** document real coaching questions as open, longitudinal cases whose evidence can remain incomplete, inconvenient, or negative.

This brief is the durable voice/product rule for study pages such as **Study 001 · The Developed Runner**.

## 1. What a FORM study is

A FORM study is not a transformation landing page and not a claim to academic research.

It is a **filed coaching investigation**:
- a real athlete;
- a real question;
- a dated intervention;
- evidence gathered through time;
- interpretation that can change;
- explicit missing evidence;
- a record that can contain failure without breaking the story.

The theatrical layer may borrow from case files, technical dossiers, archival documents, biomechanics notebooks, film strips, stamps and laboratory notation. The evidence language stays restrained.

**Visual theater is allowed. Evidence theater is not.**

## 2. The voice

The strongest study copy uses short declarative sentences, concrete verbs, and a skeptical relationship to its own intervention.

Preferred verbs:
- filed
- pending
- collected
- measured
- reported
- observed
- held
- reduced
- withdrawn
- repeated
- confirmed
- changed
- not yet known

Avoid:
- transformed
- optimized
- unlocked
- revolutionary
- proof, unless the evidence genuinely warrants that word
- unsupported causal language
- celebratory copy where the record is still open

A reader should be able to remove the styling and still want to read the page.

### Copy pattern

Good:
> Running is the constraint, so the strength side yields.

Good:
> The gap stays in the record rather than being interpolated.

Good:
> Nothing visible happens at all. That is a result.

Bad:
> Adrian is becoming the ultimate hybrid athlete.

Bad:
> The method is proven.

## 2A. Anti-robot rule

Human Performance Studies can look technical. The writing should not perform technicality.

The copy should feel like someone close to the athlete wrote down what happened, what they think it means, and what they are doing next.

### What makes the voice work

- short sentences;
- concrete verbs;
- specific body parts, sessions, dates and outcomes;
- a willingness to say `we do not know yet`;
- a sentence can stop once the point is made;
- the coach sounds confident enough not to decorate the thought.

### What kills the voice

- abstract noun stacks;
- over-explaining obvious logic;
- trying to sound scientific when the evidence is ordinary coaching evidence;
- combining multiple phase ideas into one slogan;
- phrases that are technically grammatical but nobody would say aloud;
- turning every training decision into a framework sentence.

If the plain version is accurate, use it.

Prefer:
> Find the tolerable dose.

Over:
> Establish the minimum effective loading architecture.

Prefer:
> Legs stay conservative.

Over:
> Lower-body fatigue stays bounded by running response.

Prefer:
> Repeat it. See how he runs after.

Over:
> Confirm the intervention inside the rising run week.

The page can borrow the **form** of a research file. The prose should stay human.

## 3. Three writing temperatures

A study page should deliberately move between three registers.

### WALL
The cover / research wall.

Dense, immediate, poster-like:
- study id
- subject
- thesis
- question
- baseline numbers
- current status
- case stamp
- short labels only

This is the one place where visual density is a feature.

### INSTRUMENT
Evidence, development map, progress, training receipts.

The page should feel filed rather than narrated:
- tabular numerals;
- mono labels;
- provenance;
- missing cells;
- measurements;
- pending states;
- explicit dates.

Use very little prose.

### EDITORIAL
Athlete, Question, Current Read.

This is the human voice of the coach:
- wide readable measure;
- normal sentence case;
- generous leading;
- few labels;
- no marketing language.

**CURRENT READ is the editorial heartbeat.** Earlier readings remain in history rather than being overwritten.

## 4. Missing is a first-class state

Never hide missing evidence merely because the module looks nicer when complete.

Allowed states:
- `filed`
- `partial`
- `pending`
- `missing`
- `withdrawn`
- `filed_not_read`

Examples:
- `BASELINE MASS · PENDING — collect 3–4 morning weights`
- `CURRENT RUNNING CAPTURE · NOT YET FILED`
- `W04 MEASUREMENTS · MISSING — travel week`

Do not interpolate charts through unmeasured weeks.

A pending entry is useful: it is both honest public state and a private collection reminder.

## 5. Evidence channels

Default FORM human-performance study channels:

1. **BODY**
   - standardized photography
   - weekly-average body mass
   - circumferences when relevant
   - capture conditions

2. **STRENGTH**
   - actual load
   - actual repetitions
   - progression / hold / removal
   - exact training receipt when available

3. **RUNNING**
   - key-session execution
   - following-run response
   - race results
   - repeatable running video

4. **ATHLETE REPORT**
   - recovery
   - appetite
   - heaviness
   - confidence
   - enjoyment
   - whether the running feels normal

A gain in one channel does not excuse deterioration in another.

## 6. Provenance belongs with the number

Every value should eventually support:

```js
{
  value,
  date,
  provenance: "measured" | "reported" | "official" | "derived",
  takenBy,
  method,
  conditions,
  filed: true,
  published: true
}
```

`filed` and `published` are different.

The study may possess evidence that has not yet been interpreted or released.

## 7. Study chronology

A study needs chapters even when coaching continues after them.

Example:

**CHAPTER 01 · SEP 14 — DEC 31, 2026**

The chapter closes because the currently authored intervention closes. The athlete does not need to stop training.

Every chapter should have:
- start date;
- intended close;
- current phase;
- mini milestones;
- race / performance anchors;
- next evidence date.

A returning reader should know **when the next evidence is expected**.

## 8. Study / Protocol / Instance

Keep these separate in data and language.

**Study**  
What actually happened to one athlete.

**Protocol**  
The rules, phase logic, progression logic and decision hierarchy.

**Instance**  
The dose assigned to this athlete under that protocol.

Changing Protocol v1.1 must never rewrite what Adrian did under v1.0.

## 9. Case-first rule

Human Performance Studies default to **case-first**.

Adrian is not an advertisement for a protocol. The protocol appears after the evidence and is allowed to remain provisional.

If a repeatable product emerges later, documented implementations become its evidence. Do not reverse history to make the cases fit the product.

## 10. Study copy structure

Recommended reading order:

1. Research wall / cover
2. Athlete
3. Question
4. Development map
5. Method
6. Evidence
7. Physical progress
8. Running control
9. Nutrition / recovery support when relevant
10. Study timeline
11. Current Read
12. Protocol disclosure
13. Follow / return

The first screen can be theatrical. Each subsequent section should become calmer.

## 11. Photography

Separate:

**STANDARDIZED = measurement**  
Front / side / back / defined flexed view, consistent capture conditions.

**FIELD = context**  
Gym photographs, clothing, race imagery, casual images.

Never use Field photography to claim physical change.

Every standardized capture should eventually carry:
- camera distance;
- focal length;
- lighting;
- time of day;
- hours since meal;
- hours since last run;
- clothing / pose protocol.

If comparability is poor, say so.

## 12. Video

Running footage is a control, not decoration.

Baseline / current should stay visibly incomplete until both exist.

Useful controls may include:
- angle selector;
- play together later;
- frame step later;
- 0.25× / 0.5× / 1× later.

Do not imply causality from a movement clip alone.

## 13. Color semantics

Default recommendation:

**Blue = intervention / authored choice**
- target
- dose
- active phase
- coach-selected progression

**Red = constraint / exception**
- CASE OPEN
- missed evidence
- intervention changed because the run objected
- deterioration / hold

Graphite handles ordinary structure.

Do not use red decoratively everywhere.

## 14. Motion

Paper is mostly still.

Allowed:
- short entry choreography;
- anatomy lines draw once;
- subtle paper-uncover reveal;
- filmstrip drag;
- compare drag;
- one imperfect stamp registration event.

Avoid:
- looping float;
- aggressive parallax;
- scroll hijacking;
- agency-demo motion.

Respect `prefers-reduced-motion`.

## 15. Mobile

Do not shrink the research wall.

Recompose it:
- title;
- question;
- athlete;
- 2×2 metrics;
- thesis;
- simplified markers;
- dossier;
- horizontally draggable film strip.

Tiny desktop annotations may disappear on phone if the same information is preserved in a readable form.

No important interaction can require hover.

## 16. Credibility upgrades

Before a study makes strong public claims, aim for:
- a locked prediction / pre-registered expectation;
- raw study JSON available for inspection;
- measurement provenance;
- third-party measurement where practical;
- explicit limitations in the main reading, not hidden in legal copy.

A FORM study is a coaching record, not a randomized trial. Say that.

## 17. Youth boundary

Youth athlete-development work should be a separate protocol and evidence model.

Do not reuse an adult physique-transformation frame for minors.

The youth evidence model should emphasize:
- performance;
- coordination;
- strength progression;
- robustness;
- training response;
- athlete report.

## 18. Labs namespace

`/labs/` remains the technical URL namespace.

The public editorial identity can be:

**FORM / HUMAN PERFORMANCE STUDIES**

Individual routes can remain:
- `/labs/adrian-runner-mass/`
- `/labs/track/`
- `/labs/hyrox/`
- future longitudinal athlete studies

Not every Labs tool needs to look like a dossier. The identity means the work is treated as something observable, revisable and evidence-bearing.

## 19. Source-of-truth rule

A study page does not own private athlete prescription.

For coached athletes:
- FORM Athlete System owns prescription;
- the study reads filed evidence / public projection;
- web presentation never invents completions;
- a public study update cannot silently change the athlete's actual training plan.

## 20. Definition of done for a new Human Performance Study

Before production:
- desktop composition works at 1440–1920;
- 13-inch laptop works;
- iPad portrait and landscape are intentionally composed;
- 390px and 320px phone have no overflow;
- touch and keyboard interactions work;
- reduced motion works;
- missing-data state is coherent;
- 12 months of timeline data can fit;
- a second athlete can reuse the system without rewriting the layout;
- first-load media is bounded;
- no unsupported measurement/result has been filled for visual completeness.

---

**House line:**  
**No conclusion before the evidence.**
