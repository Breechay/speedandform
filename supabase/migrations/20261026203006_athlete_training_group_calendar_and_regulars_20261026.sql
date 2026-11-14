-- FORM coaching: recurring group context and invite candidates.
-- Already applied to production as Supabase migration 20261026203006.
-- Context is not a workout, RSVP, attendance record, or completion.
-- Keep this migration present in local stacks before enabling the iOS consumer.

create table public.athlete_training_groups (
 id text primary key,
 name text not null,
 calendar_label text not null,
 hosting text not null check (hosting in ('form','external')),
 created_at timestamptz not null default now()
);

create table public.athlete_training_group_regulars (
 athlete_id uuid not null references public.athletes(id) on delete cascade,
 group_id text not null references public.athlete_training_groups(id),
 weekday smallint not null check (weekday between 1 and 7),
 purpose text not null check (purpose in ('calendar','invite')),
 active boolean not null default true,
 context_note text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key (athlete_id,group_id,weekday,purpose)
);
create index athlete_training_group_regulars_shortlist_idx
 on public.athlete_training_group_regulars (group_id,weekday,purpose,active);

create table public.athlete_training_group_events (
 id uuid primary key default gen_random_uuid(),
 group_id text not null references public.athlete_training_groups(id),
 event_date date not null,
 title text not null,
 event_type text not null check (event_type in ('time_trial','group_run','track','easy_long','other')),
 meet_at timestamptz,
 place text,
 details text,
 status text not null default 'scheduled' check (status in ('scheduled','cancelled','completed')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(group_id,event_date,title)
);
create index athlete_training_group_events_date_idx
 on public.athlete_training_group_events (event_date,group_id);

alter table public.athlete_training_groups enable row level security;
alter table public.athlete_training_group_regulars enable row level security;
alter table public.athlete_training_group_events enable row level security;

create policy athlete_training_groups_authenticated_read on public.athlete_training_groups
 for select to authenticated using (true);

create policy athlete_training_group_regulars_relevant_read on public.athlete_training_group_regulars
 for select to authenticated
 using (
  public.is_coach_member(athlete_id)
  or (purpose='calendar' and public.can_read_athlete(athlete_id))
 );

create policy athlete_training_group_regulars_coach_insert on public.athlete_training_group_regulars
 for insert to authenticated with check (public.is_coach_member(athlete_id));

create policy athlete_training_group_regulars_coach_update on public.athlete_training_group_regulars
 for update to authenticated
 using (public.is_coach_member(athlete_id))
 with check (public.is_coach_member(athlete_id));

create policy athlete_training_group_regulars_coach_delete on public.athlete_training_group_regulars
 for delete to authenticated using (public.is_coach_member(athlete_id));

create policy athlete_training_group_events_relevant_read on public.athlete_training_group_events
 for select to authenticated
 using (
  exists (
   select 1 from public.athlete_training_group_regulars r
   where r.group_id=athlete_training_group_events.group_id and r.active
    and (
     public.is_coach_member(r.athlete_id)
     or (r.purpose='calendar' and public.can_read_athlete(r.athlete_id))
    )
  )
 );

revoke all on public.athlete_training_groups,
 public.athlete_training_group_regulars,
 public.athlete_training_group_events from anon;

grant select on public.athlete_training_groups to authenticated;
grant select,insert,update,delete on public.athlete_training_group_regulars to authenticated;
grant select on public.athlete_training_group_events to authenticated;

comment on table public.athlete_training_group_regulars
 is 'Coach-curated recurring calendar labels and invite shortlists. Membership is not attendance, RSVP, workout completion, or a prescribed session.';
comment on table public.athlete_training_group_events
 is 'External or FORM group calendar context. An event is separate from prescribed athlete sessions and from Collective RSVP/attendance.';
