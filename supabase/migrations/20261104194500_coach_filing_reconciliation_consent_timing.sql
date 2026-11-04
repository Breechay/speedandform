-- A later sharing default is not retrospective permission for historical work.
-- Keep publication strictly behind the athlete's effective account setting.
create or replace function public.coach_filing_integrity_read(p_days integer default 14)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $function$
declare result jsonb;
begin
  if auth.uid() is null or not public.operating_console_owner() then
    raise exception 'Coach operations access required' using errcode='42501';
  end if;
  with scoped as (
    select c.id,c.athlete_id,c.planned_session_id,c.planned_session_version_id,
           c.status,c.filed_at,c.updated_at,a.first_name
      from public.session_completions c
      join public.athletes a on a.id=c.athlete_id
     where c.filed_at >= now()-make_interval(days=>least(greatest(coalesce(p_days,14),1),30))
       and public.is_coach_member(c.athlete_id)
     order by c.filed_at desc,c.id desc limit 120
  ), facts as (
    select s.*,
      exists (select 1 from public.athlete_memberships m
               where m.athlete_id=s.athlete_id and m.role='athlete' and m.status='active') linked_athlete,
      exists (select 1 from public.collective_work_consents k
               join public.athlete_memberships m on m.athlete_id=k.athlete_id
                 and m.user_id=k.user_id and m.role='athlete' and m.status='active'
              where k.athlete_id=s.athlete_id and k.enabled) sharing_enabled,
      exists (select 1 from public.collective_work_consents k
               where k.athlete_id=s.athlete_id and not k.enabled) sharing_disabled,
      exists (select 1 from public.collective_work_consents k
               join public.athlete_memberships m on m.athlete_id=k.athlete_id
                 and m.user_id=k.user_id and m.role='athlete' and m.status='active'
              where k.athlete_id=s.athlete_id and k.enabled
                and k.granted_at <= s.filed_at) shared_at_filing,
      exists (select 1 from public.collective_work_posts p
               join public.collective_work_consents k on k.athlete_id=p.athlete_id
                 and k.user_id=p.owner_user_id and k.enabled
              where p.source_completion_id=s.id and p.revoked_at is null) active_post_with_consent,
      (select count(*) from public.collective_work_posts p
        where p.source_completion_id=s.id and p.revoked_at is null) active_posts,
      (select count(*) from public.collective_work_posts p
        where p.source_completion_id=s.id and p.revoked_at is not null) revoked_posts
    from scoped s
  )
  select jsonb_build_object(
    'schema_version',2,'read_at',now(),
    'source','session_completions / collective_work_posts / collective_work_consents',
    'week_proof','canonical completion only; rendered Week requires athlete-facing readback',
    'feed_proof','source post only; rendered and deduplicated feed requires separate readback',
    'filings',coalesce(jsonb_agg(jsonb_build_object(
      'completion_id',id,'athlete_id',athlete_id,'first_name',first_name,
      'planned_session_id',planned_session_id,
      'planned_session_version_id',planned_session_version_id,
      'status',status,'filed_at',filed_at,'updated_at',updated_at,
      'week_state',case when planned_session_id is null then 'unmatched_filing' else 'canonical_completion' end,
      'feed_state',case
        when sharing_disabled and active_posts > 0 then 'privacy_conflict'
        when sharing_disabled then 'opted_out'
        when active_post_with_consent then 'source_post_present'
        when not linked_athlete then 'no_linked_account'
        when not sharing_enabled then 'sharing_not_enabled'
        when not shared_at_filing then 'before_sharing_enabled'
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

-- A deliberately narrow, idempotent repair operation. Only files that were
-- eligible when performed, still shareable and already authorized to their
-- own coach can be repaired. It never changes consent or completion evidence.
create function public.coach_reconcile_filing_post(p_completion_id uuid)
returns jsonb
language plpgsql volatile security definer
set search_path = ''
as $function$
declare
  rec public.session_completions%rowtype;
  valid_owner uuid;
  has_post boolean;
  consent_locked boolean;
begin
  if auth.uid() is null or not public.operating_console_owner() then
    raise exception 'Coach operations access required' using errcode='42501';
  end if;

  select * into rec from public.session_completions
    where id=p_completion_id for update;
  if not found or not public.is_coach_member(rec.athlete_id) then
    raise exception 'Filing not found in the authorized coach scope' using errcode='42501';
  end if;

  if exists(select 1 from public.collective_work_posts p
             where p.source_completion_id=rec.id and p.revoked_at is null) then
    return jsonb_build_object('completion_id',rec.id,'state','already_present');
  end if;

  if rec.status not in ('completed','partial','changed')
      or rec.source not in ('athlete','form','coach_import')
      or not collective_work_internal.publication_allowed(rec.athlete_id)
      or not exists (select 1 from public.planned_session_versions v
                     where v.id=rec.planned_session_version_id
                       and v.planned_session_id=rec.planned_session_id
                       and v.athlete_id=rec.athlete_id and nullif(btrim(v.title),'') is not null)
  then return jsonb_build_object('completion_id',rec.id,'state','ineligible'); end if;

  valid_owner:=collective_work_internal.publication_owner(rec.athlete_id,rec.filed_by,rec.source='coach_import');
  if valid_owner is null then
    return jsonb_build_object('completion_id',rec.id,'state','no_contemporaneous_sharing');
  end if;
  -- Serialize with the athlete's Settings opt-out to avoid publishing just
  -- after a concurrent consent withdrawal.
  select true into consent_locked from public.collective_work_consents c
    join public.athlete_memberships m on m.athlete_id=c.athlete_id
      and m.user_id=c.user_id and m.role='athlete' and m.status='active'
    where c.athlete_id=rec.athlete_id and c.user_id=valid_owner
      and c.enabled and c.granted_at<=rec.filed_at
    for share of c;
  if not coalesce(consent_locked,false)
     or not collective_work_internal.publication_allowed(rec.athlete_id) then
    return jsonb_build_object('completion_id',rec.id,'state','no_contemporaneous_sharing');
  end if;

  perform collective_work_internal.publish_completion(rec);
  select exists(select 1 from public.collective_work_posts p
    where p.source_completion_id=rec.id and p.revoked_at is null
      and p.owner_user_id=valid_owner) into has_post;
  if not has_post then
    raise exception 'Reconciliation did not produce an eligible source post';
  end if;
  return jsonb_build_object('completion_id',rec.id,'state','source_post_repaired',
    'rendered_feed_verified',false);
end;
$function$;

revoke all on function public.coach_reconcile_filing_post(uuid) from public, anon, authenticated;
grant execute on function public.coach_reconcile_filing_post(uuid) to authenticated;
comment on function public.coach_reconcile_filing_post(uuid) is
 'Scoped, idempotent source-post repair only where historical and current athlete sharing agree; rendered/native visibility requires a separate readback.';
