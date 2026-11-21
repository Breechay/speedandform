-- FORM tab · The Collective: remotely edited, versioned Methods.
-- No athlete data, no independent training prescription and no automatic notifications.

create table if not exists public.form_home_method_editions (
  id uuid primary key default gen_random_uuid(),
  method_key text not null check (method_key ~ '^[a-z][a-z0-9_]{2,39}$'),
  sort_order smallint not null check (sort_order between 1 and 100),
  title text not null check (char_length(title) between 3 and 80),
  statement text not null check (char_length(statement) between 20 and 240),
  spans jsonb not null check (jsonb_typeof(spans) = 'array'),
  font_size smallint not null default 14 check (font_size between 13 and 17),
  muted_gray smallint not null default 166 check (muted_gray between 155 and 200),
  bright_gray smallint not null default 240 check (bright_gray between 225 and 255),
  published_at timestamptz not null default now(),
  published_by uuid references auth.users(id) on delete set null
);
create index if not exists form_home_method_latest
  on public.form_home_method_editions (method_key, published_at desc, id desc);
alter table public.form_home_method_editions enable row level security;
revoke all on public.form_home_method_editions from public, anon, authenticated;
-- The table is never exposed directly. The reader function returns only one
-- currently published sentence, never the revision log or the publisher ID.

create table if not exists public.form_home_method_control (
  id smallint primary key default 1 check (id = 1),
  pinned_key text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.form_home_method_control enable row level security;
revoke all on public.form_home_method_control from public, anon, authenticated;
insert into public.form_home_method_control (id, pinned_key) values (1, null)
  on conflict (id) do nothing;

-- Initial Brice-approved collection. Each quote is one sentence with inline tone spans.
-- Revisions are appended, not overwritten. Existing current quote is first on the opening day.
with seeds(method_key, sort_order, title, lead, focus, tail) as (
  values
    ('practice', 1, 'The Practice',
      'You are not defined by one great workout, ', 'but by the work you return to, day after day.', ''),
    ('stack_hard', 2, 'Stacking Hard Sessions',
      'We sometimes put demanding running and lower-body strength on the same day ',
      'so the following day can genuinely be easy.', ''),
    ('oscillate', 3, 'Oscillating Training',
      'We alternate demanding and easier training ',
      'because the body needs both the work and the opportunity to adapt.', ''),
    ('speed_first', 4, 'Developing Speed First',
      'We develop speed early so we have ', 'more speed to draw from',
      ' as we build the endurance to sustain it.'),
    ('far_fast', 5, 'Running Far and Fast',
      'To run far and fast, we develop both ',
      'the pace you can reach and the pace you can hold.', ''),
    ('glutes', 6, 'Glute Development',
      'We train the glutes because ',
      'strong hips matter in running', ', helping produce and control force with every stride.'),
    ('threshold', 7, 'Threshold Development',
      'We keep threshold work controlled because ',
      'the goal is to sustain a demanding pace longer', ', not race every workout.'),
    ('easy', 8, 'Easy Running',
      'Easy runs have a purpose, ',
      'building aerobic fitness without taking away from the sessions that demand more.', ''),
    ('long_run', 9, 'Long-Run Development',
      'We build long runs progressively ',
      'so athletes can sustain effort for longer', ' without turning every Saturday into a test.'),
    ('volume', 10, 'Training Volume',
      'We don''t add mileage simply because an athlete has more time, ',
      'we add it when the training calls for it.', '')
)
insert into public.form_home_method_editions
  (method_key, sort_order, title, statement, spans)
select s.method_key, s.sort_order, s.title, s.lead || s.focus || s.tail,
  case when s.tail = '' then
    jsonb_build_array(
      jsonb_build_object('text', s.lead, 'tone', 'muted'),
      jsonb_build_object('text', s.focus, 'tone', 'bright'))
  else
    jsonb_build_array(
      jsonb_build_object('text', s.lead, 'tone', 'muted'),
      jsonb_build_object('text', s.focus, 'tone', 'bright'),
      jsonb_build_object('text', s.tail, 'tone', 'muted'))
  end
from seeds s
where not exists (select 1 from public.form_home_method_editions e where e.method_key = s.method_key);

-- One shared day in Miami, never a random message on each appearance.
-- A coach pin overrides selection; an explicitly published revision of the selected
-- Method takes effect without rebuilding the app.
create or replace function public.form_home_method_current()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare result jsonb;
begin
  -- The view is member-facing; no anonymous API access and no direct table grant.
  if (select auth.uid()) is null then return null; end if;
  with latest as (
    select distinct on (e.method_key) e.*
      from public.form_home_method_editions e
      where e.published_at <= now()
      order by e.method_key, e.published_at desc, e.id desc
  ), ordered as (
    select l.*, row_number() over (order by l.sort_order, l.method_key) as position,
      count(*) over () as total
      from latest l
  ), context as (
    select ((now() at time zone 'America/New_York')::date) as today,
      (select pinned_key from public.form_home_method_control where id = 1) as pin
  ), chosen as (
    select o.*, c.today, c.pin
      from ordered o cross join context c
      where o.method_key = c.pin or
        (c.pin is null and o.position = 1 + (((c.today - date '2026-11-03') % o.total + o.total) % o.total))
      order by case when o.method_key = c.pin then 0 else 1 end, o.position
      limit 1
  )
  select jsonb_build_object(
      'method_key', method_key, 'title', title, 'statement', statement,
      'spans', spans, 'font_size', font_size,
      'muted_gray', muted_gray, 'bright_gray', bright_gray,
      'edition_id', id, 'selected_on', today,
      'mode', case when pin is not null then 'pinned' else 'daily' end)
    into result from chosen;
  return result;
end;
$$;
revoke all on function public.form_home_method_current() from public, anon;
grant execute on function public.form_home_method_current() to authenticated;

-- Editor reads the entire published history for rollback and a concurrency token.
create or replace function public.coach_home_methods_editor()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null or
    not public.is_active_coaching_administrator((select auth.uid())) or
    not public.coaching_sync_enabled() then
    raise exception 'active coach required' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'schema_version', 1,
    'pinned_key', (select pinned_key from public.form_home_method_control where id = 1),
    'methods', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.sort_order, t.method_key)
      from (
        select distinct on (method_key) id, method_key, sort_order, title,
          statement, spans, font_size, muted_gray, bright_gray, published_at
          from public.form_home_method_editions
          where published_at <= now()
          order by method_key, published_at desc, id desc
      ) t), '[]'::jsonb),
    'history', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'method_key', method_key, 'statement', statement,
        'spans', spans, 'font_size', font_size, 'muted_gray', muted_gray,
        'bright_gray', bright_gray, 'published_at', published_at)
        order by published_at desc, id desc)
      from public.form_home_method_editions), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.coach_home_methods_editor() from public, anon;
