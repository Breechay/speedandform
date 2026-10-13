-- People and photo tags (Collective v1).
--
-- A person is someone who can appear on a public profile and be tagged in a photograph. A coached
-- athlete links to their existing `athletes` row; anyone else can be a person without a training
-- account or a Dossier. Nothing here touches plans, logs or coach notes.
--
-- Rules the readers rely on:
--   * Public fields are chosen, one by one (public_fields). A field not chosen is never returned.
--   * The bio is a draft until its owner (or Brice) confirms it; a draft is never returned publicly.
--   * Hidden (visible = false) means hidden everywhere: directory, profile by slug, and name tags.
--   * A tag is a person–photo association. Removing it deletes the row; the photograph is untouched.
--   * A tag counts publicly only when confirmed. "That's me" files a request Brice confirms.
--   * A tag says who is in a photograph, never that someone attended a run or did a workout.
--   * Album photos count only while their album is live, public and the copy is not withdrawn.

create table public.collective_people (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 40),
  first_name text not null check (char_length(btrim(first_name)) between 1 and 40),
  last_initial text check (last_initial is null or last_initial ~ '^[A-Z]$'),
  show_last_initial boolean not null default false,
  athlete_id uuid unique references public.athletes(id),
  account_id uuid unique references auth.users(id),
  visible boolean not null default false,
  public_fields text[] not null default '{}'
    check (public_fields <@ array['bio','instagram','strava','discipline','now','best']::text[]),
  bio text check (bio is null or char_length(btrim(bio)) between 1 and 90),
  bio_confirmed boolean not null default false,
  instagram text check (instagram is null or instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  strava_url text check (strava_url is null or strava_url ~ '^https://(www\.)?strava\.com/athletes/[0-9]+/?$'),
  discipline text check (discipline is null or char_length(discipline) <= 40),
  now_title text check (now_title is null or char_length(now_title) <= 60),
  now_detail text check (now_detail is null or char_length(now_detail) <= 80),
  now_url text check (now_url is null or now_url ~ '^/[A-Za-z0-9/_.-]*$'),
  best_event text check (best_event is null or char_length(best_event) <= 30),
  best_time text check (best_time is null or best_time ~ '^[0-9]{1,2}(:[0-9]{2}){1,2}$'),
  best_place text check (best_place is null or char_length(best_place) <= 60),
  best_date date,
  avatar_path text check (avatar_path is null or avatar_path ~ '^/[A-Za-z0-9/_.-]+$'),
  hero_path text check (hero_path is null or hero_path ~ '^/[A-Za-z0-9/_.-]+$'),
  hero_focal_x numeric not null default 0.5 check (hero_focal_x between 0 and 1),
  hero_focal_y numeric not null default 0.5 check (hero_focal_y between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.collective_person_tags (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.collective_people(id) on delete cascade,
  asset_id uuid references public.collective_roll_assets(id) on delete cascade,
  library_id text check (library_id is null or library_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  x numeric check (x is null or x between 0 and 1),
  y numeric check (y is null or y between 0 and 1),
  status text not null default 'confirmed' check (status in ('confirmed', 'requested')),
  created_by uuid default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  check ((asset_id is null) <> (library_id is null))
);
create unique index collective_person_tags_asset on public.collective_person_tags (person_id, asset_id) where asset_id is not null;
create unique index collective_person_tags_library on public.collective_person_tags (person_id, library_id) where library_id is not null;
create index collective_person_tags_by_asset on public.collective_person_tags (asset_id);

alter table public.collective_people enable row level security;
alter table public.collective_person_tags enable row level security;

-- Brice (publishers) manage everything directly. Everyone else goes through the functions below.
create policy collective_people_publisher on public.collective_people for all
  using (public.collective_is_publisher()) with check (public.collective_is_publisher());
create policy collective_person_tags_publisher on public.collective_person_tags for all
  using (public.collective_is_publisher()) with check (public.collective_is_publisher());

create or replace function public.collective_people_touch() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin new.updated_at := now(); return new; end $$;
create trigger collective_people_touch before update on public.collective_people
  for each row execute function public.collective_people_touch();

-- Whose profile is this? The linked account, or the athlete account of the linked athlete.
create or replace function public.collective_person_owned(p public.collective_people) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select auth.uid() is not null and (
    p.account_id = auth.uid()
    or (p.athlete_id is not null and exists (
      select 1 from public.athlete_memberships m
       where m.athlete_id = p.athlete_id and m.user_id = auth.uid()
         and m.role = 'athlete' and m.status = 'active')));
$$;

create or replace function public.collective_person_name(p public.collective_people) returns text
language sql immutable as $$
  select case when p.show_last_initial and p.last_initial is not null
              then p.first_name || ' ' || p.last_initial || '.' else p.first_name end;
$$;

-- Only the fields the person chose. The bio only once confirmed.
create or replace function public.collective_person_public(p public.collective_people) returns jsonb
language sql stable as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'slug', p.slug,
    'name', public.collective_person_name(p),
    'avatar', p.avatar_path,
    'hero', case when p.hero_path is null then null
                 else jsonb_build_object('path', p.hero_path, 'focal_x', p.hero_focal_x, 'focal_y', p.hero_focal_y) end,
    'bio', case when 'bio' = any(p.public_fields) and p.bio_confirmed then p.bio end,
    'instagram', case when 'instagram' = any(p.public_fields) then p.instagram end,
    'strava', case when 'strava' = any(p.public_fields) then p.strava_url end,
    'discipline', case when 'discipline' = any(p.public_fields) then p.discipline end,
    'now', case when 'now' = any(p.public_fields) and p.now_title is not null
                then jsonb_strip_nulls(jsonb_build_object('title', p.now_title, 'detail', p.now_detail, 'url', p.now_url)) end,
    'best', case when 'best' = any(p.public_fields) and p.best_time is not null
                 then jsonb_strip_nulls(jsonb_build_object('event', p.best_event, 'time', p.best_time,
                        'place', p.best_place, 'date', p.best_date)) end));
$$;

-- An album photo counts publicly only while it is in a live, public album and not withdrawn.
create or replace function public.collective_asset_public_item(asset uuid)
returns table (run_id uuid, run_title text, starts_at timestamptz, series_id text, item jsonb)
language sql stable security definer set search_path = public, pg_temp as $$
  select r.id, r.title, r.starts_at, r.series_id, i
    from public.collective_roll_assets a
    join public.collective_album_state s on s.run_id = a.run_id and s.live_revision is not null and not s.taken_down
    join public.collective_album_revisions v on v.run_id = s.run_id and v.revision = s.live_revision
    join public.collective_runs_current r on r.id = a.run_id
    cross join lateral jsonb_array_elements(v.items) i
   where a.id = asset and (i->>'asset') = asset::text
     and r.author_kind = 'form' and r.visibility = 'public'
     and not public.collective_media_path_withdrawn(i->>'path');
$$;

-- Public: the directory. Visible people only; search happens on the page.
create or replace function public.collective_people_directory()
returns table (person jsonb)
language sql stable security definer set search_path = public, pg_temp as $$
  select public.collective_person_public(p) - 'hero' - 'now' - 'best' - 'strava'
    from public.collective_people p where p.visible
   order by lower(p.first_name), p.slug;
$$;

-- Public: one profile and its confirmed photographs. Null when hidden or unknown.
create or replace function public.collective_person(slug text)
returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select public.collective_person_public(p) || jsonb_build_object(
    'library', coalesce((select jsonb_agg(t.library_id order by t.created_at)
                           from public.collective_person_tags t
                          where t.person_id = p.id and t.status = 'confirmed' and t.library_id is not null), '[]'::jsonb),
    'album', coalesce((select jsonb_agg(jsonb_build_object(
                           'run_id', x.run_id, 'run_title', x.run_title, 'starts_at', x.starts_at,
                           'series_id', x.series_id, 'path', x.item->>'path', 'width', x.item->'width',
                           'height', x.item->'height', 'focal_x', x.item->'focal_x', 'focal_y', x.item->'focal_y')
                         order by x.starts_at desc)
                         from public.collective_person_tags t
                         cross join lateral public.collective_asset_public_item(t.asset_id) x
                        where t.person_id = p.id and t.status = 'confirmed' and t.asset_id is not null), '[]'::jsonb))
    from public.collective_people p
   where p.slug = collective_person.slug and p.visible;
$$;

-- Public: who is in each photo of a live album (confirmed tags of visible people only).
create or replace function public.collective_album_people(run uuid)
returns table (asset uuid, slug text, name text, avatar text, x numeric, y numeric)
language sql stable security definer set search_path = public, pg_temp as $$
  select t.asset_id, p.slug, public.collective_person_name(p), p.avatar_path, t.x, t.y
    from public.collective_person_tags t
    join public.collective_people p on p.id = t.person_id and p.visible
    join public.collective_roll_assets a on a.id = t.asset_id and a.run_id = run
   where t.status = 'confirmed'
     and exists (select 1 from public.collective_asset_public_item(t.asset_id))
   order by t.asset_id, lower(p.first_name);
$$;

-- Public: who is in each library photograph (the site's /media/library).
create or replace function public.collective_library_people()
returns table (library_id text, slug text, name text, avatar text)
language sql stable security definer set search_path = public, pg_temp as $$
  select t.library_id, p.slug, public.collective_person_name(p), p.avatar_path
    from public.collective_person_tags t
    join public.collective_people p on p.id = t.person_id and p.visible
   where t.status = 'confirmed' and t.library_id is not null
   order by t.library_id, lower(p.first_name);
$$;

-- Owner: my profile as I can edit it, with every tag (requested ones too).
create or replace function public.collective_my_person()
returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'id', p.id, 'slug', p.slug, 'first_name', p.first_name, 'last_initial', p.last_initial,
    'show_last_initial', p.show_last_initial, 'visible', p.visible, 'public_fields', to_jsonb(p.public_fields),
    'bio', p.bio, 'bio_confirmed', p.bio_confirmed, 'instagram', p.instagram, 'strava_url', p.strava_url,
    'discipline', p.discipline, 'now', jsonb_strip_nulls(jsonb_build_object('title', p.now_title, 'detail', p.now_detail, 'url', p.now_url)),
    'best', jsonb_strip_nulls(jsonb_build_object('event', p.best_event, 'time', p.best_time, 'place', p.best_place, 'date', p.best_date)),
    'avatar', p.avatar_path, 'preview', public.collective_person_public(p),
    'tags', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'asset_id', t.asset_id, 'library_id', t.library_id,
                        'status', t.status, 'created_at', t.created_at) order by t.created_at desc)
                        from public.collective_person_tags t where t.person_id = p.id), '[]'::jsonb))
    from public.collective_people p
   where public.collective_person_owned(p)
   limit 1;
