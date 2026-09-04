#!/bin/sh
# The current plan, dumped to a fixed path so design work is never done against
# a stale cache. Re-run after any authoring. Read-only.
set -e
OUT="docs/CURRENT_PLAN_DUMP.json"
cd "$(dirname "$0")/.."
supabase db query --linked "
select json_build_object(
  'dumped_at', now(),
  'athletes', (select coalesce(json_agg(a order by a.slug),'[]') from athletes a where a.active),
  'blocks', (select coalesce(json_agg(b),'[]') from training_blocks b where b.status='active'),
  'weeks', (select coalesce(json_agg(w order by w.athlete_id, w.week_number),'[]') from training_weeks w),
  'sessions', (select coalesce(json_agg(s order by s.athlete_id, s.scheduled_on),'[]') from planned_sessions s),
  'versions', (select coalesce(json_agg(v),'[]') from planned_session_versions v),
  'components', (select coalesce(json_agg(c),'[]') from planned_session_components c),
  'completions', (select coalesce(json_agg(c),'[]') from session_completions c),
  'pieces', (select coalesce(json_agg(p),'[]') from session_pieces p),
  'marks', (select coalesce(json_agg(m),'[]') from athlete_marks m where m.active),
  'checkpoints', (select coalesce(json_agg(k order by k.position),'[]') from mark_checkpoints k),
  'attention', (select coalesce(json_agg(t),'[]') from coach_attention t),
  'exceptions', (select coalesce(json_agg(e),'[]') from session_exception_state e)
) as plan" 2>/dev/null | python3 -c "
import sys, json
raw = sys.stdin.read(); i = raw.find('{'); j = raw.rfind('}')
print(json.dumps(json.loads(raw[i:j+1])['rows'][0]['plan'], indent=1))
" > "$OUT"
echo "wrote $OUT ($(wc -c < "$OUT") bytes)"
