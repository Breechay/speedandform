-- Purchase access delivery is private operational state. It is not marketing
-- consent. Entitlement writes commit independently before any email operation.
create table public.rpd_purchase_email_outbox (
  stripe_checkout_session_id text primary key references public.product_entitlements(stripe_checkout_session_id) on delete cascade,
  email_version text not null,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  state text not null default 'pending' check (state in ('pending','sending','sent','failed','manual_review','cancelled')),
  attempt_count integer not null default 0 check (attempt_count between 0 and 8),
  first_attempt_at timestamptz,
  next_attempt_at timestamptz not null default now(),
  lease_token uuid,
  lease_until timestamptz,
  provider_message_id text,
  last_error_code text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.rpd_purchase_email_outbox enable row level security;
revoke all on table public.rpd_purchase_email_outbox from public, anon, authenticated;
grant select, insert, update, delete on table public.rpd_purchase_email_outbox to service_role;
comment on table public.rpd_purchase_email_outbox is
  'Service-only purchase-access delivery. One frozen payload per Checkout Session; no consent or analytics projection. Sent means provider accepted, not delivered.';

-- Stripe does not guarantee webhook ordering. Remember a refund/dispute even
-- when it arrives before its checkout event and entitlement.
create table public.rpd_purchase_revocations (
  stripe_payment_intent_id text primary key,
  status text not null check (status in ('refunded','disputed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.rpd_purchase_revocations enable row level security;
revoke all on table public.rpd_purchase_revocations from public,anon,authenticated;
grant select,insert,update,delete on table public.rpd_purchase_revocations to service_role;

-- Use a row-locked upsert instead of read-then-write so a repeated paid event
-- cannot restore a purchase revoked by a concurrent refund/dispute.
create function public.rpd_record_paid_purchase(p_purchase jsonb)
returns text language plpgsql security invoker set search_path = public, pg_temp as $$
declare v_status text; v_revoked text; v_revoked_at timestamptz; v_payment_intent text := p_purchase->>'stripe_payment_intent_id';
begin
  if (p_purchase->>'product_slug') is distinct from 'race-pace-durability'
    or coalesce(p_purchase->>'stripe_checkout_session_id','') !~ '^cs_[A-Za-z0-9_]+$'
    or nullif(btrim(p_purchase->>'purchaser_email'),'') is null then
    raise exception 'Invalid paid purchase';
  end if;
  if v_payment_intent is not null then
    perform pg_advisory_xact_lock(hashtextextended(v_payment_intent,0));
    select status,updated_at into v_revoked,v_revoked_at from public.rpd_purchase_revocations where stripe_payment_intent_id = v_payment_intent;
  end if;
  insert into public.product_entitlements (product_slug,product_version,status,stripe_checkout_session_id,
    stripe_payment_intent_id,stripe_customer_id,purchaser_email,amount_total,currency,source,purchased_at,refunded_at)
  values ('race-pace-durability',coalesce(nullif(p_purchase->>'product_version',''),'rpd_v1'),coalesce(v_revoked,'paid'),p_purchase->>'stripe_checkout_session_id',
    p_purchase->>'stripe_payment_intent_id',p_purchase->>'stripe_customer_id',lower(btrim(p_purchase->>'purchaser_email')),
    (p_purchase->>'amount_total')::integer,lower(p_purchase->>'currency'),coalesce(p_purchase->'source','{}'::jsonb),(p_purchase->>'purchased_at')::timestamptz,
    case when v_revoked = 'refunded' then v_revoked_at else null end)
  on conflict (stripe_checkout_session_id) do update
    set stripe_checkout_session_id = excluded.stripe_checkout_session_id
  returning status into v_status;
  return v_status;
end $$;

create function public.rpd_enqueue_purchase_email(p_session_id text,p_email_version text,p_payload jsonb)
returns text language plpgsql security invoker set search_path = public, pg_temp as $$
declare v_status text; v_state text;
begin
  select status into v_status from public.product_entitlements
    where stripe_checkout_session_id = p_session_id and product_slug = 'race-pace-durability' for update;
  if v_status is distinct from 'paid' then return 'cancelled'; end if;
  if nullif(btrim(p_email_version),'') is null or jsonb_typeof(p_payload) <> 'object' then raise exception 'Invalid email payload'; end if;
  insert into public.rpd_purchase_email_outbox (stripe_checkout_session_id,email_version,payload)
    values (p_session_id,p_email_version,p_payload) on conflict (stripe_checkout_session_id) do nothing;
  select state into v_state from public.rpd_purchase_email_outbox where stripe_checkout_session_id = p_session_id;
  return v_state;
end $$;

create function public.rpd_claim_purchase_email(p_session_id text)
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare v_status text; v_job public.rpd_purchase_email_outbox%rowtype; v_token uuid;
begin
  -- All paths lock entitlement first, then outbox, to avoid lock inversion.
  select status into v_status from public.product_entitlements
    where stripe_checkout_session_id = p_session_id and product_slug = 'race-pace-durability' for update;
  select * into v_job from public.rpd_purchase_email_outbox where stripe_checkout_session_id = p_session_id for update;
  if not found then return jsonb_build_object('state','cancelled'); end if;
  if v_status is distinct from 'paid' then
    update public.rpd_purchase_email_outbox set state = 'cancelled',lease_token = null,lease_until = null,updated_at = now()
      where stripe_checkout_session_id = p_session_id and state <> 'sent';
    return jsonb_build_object('state','cancelled');
  end if;
  if v_job.state in ('sent','failed','manual_review','cancelled') then return jsonb_build_object('state',v_job.state); end if;
  -- Resend retains keys for 24 hours. Never replay an ambiguous send beyond
  -- a conservative 23-hour window, even if Stripe retries days later.
  if v_job.first_attempt_at is not null and v_job.first_attempt_at + interval '23 hours' <= now() then
    update public.rpd_purchase_email_outbox set state = 'manual_review',last_error_code = 'idempotency_window_expired',lease_token = null,lease_until = null,updated_at = now()
      where stripe_checkout_session_id = p_session_id;
    return jsonb_build_object('state','manual_review');
  end if;
  if v_job.attempt_count >= 8 then
    update public.rpd_purchase_email_outbox set state = 'manual_review',last_error_code = 'attempt_limit',lease_token = null,lease_until = null,updated_at = now()
      where stripe_checkout_session_id = p_session_id;
    return jsonb_build_object('state','manual_review');
  end if;
  if v_job.state = 'sending' and v_job.lease_until > now() then return jsonb_build_object('state','busy'); end if;
  if v_job.next_attempt_at > now() then return jsonb_build_object('state','pending'); end if;
  v_token := gen_random_uuid();
  update public.rpd_purchase_email_outbox set state = 'sending',attempt_count = attempt_count + 1,
    first_attempt_at = coalesce(first_attempt_at,now()),lease_token = v_token,lease_until = now() + interval '60 seconds',updated_at = now()
    where stripe_checkout_session_id = p_session_id;
  return jsonb_build_object('state','claimed','lease_token',v_token,'payload',v_job.payload,
    'idempotency_key','rpd-purchase-access/' || p_session_id);
end $$;

create function public.rpd_finish_purchase_email(p_session_id text,p_lease_token uuid,p_outcome text,p_provider_id text default null,p_error_code text default null)
returns text language plpgsql security invoker set search_path = public, pg_temp as $$
declare v_status text; v_job public.rpd_purchase_email_outbox%rowtype; v_state text;
begin
  if p_outcome not in ('sent','retry','failed') or (p_outcome = 'sent' and nullif(btrim(p_provider_id),'') is null) then raise exception 'Invalid email outcome'; end if;
  select status into v_status from public.product_entitlements where stripe_checkout_session_id = p_session_id for update;
  select * into v_job from public.rpd_purchase_email_outbox where stripe_checkout_session_id = p_session_id for update;
  if not found then raise exception 'Missing delivery'; end if;
  if v_job.state = 'sent' then return 'sent'; end if;
  if v_job.state = 'cancelled' or v_status is distinct from 'paid' then
    update public.rpd_purchase_email_outbox set state = 'cancelled',lease_token = null,lease_until = null,
      provider_message_id = coalesce(provider_message_id,p_provider_id),updated_at = now() where stripe_checkout_session_id = p_session_id;
    return 'cancelled';
  end if;
  if v_job.lease_token is distinct from p_lease_token or v_job.state <> 'sending' then return 'busy'; end if;
  v_state := case when p_outcome = 'sent' then 'sent' when p_outcome = 'failed' then 'failed'
    when v_job.attempt_count >= 8 then 'manual_review' else 'pending' end;
  update public.rpd_purchase_email_outbox set state = v_state,lease_token = null,lease_until = null,
    provider_message_id = case when p_outcome = 'sent' then p_provider_id else provider_message_id end,
    last_error_code = case when p_outcome = 'sent' then null else left(coalesce(p_error_code,'unknown'),80) end,
    sent_at = case when p_outcome = 'sent' then now() else sent_at end,
    next_attempt_at = now() + make_interval(secs => least(3600,30 * power(2,attempt_count - 1))::integer),updated_at = now()
    where stripe_checkout_session_id = p_session_id;
  return v_state;
end $$;

create function public.rpd_revoke_paid_purchase(p_payment_intent_id text,p_status text)
returns void language plpgsql security invoker set search_path = public, pg_temp as $$
begin
  if p_status not in ('refunded','disputed') then raise exception 'Invalid revocation'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_payment_intent_id,0));
  insert into public.rpd_purchase_revocations (stripe_payment_intent_id,status) values (p_payment_intent_id,p_status)
    on conflict (stripe_payment_intent_id) do update set status = excluded.status,updated_at = now();
  update public.product_entitlements set status = p_status,
    refunded_at = case when p_status = 'refunded' then coalesce(refunded_at,now()) else refunded_at end
    where stripe_payment_intent_id = p_payment_intent_id;
  update public.rpd_purchase_email_outbox o set state = 'cancelled',lease_token = null,lease_until = null,updated_at = now()
    from public.product_entitlements e where e.stripe_checkout_session_id = o.stripe_checkout_session_id
      and e.stripe_payment_intent_id = p_payment_intent_id and o.state <> 'sent';
end $$;

revoke all on function public.rpd_record_paid_purchase(jsonb) from public,anon,authenticated;
revoke all on function public.rpd_enqueue_purchase_email(text,text,jsonb) from public,anon,authenticated;
revoke all on function public.rpd_claim_purchase_email(text) from public,anon,authenticated;
revoke all on function public.rpd_finish_purchase_email(text,uuid,text,text,text) from public,anon,authenticated;
revoke all on function public.rpd_revoke_paid_purchase(text,text) from public,anon,authenticated;
grant execute on function public.rpd_record_paid_purchase(jsonb) to service_role;
grant execute on function public.rpd_enqueue_purchase_email(text,text,jsonb) to service_role;
grant execute on function public.rpd_claim_purchase_email(text) to service_role;
grant execute on function public.rpd_finish_purchase_email(text,uuid,text,text,text) to service_role;
grant execute on function public.rpd_revoke_paid_purchase(text,text) to service_role;
