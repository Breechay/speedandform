# José · Orlando · Independent-review synthesis
**Prepared:** October 20, 2026 · **State:** findings filed; coach approval pending for prescription changes  
**Race goal:** sub-1:30 at the OUC Orlando Half Marathon, December 5, 2026.

This is an evidence and decision candidate sheet, not the athlete's current plan. Source review: independent contributions provided by the coach from Gemini, Copilot, Perplexity, Chat Breechay, Grok, Claude Breechay, Claude Hideout (DOCX), and Chat Brice. Their access to private FORM data varied; give greater evidentiary weight to confirmed activity and database records than to plausible but unverified assumptions. The private FORM record owns athlete statements, clinical concerns, and coach notes.

## Conclusion shared across reviewers
Most reviewers assess a sub-1:30 attempt as credible, not assured. The October 13 20-minute faster effort, September five- and six-mile work and October 20 eight continuous miles at 6:44/mi show speed access and substantial continuous exposure. High reported cost, unknown recovery and running load, and unverified late-half durability remain meaningful limits. The central December question is not extending 6:40–6:45/mi to twelve training miles. It is arriving rested enough to hold approximately 6:50/mi for 13.1 miles, with an even start, practiced intake and independent rhythm.

**Do not reclassify a Garmin 18:56 5K nested inside a workout as an independently raced 5K or extrapolate it into a guaranteed half-marathon time.** Do not equate watch HR zone labels with measured physiological thresholds. Solo/company responses are observational, not proof of causation.

## Reviewer comparisons
| Topic | Convergence | Disagreement to preserve |
|---|---|---|
| Main goal | Sub-1:30; controlled 6:48–6:52/mi goal-pace exposures, less need to prove faster training pace | Oct 27 remains fresh 6:40–6:45 solo (Copilot, Grok and earlier plan) versus a matched 6:48–6:52 solo pair on Oct 27 / Nov 10 (Claude Hideout, Perplexity). |
| Nov 7 and Nov 14 | Two main late goal-pace runs: 14 mi with final 3, then 14 mi with final 5; practice solo-to-steady-company transition and race morning | Whether to retain both equally, or protect only the last significant rehearsal. |
| Weekly running volume | No new hard workout or automatic increase; count all warm-up/cooldown and added mileage; protect fresh legs and taper | Approximately 39–40 versus 45–50 miles in build, with different cutback schedules. A 50-mi ceiling is not a mileage target. |
| Threshold and faster work | Keep small low-cost exposure, no new VO2 block, no October 13 pace-chasing | Effort-only tempo versus a prescribed pace ceiling. Pace ceiling must be verified, not inferred from one best effort. |
| Strength | Existing strength load unknown; replace, don't stack; prioritize Tuesday/Saturday running, reduce in taper | Exact days and whether last moderate/heavy leg exposure should be Nov 10 versus Nov 14 or later. |
| Fueling | Rehearse actual product, quantity, timing, water, GI tolerance and breakfast | Generic gel plans conflict with later private athlete information. Read latest private athlete record; do not prescribe a change from assumptions. |
| Company and psychology | Group running is a useful reported asset, not a deficiency. Practice steady rhythm solo and with company; no unplanned surges. | Race-day pack plan requires an individually suitable partner, not an assumed organizer-provided 1:30 pacer. |
| Race execution | No early banking; 6:50-ish working target, mile 9 reassessment, settle/hold/finish cues | Exact first-mile allowances and when to accelerate are provisional, not race-week commitments. |
| FORM | Reuse canonical prescriptions/completions and private coach observations; don't build speculative readiness algorithms | Critical integrity bugs should take precedence over new structured tracking UI. |

## Verified race information
Track Shack's October 20 event page: December 5, 2026, 7:15 AM Eastern, Downtown Orlando/Lake Eola; nine water stops at approximately 1.5-mile intervals with Gatorade. **Published official half-marathon pace groups begin at 1:40**, not 1:30. Use independent timing and arrange any compatible running company separately. Verify route, travel and athlete-guide updates closer to race week.

## Coach decision candidates — not yet applied
1. **Oct 27 / Nov 10 matched question:** Strong case for making each four continuous miles solo at ~6:50/mi, same course/time/conditions where practical; this makes the pair interpretable and accords with the coach's newly communicated pace-band trial. Preserve a small faster exposure on Nov 3 for speed familiarity. Counterargument: Oct 27 at 6:40–6:45 preserves a specific fast-rhythm comparison to Oct 20, although unequal 4 vs 8-mile duration still prevents a clean cost comparison.
2. **Nov 7 / Nov 14:** Keep the goal-pace late miles (3 and 5) with real race-day bottle, breakfast and fueling rehearsals. A stable companion joins late on Nov 14 without raising pace. No additional ten/twelve-mile fast test.
3. **Nov 21:** Current live assignment contains 12 easy miles. Some agents propose 11 mi with a two-mile goal-pace finish; others favor all easy. Do not add the third late goal-pace finish without evidence that the Nov 14 session has been absorbed and the taper remains protected.
4. **Mileage:** Review actual weekly totals; the published plan, including timed warm-ups, cool-downs, strides and Saturday distance, determines the ceiling. Do not use `prescribed_distance` alone for versioned workouts that lack a fixed total.
5. **Race pacing:** Pending Nov 14 and race-week check, provisional opening near 6:50–6:51, through nine miles near 6:48–6:52, late steady rather than a forced surge. Short mental cues are useful. Official course-mile markers are more reliable for finish-time checks than an assumed GPS distance.
6. **Fuel and hydration:** Preserve the latest **private** athlete-reported information and specifically measured training outcomes. No automatic reduction or gel substitution without dose, tolerance, dilution and fluid evidence. Confirm suitability with José before locking the race brief.
7. **Strength:** Reconcile actual FORGE/other leg sessions first; the unlisted alternative is a substitute, not a parallel program.
8. **Safety gate:** Read the private coach note and confirm the status of any previously reported exertional symptoms before additional hard training. This belongs in the private athlete record, not public study or an agent-written fitness inference.

