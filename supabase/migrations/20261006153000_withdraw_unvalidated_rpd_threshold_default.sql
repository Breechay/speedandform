-- External-review correction: withdraw the unvalidated automatic W7 3x12 default.
-- Re-publication is a new receipt. Earlier publications and version 7 remain history.
-- Individual assignments, session versions and completed evidence are not migrated.
do $$
declare
  p_id uuid;
  v6 uuid;
  live public.plan_publications%rowtype;
  n integer;
  live_number integer;
begin
  select id into strict p_id from public.training_plans where slug='race-pace-durability';
  select count(*) into n from public.plan_publications where plan_id=p_id and published_at is not null and revoked_at is null;
  if n<>1 then raise exception 'Expected exactly one current RPD publication'; end if;
  select * into strict live from public.plan_publications where plan_id=p_id and published_at is not null and revoked_at is null for update;
  select version_number into live_number from public.training_plan_versions where id=live.plan_version_id;
  if live_number=6 then return; end if;
  if live_number<>7 or not exists(select 1 from public.training_plan_versions where id=live.plan_version_id and summary='Oct 6 cost-lane revision: W7 Thursday 3x12 controlled threshold instead of VO2 5x3.') then
    raise exception 'A different plan revision is current; reconcile before restoring anything';
  end if;
  select id into strict v6 from public.training_plan_versions where plan_id=p_id and version_number=6;
  if (select count(*) from public.training_plan_weeks where version_id=v6)<>15 then raise exception 'Previous plan is incomplete'; end if;
  update public.plan_publications set revoked_at=now() where id=live.id;
  insert into public.plan_publications(plan_id,plan_version_id,slug,starts_on,race_on,race_name,published_at,published_by)
  values(p_id,v6,live.slug,live.starts_on,live.race_on,live.race_name,now(),live.published_by);
end $$;
