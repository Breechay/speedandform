-- Attention has an order, and it is a coach's, not a computation's.
--
-- The bench sorted by delivery, then queue urgency, then race date. Those are
-- reasonable proxies and they are not the same thing as where Brice is actually
-- spending his attention. Marcus is the case that proves it: he has an active
-- block and a nearer race than Simon, so every proxy puts him high, and the
-- decision is that he sits last while his coaching is paused.
--
-- So the order becomes an authored fact. Nobody is hidden — last is a position,
-- not a disappearance.

alter table public.athletes
  add column if not exists attention_position smallint;

comment on column public.athletes.attention_position is
  'Where this athlete sits in the coach''s attention, authored rather than derived. Null sorts after everyone with a position. Last is a position, not a removal.';

update public.athletes set attention_position = v.pos
  from (values ('jose', 1), ('hope', 2), ('simon', 3), ('natalie', 4), ('marcus', 7)) as v(slug, pos)
 where athletes.slug = v.slug;

-- 5 and 6 are left free for Rod and Devin, who are not athletes here yet.

do $$
declare ordered text;
begin
  select string_agg(slug, ' → ' order by attention_position) into ordered
    from public.athletes where attention_position is not null;
  raise notice 'bench order: %', ordered;
end $$;
