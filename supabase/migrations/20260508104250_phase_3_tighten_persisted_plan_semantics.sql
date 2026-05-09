alter table public.plan_cycles
  add column schema_version text not null default 'legacy-week-1-preview-v1',
  add column source_kind text,
  add column target_date date,
  add column goal_metadata jsonb,
  add column plan_preferences jsonb;

alter table public.plan_cycles
  add constraint plan_cycles_goal_metadata_object_check
    check (goal_metadata is null or jsonb_typeof(goal_metadata) = 'object'),
  add constraint plan_cycles_plan_preferences_object_check
    check (plan_preferences is null or jsonb_typeof(plan_preferences) = 'object');

update public.plan_cycles
set schema_version = case
  when source_template = 'training-plan-v2' then 'training-plan-v2'
  when source_template = 'json-import-v1' then 'legacy-week-1-preview-v1'
  else source_template
end
where schema_version = 'legacy-week-1-preview-v1';

alter table public.planned_workouts
  add column source_workout_id text,
  add column source_workout_type text,
  add column planned_rpe smallint check (planned_rpe is null or planned_rpe between 1 and 10),
  add column estimated_fatigue text,
  add column recovery_priority text;

update public.planned_workouts
set source_workout_type = workout_type::text
where source_workout_type is null;
