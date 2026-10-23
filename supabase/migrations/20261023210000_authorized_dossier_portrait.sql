-- Expose an athlete's portrait only inside the authorized dossier RPC.
-- athlete_role rejects all other callers before assembling this payload.
CREATE OR REPLACE FUNCTION public.athlete_dossier(athlete uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare role text := public.athlete_role(athlete); b public.training_blocks; f public.athlete_focus_revisions;
        g public.athlete_gate_revisions; d public.athlete_direction_drafts; res jsonb;
begin
  if role is null then raise exception 'not_your_athlete'; end if;
  select * into b from public.training_blocks x where x.athlete_id = athlete and x.status = 'active'
   order by x.starts_on desc limit 1;
  f := public.athlete_focus_live(athlete);
  g := public.athlete_gate_live(athlete);
  select jsonb_build_object(
    'viewer', role,
    'athlete', jsonb_build_object('id', a.id, 'display_name', a.display_name, 'first_name', a.first_name,
                                  'goal_label', a.goal_label, 'target_event', a.target_event, 'portrait_path', a.portrait_path),
    'block', case when b.id is null then null else jsonb_build_object(
               'id', b.id, 'name', b.name, 'total_weeks', b.total_weeks, 'starts_on', b.starts_on,
               'race_on', b.race_on, 'race_name', b.race_name, 'goal_statement', b.goal_statement,
               'artwork_url', b.artwork_url, 'phases', public.athlete_block_phases_live(b.id)) end,
    'focus', case when f.id is null then null else jsonb_build_object(
               'id', f.id, 'body', f.body, 'effective_from', f.effective_from,
               'author', (select coalesce(nullif(btrim(p.display_name), ''), 'Your coach') from public.profiles p where p.user_id = f.authored_by)) end,
    'gate', case when g.id is null then null else jsonb_build_object(
               'id', g.id, 'body', g.body, 'effective_from', g.effective_from) end)
    into res
    from public.athletes a where a.id = athlete;
  -- The coach also gets the private draft (for the hub's "Leo still sees the 14 Sep version").
  if role = 'coach' then
    select * into d from public.athlete_direction_drafts x where x.athlete_id = athlete;
    res := res || jsonb_build_object('draft', case when d.athlete_id is null then null else jsonb_build_object(
             'version', d.version, 'focus', d.focus, 'gate', d.gate, 'updated_at', d.updated_at,
             'stale', d.base_focus is distinct from f.id or d.base_gate is distinct from g.id) end);
  end if;
  return res;
end $function$
