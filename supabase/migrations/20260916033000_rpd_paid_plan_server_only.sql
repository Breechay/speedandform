-- Race Pace Durability is a paid plan after Week 4.
--
-- The complete published prescription stays callable by the service role so the
-- entitlement Edge Function can serve it after purchase verification. Public
-- visitors receive the same 15-week shell, but Weeks 5-15 contain no workout
-- prescription or weekly volume data.

revoke all on function public.public_plan(text) from public;
revoke execute on function public.public_plan(text) from anon, authenticated;
grant execute on function public.public_plan(text) to service_role;

create or replace function public.public_plan_preview(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
with full_plan as (
  select public.public_plan(p_slug) as payload
), redacted as (
  select jsonb_set(
    payload,
    '{weeks}',
    coalesce((
      select jsonb_agg(
        case
          when (week_item->>'week_number')::int <= 4 then week_item
          else jsonb_build_object(
            'week_number', (week_item->>'week_number')::int,
            'phase', null,
            'total_distance', null,
            'intent', null,
            'sessions', '[]'::jsonb
          )
        end
        order by (week_item->>'week_number')::int
      )
      from jsonb_array_elements(payload->'weeks') as week_item
    ), '[]'::jsonb),
    true
  ) as payload
  from full_plan
)
select payload from redacted;
$$;

revoke all on function public.public_plan_preview(text) from public;
grant execute on function public.public_plan_preview(text) to anon, authenticated, service_role;
