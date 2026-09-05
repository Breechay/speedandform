-- A withdrawal carries a reason.
--
-- Revising a session demands one: write_session_version refuses without it,
-- because a revision without a reason is a mystery in six weeks. Withdrawing a
-- session demanded nothing. `planned_sessions.state` moved to 'cancelled' and
-- the record kept a timestamp and a silence.
--
-- That silence has already cost something. W7 and W11's Tuesdays were both
-- withdrawn at 20:44:54 on 3 September, in one action, and nothing in the
-- database says why or whether the blank they left is deliberate. Neither the
-- coach nor the athlete can tell an intentional gap from an unauthored hole,
-- and the surfaces cannot either.
--
-- The same shape as every other ledger here: appended, never overwritten, and
-- carrying who and when.

alter table public.planned_sessions
  add column if not exists withdrawn_reason text,
  add column if not exists withdrawn_at timestamptz,
  add column if not exists withdrawn_by uuid references auth.users(id) on delete set null;

comment on column public.planned_sessions.withdrawn_reason is
  'Why this session was withdrawn, in words that are still legible in six weeks. Required by withdraw_session. A blank it does not explain is indistinguishable from a session nobody authored.';

create or replace function public.withdraw_session(
  p_planned_session_id uuid,
  p_reason text
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  owner_id uuid;
  filed boolean;
begin
  select athlete_id into owner_id from public.planned_sessions where id = p_planned_session_id;
  if owner_id is null then raise exception 'no such session'; end if;
  if not public.is_coach_member(owner_id) then
    raise exception 'only a coach on this athlete may withdraw their work';
  end if;
  if coalesce(btrim(p_reason), '') = '' then
    raise exception 'a withdrawal needs a reason. A blank nobody explained is not a coaching decision.';
  end if;

  -- Evidence is not withdrawn. A session that was run happened, and cancelling
  -- it would hide a filing behind a state change.
  select exists (select 1 from public.session_completions c
                  where c.planned_session_id = p_planned_session_id) into filed;
  if filed then
    raise exception 'that session was filed. Correct the filing or revise the prescription; do not withdraw evidence.';
  end if;

  update public.planned_sessions
     set state = 'cancelled',
         withdrawn_reason = btrim(p_reason),
         withdrawn_at = now(),
         withdrawn_by = auth.uid()
   where id = p_planned_session_id;
end;
$$;

revoke all on function public.withdraw_session(uuid, text) from public, anon;
grant execute on function public.withdraw_session(uuid, text) to authenticated;

comment on function public.withdraw_session is
  'The one path a future session leaves the plan by. Requires a reason, refuses to touch anything already filed, and stamps who and when.';

-- The two that are already withdrawn. Recorded now rather than left silent: the
-- reason is reconstructed from what the block itself shows, and says so.
update public.planned_sessions s
   set withdrawn_reason = 'Reconstructed 4 September, after the fact. Both Tuesdays were withdrawn in one action on 3 September and nothing replaced either. W7 is the major cutback and W11 protects the twelve-mile continuous on its Saturday; in both weeks the Tuesday quality was the thing the week could least afford.',
       withdrawn_at = s.updated_at
 from public.athletes a, public.training_weeks w
 where a.id = s.athlete_id and w.id = s.week_id
   and a.slug in ('jose', 'hope') and w.week_number in (7, 11)
   and s.day_label = 'TUE' and s.state = 'cancelled'
   and s.withdrawn_reason is null;
