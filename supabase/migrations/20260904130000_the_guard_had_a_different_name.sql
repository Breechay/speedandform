-- The guard had a different name.
--
-- author_athlete called is_coaching_administrator(); the function is
-- is_active_coaching_administrator(). Postgres does not resolve a missing
-- function until the line runs, so the migration applied clean and the failure
-- arrived at the first athlete anyone tried to enter.

create or replace function public.author_athlete(
  p_slug text, p_display_name text, p_first_name text,
  p_program_name text, p_account_label text,
  p_target_event text default null, p_goal_label text default null,
  p_delivery text default 'app',
  p_goal_seconds integer default null, p_target_pace_seconds integer default null
) returns uuid
language plpgsql security invoker set search_path = public, pg_temp as $$
declare created uuid;
begin
  if not public.is_active_coaching_administrator() then
    raise exception 'only a coaching administrator may enter an athlete';
  end if;
  if exists (select 1 from public.athletes where slug = lower(btrim(p_slug))) then
    raise exception 'an athlete with that slug already exists. Find them rather than entering a second one.';
  end if;

  insert into public.athletes (slug, display_name, first_name, home_surface, target_event,
                               goal_label, program_name, account_label, delivery,
                               goal_seconds, target_pace_seconds)
  values (lower(btrim(p_slug)), btrim(p_display_name), btrim(p_first_name), 'form',
          p_target_event, p_goal_label, p_program_name, p_account_label, p_delivery,
          p_goal_seconds, p_target_pace_seconds)
  returning id into created;

  insert into public.athlete_memberships (athlete_id, user_id, role, status)
  values (created, auth.uid(), 'coach', 'active');

  return created;
end $$;

revoke all on function public.author_athlete(text, text, text, text, text, text, text, text, integer, integer) from public;
grant execute on function public.author_athlete(text, text, text, text, text, text, text, text, integer, integer) to authenticated;
