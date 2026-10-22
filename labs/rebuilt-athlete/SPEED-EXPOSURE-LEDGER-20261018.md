# Rebuilt Athlete · Speed Exposure Ledger

**Opened October 18, 2026. Interval screenshots verified later that day.** Athlete: Brice. Companion to [dated run observations](LONG-RUN-COMPARISON.md) and [physical goals](../../docs/studies/REBUILT-ATHLETE-BODY-GOAL-20260923.md). This is an evidence tracker, **not** a training schedule or a speed prescription. The present block's formal start/end dates were not established in the October 18 conversation; the ledger begins with the newly supplied evidence and can backfill older activities when original recordings are available.

## Why track

Brice wants to observe the amount of time he spends running at progressively faster paces and whether those paces become repeatable over 400 m, 800 m, 1 mile, 2 miles or longer. During this phase he also wants aerobic treadmill work recorded primarily as **duration + HR**, rather than forcing treadmill pace. First speed-exposure threshold: **7:42/mi or faster**. Capture time in 15-second pace bands, including the 7-, 6- and eventually 5-minute-per-mile ranges. Record naturally occurring faster running separately from purposeful track repetitions, rather than using these counts to require speed on every outing.

A pace band is an **external performance exposure**, not a distinct muscle-fiber type. Different fiber populations are recruited according to relative force, intensity, fatigue and individual physiology; crossing 7:00 or 6:00/mi does not activate a unique fiber category. The time-at-pace ledger helps explain exposure and specificity, not diagnose fiber composition, VO₂ max, economy or lactate threshold.

## Classification and exact counting rules

1. **Two complementary views:** calendar-minute ranges, for intuitive totals (**7:00–7:59/mi**, **6:00–6:59/mi**, **5:00–5:59/mi**); and custom **15-second windows anchored on 7:42**. The custom windows are 7:28–7:42, 7:13–7:27, 6:58–7:12, 6:43–6:57, 6:28–6:42, 6:13–6:27, 5:58–6:12, 5:43–5:57, 5:28–5:42, etc. All endpoints inclusive at the displayed 1-second/mi resolution; internal calculations should use unrounded pace in seconds/mi. 7:42 is a study cutoff, not a compulsory target.
2. **Time ≥ threshold:** sum recorded moving time at **≤7:42/mi** when high-resolution speed data are available. Also record individual times in each nonoverlapping band and time in each minute-range, and keep total run time (including slower work) available for denominator/context. Label the sampling and smoothing approach. Without time-series data the exact time-at-pace totals are **unknown**, not zero.
3. **Sustained holds:** separately report uninterrupted moving stretches of at least **400 m, 800 m, 1 mile and 2 miles** at a mean pace within / faster than the relevant band. Also record actual segment average pace and duration. A 400 m interval in 88 seconds is exposure at 5:54/mi *averaged over the rep*, even if instantaneous points vary. For a claim of sustained 400 m at a specific band, use lap/segment duration and distance rather than assuming each instant stayed inside the band. Segments cannot double count for aggregate time totals; nested sustained-distance milestones may be reported separately with their own definitions.
4. **Source quality:** Prefer original Garmin **FIT** file with timestamped speed/distance records and lap/event records; TCX or GPX may support partial pace calculations, although GPX often lacks intervals/paused time and treadmill speed. Reconstruct pauses from timers where available and exclude walking/recovery from *work-interval* metrics, while retaining them in whole-session summary. The Garmin connection on October 18, 2026 exposed activity summaries only (Free tier); it did **not** expose the detailed pace series or lap events. Screenshots of Garmin laps are useful to enter lap-averaged intervals, but **cannot** establish per-second band totals.
5. **Filtering:** GPS instantaneous pace can oscillate, especially on a track. For road/track time-in-band prefer a short moving-speed smoothing window (for example, 10 seconds) applied transparently to FIT speed/distance with known pauses removed. Explicitly mark data-quality failures and any smoothing uncertainty. Keep 400/800/mile work-rep averages independent of the sample histogram. Do not equate an isolated device maximum speed with a sustained 5-minute-mile-range exposure. For treadmill sessions, record treadmill-reported pace or calibrated footpod pace only if supplied, otherwise time + HR.
6. **Comparability:** Separate treadmill aerobic, road free rhythm and track interval sessions; report shoes, surface, heat, hydration, sleep/recovery, and RPE only as supplied. Distinct loads are not scored as better/worse. Do not prescribe more speed or mileage based on the ledger.
7. **Record scopes:** Each entry must specify source device, date, and verification status: *connected Garmin summary*, *athlete report*, *photo-derived lap*, or *FIT-derived*. Do not interpolate missing splits. Avoid counting full-mile average paces as exact second-by-second band residency.

