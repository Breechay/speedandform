-- The number under the name needs a writer.
--
-- `athlete_marks.current_value` is what the bench puts under an athlete's name:
-- the single fact that surface exists to carry. It was set by hand in a
-- migration in August and nothing has written it since, so on 3 September it
-- read 1.00 for Hope, José and Marcus — three athletes, three different states,
-- one stale number. Hope owns 4.0 and José 6.1; Marcus owns nothing.
--
-- Reading the ladder instead would be worse: Marcus's checkpoints claim he
-- reached 8.00 miles and he has never filed a session.
--
-- So: a writer, coach only. And null is a real value here, not a missing one —
-- "nothing established" is a state an athlete can be in, and it is the honest
-- state for someone with no evidence. The bench draws an em dash for it.

create or replace function public.set_mark_value(
  p_mark_id uuid,
  p_value numeric default null,
  p_clear boolean default false
) returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare owner_id uuid;
begin
  select athlete_id into owner_id from public.athlete_marks where id = p_mark_id;
  if owner_id is null then raise exception 'no such mark'; end if;
  if not public.is_coach_member(owner_id) then
    raise exception 'only a coach on this athlete may set what they own';
  end if;
  if not p_clear and p_value is null then
    raise exception 'give a value, or pass p_clear to say nothing is established';
  end if;
  if p_value is not null and p_value <= 0 then
    raise exception 'what an athlete owns is a positive quantity';
  end if;

  update public.athlete_marks
     set current_value = case when p_clear then null else p_value end,
         updated_at = now()
   where id = p_mark_id;
end $$;

comment on function public.set_mark_value is
  'Sets what an athlete owns on a mark. Null is a state, not a gap: an athlete with no evidence owns nothing, and the bench draws an em dash rather than a number.';

revoke all on function public.set_mark_value(uuid, numeric, boolean) from public;
grant execute on function public.set_mark_value(uuid, numeric, boolean) to authenticated;
