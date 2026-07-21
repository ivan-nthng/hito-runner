alter table public.runner_profiles
	alter column goal_type drop not null,
	alter column goal_label drop not null,
	alter column baseline_sessions_per_week drop not null,
	alter column baseline_long_run_km drop not null,
	add column if not exists fitness_level text,
	add column if not exists baseline_revision bigint not null default 1;

alter table public.runner_profiles
	drop constraint if exists runner_profiles_fitness_level_check,
	drop constraint if exists runner_profiles_baseline_revision_check,
	drop constraint if exists runner_profiles_heart_rate_profile_object_check;

with latest_explicit_fitness as (
	select distinct on (user_id)
		user_id,
		coalesce(
			goal_metadata #>> '{selected_plan_engine,runner_level}',
			plan_preferences #>> '{running_plan_engine_review,normalized_input,runnerLevel}',
			plan_preferences #>> '{manual_setup,running_level}'
		) as runner_level
	from public.plan_cycles
	where coalesce(
		goal_metadata #>> '{selected_plan_engine,runner_level}',
		plan_preferences #>> '{running_plan_engine_review,normalized_input,runnerLevel}',
		plan_preferences #>> '{manual_setup,running_level}'
	) is not null
	order by user_id, (status = 'active') desc, updated_at desc
)
update public.runner_profiles as profile
set fitness_level = case latest.runner_level
	when 'beginner_new_runner' then 'new_to_running'
	when 'sometimes_runs' then 'beginner'
	when 'runs_a_lot' then 'running_regularly'
	when 'professional_competitive' then 'performance_focused'
	when 'new_to_running' then 'new_to_running'
	when 'beginner' then 'beginner'
	when 'running_regularly' then 'running_regularly'
	when 'performance_focused' then 'performance_focused'
	when 'custom' then 'custom'
	else null
end
from latest_explicit_fitness as latest
where profile.user_id = latest.user_id
	and profile.fitness_level is null;

update public.runner_profiles
set heart_rate_profile = jsonb_build_object(
	'version', 'runner_hr_profile_v2',
	'source', 'personal',
	'zones', heart_rate_profile -> 'zones'
)
where heart_rate_profile ->> 'version' = 'personal_hr_profile_v1';