## Current recorded evidence

| Date | Session | Device/source | Moving/recorded duration | Distance | Pace | Avg / max HR | Time at ≤7:42/mi | Exact 15-second bands | 400/800/1 mi/2 mi exposures |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Oct 17 | Palm Beach spontaneous road run, gifted ASICS shoes | Forerunner 965; Garmin summary and owner lap screenshots | 55:21 | 7.00 mi | 7:54/mi overall | 144 / 163 bpm | **Unknown**; mile 5 averaged 7:40/mi, not proof all its seconds were ≤7:42 | Pending original recording | One whole-mile **lap average** 7:40/mi; sustained-band residency not verified |
| Oct 18 06:56 | Treadmill aerobic by time/HR | Forerunner 965; connected summary, ID `24767168775` | 60:31 | 8.06 km ≈ 5.01 mi (watch) | 7.51 min/km ≈ 12:05/mi (watch) | 113 / 125 bpm | **Not assessed** (aerobic time/HR focus) | Not assessed; treadmill calibration not provided | Not assessed |
| Oct 18 08:57 | Miami Beach track, mixed short repetitions | Forerunner 965; connected summary, ID `24768331932`, owner recollection | 22:04 | 5.17 km ≈ 3.21 mi | 4.27 min/km ≈ 6:52/mi overall **including any recoveries recorded** | 151 / 179 bpm | **17:04.9** in 8 timed work laps averaging 5:57–6:12/mi, all faster than 7:42; *not second-by-second time at speed* | **Verified by Garmin interval screenshot as lap-average categories; second-by-second distribution still unknown** | **Verified Garmin interval screen: 5 × about 400 m + 3 × about 800 m**, with recoveries and brief rests. See October 18 verified work table below. |

**Reconciliation resolved by October 18 screenshots:** Garmin's Intervals screen contains **five short Run rows (~0.25–0.26 mile)** and **three longer Run rows (~0.51 mile)**, each with a timestamp and average pace. This supersedes the earlier uncertain recollection of ten total reps. Rounded distance of 0.25–0.26 and 0.51 mi is not a calibrated track measurement. Work durations total 17:04.9; the full recording is 22:03.8 (22:04 rounded). Garmin also records recoveries/brief rests, and the Run/Walk classification shows 19:15 run and 1:50 walk. Do not sum these distinct classification schemes as separate exercise volumes.

**October 17 prior visual pace laps:** 8:02, 7:52, 7:53, 8:00, **7:40**, 7:58, 7:52 per mile. Brice clarified that 7:40 felt like 8:00 and that subsequent slowing was a conscious choice because of sun exposure and felt underhydration, not proof the pace became harder. Those splits can be used as *whole-mile average* benchmarks, not as exact seconds within 15-second pace zones.

**Historical baseline available:** The October 14 spontaneous six-mile outdoor outing and September 25 / October 4 / October 9 longer-run records are in [LONG-RUN-COMPARISON](LONG-RUN-COMPARISON.md). Their displayed splits/whole-run averages can backfill benchmark examples, but **not exact pace-band minutes** without original traces. The October 17 Garmin profile estimated VO₂ max 52, and the October 17 four-week screenshot showed a rising estimate; keep that an indirect supporting fitness marker, not a speed-bin measure.

## Weight, phenotype and recovery observation · October 18

