-- Coach Mirror reads the selected athlete's Halo exactly as the athlete sees it,
-- but never creates an athlete read receipt. Authorization is the canonical
-- active coach membership for that exact athlete; no roster-wide or caller-
-- supplied identity bypass is accepted.
create or replace function public.form_ghost_inbox_for_athlete(p_athlete uuid)
returns jsonb language plpgsql stable security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_rec record;
  v_items jsonb := '[]'::jsonb;
  v_body text;
  v_next_title text;
  v_recovery_seconds integer;
  v_recovery_kind text;
  v_next_line text;
  v_filed text;
  v_link_exists boolean;
begin
  if v_user is null then raise exception 'authentication_required'; end if;
  if p_athlete is null or not exists (
    select 1 from public.athlete_memberships m
    where m.athlete_id=p_athlete and m.user_id=v_user
      and m.role='coach' and m.status='active'
  ) then
    raise exception 'athlete_access_denied';
  end if;

  for v_rec in
    select msg.*, r.athlete_id, r.first_opened_at
    from public.form_ghost_messages msg
    join public.form_ghost_recipients r on r.message_id=msg.id
    where r.athlete_id=p_athlete
      and msg.available_at<=now() and msg.archived_at is null
      and (r.first_opened_at is null
           or r.first_opened_at>now()-interval '7 days')
    order by msg.available_at desc, msg.id desc limit 50
  loop
    v_body := v_rec.body;
    if v_rec.template_kind='thursday_postrun' then
      v_filed:=null; v_link_exists:=false;
      select exists (
        select 1 from public.form_miami_session_links l
        where l.lane='thursday' and l.on_date=v_rec.event_on
          and l.athlete_id=v_rec.athlete_id and not l.paused
      ) into v_link_exists;
      select sc.status into v_filed
        from public.form_miami_session_links l
        join public.session_completions sc
          on sc.planned_session_id=l.planned_session_id
         and sc.athlete_id=l.athlete_id
        where l.lane='thursday' and l.on_date=v_rec.event_on
          and l.athlete_id=v_rec.athlete_id and not l.paused
        order by sc.filed_at desc limit 1;

      v_next_title:=null; v_recovery_seconds:=null; v_recovery_kind:=null;
      select p.payload->>'title',
        (select nullif(w->>'recoverySeconds','')::integer
         from jsonb_array_elements(coalesce(p.payload->'components','[]'::jsonb)) w
         where w->>'role'='work' and w ? 'recoverySeconds' limit 1),
        (select w->>'recoveryKind'
         from jsonb_array_elements(coalesce(p.payload->'components','[]'::jsonb)) w
         where w->>'role'='work' and w ? 'recoveryKind' limit 1)
       into v_next_title,v_recovery_seconds,v_recovery_kind
       from public.form_miami_publications p
       where p.lane='thursday' and p.on_date=v_rec.action_date
       order by p.revision desc limit 1;

      if v_next_title is not null then
        v_next_line := 'Next Thursday (' || to_char(v_rec.action_date,'Mon FMDD') || '): '
          || v_next_title;
        if v_recovery_seconds is not null and v_recovery_kind='jog' then
          v_next_line := v_next_line || ' with a '
            || (v_recovery_seconds / 60)::text || ':'
            || lpad((v_recovery_seconds % 60)::text,2,'0') || ' jog';
        end if;
        v_next_line := v_next_line || '. See you on the track.';
      else
        v_next_line := 'The next Thursday session will appear in Week once it is published.';
      end if;

      if v_filed='completed' then
        v_body := 'Your Thursday session is filed. Strong, composed work. ' || v_next_line;
      elsif v_filed='partial' then
        v_body := 'Your Thursday session is saved. Finish filing when you are ready. ' || v_next_line;
      elsif v_link_exists then
        v_body := 'If you ran with us, file your Thursday session when you have a moment. ' || v_next_line;
      else
        v_body := 'Thursday with FORM. ' || v_next_line;
      end if;
    end if;

    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'id',v_rec.id,'title',v_rec.title,'body',v_body,
      'action_kind',v_rec.action_kind,'action_date',v_rec.action_date,
      'event_on',v_rec.event_on,'available_at',v_rec.available_at,
      'first_opened_at',v_rec.first_opened_at,
      'unread',(v_rec.first_opened_at is null),
      'hide_after',case when v_rec.first_opened_at is null
        then null else v_rec.first_opened_at+interval '7 days' end
    ));
  end loop;
  return v_items;
end;
$function$;

revoke all on function public.form_ghost_inbox_for_athlete(uuid)
  from public, anon, authenticated;
grant execute on function public.form_ghost_inbox_for_athlete(uuid)
  to authenticated;

comment on function public.form_ghost_inbox_for_athlete(uuid) is
  'Read-only Coach Mirror Halo projection for one actively assigned athlete. Does not mark messages opened.';