grant execute on function public.coach_home_methods_editor() to authenticated;

create or replace function public.coach_home_method_publish(
  p_key text, p_expected_edition uuid, p_statement text,
  p_spans jsonb, p_font_size integer, p_muted_gray integer, p_bright_gray integer
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  old_row public.form_home_method_editions%rowtype;
  new_id uuid;
  joined text;
  good boolean;
  number_of_spans integer;
begin
  if (select auth.uid()) is null or
    not public.is_active_coaching_administrator((select auth.uid())) or
    not public.coaching_sync_enabled() then
    raise exception 'active coach required' using errcode = '42501';
  end if;
  -- Stable parent row, checked under lock. A stale tab cannot overwrite newer copy.
  perform pg_advisory_xact_lock(hashtext('form-home-method-' || coalesce(p_key, '')));
  select * into old_row from public.form_home_method_editions
    where method_key = p_key order by published_at desc, id desc limit 1;
  if not found or old_row.id is distinct from p_expected_edition then
    raise exception 'Method changed since preview; refresh before publishing' using errcode = '40001';
  end if;
  if p_statement is null or not public.coach_copy_clean(p_statement, 240) or
    right(btrim(p_statement), 1) <> '.' or
    p_font_size not between 13 and 17 or p_muted_gray not between 155 and 200 or
    p_bright_gray not between 225 and 255 or
    jsonb_typeof(p_spans) is distinct from 'array' or
    jsonb_array_length(p_spans) not between 1 and 24 then
    raise exception 'Invalid Method sentence or typography' using errcode = '22023';
  end if;
  select count(*), string_agg(item->>'text', '' order by ord),
    bool_and(jsonb_typeof(item) = 'object' and
      nullif(item->>'text', '') is not null and
      item->>'text' !~ E'[\\r\\n]' and
      item->>'tone' in ('muted', 'bright'))
  into number_of_spans, joined, good
  from jsonb_array_elements(p_spans) with ordinality as segments(item, ord);
  if number_of_spans = 0 or not coalesce(good, false) or
    joined is distinct from p_statement then
    raise exception 'Inline emphasis must reproduce the complete sentence' using errcode = '22023';
  end if;
  insert into public.form_home_method_editions
    (method_key, sort_order, title, statement, spans,
     font_size, muted_gray, bright_gray, published_by)
  values (old_row.method_key, old_row.sort_order, old_row.title,
    p_statement, p_spans, p_font_size, p_muted_gray, p_bright_gray,
    (select auth.uid())) returning id into new_id;
  return jsonb_build_object('edition_id', new_id, 'method_key', p_key, 'published', true);
end;
$$;
revoke all on function public.coach_home_method_publish(text,uuid,text,jsonb,integer,integer,integer) from public, anon;
grant execute on function public.coach_home_method_publish(text,uuid,text,jsonb,integer,integer,integer) to authenticated;

create or replace function public.coach_home_method_pin(p_key text default null)
returns jsonb language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null or
    not public.is_active_coaching_administrator((select auth.uid())) or
    not public.coaching_sync_enabled() then
    raise exception 'active coach required' using errcode = '42501';
  end if;
  if p_key is not null and not exists (
    select 1 from public.form_home_method_editions
    where method_key = p_key and published_at <= now()
  ) then
    raise exception 'Unknown published Method' using errcode = '22023';
  end if;
  update public.form_home_method_control
    set pinned_key = p_key, updated_by = (select auth.uid()), updated_at = now()
    where id = 1;
  return jsonb_build_object('pinned_key', p_key, 'mode',
    case when p_key is null then 'daily' else 'pinned' end);
end;
$$;
revoke all on function public.coach_home_method_pin(text) from public, anon;
grant execute on function public.coach_home_method_pin(text) to authenticated;