The athlete reported weighing **190 lb** on October 18 (scale, time relative to food/fluid and standardized morning conditions unspecified). He says running at faster speeds felt heavier at this weight, even though he enjoyed both morning sessions. **Current preference clarified:** trend toward the lower end of the previously approved body range, around **185 lb with visible muscle**, retaining specific areas of muscular fullness rather than treating size as equal to total body weight. One 190-lb reading is not a validated baseline, measured fat gain or reason to restrict fueling. Consider the burden of recent training, sleep, hydration and bone-recovery context before attributing the sensation solely to body mass. The owner wishes to preserve both speed capacity and muscular appearance through intelligently distributed strength work, without increasing the current exercise prescriptions or creating a calorie-restriction plan here.

## What is needed for quantitative totals

- **Best:** Export each Garmin activity's original FIT file from Garmin Connect and supply it. A separate original recording for the October 18 track session and October 17 Palm Beach run would let the study compute the bins; more files can then be backfilled. A TCX is second choice if FIT unavailable.
- **Fallback:** Garmin lap/interval screenshots (date, lap number, duration, distance, average pace) plus details for recoveries. These can establish times spent on *recorded work repetitions by lap-average pace*, not sample-accurate time within 15-second pace bands.
- **Do not claim from current API:** neither the precise 400/800 splits nor seconds at 7:42, in 6:xx/mi or 5:xx/mi. Even a peak-speed reading cannot confirm sustained exposure.

## Provenance and publication

Garmin Forerunner 965 activity summaries retrieved through the user's connected Fitness AI Connector on October 18, 2026; October 17 Strava/Garmin screenshots, October 17 four-week Garmin VO₂ max image, and October 18 athlete first-person conversation. **Insights derived in part from Garmin device-sourced data.** Source-document update does not establish live website deployment, FORM app/Forge syncing, changes to coach assignments, or automation of Garmin imports. This ledger must not be presented as an automatic feed while the connector provides only summaries.

## October 18 · Timed speed exposure from Garmin intervals

**Screenshot readback, not FIT sample-level data.** The Garmin Intervals screen confirms these eight Run work entries. Run row index, displayed duration, Garmin distance and pace are retained without inventing missing lengths, rest periods or per-second speeds.

| Work rep | Duration | Garmin recorded distance | Displayed avg pace | Category by average |
| --- | --- | --- | --- | --- |
| 400-ish #1 | 1:32.2 | 0.26 mi | 5:57/mi | 5:43–5:57 |
| 400-ish #2 | 1:31.6 | 0.25 mi | 6:00/mi | 5:58–6:12 |
| 400-ish #3 | 1:32.4 | 0.26 mi | 6:01/mi | 5:58–6:12 |
| 400-ish #4 | 1:32.4 | 0.25 mi | 6:05/mi | 5:58–6:12 |
| 800-ish #1 | 3:09.8 | 0.51 mi | 6:12/mi | 5:58–6:12 |
| 800-ish #2 | 3:07.8 | 0.51 mi | 6:05/mi | 5:58–6:12 |
| 800-ish #3 | 3:05.8 | 0.51 mi | 6:04/mi | 5:58–6:12 |
| Closing 400-ish #5 | 1:32.9 | 0.26 mi | 5:58/mi | 5:58–6:12 |

**Totals:** 17:04.9 of measured work reps; **1:32.2** classified into 5:43–5:57/mi by lap mean; **15:32.7** classified into 5:58–6:12/mi by lap mean. Across conventional minute ranges, **3:05.1** from two work reps averaged 5:xx/mi and **13:59.8** from six reps averaged 6:xx/mi. No work rep averaged 7:xx/mi. These are **work-interval duration totals based on average pace**, not proof that each second remained in the nominated category.

The whole track recording shows 3.21 mi, 22:03.8 total, 6:52/mi whole-session average, 151 bpm average and 179 maximum on the Garmin connector (Strava displays 152 bpm whole-session average); 3.2 aerobic and 3.7 anaerobic Garmin Training Effect; 438 W mean power; 154 spm overall cadence (affected by stops), 187 maximum; 1.45 m mean stride length; 6.4% mean vertical ratio; 9.1 cm oscillation; **217 ms mean ground contact time**, all device outputs not independently verified measures of running economy. Garmin configured HR-zone distribution: Z5 5:41, Z4 9:26, Z3 3:08, Z2 1:54, Z1 1:26. Power-zone distribution differs and is not equivalent to HR zones. Garmin’s device-temperature display ranges 77–79°F and must not be reported as reliable ambient air temperature.

