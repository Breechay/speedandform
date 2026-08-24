-- FORM private athlete system · Slice 1 authored content
-- These rows contain the binding Natalie mock content and honest decision-queue
-- placeholders for the three FORM athletes. No authentication membership is seeded.

insert into public.athletes (
  id, slug, display_name, first_name, home_surface, target_event,
  goal_label, program_name, account_label
) values
  ('10000000-0000-4000-8000-000000000001', 'natalie', 'Natalie Ajamil', 'Natalie', 'website', 'Miami Half', 'Finish', 'Run Development', 'Run Development · 8 weeks · Week 1 · Paid'),
  ('10000000-0000-4000-8000-000000000002', 'marcus', 'Marcus', 'Marcus', 'form', 'Half marathon', 'Sub-1:30', 'FORM', 'Founding Member'),
  ('10000000-0000-4000-8000-000000000003', 'hope', 'Hope', 'Hope', 'form', 'Half marathon', 'Sub-1:30', 'FORM', 'Founding Member'),
  ('10000000-0000-4000-8000-000000000004', 'jose', 'Jose', 'Jose', 'form', 'Half marathon', 'Sub-1:30', 'FORM', 'Founding Member');

insert into public.training_blocks (
  id, athlete_id, source, name, block_number, target_event, goal_label,
  current_week, total_weeks, starts_on, ends_on, status
) values (
  '11000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'coach_authored', 'Run Development', 1, 'Miami Half', 'Finish',
  1, 8, '2026-08-23', '2026-10-17', 'active'
);

insert into public.training_weeks (
  id, athlete_id, block_id, week_number, starts_on, ends_on,
  intent, matters_because, state
) values (
  '12000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '11000000-0000-4000-8000-000000000001',
  1, '2026-08-23', '2026-08-29',
  'Keep easy genuinely easy. Let Sunday answer the distance question.',
  'More time on your feet without changing how you move.',
  'in_progress'
);

