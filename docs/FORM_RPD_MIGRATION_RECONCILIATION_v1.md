# FORM RPD MIGRATION RECONCILIATION — v1
**2026-09-09. Investigation only — no migration file was applied, committed, deleted, or renamed to
produce this document.** Read-only comparison of the repo content of three Supabase migration files
in `speedandform/supabase/migrations/`, against the base migration that precedes them.

---

## Files compared

| File | Adds |
|---|---|
| `20260905120000_race_pace_durability_is_a_plan.sql` | Creates `training_plan_versions` version_number **1** for the `race-pace-durability` plan. Already tracked/committed (not part of this pass's untracked set). |
| `20260906100000_race_pace_durability_v2.sql` | Creates version_number **2**: clones v1, then edits four Thursday sessions (Pyramid Intervals, VO2, Speed Demons, Nice and Easy) and one Saturday (W12). |
| `20260906150000_race_pace_durability_v3_speed_warmups.sql` | Creates version_number **3**: clones v2, then shortens the three fixed-speed Thursday warm-ups (W5/W10/W13) from 20 to 15 minutes. |
| `20260906160000_race_pace_durability_v4_distance_language.sql` | Creates version_number **4**: clones v3, then rewrites W2 hills and W7 aerobic-power sessions into distance-authored language, and standardizes recovery-stride distance across several weeks. Also `create or replace`s the `public_plan()` function (idempotent). |

All three of v2/v3/v4 are currently **untracked** in `speedandform` git status (never committed).

---

## Findings

**1. Each migration is additive, not a replacement.** Each one clones the entire prior version's
weeks/sessions/components wholesale (`for old_week in select * from training_plan_weeks where
version_id = <prior> ...`) before applying its own targeted edits. Nothing in v1 is deleted by v2,
nothing in v2 is deleted by v3, nothing in v3 is deleted by v4. Each creates a **new**
`training_plan_versions` row rather than mutating an existing one, and each preserves the prior
version's rows untouched — v1 remains queryable after v2 exists, v2 after v3, and so on.

**2. Each migration explicitly assumes the immediately preceding version's schema and asserts it.**
This is the strongest evidence for a strict chain, not independent drafts:

- v2's DO block: `where p.slug = 'race-pace-durability' ... version_number = 1 ... if v_plan is null
  then raise exception 'Race Pace Durability v1 is missing'; end if;` and refuses to run twice
  (`if exists (... version_number = 2) then raise exception 'v2 already exists'`).
- v3's DO block: same pattern against `version_number = 2` ("Race Pace Durability v2 is missing" /
  "v3 already exists").
- v4's DO block: same pattern against `version_number = 3` ("RPD v3 missing" / "RPD v4 already
  exists").

Each file is written so it **cannot** be applied out of order or twice — applying v3 before v2
exists, or v4 before v3 exists, raises an exception and aborts. This is a hard-coded chain, not a set
of alternative drafts that happen to share a naming pattern.

**3. No code/RPC reference depends on skipping a version.** All three call the same
`public_plan('race-pace-durability')` function and the same assertion pattern (`public RPD is not
vN`) to prove the cutover took effect; v4 additionally redefines `public_plan()` itself, but that
redefinition is idempotent (`create or replace function`) and does not depend on which prior
migration ran — it would produce the same function body whether run right after v3 or, hypothetically,
directly after v1 (though the version-guard `do $$` blocks above would refuse that path anyway).

**4. None are complete replacements or throwaway drafts.** Each targets a narrow, named change
(v2: reopen the ceiling with four sessions + one Saturday; v3: warm-up duration only; v4:
distance-authored language for three session families) and each says so in its own `summary` column
value and header comment. There is no sign any of the three was abandoned mid-edit or superseded by
a sibling at the same version number — there is exactly one file per version number.

**5. Whether any have already been applied to any environment cannot be determined from the repo
alone**, and this investigation did not connect to any live database to check, per instruction. The
only repo-visible signal is that all three are **untracked** in git (never committed) — which speaks
to whether they have been *checked in*, not whether they have been *run* against a Supabase project.
A migration can be run against a database without ever being committed to git. This part is
genuinely unresolved from static analysis and would need a live `select version_number from
training_plan_versions where plan_id = (select id from training_plans where slug =
'race-pace-durability')` check against the actual environment(s) in question — explicitly not done
here.

---

## Conclusion

**SEQUENTIAL.**

Keep all three. Apply in order — v2, then v3, then v4 — if/when they are applied at all; each
migration's own guard clauses enforce this order mechanically (they cannot be applied out of
sequence without raising an exception). None of the three is a draft that should never be applied;
none supersedes another in the sense of making it obsolete before it runs — v3 depends on v2 having
already run, and v4 depends on v3 having already run, exactly as their content declares.

The one open question this document cannot resolve — whether any of the three has already been run
against a live Supabase environment — is a live-database check, explicitly out of scope for this
investigation, and does not change the SEQUENTIAL classification of the three files' relationship to
each other.
