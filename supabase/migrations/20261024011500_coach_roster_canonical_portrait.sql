-- Keep the Coach Board on the same canonical, remotely managed portrait as Dossier.
-- This SECURITY DEFINER RPC returns only active app-delivered coaching members for
-- auth.uid(); it must never broaden collective_people's publisher-only RLS.
-- Optional portrait_path is additive for older iOS clients.
create or replace function public.coach_preview_roster()
returns jsonb
language plpgsql
stable security definer
set search_path to 'public', 'auth', 'pg_temp'
as $function$
declare
  payload jsonb;
begin
  if auth.uid() is null then
    raise exception 'A signed-in account is required';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'athlete_id', a.id,
      'slug', a.slug,
      'display_name', a.display_name,
      'target_event', a.target_event,
      'portrait_path', coalesce(p.avatar_path, a.portrait_path),
      'has_active_block', exists (
        select 1 from public.training_blocks b
         where b.athlete_id=a.id and b.status='active'
      )
    )
    order by coalesce(a.attention_position, 32767), a.display_name
  ), '[]'::jsonb)
  into payload
  from public.athlete_memberships m
  join public.athletes a on a.id=m.athlete_id
  left join public.collective_people p on p.athlete_id=a.id
  where m.user_id=auth.uid()
    and m.role='coach'
    and m.status='active'
    and a.active
    and a.delivery='app'
    and not exists (select 1 from public.athlete_memberships own
                     where own.athlete_id=a.id and own.user_id=auth.uid()
                       and own.role='athlete' and own.status='active');

  return payload;
end;
$function$;
