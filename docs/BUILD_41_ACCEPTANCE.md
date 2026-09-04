# Build 41 — physical-device acceptance

**Gate A is not complete until this passes on a real phone.** Server is green and
the code path is green; neither is proof. The last time a walk was called passed
without being run, the failure mode was a clean fallback — which is exactly what
a working app looks like.

Run as José or Hope, on 41, against the current or a future coached week.

| # | Check | Why it can fail |
|---|---|---|
| 1 | **The coached Monday easy session appears.** `Easy · 8 mi · 8:45 or slower`. | Monday sessions did not exist until 4 September. If Monday is a rest day, the coached week was rejected and the app drew its own. |
| 2 | **No `Across the week` budget row appears anywhere.** | The feed now filters undated rows. If one shows up, the filter did not deploy — and an undated row rejects the entire week. |
| 3 | **Tuesday, Thursday and Saturday match Labs exactly**, title and structure. | The whole point. A mismatch means the app is drawing its own plan. |
| 4 | **Total session distance is distinguishable from the work dose.** A W5 Tuesday is `7 mi @ 6:30–6:45` inside a **10.4-mile session**. The athlete must not read it as ten and a half miles at race pace. | `prescribed_distance` changed meaning on 4 September. The translator's dose line reads the components, so the dose should be right — but the session figure is now larger than it has ever been and the surface has never had to show both. **This is the one most likely to need UI work.** |
| 5 | **Pace and recovery structure survive translation** — bands, floats, jogs, warm-up and cool-down all present. | Warm-ups and cool-downs were typed on eighteen sessions for the first time on 4 September. None of them has ever been through the translator. |
| 6 | **A cancelled session renders as cancelled**, not as a gap. W7 and W11 Tuesdays. | A cancelled session read as absent is a week the athlete thinks is lighter than it is. |
| 7 | **A future Labs revision supersedes the app's prescription** after a refresh. Change one W6 session, pull, confirm. | This is the actual claim being tested: Labs authors, the phone delivers. |
| 8 | **The fallback planner never appears while coached authority is valid.** Check `FORMCoachedWeekFaultLog` for `reportGeneratedDespiteCampaign`. | The silent failure. A generated week looks healthy and is the wrong week. |

**Do not redesign the iOS UI first.** Run the pass, and only touch the surface if
#4 proves it genuinely cannot communicate total-session distance against work
dose. Everything else is verification, not design.