alter table public.runner_profiles
	add constraint runner_profiles_fitness_level_check
	check (
		fitness_level is null
		or fitness_level in (
			'new_to_running',
			'beginner',
			'running_regularly',
			'performance_focused',
			'custom'
		)
	),
	add constraint runner_profiles_baseline_revision_check
	check (baseline_revision >= 1),
	add constraint runner_profiles_heart_rate_profile_object_check
	check (
		heart_rate_profile is null
		or coalesce((
			jsonb_typeof(heart_rate_profile) = 'object'
			and heart_rate_profile ->> 'version' = 'runner_hr_profile_v2'
			and (
				(
					heart_rate_profile ->> 'source' = 'estimated'
					and heart_rate_profile - array['version', 'source'] = '{}'::jsonb
				)
				or (
					heart_rate_profile ->> 'source' = 'personal'
					and heart_rate_profile - array['version', 'source', 'zones'] = '{}'::jsonb
					and jsonb_typeof(heart_rate_profile -> 'zones') = 'array'
					and jsonb_array_length(heart_rate_profile -> 'zones') = 5
					and heart_rate_profile -> 'zones' -> 0 ->> 'reference' = 'Z1'
					and heart_rate_profile -> 'zones' -> 1 ->> 'reference' = 'Z2'
					and heart_rate_profile -> 'zones' -> 2 ->> 'reference' = 'Z3'
					and heart_rate_profile -> 'zones' -> 3 ->> 'reference' = 'Z4'
					and heart_rate_profile -> 'zones' -> 4 ->> 'reference' = 'Z5'
					and (heart_rate_profile -> 'zones' -> 0)
						- array['reference', 'minBpm', 'maxBpm'] = '{}'::jsonb
					and (heart_rate_profile -> 'zones' -> 1)
						- array['reference', 'minBpm', 'maxBpm'] = '{}'::jsonb
					and (heart_rate_profile -> 'zones' -> 2)
						- array['reference', 'minBpm', 'maxBpm'] = '{}'::jsonb
					and (heart_rate_profile -> 'zones' -> 3)
						- array['reference', 'minBpm', 'maxBpm'] = '{}'::jsonb
					and (heart_rate_profile -> 'zones' -> 4)
						- array['reference', 'minBpm', 'maxBpm'] = '{}'::jsonb
					and not jsonb_path_exists(
						heart_rate_profile,
						'$.zones[*] ? (
							!exists(@.minBpm)
							|| @.minBpm.type() != "number"
							|| @.minBpm < 1
							|| @.minBpm > 300
							|| @.minBpm != @.minBpm.floor()
							|| !exists(@.maxBpm)
							|| @.maxBpm.type() != "number"
							|| @.maxBpm < 1
							|| @.maxBpm > 300
							|| @.maxBpm != @.maxBpm.floor()
							|| @.minBpm > @.maxBpm
						)'
					)
					and case
						when jsonb_path_exists(
							heart_rate_profile,
							'$.zones[*] ? (
								@.minBpm.type() != "number"
								|| @.maxBpm.type() != "number"
							)'
						) then false
						else
							((heart_rate_profile -> 'zones' -> 1 ->> 'minBpm')::integer
								> (heart_rate_profile -> 'zones' -> 0 ->> 'maxBpm')::integer)
							and ((heart_rate_profile -> 'zones' -> 2 ->> 'minBpm')::integer
								> (heart_rate_profile -> 'zones' -> 1 ->> 'maxBpm')::integer)
							and ((heart_rate_profile -> 'zones' -> 3 ->> 'minBpm')::integer
								> (heart_rate_profile -> 'zones' -> 2 ->> 'maxBpm')::integer)
							and ((heart_rate_profile -> 'zones' -> 4 ->> 'minBpm')::integer
								> (heart_rate_profile -> 'zones' -> 3 ->> 'maxBpm')::integer)
					end
				)
			)
			), false)
		) not valid;

-- New and changed rows are checked immediately. A historically accepted v1 row that no longer
-- satisfies the stricter contract stays preserved but unavailable until the runner saves a valid set.
do $$
begin
	begin
		alter table public.runner_profiles
			validate constraint runner_profiles_heart_rate_profile_object_check;
	exception
		when check_violation then
			null;
	end;
end $$;

create or replace function public.apply_reviewed_plan_persistence_with_profile_revision(
	p_user_id uuid,
	p_profile jsonb,
	p_plan jsonb,
	p_workouts jsonb,
	p_expected_active_plan_id uuid,
	p_expected_active_plan_updated_at timestamptz,
	p_expected_history jsonb,
	p_archive_goal_metadata jsonb,
	p_logs jsonb,
	p_evidence_relinks jsonb,
	p_expected_profile_revision bigint
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
	v_profile_revision bigint;
begin
	perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

	select baseline_revision
	into v_profile_revision
	from public.runner_profiles
	where user_id = p_user_id
	for update;

	if not found or v_profile_revision is distinct from p_expected_profile_revision then
		return jsonb_build_object(
			'ok', false,
			'reason', 'stale_review',
			'message', 'The runner baseline changed before the reviewed plan was saved.'
		);
	end if;

	return public.apply_reviewed_plan_persistence(
		p_user_id,
		p_profile,
		p_plan,
		p_workouts,
		p_expected_active_plan_id,
		p_expected_active_plan_updated_at,
		p_expected_history,
		p_archive_goal_metadata,
		p_logs,
		p_evidence_relinks
	);
end;
$$;

revoke execute on function public.apply_reviewed_plan_persistence_with_profile_revision(
	uuid,
	jsonb,
	jsonb,
	jsonb,
	uuid,
	timestamptz,
	jsonb,
	jsonb,
	jsonb,
	jsonb,
	bigint
) from public, anon, authenticated;

grant execute on function public.apply_reviewed_plan_persistence_with_profile_revision(
	uuid,
	jsonb,
	jsonb,
	jsonb,
	uuid,
	timestamptz,
	jsonb,
	jsonb,
	jsonb,
	jsonb,
	bigint
) to service_role;