insert into public.planned_sessions (
  id, athlete_id, week_id, scheduled_on, day_label, position, state
) values
  ('13000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '12000000-0000-4000-8000-000000000001', '2026-08-23', 'SUN', 1, 'completed'),
  ('13000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '12000000-0000-4000-8000-000000000001', '2026-08-25', 'TUE', 2, 'published'),
  ('13000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '12000000-0000-4000-8000-000000000001', '2026-08-27', 'THU', 3, 'published');

insert into public.planned_session_versions (
  id, athlete_id, planned_session_id, version_number, title,
  prescribed_distance, distance_unit, intent, details
) values
  ('14000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '13000000-0000-4000-8000-000000000001', 1, 'Track with Brice', 3, 'mi', 'Let the arms move. The shoe can kiss the floor; the heel stays off.', 'Easy running together. No pace target.'),
  ('14000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '13000000-0000-4000-8000-000000000002', 1, 'Easy', 4, 'mi', 'Longer on your feet without changing the effort. Walk when you want to.', 'Easy means conversational throughout.'),
  ('14000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '13000000-0000-4000-8000-000000000003', 1, 'Support + stairs', 3, 'mi', 'Build the single-leg control the running is already asking for.', 'Run easy. Stairs up only for 10–15 minutes; ride down.');

insert into public.athlete_baselines (
  id, athlete_id, running_history, longest_run, current_frequency,
  constraints, strength_schedule, source
) values (
  '15000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'Running for three weeks before the block.', 3, 3,
  'Left knee noticeable on stairs.',
  'Lifting twice a week with her strength coach.',
  'coach_import'
);

insert into public.session_completions (
  id, athlete_id, planned_session_id, status, actual_distance, distance_unit,
  duration_seconds, felt, knee_during, knee_after, recovered_next_day,
  athlete_note, source, filed_at
) values (
  '16000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '13000000-0000-4000-8000-000000000001',
  'completed', 3, 'mi', 2340,
  'Easy and controlled', 'Quiet while running', 'Noticeable on stairs later', null,
  'Felt composed. Checking how the knee settles the next morning.',
  'coach_import', '2026-08-23 09:30:00-04'
);

insert into public.directions (
  id, athlete_id, planned_session_id, protected_variable, movable_variable,
  stop_or_change_if, priority_targets, execution_context, athlete_text,
  delivery_state, published_at
) values (
  '18000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '13000000-0000-4000-8000-000000000002',
  'Easy effort and a quiet knee',
  'Distance and walk breaks',
  'The knee changes your movement or continues to build',
  '["Easy stays conversational","Let the arms move","Heel stays light"]'::jsonb,
  '{"surface":"outdoor","with_coach":false,"heat_allowance":"Walk whenever the heat changes the effort"}'::jsonb,
  'Protect the easy effort and quiet knee. Distance can move; movement cannot.',
  'published', '2026-08-24 10:00:00-04'
);

insert into public.reads (
  id, athlete_id, athlete_text, question_answered, delivery_state, published_at
) values (
  '17000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'Three miles stayed composed. Your movement did not ask us to rebuild anything. The next-day knee response still decides progression.',
  'Could three continuous miles stay easy without changing her movement?',
  'published', '2026-08-23 12:00:00-04'
);

insert into public.read_completions (read_id, completion_id) values
  ('17000000-0000-4000-8000-000000000001', '16000000-0000-4000-8000-000000000001');

insert into public.decisions (
  id, athlete_id, decision_type, athlete_text, rationale, effective_on,
  delivery_state, published_at
) values (
  '19000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'establish_distance',
  'AUG 23 · THREE MILES ESTABLISHED — The distance stayed easy and your movement stayed composed.',
  'Three continuous miles answered the first question without creating a movement tradeoff.',
  '2026-08-23', 'published', '2026-08-23 12:05:00-04'
);

insert into public.decision_completions (decision_id, completion_id) values
  ('19000000-0000-4000-8000-000000000001', '16000000-0000-4000-8000-000000000001');

insert into public.athlete_marks (
  id, athlete_id, block_id, mark_type, label, current_value, target_value,
  unit, current_question, is_primary
) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000001', 'longest_continuous_distance', 'Longest continuous distance', 3, 13.1, 'mi', 'Can five miles settle normally enough to progress without changing her movement?', true),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', null, 'outdoor_goal_pace_miles', 'Goal-pace miles closed outdoors', null, null, 'mi', 'Is the 6:15 treadmill ability available when Miami changes the cost?', true),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', null, 'race_pace_miles', 'Race-pace miles established near 6:30', null, null, 'mi', 'Is the working pace controlled before the float is tightened?', true),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004', null, 'even_repetitions', 'Even repetitions held at target volume', null, null, null, 'Does quality survive the added load?', true);

insert into public.mark_checkpoints (id, athlete_id, mark_id, value, label, position, state) values
  ('21000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 3, '3', 1, 'current'),
  ('21000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 5, '5', 2, 'proposed'),
  ('21000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 6, '6', 3, 'proposed'),
  ('21000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 7.5, '7.5', 4, 'proposed'),
  ('21000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 9, '9', 5, 'proposed'),
  ('21000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 10.5, '10.5', 6, 'proposed'),
  ('21000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 13.1, '13.1', 7, 'proposed');

insert into public.mark_gate_conditions (id, athlete_id, mark_id, condition_text, state, position) values
  ('22000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'The knee stays quiet during and after.', 'unknown', 1),
  ('22000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'You move normally by the next day.', 'unknown', 2),
  ('22000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Single-leg control holds at the end of the run.', 'unknown', 3),
  ('22000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Easy still feels genuinely easy.', 'unknown', 4);

insert into public.movement_reads (id, athlete_id, read_id, marker, state, cue, position) values
  ('23000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '17000000-0000-4000-8000-000000000001', 'running_economy', 'present', 'Do not interfere with what already works.', 1),
  ('23000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '17000000-0000-4000-8000-000000000001', 'heel_light', 'available', 'The shoe can kiss the floor; the heel stays off.', 2),
  ('23000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '17000000-0000-4000-8000-000000000001', 'wrist_to_hip', 'available', 'Let the arms move.', 3),
  ('23000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', '17000000-0000-4000-8000-000000000001', 'chest_proud', 'fades', 'Shoulders back without lifting the ribs.', 4),
  ('23000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', '17000000-0000-4000-8000-000000000001', 'single_leg_control', 'developing', 'Own the knee over the foot.', 5);

insert into public.support_prescriptions (
  id, athlete_id, title, summary, shared_with_strength_coach
) values (
  '24000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'The work underneath',
  'A prescription for the strength coach to implement—not a second program.',
  true
);

insert into public.support_items (
  id, athlete_id, prescription_id, purpose, movement, reason, cue, dose,
  group_position, item_position
) values
  ('25000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '24000000-0000-4000-8000-000000000001', 'Own the single leg', 'Bulgarian split squat', 'Build control through the knee and hip.', 'Knee tracks over the foot the whole way down.', '3 × 8 each', 1, 1),
  ('25000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '24000000-0000-4000-8000-000000000001', 'Own the single leg', 'Single-leg RDL', 'Own the hip without borrowing rotation.', 'Hips square. Stop where control stops.', '3 × 8 each', 1, 2),
  ('25000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '24000000-0000-4000-8000-000000000001', 'Own the single leg', 'Reverse lunge', 'Keep the return quiet and controlled.', 'Step back quietly.', '3 × 8 each', 1, 3),
  ('25000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', '24000000-0000-4000-8000-000000000001', 'Own the single leg', 'Lateral step-down', 'Control the descent that running repeats.', 'Slow down. This one is about the descent.', '3 × 8 each', 1, 4),
  ('25000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', '24000000-0000-4000-8000-000000000001', 'Build the lower leg', 'Calf raise · bent knee', 'Build the lower leg as mileage grows.', 'Lower slower than you lift.', '3 × 12', 2, 1),
  ('25000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', '24000000-0000-4000-8000-000000000001', 'Build the lower leg', 'Calf raise · straight leg', 'Keep full range available.', 'Full height every rep.', '3 × 12', 2, 2),
  ('25000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000001', '24000000-0000-4000-8000-000000000001', 'Build the lower leg', 'Tibialis raise', 'Support the shin as mileage climbs.', 'Lift cleanly without rocking back.', '3 × 15', 2, 3),
  ('25000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000001', '24000000-0000-4000-8000-000000000001', 'Open the upper frame', 'Reverse cable crossover', 'Hold the chest late in a run.', 'Shoulders stay down.', '3 × 15', 3, 1),
  ('25000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000001', '24000000-0000-4000-8000-000000000001', 'Open the upper frame', 'Band pull-apart', 'Keep the upper frame available.', 'Shoulders down, not shrugged.', '3 × 15', 3, 2),
  ('25000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000001', '24000000-0000-4000-8000-000000000001', 'Thursday', 'Stairs · up only', 'Build force without loading the descent.', 'Ride down. Descending is the part the knee does not want yet.', '10–15 min', 4, 1);

insert into public.coach_tasks (
  id, athlete_id, state, title, summary, waiting_on, priority, due_on
) values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'needs_you', 'Should five miles open?', 'Three miles stayed composed. Her next-day knee response decides whether the next distance moves forward.', 'Knee check', 1, '2026-08-24'),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'waiting_for_run', 'Outdoor race-pace read', 'The next outdoor close has to answer the question the treadmill cannot.', 'Filed outdoor run', 20, null),
  ('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', 'on_track', 'Working pace control', 'Nothing needs changing before the next scheduled quality session.', 'Next quality session', 40, null),
  ('30000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004', 'waiting_for_athlete', 'Quality under added load', 'The plan is set. The filed response will determine whether volume holds.', 'Athlete response', 30, null);

insert into public.coach_task_evidence (id, athlete_id, task_id, label, value, position) values
  ('31000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Longest run', '3.0 mi', 1),
  ('31000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Movement', 'Composed', 2),
  ('31000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Waiting on', 'Next-day knee', 3);

insert into public.coach_task_actions (
  id, athlete_id, task_id, label, decision_type, athlete_text, rationale,
  is_primary, position
) values
  ('32000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Open five miles', 'progress_distance', 'AUG 24 · FIVE MILES OPENS — The knee settled normally, movement held, and easy stayed easy. Five miles is available.', 'All four progression conditions were met after three miles.', true, 1),
  ('32000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Repeat three miles', 'repeat_distance', 'AUG 24 · REPEAT THREE MILES — We are keeping the distance where movement is composed while the knee response settles.', 'Repeating is the coaching decision that protects the next progression.', false, 2);

insert into public.coach_admin_status (
  athlete_id, relationship_label, payment_state
) values
  ('10000000-0000-4000-8000-000000000001', 'Run Development · 8 weeks · Week 1', 'paid'),
  ('10000000-0000-4000-8000-000000000002', 'Founding Member', 'not_applicable'),
  ('10000000-0000-4000-8000-000000000003', 'Founding Member', 'not_applicable'),
  ('10000000-0000-4000-8000-000000000004', 'Founding Member', 'not_applicable');

