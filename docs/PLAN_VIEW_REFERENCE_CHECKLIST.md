# Plan view — reference checklist

Reference: `the-plan-6.html`, read as the contract. 4 September. **Nothing below
is built.** This is the audit Brice asked for before implementation.

Key: **BUILD** buildable from production data · **SLOT** element stays, backing
data missing, reported not removed · **COPY** coaching text with no data behind
it · **OMIT** deliberately not built, with the reason.

## A · Chrome

| # | Element | | Note |
|---|---|---|---|
| 1 | `FORM LABS` mark | BUILD | Labs keeps it as fixed chrome rather than the reference's flow bar — it is shared by Bench and Brief. |
| 2 | Nav | BUILD | Labs has four: Bench · Brief · Plan · Console. |
| 3 | Date stamp | BUILD | |

## B · Hero

| # | Element | | Note |
|---|---|---|---|
| 4 | Portrait frame 80×100, gradient plate, ghost monogram | BUILD | Today's `.heroPortrait` is a 74px circle. The reference frame replaces it. |
| 5 | Name | BUILD | `athletes.first_name` |
| 6 | `OUC Half · Orlando · 5 December 2026 · week 2 of 15` | BUILD | |
| 7 | JOSÉ / HOPE toggle | **OMIT** | Your ruling. The route carries the athlete; two names on one page is the thing that must never ship. |
| 8 | THE GOAL — *Break 1:30. Anything faster is a win.* | COPY | Slot builds from `goal_statement` (*Run under 1:30 at Orlando*). The reference's sentence is yours to write. |
| 9 | *Race pace is 6:45 a mile. Fifteen weeks to take it from 2 continuous miles to 13.1.* | BUILD | Every number derives: band high, `total_weeks`, owned, `target_value`. |
| 10 | WHAT YOU OWN TODAY — `2 mi` | BUILD | From `athlete_continuous_owned`. Never typed. |
| 11 | *…Three Saturdays in this plan move that number* | BUILD | Question from `mark.current_question`; the count from the rung test. |

## C · Pace bands

| # | Element | | Note |
|---|---|---|---|
| 12 | EASY · `8:45 /mi or slower` | BUILD | One-sided ceiling, 14 components. |
| 13 | RACE WORK · `6:30–6:45` | BUILD | 54 components. |
| 14 | THRESHOLD · `≈6:15` | **SLOT** | **No component in either block prescribes threshold.** The number exists only in the reference. `purpose` is an enum, so there is nowhere to author it. The cell renders and says the band is not authored in this block, until it has a home. |
| 15 | Coral "unverified" treatment | **OMIT** | Your correction. Threshold is known and intentionally deprioritised, not uncertain. |
| — | A fourth STEADY band | **OMIT** | Your rule 4. It overlapped race work numerically and has no independent prescription. |

## D · Week rhythm

| # | Element | | Note |
|---|---|---|---|
| 16 | THE WEEK — shape | BUILD | Key days and the long day derive. **The `≈45 mi` does not:** authored components sum to 25–45 by week, mean 36. See #36. |
| 17 | HOPE · a normal week | **OMIT → replaced** | Second athlete. Becomes OBSERVED, from filed evidence — José W1: Mon 4.02 · Tue 9.32 · Wed 5.05 · Thu 6.02 · Fri 3.52 · Sat 12.02. |
| 18 | JOSÉ · this week so far | BUILD | Now that the easy running is filed. W2 to Friday: 30.85 filed. |

## E · The grid

| # | Element | | Note |
|---|---|---|---|
| 19 | `weeks out` row label | BUILD | |
| 20 | Week headers — number, start date, countdown | BUILD | |
| 21 | Column count | **DEVIATION** | The reference stops at **W14**. José and Hope are 15-week blocks. Per your rule 5 I render **all 15**. |
| 22 | Current week, continuous down the column | BUILD | |
| 23 | `down` cutback marker | BUILD | Derived from the volume row. |
| 24 | `THIS WEEK IS FOR` row | **SLOT** | `training_weeks.intent` **already exists** — no migration needed — and is null on all 77 weeks. Row renders empty until authored. |
| 25 | Seven day rows Mon–Sun | BUILD | Four are empty of *prescriptions* for both athletes; see #37. |
| 26 | Tue / Thu / Sat weighting | BUILD | |
| 27 | Cell — session name | BUILD | |
| 28 | Cell — structure line | BUILD | Derived from components, never the title. |
| 29 | Cell — `RAN` | BUILD | 18 filings now on file. |
| 30 | Cell — *moves what you own* | BUILD | |
| 31 | Lime title (continuous at band) | BUILD | |
| 32 | Lime left bar (rung) | BUILD | Still **derived**: `establishes_checkpoint_id` is set on 0 sessions. |
| 33 | Cancelled, struck through, visible | BUILD | 2 for José. |
| 34 | Empty-day dot | BUILD | |
| 35 | Across-the-week budget row | BUILD | Outside the dated days, as specified. |
| 36 | `Miles` volume row | BUILD, **numbers differ** | The reference holds a flat 45. The authored components sum to 33 · 39 · 37 · 41 · 44 · 39 · 25 · 37 · 38 · 45 · 31 · 39 · 39 · 26. I render what is authored. Whether the plan should hold 45 is your call, not the view's. |
| 37 | **Filed runs on days with no prescription** | **NEW — not in the reference** | Ten of the twelve runs I filed have no planned session, because none was authored that day. Without this the Monday, Wednesday and Friday cells stay empty and the evidence is invisible. The cell becomes: what was asked, and what was run — including when nothing was asked. |

## F · Footer and route

| # | Element | | Note |
|---|---|---|---|
| 38 | Legend | BUILD | |
| 39 | `#/a/:slug/plan` replaces `#/a/:slug/block`; shape strip removed | BUILD | |
| 40 | The `.plate` collision | BUILD | `labs.css:85` — the bench column's plate is `position:absolute; inset:0` with a gradient. The Plan view reused the class name. That full-screen box **is** the translucent rectangle over FORM LABS **and** what hid the hero. New names throughout; no reuse of bench classes. |

## Two data-quality notes, not defects of the view

- **`actual_distance` means two different things.** Some completions carry the
  whole session (José 25 Aug, 9.32) and some carry only the work (José 1 Sep, 6,
  against a 9.09-mile session). Two are null (José's 25 Aug evening double,
  Hope's 27 Aug sixes) though both carry full splits. Any weekly filed total is
  wrong until this is one convention. Changing them is `correct_session`, which
  is a coach's call with a reason attached, not a migration's.
- **Ownership eligibility** — see the open list. The one-sided-ceiling hole is
  unexploited today and still open.

## Tranches

**A · matrix mechanics** — 19–37, 39, 40.
**B · athlete context** — 4–6, 8–13, 16–18.
**C · coaching intelligence** — 14, 24, and the cell-click drawer.

Audit after each: built / not built / different from reference / why, checked
against the live route rather than against the markup.
