# Rebuilt Athlete: Run Evidence Review Standard

**Adopted:** October 22, 2026  
**Study:** FORM Study 002 · The Rebuilt Athlete  
**Applies whenever Brice provides a Garmin activity ID, ZIP/FIT/TCX/GPX, screenshots, or a run report for this study.**

## Purpose

Review each new run once, proportionate to what it contributes. Use the current study and the historical evidence ledger as the record of findings; do not make every run a new public headline. The athlete's account is first-person evidence, not an inconvenient footnote. Preserve completed splits and original recordings even when the athlete corrects the interpretation.

## The intake and review loop

1. **Identify and classify:** Resolve activity ID, local session date/time, device, surface, distance, moving/timer/elapsed durations, session type (easy, longer aerobic, structured work, social run, treadmill, warm-up), and source precision. Avoid treating a summary ID as evidence that detailed samples have been received.
2. **Read real data once:** First read available Garmin activity summary / detailed metrics through the connected provider. When FIT is supplied or available, inspect original record, lap and event messages. If provider restrictions prevent full detail, use the available summary and ask for original FIT only when the missing precision actually changes a conclusion; never invent a series from aggregate pace or device maximum.
3. **Pace exposure:** Preserve full-session time/distance and separate warm-up, timed work, recovery and cooldown. For interval sessions, report each rep time, distance, mean pace and work-only aggregate. When timestamped traces exist, produce a transparently smoothed time-in-pace estimate and its smoothing/boundary rules; keep that separate from summing full laps by their average pace.
4. **Mechanics when meaningful:** Check measured step/stride length, cadence, ground-contact time, vertical oscillation and vertical ratio, and any reliable foot-balance, running power or other recorded metrics. Show *work-lap metrics* for intervals when recoveries would distort whole-session means. Confirm FIT unit scales; screen nulls and stationary transitions; state whether data came from measured records, recorded lap aggregates or summary-only. Missing metrics remain unknown rather than zero.
5. **Cardiovascular and effort:** Note heart rate and whether it reflects work-only or all-session; compare HR at reasonably matched pace with similar conditions rather than asserting lower aerobic cost from a single faster day. Preserve athlete RPE, perceived breathing/mechanics, sleep and other context only when reported. Device-assigned zones and VO2 estimates are not ground-truth physiological tests.
6. **Durability and post-load response:** Watch rep-to-rep consistency, continuous hold duration, outdoor versus treadmill demands, recovery between efforts, and later next-day leg response. Never infer a fatigue fade from a slower split without checking athlete account and pauses/starts. Likewise, do not equate smooth mechanics with low cardiac cost.
7. **File proportionately:** Update the dated private evidence ledger for genuinely new information. Update the public Study 002 page / Speed Exposure workbench if the new evidence changes a trend, offers a meaningful pace/mechanics benchmark, corrects an interpretation, or clarifies a question. Do not crowd the study with repetitive summary-only entries. Clearly date edits and preserve historical versions.
8. **Separate coaching and publication:** A study observation is not a signed FORM run completion, new prescribed workout, clearance, future pace band or program change. The canonical FORM Athlete System owns the active athlete prescription. Follow the website's owner-approved publication discipline before deployment.

## Reference metrics

| Dimension | First read | Deeper analysis when informative |
| --- | --- | --- |
| Training load | duration, distance, surface, type, context | within-run shifts, week-to-week accumulation |
| Pace | full run and recorded rep averages | sample-time pace bins with smoothing and exclusions |
| Step length | session/lap value if actually recorded | comparison at matched speeds and cadence |
| Cadence | steps/min | rep consistency, speed dependence; check device half-cadence fields |
| Ground contact | ms | rep-level contact at similar speed and surface |
| Vertical movement | cm and vertical ratio % | speed-dependent change, not a universal target |
| HR | average/peak, scope explicitly described | segment HR, drift and matched pace/conditions |
| Recovery | athlete's described effort and next-day response | trends across comparable loading, stop rules |

## Availability / confidence labels

- **FIT original:** timestamped records, sensor fields, laps/events. All metrics still device-derived; sample quality may limit confidence.
- **Detailed provider record:** provider-derived laps or 10-second series. Note availability and any downsampling.
- **Summary only:** activity ID, average HR, duration, distance, average pace. Mechanics and time-in-pace cannot be reconstructed from an ID alone.
- **Athlete reported / screenshot:** useful firsthand evidence, but not falsely called FIT-verified.

Garmin connector access can be free-tier summary-only. Do not promise that every supplied ID is enough to retrieve stride length, ground contact or a detailed pace histogram. Offer a FIT upload for precision when needed; otherwise make the best honest read from available material.

## Comparative caution

A 400 m effort near 5:30/mi should naturally differ in step length, cadence and contact from a 1-mile effort near 6:00/mi. Compare that within-session relationship descriptively. Claiming a trained improvement in economy requires repeated comparable observations (pace, surface, shoes, environmental conditions, fatigue, sensor quality) and ideally validated internal cost. An isolated watch metric is not a diagnosis or proof of adaptation.

**October 22 reference case:** activity 24812863860, *Descent Into Ruin*. Seven work laps totaling 17:23 at about 5:49/mi mean work pace; work-only device means 1.54 m step length, 179 spm cadence, 213 ms ground contact. Final 400 affected by filming distraction, not reported fatigue fade. See [ledger entry](SPEED-EXPOSURE-LEDGER-20261018.md).
