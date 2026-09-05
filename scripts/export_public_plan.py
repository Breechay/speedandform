#!/usr/bin/env python3
"""Export Race Pace Durability v1 from the source Plan object to JSON.

Reads the plan, never an athlete. The public page is the method; what Hope and
José established belongs to their assignments and does not appear here. The only
athlete-derived fact taken is the chronology of this first running — when week 1
began and when the race is — because a plan has weeks and a running of it has
dates.
"""
import json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

QUERY = """
select json_build_object(
  'plan', (select to_jsonb(p) from training_plans p where p.slug = 'race-pace-durability'),
  'version', (select to_jsonb(v) from training_plan_versions v
               join training_plans p on p.id = v.plan_id
              where p.slug = 'race-pace-durability' and v.version_number = 1),
  'weeks', (select coalesce(json_agg(json_build_object(
              'week_number', w.week_number, 'phase', w.phase,
              'total_distance', w.total_distance, 'intent', w.intent,
              'sessions', (select coalesce(json_agg(json_build_object(
                  'day', s.day_of_week, 'role', s.role, 'title', s.title,
                  'intent', s.intent, 'details', s.details,
                  'distance', s.prescribed_distance,
                  'asks', s.asks_rung_value,
                  'components', (select coalesce(json_agg(json_build_object(
                      'role', c.role, 'shape', c.shape, 'distance', c.distance,
                      'duration_seconds', c.duration_seconds, 'repeat_count', c.repeat_count,
                      'pace_low_seconds', c.pace_low_seconds, 'pace_high_seconds', c.pace_high_seconds,
                      'rpe_low', c.rpe_low, 'rpe_high', c.rpe_high,
                      'recovery_kind', c.recovery_kind, 'recovery_seconds', c.recovery_seconds,
                      'counts_toward_mark', c.counts_toward_mark) order by c.position), '[]'::json)
                    from training_plan_components c where c.plan_session_id = s.id))
                order by s.position), '[]'::json)
                from training_plan_sessions s where s.plan_week_id = w.id))
            order by w.week_number), '[]'::json)
     from training_plan_weeks w
     join training_plan_versions v on v.id = w.version_id and v.version_number = 1
     join training_plans p on p.id = v.plan_id and p.slug = 'race-pace-durability'),
  -- The chronology of THIS running: when week one began, and the race. Facts
  -- about the calendar, not about either athlete.
  'first_run', (select json_build_object(
       'week_one_starts_on', min(w.starts_on),
       'race_on', max(b.race_on),
       'assignments', count(distinct pa.id))
     from plan_assignments pa
     join training_blocks b on b.id = pa.block_id
     join training_weeks w on w.athlete_id = pa.athlete_id and w.block_id = b.id
     join training_plans p on p.id = pa.plan_id and p.slug = 'race-pace-durability')
) as payload
"""

raw = subprocess.run(['supabase', 'db', 'query', '--linked', QUERY],
                     capture_output=True, text=True, timeout=180).stdout
i, j = raw.find('{'), raw.rfind('}')
if i < 0:
    sys.exit('the query returned nothing:\n' + raw[:500])
payload = json.loads(raw[i:j + 1])['rows'][0]['payload']

weeks = payload['weeks']
if len(weeks) != 15:
    sys.exit(f'expected 15 plan weeks, got {len(weeks)}')
asks = sorted(s['asks'] for w in weeks for s in w['sessions'] if s['asks'] is not None)
if asks != [5, 6, 8, 12]:
    sys.exit(f'expected asks 5, 6, 8, 12 — got {asks}')
for w in weeks:
    total = sum(s['distance'] or 0 for s in w['sessions'])
    if abs(total - (w['total_distance'] or 0)) > 0.001:
        sys.exit(f"week {w['week_number']} sums to {total}, declares {w['total_distance']}")

out = 'design/approved/race-pace-durability-v8/work/plan.json'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as fh:
    json.dump(payload, fh, indent=1)
print(f"{out}  ·  15 weeks · asks {asks} · week one {payload['first_run']['week_one_starts_on']}"
      f" · race {payload['first_run']['race_on']} · {payload['first_run']['assignments']} assignments")
