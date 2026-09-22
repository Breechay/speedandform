create table if not exists public.coaching_magic_link_rate_limit (
  email_hash text primary key check (char_length(email_hash) = 64),
  last_sent_at timestamptz not null default now(),
  sent_count integer not null default 1 check (sent_count > 0)
);

alter table public.coaching_magic_link_rate_limit enable row level security;
revoke all on table public.coaching_magic_link_rate_limit from anon, authenticated;

create or replace function public.coaching_magic_link_admit(
  p_email text,
  p_email_hash text
)
returns text
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_allowed boolean := false;
  v_rows integer := 0;
begin
  if char_length(v_email) < 3
     or position('@' in v_email) <= 1
     or char_length(coalesce(p_email_hash, '')) <> 64 then
    return 'invalid';
  end if;

  select exists (
    select 1
      from public.access_invites ai
      join public.athletes a on a.id = ai.athlete_id
     where lower(ai.email) = v_email
       and a.active = true
       and (ai.expires_at is null or ai.expires_at > now())
  )
  into v_allowed;

  if not v_allowed then
    select exists (
      select 1
        from auth.users u
        join public.athlete_memberships am on am.user_id = u.id
        join public.athletes a on a.id = am.athlete_id
       where lower(u.email) = v_email
         and am.status = 'active'
         and a.active = true
    )
    into v_allowed;
  end if;

  if not v_allowed then
    return 'not_found';
  end if;

  insert into public.coaching_magic_link_rate_limit(email_hash, last_sent_at, sent_count)
  values (p_email_hash, now(), 1)
  on conflict (email_hash) do update
     set last_sent_at = excluded.last_sent_at,
         sent_count = public.coaching_magic_link_rate_limit.sent_count + 1
   where public.coaching_magic_link_rate_limit.last_sent_at < now() - interval '60 seconds';

  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return 'rate_limited';
  end if;

  return 'ok';
end;
$$;

revoke all on function public.coaching_magic_link_admit(text, text) from public, anon, authenticated;
grant execute on function public.coaching_magic_link_admit(text, text) to service_role;
