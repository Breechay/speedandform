# FORM · Distance-first easy running
**Coach authoring standard · October 25, 2026**

## Default
Published easy runs are prescribed in **miles**. For an athlete whose native units are kilometers, prescribe **kilometers**. Do not prescribe the total easy run as a number of minutes.

- Examples: `Easy · 4 mi`, `Easy + strides · 5 mi`, `Easy · 7 km`.
- Easy + strides is one session: a distance for the easy run, then explicit stride count, seconds and recovery.
- Long runs already use individualized distance. A shared meetup does not impose one common long-run length.
- Threshold work, interval work, timed repetitions, warmups and cooldowns may still use minutes when that is the actual training stimulus. This rule changes easy **sessions**, not workout structure.
- Keep the athlete's true easy effort. The distance conversion is not an invitation to run faster to match the old time. Respect the individualized easy floor where one is set.
- Every change creates a new `planned_session_versions` row and typed components. Keep prior versions, filed runs and evidence unchanged.
- Display one complete prescription. No internal coach qualifiers or instructions to choose between conflicting sessions.
- For new athlete onboarding, choose the athlete's units before authoring Week 1; use distance by default so manual repairs aren't necessary.

## Publication gate
Before publishing, reject a future easy session with `prescribed_duration_minutes` set and `prescribed_distance` missing. Do not reject a true speed/threshold workout simply because its work intervals use minutes. Test the athlete-facing Week read model and typed components together.

**October 25 data correction:** existing future easy-session prescriptions were revised in the FORM Athlete System, with prior versions kept as history. This document is the authoring rule, not an alternate owner of training data.
