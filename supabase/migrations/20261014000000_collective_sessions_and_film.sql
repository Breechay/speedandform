-- Sessions and film (Collective v1.1).
--
-- A session is one athlete's own workout that Brice filmed or photographed: Adrian's 7 × 800 on
-- Oct 14, say. It is not a group run, so it carries no "I'm in" and implies no attendance. It
-- belongs to the people linked to it.
--
-- Rules the readers rely on:
--   * A session is public only when Brice publishes it AND every linked person's profile is
--     visible. Hiding a profile hides its sessions everywhere: list, session page, profile.
--   * Film is a YouTube video id (the full film) plus optional short clips, each also a YouTube
--     id. Nothing is uploaded here; the video lives on YouTube.
--   * Photos for a session are library photos (by id) or, when it has one, the album of a
--     linked group run. Names on those photos still come only from confirmed tags.
-- Also: an owner's own tag list skips photos in Recently Deleted (the tag comes back with a
-- restore and goes with a permanent delete).

create table public.collective_sessions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  title text not null check (char_length(btrim(title)) between 1 and 80),
  detail text check (detail is null or char_length(detail) <= 120),
  happened_on date not null,
  place text check (place is null or char_length(place) <= 60),
  youtube_id text check (youtube_id is null or youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  clips jsonb not null default '[]'::jsonb check (jsonb_typeof(clips) = 'array'),
  poster_library_id text check (poster_library_id is null or poster_library_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  library_ids text[] not null default '{}',
  run_id uuid references public.collective_runs(id),
  published boolean not null default false,
  created_by uuid default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- clips: [{"youtube_id": "...", "title": "Rep 4"}]
alter table public.collective_sessions add constraint collective_sessions_clips_shape check (
  not jsonb_path_exists(clips, '$[*] ? (!exists(@.youtube_id) || !(@.youtube_id like_regex "^[A-Za-z0-9_-]{11}$"))')
);

create table public.collective_session_people (
  session_id uuid not null references public.collective_sessions(id) on delete cascade,
  person_id uuid not null references public.collective_people(id) on delete cascade,
  primary key (session_id, person_id)
);

alter table public.collective_sessions enable row level security;
alter table public.collective_session_people enable row level security;
create policy collective_sessions_publisher on public.collective_sessions for all
  using (public.collective_is_publisher()) with check (public.collective_is_publisher());
create policy collective_session_people_publisher on public.collective_session_people for all
  using (public.collective_is_publisher()) with check (public.collective_is_publisher());
grant select, insert, update, delete on public.collective_sessions, public.collective_session_people to authenticated;

create trigger collective_sessions_touch before update on public.collective_sessions
  for each row execute function public.collective_people_touch();

-- Public when published and everyone in it is visible (and it has at least one person).
create or replace function public.collective_session_is_public(s public.collective_sessions) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select s.published
     and exists (select 1 from public.collective_session_people sp where sp.session_id = s.id)
     and not exists (select 1 from public.collective_session_people sp
                       join public.collective_people p on p.id = sp.person_id
                      where sp.session_id = s.id and not p.visible);
$$;

create or replace function public.collective_session_public(s public.collective_sessions) returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'slug', s.slug, 'title', s.title, 'detail', s.detail, 'date', s.happened_on, 'place', s.place,
    'youtube_id', s.youtube_id, 'clips', s.clips, 'poster', s.poster_library_id,
    'library', to_jsonb(s.library_ids),
    'run', (select jsonb_build_object('id', r.id, 'title', r.title, 'starts_at', r.starts_at, 'series_id', r.series_id)
              from public.collective_runs_current r where r.id = s.run_id and r.author_kind = 'form' and r.visibility = 'public'),
    'people', (select jsonb_agg(jsonb_build_object('slug', p.slug, 'name', public.collective_person_name(p), 'avatar', p.avatar_path)
                                order by lower(p.first_name))
                 from public.collective_session_people sp join public.collective_people p on p.id = sp.person_id
                where sp.session_id = s.id)));
$$;

-- Public: one session page. Null when unpublished, unknown, or anyone in it is hidden.
create or replace function public.collective_session(slug text)
returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select public.collective_session_public(s) from public.collective_sessions s
   where s.slug = collective_session.slug and public.collective_session_is_public(s);
$$;

-- Public: the profile now carries its sessions (newest first).
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
                        where t.person_id = p.id and t.status = 'confirmed' and t.asset_id is not null), '[]'::jsonb),
    'sessions', coalesce((select jsonb_agg(public.collective_session_public(s) order by s.happened_on desc)
                            from public.collective_session_people sp join public.collective_sessions s on s.id = sp.session_id
                           where sp.person_id = p.id and public.collective_session_is_public(s)), '[]'::jsonb))
    from public.collective_people p
   where p.slug = collective_person.slug and p.visible;
$$;

-- Owner: tags list skips photos in Recently Deleted.
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
                        from public.collective_person_tags t
                        left join public.collective_roll_assets a on a.id = t.asset_id
                       where t.person_id = p.id and (t.asset_id is null or a.deleted_at is null)), '[]'::jsonb))
    from public.collective_people p
   where public.collective_person_owned(p)
   limit 1;
$$;

revoke all on function public.collective_session_is_public(public.collective_sessions) from public, anon, authenticated;
revoke all on function public.collective_session_public(public.collective_sessions) from public, anon, authenticated;
grant execute on function public.collective_session(text) to anon, authenticated;

-- Adrian's 7 × 800 (Oct 14, 2026): created unpublished, film to come. Brice adds the YouTube id
-- and publishes from the Runs room.
insert into public.collective_sessions (slug, title, detail, happened_on, place, published)
values ('adrian-7x800-2026-10-14', '7 × 800 at 2:44', '5:30 a mile · 2:00 jog between', '2026-10-14', null, false);
insert into public.collective_session_people (session_id, person_id)
select s.id, p.id from public.collective_sessions s, public.collective_people p
 where s.slug = 'adrian-7x800-2026-10-14' and p.slug = 'adrian';
