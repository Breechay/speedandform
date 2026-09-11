# FORM Remote Strength — Adrian Pilot

**Status:** live pilot · Week 01 baseline  
**Date:** 11 September 2026  
**Athlete:** Adrian  
**Public delivery artifact:** `/plans/adrian-hypertrophy-week-01/`  
**Canonical source file:** `plans/adrian-hypertrophy-week-01/index.html`

## Read this first

Adrian is the first live test of a remote, coach-managed strength-training product inside the FORM ecosystem.

This is **not** a request to build a complete strength app. The experiment is deliberately narrow:

> Will an athlete reliably execute remote strength programming when the prescription is exceptionally clear, low-friction, and personally managed?

Build only what Adrian's behavior proves is needed.

## Current Week 01

The standalone public plan is **Adrian — Hypertrophy Week 01**.

Week 01 is intentionally a baseline week, not a progression block yet.

Adrian's running week established the strength slots. His normal running pattern is easy Monday, easy + strides Tuesday, workout Wednesday, easy Thursday, easy + strides Friday, long workout Saturday, and gym Sunday. Strength therefore protects the Wednesday and Saturday quality anchors and uses:

- Monday — Upper A / chest + frame
- Thursday — Lower + Core / main lower-body exposure
- Friday — Upper B / width + arms
- Sunday — Lower Support + Core / deliberately low-fatigue after the Saturday long workout

Primary physical objective:

> Expand his frame while staying lean, then develop his arms.

Training emphasis: upper chest, lateral delts, arms, enough back work to widen the frame, one meaningful lower-body hypertrophy exposure, and one lighter lower/core support session that should not interfere with running.

The HTML plan is the source of truth for the exact exercises, sets, rep ranges, rules, and visual reference. Do not duplicate those details elsewhere unless a product surface needs them.

## Pilot learning: running schedule controls strength placement

The first live change to the pilot came from Adrian's existing run structure, not from adding product complexity.

When run training has established quality anchors, strength should fit around them rather than ask the athlete to redesign the whole week. For Adrian:

- Wednesday workout stays protected.
- Saturday long workout stays protected.
- Thursday is the principal leg-strength day because it follows Wednesday quality.
- Sunday remains a lower/core day because that matches his existing routine, but it must stay controlled enough not to compromise Monday.
- Monday and Friday carry the frame / chest / shoulders / arms emphasis.

This is an important pilot principle: **adapt the prescription to the athlete's real week before building software around an imagined ideal week.**

## Product boundary

**Do not put the athlete-facing strength product inside the Coach Console.**

The Coach Console may eventually show the coach a quiet read of Adrian's execution, but Adrian's experience should be its own athlete-facing strength surface under the same athlete identity.

Working product names may include **Forge / Sculpt / Breechay**. Do not assume the final name is settled.

Conceptual athlete path:

`Athlete → Strength → Current Block → Week 01 → Session 01 / 02 / 03 / 04`

The public HTML plan remains the lightweight delivery layer. Adrian should only graduate into authenticated logging if his execution justifies the added product complexity.

## What this experiment is testing

Week 01 should answer:

1. Does Adrian actually complete the sessions?
2. Can he understand the prescription without live coaching?
3. Does he record loads and reps accurately?
4. Does he understand how close to failure he is working?
5. How much soreness or interference does the work create with his running?
6. Does he return for the next week without being chased?

Do not overbuild before those questions are answered.

## Product doctrine

The athlete should never have to interpret the program.

A session answers only:

- **What am I doing?**
- **How much?**
- **How hard?**
- **What happened?**

Everything else is secondary.

The interface should feel more like receiving a beautifully prepared training card than operating fitness software.

No gamification. No badges. No streak language. No motivational filler. No clutter. No giant exercise library exposed to the athlete. No meaningless analytics.

**Prescription first. Execution second. Evidence third. Interpretation comes from the coach.**

## Visual doctrine

Use `plans/adrian-hypertrophy-week-01/index.html` as the visual reference.

Direction:

- warm paper
- black typography
- restrained hairline dividers
- strong hierarchy
- generous white space
- Apple-level economy
- excellent mobile typography
- no decorative cards unless a container has a functional reason
- no gradients
- no fitness-app aesthetic

One divider is enough. Avoid doubled borders and rulers.

The athlete should be able to screenshot any session and the screenshot should look finished.

## Minimum authenticated session model

If Adrian earns the next layer, the first authenticated version needs only:

- exercise name
- prescribed sets
- prescribed rep range
- load used
- reps completed per set
- optional short note
- complete session

Potential later additions: RIR / difficulty, pain flag, video upload, coach comment.

Do not make those necessary for the first Adrian test.

Minimum useful evidence:

```text
Incline Barbell Bench
Set 1 — 95 × 10
Set 2 — 95 × 9
Set 3 — 95 × 8
```

That is enough for the coach to write Week 02.

## Progression doctrine

The product should **not** auto-prescribe progression yet.

Adrian executes. The system records. The coach interprets. The next prescription is written from evidence.

Week 01 establishes loads and tolerance. Week 02 onward may progress through some combination of reps → load → sets → exercise progression.

Preserve training history so progression becomes obvious without turning it into noise.

## Business model being tested

This may become a second coaching model alongside run coaching:

> Remote, coach-managed strength programming with asynchronous athlete execution.

The value is not access to workouts. The value is personalized prescription, progression management, accountability, coach judgment, and very low athlete cognitive load.

Adrian is the first real-world test. Build the smallest credible system around his actual behavior, not an imagined future customer.

## Next implementation only if earned

1. Add Adrian as the first strength athlete.
2. Create a Strength / Sculpt area under his athlete identity.
3. Represent the four-session Week 01 exactly.
4. Preserve the standalone HTML visual language.
5. Allow load + reps to be recorded per set.
6. Allow a session to be marked complete.
7. Give the coach a clean view of what Adrian actually performed.
8. Add nothing broader unless this pilot requires it.

## Guardrail for future agents

Before expanding this product, ask: **What did Adrian actually do?**

If the answer is not grounded in his execution data, do not invent a platform requirement. The pilot exists to learn before defining the full product.
