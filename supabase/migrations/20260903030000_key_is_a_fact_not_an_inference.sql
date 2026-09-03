-- Key is a fact, not an inference.
--
-- The bench's second register says NEXT and quietly means "the next session that
-- has a pace band on it". That held while the plan contained only quality work.
-- It stops holding the moment easy running is authored as a weekly budget with a
-- one-sided ceiling — 18 miles at 8:45 or slower — because that row has a pace
-- on it and would start presenting itself as the next key session.
--
-- Key-ness is currently derived three different ways in this system: positionally
-- from the weekday, from whether typed components carry a band, and in the app
-- from required/supporting/optional. Three derivations, no stored fact. So the
-- flag gets stored, and the surfaces read it instead of guessing.
--
-- It is an EVIDENCE flag and deliberately not the same question as which session
-- moves a rung. A session can be key because it is what this week is asking of
-- the athlete without establishing anything on the ladder — Hope's Tuesday is
-- exactly that. The rung question stays open until real reads show which sessions
-- generate one.

alter table public.planned_sessions
  add column if not exists is_key boolean not null default false;

comment on column public.planned_sessions.is_key is
  'Whether this session is what the week is asking of the athlete. An evidence flag, stored rather than inferred from whether a pace band exists — easy running authored with a one-sided ceiling carries a pace and is not key.';

-- Backfilled to exactly what the surfaces were already inferring, so nothing on
-- screen changes today: a session whose current version has a banded work
-- component was key, and still is.
update public.planned_sessions s set is_key = true
where exists (
  select 1
    from public.planned_session_versions v
    join public.planned_session_components c on c.version_id = v.id
   where v.planned_session_id = s.id
     and v.version_number = (select max(v2.version_number) from public.planned_session_versions v2
                              where v2.planned_session_id = s.id)
     and c.role = 'work'
     and c.pace_low_seconds is not null);

create or replace function public.set_session_key(p_planned_session_id uuid, p_is_key boolean)
returns void language plpgsql security invoker set search_path = public, pg_temp as $$
declare owner_id uuid;
begin
  select athlete_id into owner_id from public.planned_sessions where id = p_planned_session_id;
  if owner_id is null then raise exception 'no such session'; end if;
  if not public.is_coach_member(owner_id) then
    raise exception 'only a coach on this athlete may say what their week is asking';
  end if;
  update public.planned_sessions set is_key = p_is_key, updated_at = now()
   where id = p_planned_session_id;
end $$;

revoke all on function public.set_session_key(uuid, boolean) from public;
grant execute on function public.set_session_key(uuid, boolean) to authenticated;
