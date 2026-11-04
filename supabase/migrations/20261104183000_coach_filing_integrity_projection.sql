-- Read-only owner/coach reconciliation. No duplicate filing, feed publish,
-- consent mutation or plan write is performed by this projection.
create function public.coach_filing_integrity_read(p_days integer default 14)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $function$
declare
  result jsonb;
begin
  if auth.uid() is null or not public.operating_console_owner() then
    raise exception 'Coach operations access required' using errcode = '42501';
  end if;

  with scoped as (
    select c.id, c.athlete_id, c.planned_session_id,
           c.planned_session_version_id, c.status, c.filed_at, c.updated_at,
           a.first_name
      from public.session_completions c
      join public.athletes a on a.id = c.athlete_id
     where c.filed_at >= now() - make_interval(days => least(greatest(coalesce(p_days,14),1),30))
       and public.is_coach_member(c.athlete_id)
     order by c.filed_at desc, c.id desc
     limit 120
  ), facts as (
    select s.*,
      exists (
        select 1 from public.athlete_memberships m
         where m.athlete_id=s.athlete_id and m.role='athlete' and m.status='active'
      ) as linked_athlete,
      exists (
        select 1 from public.collective_work_consents k
         join public.athlete_memberships m on m.athlete_id=k.athlete_id
              and m.user_id=k.user_id and m.role='athlete' and m.status='active'
         where k.athlete_id=s.athlete_id and k.enabled
      ) as sharing_enabled,
      exists (
        select 1 from public.collective_work_consents k
         join public.athlete_memberships m on m.athlete_id=k.athlete_id
              and m.user_id=k.user_id and m.role='athlete' and m.status='active'
         where k.athlete_id=s.athlete_id and not k.enabled
      ) as sharing_disabled,
      (select count(*) from public.collective_work_posts p
        where p.source_completion_id=s.id and p.revoked_at is null) as active_posts,
      (select count(*) from public.collective_work_posts p
        where p.source_completion_id=s.id and p.revoked_at is not null) as revoked_posts
    from scoped s
  )
  select jsonb_build_object(
    'schema_version', 1,
    'read_at', now(),
    'source', 'session_completions / collective_work_posts / collective_work_consents',
    'week_proof', 'canonical completion only; rendered Week requires athlete-facing readback',
    'feed_proof', 'source post only; rendered and deduplicated feed requires separate readback',
    'filings', coalesce(jsonb_agg(jsonb_build_object(
       'completion_id',id, 'athlete_id',athlete_id, 'first_name',first_name,
       'planned_session_id',planned_session_id,
       'planned_session_version_id',planned_session_version_id,
       'status',status, 'filed_at',filed_at, 'updated_at',updated_at,
       'week_state',case when planned_session_id is null then 'unmatched_filing' else 'canonical_completion' end,
       'feed_state',case
          when active_posts > 0 and sharing_enabled then 'source_post_present'
          when sharing_disabled and not sharing_enabled then 'opted_out'
          when not linked_athlete then 'no_linked_account'
          when not sharing_enabled then 'sharing_not_enabled'
          when revoked_posts > 0 then 'post_revoked'
          else 'missing_source_post' end,
       'active_post_count',active_posts
    ) order by filed_at desc,id desc),'[]'::jsonb)
  ) into result from facts;

  return result;
end;
$function$;

revoke all on function public.coach_filing_integrity_read(integer) from public, anon, authenticated;
grant execute on function public.coach_filing_integrity_read(integer) to authenticated;
comment on function public.coach_filing_integrity_read(integer) is
 'Authorized coach-owned readback of completion and feed source state. Does not attest UI delivery, infer missing consent as opt-out, or publish anything.';