**Workload context:** This track exposure followed 60:31 of treadmill running, Garmin 5.01 mi, 113 bpm average, 125 bpm maximum, intended as aerobic time/HR rather than a pace challenge. The two sessions are recorded separately. The athlete describes enjoying both, with faster running feeling heavier at a scale-measured 190 lb than at his desired muscular weight closer to 185. Do not infer the cause from scale weight alone.

## Baseline anchor · October 10, and block entry · October 12–18

The user identifies the October 10 **run with Matt, while Adrian followed on a bike**, as the first especially clear felt transition to freer running, accompanying the period when the Garmin VO₂ max estimate rose and remained higher. **Observation anchor: October 10.** October 12–18 is independently documented in the existing [Velocity Automaticity study record](VELOCITY-AUTOMATICITY-20261013.md) as the entry/read week of the authored running block. These are different dates for different purposes, not conflicting program prescriptions.

- **October 9 with Julius:** 10 mi in 1:22:57, average 8:18/mi, with pace feeling more available as a self-selected social outing. Contextual precursor, not falsely counted as completed miles in 7:42-or-faster bins.
- **October 10 with Matt (Adrian on bike):** 3 mi at 7:18/mi; full-mile laps **7:37, 7:17, 7:00**; HR 139 avg; cadence 168; stride 1.30 m; GCT 250 ms; vertical ratio 7.4%; oscillation 9.7 cm. The user reports relaxed movement with music and a deliberate decision to finish before quality deteriorated. Source: athlete’s October 10 conversation. The whole-mile lap-average paces qualify for the wider chart, but the file has not been received to time-classify second-by-second pace.
- **October 12:** 20:00 warm-up / 2.67 mi at 7:29/mi, then originally intended 2 × 10 minutes faster; the user broke the quicker work into shorter pieces to preserve fluidity. Entire activity: 5.27 mi in 36:53 moving time, 7:00/mi moving-average pace; 159 avg HR, 239 ms GCT, 1.32 m stride. Faster interval durations are not quantified here without the actual laps/FIT.
- **October 13:** 3 × 1 mile with 2:30 recovery, splits **7:05 (HR 141), 6:40 (HR 169), 6:48 (HR 168)**, average 6:51/mi; 242 ms GCT, 1.36 m stride, average HR 159. Using displayed full-mile split paces (rounded to whole seconds) their nominal qualifying lap durations sum to about **20:33**, while the Garmin activity record reports 20:36 for all three. Do not force reconciliation from rounded splits or treat the entire 20:36 as a FIT-verified speed histogram.
- **October 14:** 6 miles in 50:05 at 8:20/mi, recorded separately in [long-run observations](LONG-RUN-COMPARISON.md), not a new session just because FORM athletes did track intervals that morning.
- **October 17:** 7 miles at 7:54/mi average; mile 5 was **7:40/mi averaged across the whole mile**. Brice said it felt no harder than 8:00/mi and deliberately eased because of sun and hydration concerns. Record the lap as benchmark, not precise per-second bin residency.
- **Other two prior track sessions:** exact athlete session identities, dates and FIT/lap evidence remain pending user uploads. Do not substitute Adrian/Tinius filmed intervals or another athlete’s programmed work.

**Observational goal:** Brice wants the **7:42–7:20/mi corridor** eventually to become ordinary low-aerobic running. When repeatable matched-condition efforts demonstrate low-aerobic cost (ideally grounded in an individualized LT1/VT1 or credible submaximal assessment), manageable HR drift, low perceived effort, and normal recovery, the corridor may be *retired from special speed milestones* and treated as ordinary aerobic mileage. No number of accumulated fast minutes alone can establish this transition.

## Graph projection · October 18

The graphical study workbench now lives at [Speed Exposure](speed-exposure/index.html). Its views cover documented duration in 15-second **lap-average pace** bins, aerobic cost and Garmin VO₂ max estimate, stride length/ground-contact time alongside pace, and durability with continuous versus repeated exposures. It does not pretend to reconstruct FIT speed histograms, physiological lactate thresholds or same-day tissue adaptation from current incomplete data.

