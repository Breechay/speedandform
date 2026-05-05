-- ============================================================
-- FORM FIELD STREAM TABLES (POSTS / REPLIES / REACTIONS)
-- Run after supabase-field-visibility.sql
-- ============================================================

create table if not exists field_posts (
  id            uuid primary key default gen_random_uuid(),
  athlete_id    uuid not null references auth.users(id) on delete cascade,
  content       text,
  image_url     text,
  source        text not null default 'app' check (source in ('app', 'web')),
  posted_at     timestamptz not null default now(),
  deleted_at    timestamptz,
  created_at    timestamptz not null default now()
);

create table if not exists field_replies (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid not null references field_posts(id) on delete cascade,
  athlete_id    uuid not null references auth.users(id) on delete cascade,
  content       text not null,
  source        text not null default 'app' check (source in ('app', 'web')),
  posted_at     timestamptz not null default now(),
  deleted_at    timestamptz,
  created_at    timestamptz not null default now()
);

create table if not exists field_reactions (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid not null references field_posts(id) on delete cascade,
  athlete_id    uuid not null references auth.users(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('heart', 'fire')),
  created_at    timestamptz not null default now(),
  unique(post_id, athlete_id, reaction_type)
);

alter table field_posts enable row level security;
alter table field_replies enable row level security;
alter table field_reactions enable row level security;

-- Public stream visibility: only when profile is public + stream visibility is public
drop policy if exists "Public field posts read" on field_posts;
create policy "Public field posts read"
  on field_posts for select
  using (
    deleted_at is null
    and exists (
      select 1
      from athlete_profiles ap
      where ap.id = field_posts.athlete_id
        and ap.is_public = true
        and ap.field_stream_visibility = 'public'
    )
  );

drop policy if exists "Athlete writes own field posts" on field_posts;
create policy "Athlete writes own field posts"
  on field_posts for insert
  with check (auth.uid() = athlete_id);

drop policy if exists "Athlete deletes own field posts" on field_posts;
create policy "Athlete deletes own field posts"
  on field_posts for update
  using (auth.uid() = athlete_id)
  with check (auth.uid() = athlete_id);

drop policy if exists "Public field replies read" on field_replies;
create policy "Public field replies read"
  on field_replies for select
  using (
    deleted_at is null
    and exists (
      select 1
      from field_posts fp
      join athlete_profiles ap on ap.id = fp.athlete_id
      where fp.id = field_replies.post_id
        and fp.deleted_at is null
        and ap.is_public = true
        and ap.field_stream_visibility = 'public'
    )
  );

drop policy if exists "Athlete writes own field replies" on field_replies;
create policy "Athlete writes own field replies"
  on field_replies for insert
  with check (auth.uid() = athlete_id);

drop policy if exists "Athlete updates own field replies" on field_replies;
create policy "Athlete updates own field replies"
  on field_replies for update
  using (auth.uid() = athlete_id)
  with check (auth.uid() = athlete_id);

drop policy if exists "Public field reactions read" on field_reactions;
create policy "Public field reactions read"
  on field_reactions for select
  using (
    exists (
      select 1
      from field_posts fp
      join athlete_profiles ap on ap.id = fp.athlete_id
      where fp.id = field_reactions.post_id
        and fp.deleted_at is null
        and ap.is_public = true
        and ap.field_stream_visibility = 'public'
    )
  );

drop policy if exists "Athlete writes own field reactions" on field_reactions;
create policy "Athlete writes own field reactions"
  on field_reactions for insert
  with check (auth.uid() = athlete_id);

drop policy if exists "Athlete deletes own field reactions" on field_reactions;
create policy "Athlete deletes own field reactions"
  on field_reactions for delete
  using (auth.uid() = athlete_id);

create index if not exists field_posts_posted_at_idx on field_posts(posted_at desc);
create index if not exists field_posts_athlete_id_idx on field_posts(athlete_id);
create index if not exists field_replies_post_id_idx on field_replies(post_id, posted_at);
create index if not exists field_reactions_post_id_idx on field_reactions(post_id);
