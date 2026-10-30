-- Fix production 503: auth.users.email is varchar(255), while the service-only
-- outbox claim RPC returns email text. A RETURN QUERY requires exact types.
-- Keep claim locking, verified-address checks, consent filtering and privilege
-- boundaries unchanged. Applied to production as migration 20261030095818.
create or replace function public.form_miami_email_claim(p_limit int default 20)
returns table(id uuid,email text,title text,body text,href text)
language plpgsql security definer set search_path = '' as $$
begin
  if auth.role()<>'service_role' then raise exception 'service_only'; end if;
  return query with claimed as (
    select o.id from public.form_miami_email_outbox o
    where (o.status='pending' or (o.status='sending' and o.next_attempt_at<now()))
      and o.next_attempt_at<=now() and o.attempts<4
    order by o.next_attempt_at,o.id for update skip locked limit least(greatest(p_limit,1),30)
  ), moved as (
    update public.form_miami_email_outbox o set status='sending',attempts=o.attempts+1,
      next_attempt_at=now()+interval '5 minutes' from claimed c where o.id=c.id
      returning o.id,o.user_id,o.notification_id
  )
  select moved.id,u.email::text,n.title,n.body,n.href
    from moved join auth.users u on u.id=moved.user_id
    join public.form_miami_notifications n on n.id=moved.notification_id
    left join public.form_miami_notification_preferences pref on pref.user_id=u.id
    where u.email_confirmed_at is not null and u.email is not null and coalesce(pref.email_enabled,true);
end $$;
revoke all on function public.form_miami_email_claim(integer) from public,anon,authenticated;
grant execute on function public.form_miami_email_claim(integer) to service_role;