**Research context:** A 2024 systematic review and meta-analysis supports some improvements in running economy from high-load strength training and plyometrics, with speed-dependent effects (https://pmc.ncbi.nlm.nih.gov/articles/PMC11052887/). A 2025 recreational-runner study found LT1 running speed deteriorated after 90 min of low-intensity running, supporting durability as distinct from rested fitness (https://pmc.ncbi.nlm.nih.gov/articles/PMC11889008/). Neither study establishes a universal adaptation dose such as 30 cumulative minutes at a particular pace. The dashboard does not override FORM Athlete System prescriptions or medical return-to-running guidance.


## October 22 · Original Garmin FIT, Descent Into Ruin

**Source:** Athlete-uploaded ZIP on October 22, Garmin activity 24812863860_ACTIVITY.fit. This entry is a selected study observation, not a submitted FORM completion or a new live training prescription.

### Recorded fast work, recoveries excluded

| Rep | Duration | Distance | Lap average |
| --- | ---: | ---: | ---: |
| Mile | 5:59.548 | 1609.34 m | 5:59.5/mi |
| 800m 1 | 2:52.741 | 800 m | 5:47.5/mi |
| 800m 2 | 2:57.231 | 800 m | 5:56.6/mi |
| 400m 1 | 1:22.290 | 400 m | 5:31.1/mi |
| 400m 2 | 1:22.056 | 400 m | 5:30.2/mi |
| 400m 3 | 1:22.423 | 400 m | 5:31.6/mi |
| 400m 4 | 1:26.740 | 400 m | 5:49.0/mi |
| **Total work** | **17:23.029** | **4809.34 m (2.99 mi)** | **5:49/mi** |

### Estimated time within instantaneous speed bands

This is a **different measurement** from categorizing whole reps by their average pace. Garmin FIT enhanced-speed records were restricted to the seven work-lap boundaries. Within each lap, a centered rolling median of eleven consecutive speed samples (approximately 11 seconds for one-second records) was applied. Each result contributes elapsed time to the next sample, capped by that work lap's end. Recovery/pause laps were excluded. Pace transitions, GPS noise and choice of smoothing window make these estimates approximate.

| Smoothed speed sample band | Estimated time |
| --- | ---: |
| Faster than 5:30/mi | 2:04 |
| 5:30–5:44/mi | 3:51 |
| 5:45–5:59/mi | 4:54 |
| 6:00–6:14/mi | 5:33 |
| 6:15/mi or slower | 1:01 |
| **Total sampled work time** | **17:23** |

Estimated sampled time **faster than 6:00/mi: 10:49**. These results do not imply 10:49 of uninterrupted sub-6:00 running. Work-lap averages are independently calculated from elapsed time and distance, and are the more robust measure of sustained rep execution.

### Athlete explanation and comparison to prior runs

- The first warm-up stride felt like grinding or forcing the pace, around 7:00/mi. Subsequent strides loosened, and the main workout felt controlled and smooth, despite a recorded session HR maximum of 185 bpm.
- The fourth 400m was affected by a late start and trying to film with sweaty hands. This explains the 1:26.7 split in the athlete's account; it must **not** be labeled a late-workout fitness fade.
- Quinn, Jacob and Kevin were present. Group rhythm assisted pacing. The social environment is context, not proof of lower physiological load.
- Oct 17: seven outdoor miles, 55:21 (7:54/mi overall), including a 7:40 full-mile average. Exact speed-bin time absent.
- Oct 18: 60:31 aerobic treadmill, average HR 113; 17:04.9 of separately timed faster track work from verified screenshots. Original speed trace absent here.
- Oct 19: iRUN group intervals reported; full trace not available in this ledger.
- Oct 21: 6.05 miles in 50:07 (8:17/mi) after strength; no original detailed trace available here.
- Oct 22: 17:23 of fast work in broken track repetitions at 5:49/mi average, excluding recoveries. This is not three uninterrupted miles at 5:49.
- Recovery-first decision: no running on Oct 23; easy Alo social 5K Oct 24, with future Monday iRUN and Thursday FORM Track as preferred, coach-reviewed quality opportunities rather than automatic demands.

**Limit:** Faster rep time and a good mechanical feeling do not prove improvement in running economy, tibial load tolerance, lower cardiac cost at matched pace, or readiness for an automatic mileage increase. Other recent runs remain summary/lap-level evidence unless their original recordings are supplied.



## October 22 · Detailed work-lap running mechanics

**Source and scope:** Original Garmin Forerunner 965 FIT activity 24812863860, 1,204 timestamped record messages; the running-dynamics comparison uses only the seven timed Run work laps, excluding warm-up, recovery and post-work records. Each row is a mean of valid moving samples within that recorded work lap (positive running cadence, speed at least 2.4 m/s). FIT field transformations: half-cadence and fractional cadence to full steps/min; raw step length /10,000 to metres; stance time /10 to milliseconds; vertical oscillation /100 to centimetres; vertical ratio /100 to percent. One-second-ish samples are not independent experiments and rounding does not imply instrument-level precision.

| Work lap | Mean pace /mi | Mean steps/min | Mean step length | Mean ground contact | Vertical oscillation | Vertical ratio | Mean HR |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1600 m, 5:59.548 | 5:59.5 | 178.2 | 1.50 m | 217.9 ms | 9.60 cm | 6.42% | 166.7 bpm |
| 800 m 1, 2:52.741 | 5:47.5 | 178.5 | 1.55 m | 213.0 ms | 9.73 cm | 6.27% | 159.5 bpm |
| 800 m 2, 2:57.231 | 5:56.6 | 177.8 | 1.50 m | 218.6 ms | 9.64 cm | 6.45% | 167.9 bpm |
| 400 m 1, 1:22.290 | 5:31.1 | 182.3 | 1.62 m | 202.5 ms | 9.57 cm | 5.91% | 157.8 bpm |
| 400 m 2, 1:22.056 | 5:30.2 | 181.9 | 1.61 m | 201.9 ms | 9.63 cm | 5.98% | 165.3 bpm |
| 400 m 3, 1:22.423 | 5:31.6 | 181.1 | 1.61 m | 204.7 ms | 9.68 cm | 6.01% | 163.9 bpm |
| 400 m 4, 1:26.740 | 5:49.0 | 179.3 | 1.55 m | 212.0 ms | 9.63 cm | 6.24% | 164.9 bpm |
| **All 7 timed work laps** | **5:49** | **179.1** | **1.54 m** | **213.3 ms** | **9.64 cm** | **6.28%** | **164.6 bpm** |

Work metrics are sampled device estimates, not lab-calibrated mechanics. All seven work laps supplied valid ground-contact and step-length sample data after filtering (approximately 1,012 moving samples). The FIT file did not provide usable left-right ground contact balance for this session; **do not infer symmetry**.

**What is meaningful:** The first three 400 m reps show consistently quicker pace and a speed-dependent combination of longer measured step length (about 1.61 m versus 1.50 m in the mile), cadence about 182 versus 178 steps/min, and shorter ground contact (about 203 versus 218 ms). Faster running normally produces these changes, so these numbers are evidence of *how* speed was accessed on this day, not proof of improved efficiency. Oct 22 work-only sample means must not be compared directly with the Oct 18 entire track recording's 217 ms average GCT and 1.45 m stride length, where recovery and idle periods were included. Further matched-pace work across comparable days is needed.

**Athlete context:** The first warm-up stride felt forced; work felt smooth. The last 400 was distracted, not reported as a physical fade. Heart rate was high despite smooth perceived mechanics, and the device reached 185 bpm in the full recorded session. Neither the last-lap values nor raw HR establish a biomechanical breakdown.

**Ongoing run ID review:** See [Run Evidence Review Standard](RUN-EVIDENCE-REVIEW-STANDARD.md) for how supplied activity IDs are screened for lap pace, time-at-pace, stride/step length, cadence, ground contact time, vertical oscillation/ratio, cardiac cost and recovery. A Garmin activity ID can identify a summary record, but source-level mechanics and sample-accurate pace bins require the original FIT trace or a compatible detailed record. Unavailable fields remain unknown.
