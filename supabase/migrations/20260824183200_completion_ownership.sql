-- Transfer imported Natalie actuals to her authenticated account at claim time,
-- then keep athlete-owned identity columns immutable.

create or replace function public.attach_imported_completions()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.role = 'athlete' and new.status = 'active' then
    update public.session_completions
    set filed_by = new.user_id
    where athlete_id = new.athlete_id
      and source = 'coach_import'
      and filed_by is null;
  end if;
  return new;
end;
$$;

revoke all on function public.attach_imported_completions() from public;

create trigger memberships_attach_imported_completions
  after insert on public.athlete_memberships
  for each row execute function public.attach_imported_completions();

create or replace function public.protect_completion_identity()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is not null then
    if new.athlete_id <> old.athlete_id
      or new.planned_session_id is distinct from old.planned_session_id
      or new.source <> old.source
      or (
        new.filed_by is distinct from old.filed_by
        and not (old.filed_by is null and old.source = 'coach_import' and new.filed_by = auth.uid())
      )
    then
      raise exception 'Completion ownership cannot be changed';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.protect_completion_identity() from public;

create trigger session_completion_identity_guard
  before update on public.session_completions
  for each row execute function public.protect_completion_identity();

drop policy completions_athlete_update on public.session_completions;
create policy completions_athlete_update on public.session_completions for update to authenticated
  using (public.is_athlete_member(athlete_id) and filed_by = auth.uid())
  with check (
    public.is_athlete_member(athlete_id)
    and filed_by = auth.uid()
    and source in ('athlete', 'coach_import')
  );