$$;

-- Owner: change what is public. Only these fields; anything else is ignored.
create or replace function public.collective_update_my_person(changes jsonb)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare me public.collective_people;
begin
  select * into me from public.collective_people p where public.collective_person_owned(p) limit 1 for update;
  if not found then raise exception 'no_profile'; end if;
  update public.collective_people set
    visible = coalesce((changes->>'visible')::boolean, visible),
    show_last_initial = coalesce((changes->>'show_last_initial')::boolean, show_last_initial),
    public_fields = case when changes ? 'public_fields'
                         then array(select jsonb_array_elements_text(changes->'public_fields')) else public_fields end,
    bio = case when changes ? 'bio' then nullif(btrim(changes->>'bio'), '') else bio end,
    -- the owner wrote it, so it is theirs: confirmed
    bio_confirmed = case when changes ? 'bio' then nullif(btrim(changes->>'bio'), '') is not null else bio_confirmed end,
    instagram = case when changes ? 'instagram' then nullif(ltrim(btrim(changes->>'instagram'), '@'), '') else instagram end,
    strava_url = case when changes ? 'strava_url' then nullif(btrim(changes->>'strava_url'), '') else strava_url end
   where id = me.id;
  return public.collective_my_person();
end $$;

-- Owner: remove me from a photograph. The photograph stays.
create or replace function public.collective_remove_my_tag(tag uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  delete from public.collective_person_tags t
   using public.collective_people p
   where t.id = tag and p.id = t.person_id and public.collective_person_owned(p);
  if not found then raise exception 'not_your_tag'; end if;
end $$;

-- Owner: "That's me." Files a request; Brice confirms it.
create or replace function public.collective_request_tag(asset uuid default null, library text default null)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid; out_id uuid;
begin
  if (asset is null) = (library is null) then raise exception 'one_photo'; end if;
  select p.id into me from public.collective_people p where public.collective_person_owned(p) limit 1;
  if me is null then raise exception 'no_profile'; end if;
  if asset is not null and not exists (select 1 from public.collective_asset_public_item(asset)) then
    raise exception 'not_public';
  end if;
  insert into public.collective_person_tags (person_id, asset_id, library_id, status)
  values (me, asset, library, 'requested')
  on conflict do nothing returning id into out_id;
  return out_id;
end $$;

-- Brice: confirm a request.
create or replace function public.collective_confirm_tag(tag uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.collective_is_publisher() then raise exception 'not_publisher'; end if;
  update public.collective_person_tags set status = 'confirmed', confirmed_at = now() where id = tag;
end $$;

revoke all on function public.collective_person_owned(public.collective_people) from public, anon;
revoke all on function public.collective_asset_public_item(uuid) from public, anon, authenticated;
grant execute on function public.collective_people_directory() to anon, authenticated;
grant execute on function public.collective_person(text) to anon, authenticated;
grant execute on function public.collective_album_people(uuid) to anon, authenticated;
grant execute on function public.collective_library_people() to anon, authenticated;
revoke all on function public.collective_my_person() from public, anon;
revoke all on function public.collective_update_my_person(jsonb) from public, anon;
revoke all on function public.collective_remove_my_tag(uuid) from public, anon;
revoke all on function public.collective_request_tag(uuid, text) from public, anon;
revoke all on function public.collective_confirm_tag(uuid) from public, anon;
grant execute on function public.collective_my_person() to authenticated;
grant execute on function public.collective_update_my_person(jsonb) to authenticated;
grant execute on function public.collective_remove_my_tag(uuid) to authenticated;
grant execute on function public.collective_request_tag(uuid, text) to authenticated;
grant execute on function public.collective_confirm_tag(uuid) to authenticated;
grant select, insert, update, delete on public.collective_people, public.collective_person_tags to authenticated;

-- First group, as Brice named them on Oct 13, 2026 (consent held by Brice). Bios stay drafts
-- until each person confirms their own line. Strava stays empty until a link is given.
insert into public.collective_people
  (slug, first_name, last_initial, athlete_id, visible, public_fields, bio, bio_confirmed, instagram,
   discipline, now_title, now_detail, now_url, best_event, best_time, best_place, best_date,
   avatar_path, hero_path, hero_focal_x, hero_focal_y)
values
  ('jose', 'José', 'S', '10000000-0000-4000-8000-000000000004', true,
   array['bio','instagram','discipline','now','best'], 'Running Orlando with Hope.', false, 'josefsantosdesoto',
   'Half marathon', 'Speed That Endures', 'OUC Half · Orlando · December 5', '/labs/speed-that-endures/',
   'Half marathon', '1:40:23', 'Key Biscayne', '2026-04-12',
   '/assets/athletes/jose-remote-256.webp', '/media/library/jose-track-dusk-2400.webp', 0.56, 0.45),
  ('hope', 'Hope', 'F', '10000000-0000-4000-8000-000000000003', true,
   array['bio','instagram','discipline','now','best'], 'Half marathoner, training for Orlando.', false, 'hope_finnane',
   'Half marathon', 'Speed That Endures', 'OUC Half · Orlando · December 5', '/labs/speed-that-endures/',
   'Half marathon', '1:40:24', 'Key Biscayne', '2026-04-12',
   '/assets/athletes/hope-256.webp', '/media/library/hope-bridge-stride-2400.webp', 0.55, 0.45),
  ('adrian', 'Adrian', 'G', 'f540581f-bc11-4c0a-af32-7f2ed5e331d8', true,
   array['bio','instagram','discipline','now','best'], 'Getting stronger without giving up the run.', false, 'fit_with_adrian',
   'Marathon', 'The Developed Runner', 'More muscle, same runner · Study 001', '/labs/adrian-runner-mass/',
   'Marathon', '2:53:39', null, null,
   '/assets/athletes/adrian-256.webp', '/media/library/adrian-dune-path-2400.webp', 0.75, 0.3),
  ('tinius', 'Tinius', null, 'a1eb15b4-3e91-4b45-a11a-b2e8af9708af', true,
   array['instagram'], null, false, 'tiniusms',
   null, null, null, null, null, null, null, null,
   '/assets/athletes/tinius-256.webp', '/media/library/bw-lead-runner-2400.webp', 0.6, 0.35);

insert into public.collective_person_tags (person_id, library_id, status, confirmed_at, created_by)
select p.id, l.library_id, 'confirmed', now(), null
  from (values
    ('jose', 'jose-track-dusk'),
    ('hope', 'hope-bridge-stride'), ('hope', 'bridge-profile'), ('hope', 'canopy-street'),
    ('hope', 'crossing-ahead'), ('hope', 'keep-right-path'), ('hope', 'waterfront-palms-four'),
    ('adrian', 'adrian-dune-path'),
    ('tinius', 'bw-lead-runner')) as l(slug, library_id)
  join public.collective_people p on p.slug = l.slug;

-- Hardening after the advisors (applied as collective_people_hardening).
revoke all on function public.collective_person_owned(public.collective_people) from authenticated;
alter function public.collective_person_name(public.collective_people) set search_path = public, pg_temp;
alter function public.collective_person_public(public.collective_people) set search_path = public, pg_temp;
