-- Add evidence_surface_requirement to athlete_marks for Marcus's outdoor-only requirement
-- This is a property of what evidence counts for a mark, not a capability rung
-- Allowed values: 'any' (default) or 'outdoor' (for Marcus)

alter table public.athlete_marks
  add column evidence_surface_requirement text not null default 'any';

-- Add check constraint to ensure only valid values
alter table public.athlete_marks
  add constraint evidence_surface_requirement_check 
  check (evidence_surface_requirement in ('any', 'outdoor'));

-- Set Marcus's primary mark to 'outdoor'
-- Identify Marcus by his stable slug from the existing migration
do $$
declare marcus_id uuid;
begin
  select id into marcus_id from public.athletes where slug = 'marcus';
  
  update public.athlete_marks
    set evidence_surface_requirement = 'outdoor'
    where athlete_id = marcus_id
      and is_primary = true
      and active = true;
end $$;

-- Add comment explaining the field
comment on column public.athlete_marks.evidence_surface_requirement is 
'What evidence counts for this mark: "any" (default) or "outdoor" (Marcus only). 
The completion surface field records where a particular run happened; this field 
states what evidence counts for the mark claim.';
