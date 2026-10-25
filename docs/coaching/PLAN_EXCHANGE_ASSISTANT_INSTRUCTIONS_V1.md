# FORM Plan Exchange file instructions for ChatGPT, Claude and other assistants

Status: Developer/assistant handoff for the schema-1 preview. Import into the live FORM app is not yet enabled.

When an athlete gives you a FORM Plan Exchange JSON file and asks to revise a plan:

1. Ask what dates, days, goal, pace or workout structure should change only where the athlete has not already specified it. Do not assume a race registration or invent past execution.
2. Keep the file in the exact `schema_version: 1` format of `plan-exchange-example-v1.json`. Return one valid downloadable UTF-8 `.json` file containing the full plan, not a partial patch, Markdown code fences or explanatory fields.
3. Keep the athlete's original dates and prescriptions unless the requested edit requires changing them. A plan file contains **no** athlete ID, account email, login token, coach approval, workout result, completed-session ID, notification or public visibility flag.
4. One dated session per day in v1, a real `YYYY-MM-DD` calendar date, maximum 366 sessions and a span of at most one year. If two sessions are needed on a day, explain that the current file version cannot represent both separately.
5. Use `type` from `easy`, `easy_strides`, `speed`, `threshold`, `long`, `recovery`, `rest`, `race`, `cross_training`. Provide `title`, and a `distance` object (`value` and `mi|km`), `duration` in minutes, or structured `segments`. Rest uses just date, type and title.
6. Pace bounds are seconds per unit: `pace: {"min": 390, "max": 400, "unit": "sec_per_mi"}` means 6:30–6:40 per mile. `min` is the faster pace and `max` the slower. For kilometers use `sec_per_km`. Never silently convert a per-mile target to a per-kilometer target without recalculating the seconds.
7. Speed and threshold work need `segments`, each with `kind`, `amount: {value, unit}`, and optional `repeats`, `pace`, `recovery`. Kinds are `warmup`, `work`, `recovery`, `strides`, `cooldown`; amount units are `mi`, `km`, `min`. Repeated work must specify recovery as `"full"` or `{ "value": 2, "unit": "min" }`. Do not interpret easy-run duration as warm-up.
8. Athlete instructions are short and about executing the run. No generic commentary, long em dashes, coaching-system notes, fabricated personalized goals, private analysis or requests to report back.
9. Do not relabel a workout as easy if it still contains fast repeated efforts. Do not invent recovery durations. Do not change the training load or remove a medical/coach hold just to make a JSON file validate.
10. Run JSON syntax and FORM schema validation before handing back the file. If an edit requires unsupported fields or multiple daily workouts, explain the limitation; never drop workouts silently.

The athlete owns whether to use this plan. The presence of a file is not evidence that FORM or Brice personally reviewed it. The app must show a preview and request explicit activation before changing an active Week.
