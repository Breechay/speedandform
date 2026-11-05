-- A shared Thursday publication updates one program batch. Keep the in-app
-- receipt, but do not create one email per athlete/workout. This applies before
-- the remaining dated publications and does not publish any session itself.
create or replace function public.form_miami_queue_notice(
 p_athlete_id uuid,p_source text,p_kind text,p_title text,p_body text,p_href text)
returns void language plpgsql security definer set search_path = '' as $$
declare notice_id uuid;
begin
  insert into public.form_miami_notifications(athlete_id,source_key,kind,title,body,href,created_by)
  values(p_athlete_id,p_source,p_kind,p_title,left(p_body,700),p_href,(select auth.uid()))
  on conflict(athlete_id,source_key) do nothing returning id into notice_id;
  if notice_id is null or p_source like 'thursday:%' then return; end if;

  insert into public.form_miami_email_outbox(notification_id,user_id)
  select notice_id,m.user_id from public.athlete_memberships m
  join auth.users u on u.id=m.user_id
  where m.athlete_id=p_athlete_id and m.role='athlete' and m.status='active'
    and u.email_confirmed_at is not null and u.email is not null
  on conflict do nothing;
end $$;

revoke all on function public.form_miami_queue_notice(uuid,text,text,text,text,text)
  from public,anon,authenticated;

comment on function public.form_miami_queue_notice(uuid,text,text,text,text,text) is
  'Creates the in-app receipt. Thursday batch publications are intentionally email-quiet.';
