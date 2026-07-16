# FORGE temporary athlete portal data

This folder is the implementation handoff for `/forge-sculpt/train/`.

## Files

- `forge-portal-programs.json` — runtime-derived prescriptions
- `forge-portal-programs.schema.json` — portal-specific validation contract

The payload was generated from the compiled `FORM-iOS` `ForgeProgramLibrary` at commit
`b5c072fc`. It was not assembled from screenshots, marketing copy, old JSON fixtures,
or clinical documentation.

## Included

### Forge Sculpt

Only the flagship `forge_sculpt_*` Phase 1–4 ladder:

| Phase | Runtime ID | Weeks | Training sessions | Exercise occurrences | Prescribed sets |
|---|---|---:|---:|---:|---:|
| 1 | `forge_sculpt_phase1_v1` | 3 | 18 | 108 | 342 |
| 2 | `forge_sculpt_phase2_v1_fs` | 3 | 18 | 105 | 326 |
| 3 | `forge_sculpt_phase3_v1_fs` | 6 | 36 | 216 | 618 |
| 4 | `forge_sculpt_phase4_v1_fs` | 3 | 18 | 90 | 234 |
| **Total** |  | **15** | **90** | **519** | **1,520** |

Use the hierarchy already present in the payload:

```text
program → phase → week → day/session → exercise → set
```

Do not invent phase names or session prescriptions. The runtime currently supplies
plain `Phase 1`–`Phase 4` labels plus authored week labels.

### Rod

Only the athlete-safe workout prescription from `rod_accountability_v1`:

- 6 weeks
- Monday: `Upper Frame`
- Friday: `Frame + Legs`
- 12 training-session occurrences
- 72 exercise occurrences
- 252 prescribed sets
- full and short-session movement lists

The repeated weeks are intentional. Render the authored week labels and prescriptions
as provided.

## Explicitly excluded

- The discontinued `breechay_sculpt_*` clinical/Tibia ladder
- All Tibia wording
- Forge Sculpt Phases 5–12
- Rod’s private playbook, identity/access keys, nutrition, medication, alcohol, waist,
  judgments, logs, working weights, and psychological or clinical context
- Athlete history or cloud state

The export was checked for whole-word occurrences of:

```text
tibia · accountability · alcohol · medication · waist · protein
judgment · mania · depression
```

All checks returned no matches.

## Why this has its own schema

The repository-level `data/forge-programs.schema.json` cannot faithfully represent:

- phases
- rep ranges
- RIR ranges
- laterality
- short-session movement lists
- runtime-resolved rest
- the two different navigation shapes (`phased` and `weekly`)

Do not flatten this payload into the older schema. The portal-specific schema preserves
the runtime prescription without inventing fields or dropping truth.

## Portal boundary

The JSON is prescription truth only. Browser completion state, movement notes, and
resume position belong in separate local browser storage. They must not be written back
into this file or presented as a cross-device training record.

The public `/forge-sculpt/` landing page does not need to consume or link this data.