## Confirmed product integrity priorities
- **P0 execution distance:** Oct 20 `session_completions.actual_distance` is eight work miles while the complete activity is 11.49 mi captured separately in `session_pieces`. Other completions may mean whole-activity distance. Do not indiscriminately sum either field until the semantics are normalized without destroying original evidence.
- **P0 planned distance:** `planned_session_versions.prescribed_distance` is NULL for several important warm-up/work/cooldown prescriptions, and the current athlete/coach view displays that field. Weekly planned volume may omit those miles. Derived totals must include repeated work blocks, recovery jogging, timed warm-ups and cooldowns, and strides without double-counting.
- **P1 pace authority:** Athlete block still labels old `RACE WORK 6:30–6:45` and `EASY 8:45+`; newer published sessions use two distinct training vs goal pace bands and easy 8:00+. Resolve by an explicitly versioned coach decision rather than silently overwriting historical paces.
- **P1 recovery filing:** Coach form in `coach/coach.js` currently sends `recoveredNextDay: null`, although the completion field exists.
- **P1 incomplete copy:** Some easy days and the Nov 21 long run have a title, mileage component and no `details`. They are not empty sessions, but need clear definite athlete wording when approved.
- **P2 small evidence capture:** First reuse completion note and existing observations to store solo/partner context, segment effort, measured fueling and next-day recovery. Defer extensive app scoring and new analytics until after the race.
- Verify authenticated app Week actually shows the latest published prescriptions rather than assuming DB publication means device delivery.

## Next evidence and publication gates
1. Resolve private safety and training-load unknowns with the athlete.
2. Coach chooses Oct 27 pace and weekly load. Reconcile any chosen change by creating new published session versions, not editing history.
3. After Oct 27, Nov 7, Nov 10 and Nov 14, preserve output, effort, contextual company, measured fuel and 24/48-hour recovery. Compare like with like; record uncertainties.
4. Lock race-day nutrition, hydration, packing, start logistics and pace cues only from confirmed rehearsal and organizer details, then deliver a short athlete-facing brief.
5. Publish public study excerpts only with appropriate permissions and dated evidence. Keep private messages, sensitive health data, uncertain fueling claims and raw coach analysis out of public content.
6. On race day and after, record actual outcome, decision quality, and which interventions remain unproven even if the goal succeeds.

**Decision record:** Review intake only. No automatic session rewrite, public-study publication, strength assignment or feature deployment is authorized by reviewer agreement alone.

## October 20 owner decision · applied after independent review

The coach approved the following **current athlete prescription** in FORM Athlete System on October 20, superseding earlier proposals above:

- October 27 and November 10: matched four continuous solo miles at **6:48–6:52/mi** on the same route where practical, with a twenty-minute easy warm-up and ten-minute cooldown. Compare effort and 24–48-hour recovery; this is an observation, not proof of physiological adaptation.
- November 3: retain **3 × 1 mile at 6:40–6:45/mi** as a short faster training exposure.
- November 7: **14 miles, eleven easy plus final three at 6:48–6:52**. Familiar fuel/hydration rehearsal.
- November 14: **14 miles, nine easy plus final five at 6:48–6:52**; first three solo, steady companion for final two without acceleration; race-morning rehearsal.
- November 17: three continuous goal-pace miles, not a faster requirement. November 21: ten entirely easy miles. November 28: eight easy. No third late-race-pace long-run finish.
- November 27: four easy miles. December 4: two-mile shakeout. Missing easy-day session instructions now have plain published text. Preserve existing running plan versions; do not retrofit historical completions.

The older **6:30–6:45 RACE WORK** and **8:45 EASY** active block labels are superseded in the current block by **GOAL PACE 6:48–6:52**, **FASTER TOUCH 6:40–6:45**, and **EASY 8:00 or slower**. The old band settings and workout evidence remain historical, not current instructions. The athlete reports maple syrup intake at 70–80 g carbohydrate per hour and a planned water bottle. Actual amounts, fluid volumes and tolerance still require dated observation.

The race is still on December 5. The long-run progression is now **actual faster work → fresh goal-pace comparison → late goal-pace durability → taper → race**, not a twelve-mile pre-race proof requirement. Future runs remain *planned* until results are filed.

### Deferred FORM iOS product work

**Calendar review date: November 3, 2026 (all-day, after current iOS shipping window).** This is a review, not a shipping or activation deadline. Priority order at that review:

1. Validate activity total distance versus race-pace work distance and projected whole-session miles.
2. Confirm live goal/fast/easy pace authority and actual app Week readback.
3. Make next-day recovery capturable and preserve existing session history.
4. Reuse existing notes before considering minimal new segment RPE, company and fueling fields.

The current FORM release is protected. No speculative scoring, prediction feature or new workout database is authorized. Any work after review must be staged in a separately approved bounded implementation batch. The standard active Weekly Company Review and athlete coach records remain the broader owning sources.
