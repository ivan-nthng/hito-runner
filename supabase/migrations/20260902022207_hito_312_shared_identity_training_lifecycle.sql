-- HITO-312: replace the active dedicated-identity lifecycle with an explicit
-- shared-owner, relative-date training lifecycle. The old no-argument
-- functions remain revoked as immutable rollback behavior; active consumers
-- use only these explicit signatures.

create function hito_staging.hito_312_task_counts(p_user_id uuid)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
	v_counts jsonb;
begin
	if p_user_id is null then
		raise exception 'HITO-312 shared owner is required.';
	end if;

	select jsonb_build_object(
		'runner_profiles', (
			select count(*) from hito_staging.runner_profiles
			where user_id = p_user_id
				and display_name = 'HITO-312 Staging Runner'
		),
		'plan_cycles', (
			select count(*) from hito_staging.plan_cycles
			where user_id = p_user_id
				and (
					id = '31200000-0000-4000-8000-000000000001'::uuid
					or source_template = 'hito_312_synthetic_seed_v2'
				)
		),
		'planned_workouts', (
			select count(*) from hito_staging.planned_workouts
			where user_id = p_user_id
				and (
					plan_cycle_id = '31200000-0000-4000-8000-000000000001'::uuid
					or id in (
						'31200000-0000-4000-8000-000000000002'::uuid,
						'31200000-0000-4000-8000-000000000004'::uuid,
						'31200000-0000-4000-8000-000000000005'::uuid
					)
					or workout_identity like 'hito_312_%'
				)
		),
		'workout_logs', (
			select count(*) from hito_staging.workout_logs
			where user_id = p_user_id
				and (
					id = '31200000-0000-4000-8000-000000000006'::uuid
					or planned_workout_id in (
						select id from hito_staging.planned_workouts
						where user_id = p_user_id
							and (
								plan_cycle_id = '31200000-0000-4000-8000-000000000001'::uuid
								or workout_identity like 'hito_312_%'
							)
					)
				)
		),
		'calendar_workout_mutation_events', (
			select count(*) from hito_staging.calendar_workout_mutation_events
			where user_id = p_user_id
				and (
					planned_workout_id in (
						'31200000-0000-4000-8000-000000000002'::uuid,
						'31200000-0000-4000-8000-000000000004'::uuid,
						'31200000-0000-4000-8000-000000000005'::uuid
					)
					or review_payload_version = 'hito_312_qa_v2'
					or mutation_payload_version = 'hito_312_qa_v2'
				)
		),
		'legacy_fake_result_assets', (
			select count(*) from hito_staging.workout_result_assets
			where user_id = p_user_id
				and (
					id = '31200000-0000-4000-8000-000000000003'::uuid
					or original_file_name = 'hito-312-synthetic.fit'
				)
		)
	) into v_counts;

	return v_counts;
end;
$$;

create function hito_staging.hito_312_global_task_residue(p_owner_user_id uuid)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
	v_total bigint;
	v_foreign bigint;
begin
	if p_owner_user_id is null then
		raise exception 'HITO-312 shared owner is required.';
	end if;

	with residue as (
		select user_id from hito_staging.runner_profiles
		where display_name = 'HITO-312 Staging Runner'
		union all
		select user_id from hito_staging.plan_cycles
		where id = '31200000-0000-4000-8000-000000000001'::uuid
			or source_template in ('hito_312_synthetic_seed', 'hito_312_synthetic_seed_v2')
		union all
		select user_id from hito_staging.planned_workouts
		where plan_cycle_id = '31200000-0000-4000-8000-000000000001'::uuid
			or id in (
				'31200000-0000-4000-8000-000000000002'::uuid,
				'31200000-0000-4000-8000-000000000004'::uuid,
				'31200000-0000-4000-8000-000000000005'::uuid
			)
			or workout_identity like 'hito_312_%'
		union all
		select user_id from hito_staging.workout_logs
		where id = '31200000-0000-4000-8000-000000000006'::uuid
			or planned_workout_id in (
				'31200000-0000-4000-8000-000000000002'::uuid,
				'31200000-0000-4000-8000-000000000004'::uuid,
				'31200000-0000-4000-8000-000000000005'::uuid
			)
			or notes = 'HITO-312 deterministic result-backed Calendar proof'
		union all
		select user_id from hito_staging.calendar_workout_mutation_events
		where planned_workout_id in (
				'31200000-0000-4000-8000-000000000002'::uuid,
				'31200000-0000-4000-8000-000000000004'::uuid,
				'31200000-0000-4000-8000-000000000005'::uuid
			)
			or review_payload_version = 'hito_312_qa_v2'
			or mutation_payload_version = 'hito_312_qa_v2'
		union all
		select user_id from hito_staging.workout_result_assets
		where id = '31200000-0000-4000-8000-000000000003'::uuid
			or original_file_name = 'hito-312-synthetic.fit'
	)
	select count(*), count(*) filter (where user_id is distinct from p_owner_user_id)
	into v_total, v_foreign
	from residue;

	return jsonb_build_object(
		'total', coalesce(v_total, 0),
		'foreignOwner', coalesce(v_foreign, 0)
	);
end;
$$;

create function hito_staging.hito_312_status(p_user_id uuid)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
	v_counts jsonb;
	v_global jsonb;
	v_total bigint;
begin
	if p_user_id is null then
		raise exception 'HITO-312 shared owner is required.';
	end if;

	if not exists (select 1 from auth.users where id = p_user_id) then
		raise exception 'HITO-312 shared owner does not exist in Auth.';
	end if;

	v_counts := hito_staging.hito_312_task_counts(p_user_id);
	v_global := hito_staging.hito_312_global_task_residue(p_user_id);
	select coalesce(sum(value::text::bigint), 0)
	into v_total
	from jsonb_each(v_counts);

	return jsonb_build_object(
		'dataset', 'hito_staging',
		'ownerPresent', true,
		'asAuthMutation', false,
		'taskRows', v_counts,
		'totalTaskRows', v_total,
		'globalTaskResidue', v_global
	);
end;
$$;

create function hito_staging.hito_312_seed(p_user_id uuid, p_as_of_date date)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
	v_global jsonb;
begin
	if p_user_id is null or p_as_of_date is null then
		raise exception 'HITO-312 shared owner and as-of date are required.';
	end if;

	if not exists (select 1 from auth.users where id = p_user_id) then
		raise exception 'HITO-312 shared owner does not exist in Auth.';
	end if;

	v_global := hito_staging.hito_312_global_task_residue(p_user_id);
	if (v_global ->> 'total')::bigint <> 0 then
		raise exception 'HITO-312 seed requires zero global task residue: %', v_global;
	end if;

	if exists (select 1 from hito_staging.runner_profiles where user_id = p_user_id) then
		raise exception 'HITO-312 seed refuses to replace a non-task staging runner profile.';
	end if;

	insert into hito_staging.runner_profiles (
		user_id, goal_type, goal_label, baseline_sessions_per_week,
		baseline_long_run_km, setup_state, display_name, fitness_level,
		age, height_cm, weight_kg, calendar_timezone,
		calendar_timezone_source, training_preferences
	) values (
		p_user_id, 'build_consistency'::public.runner_goal_type,
		'Synthetic staging baseline', 3, 5,
		'completed'::public.runner_setup_state, 'HITO-312 Staging Runner',
		'beginner', 34, 178, 72, 'America/Sao_Paulo', 'user',
		'{"availability":4,"fixed_rest_days":["tuesday","thursday","saturday"]}'::jsonb
	);

	insert into hito_staging.plan_cycles (
		id, user_id, status, title, goal_summary, source_template,
		source_kind, start_date, end_date
	) values (
		'31200000-0000-4000-8000-000000000001'::uuid,
		p_user_id, 'active'::public.plan_cycle_status,
		'Synthetic staging plan', 'Deterministic staging-only proof',
		'hito_312_synthetic_seed_v2', 'manual', p_as_of_date, p_as_of_date + 6
	);

	insert into hito_staging.planned_workouts (
		id, plan_cycle_id, user_id, workout_date, weekday, week_number,
		phase, workout_type, workout_family, workout_identity, title,
		steps, display_order, origin_kind
	) values (
		'31200000-0000-4000-8000-000000000002'::uuid,
		'31200000-0000-4000-8000-000000000001'::uuid,
		p_user_id, p_as_of_date, lower(to_char(p_as_of_date, 'FMDay')),
		1, 'Synthetic staging', 'easy'::public.workout_type, 'easy',
		'hito_312_result_backed_easy', 'Synthetic completed easy run',
		'[]'::jsonb, 0, 'manual'
	);

	insert into hito_staging.workout_logs (
		id, planned_workout_id, user_id, outcome, actual_distance_km,
		actual_duration_min, rpe, notes, logged_at
	) values (
		'31200000-0000-4000-8000-000000000006'::uuid,
		'31200000-0000-4000-8000-000000000002'::uuid,
		p_user_id, 'completed'::public.workout_outcome, 5.00, 30, 4,
		'HITO-312 deterministic result-backed Calendar proof',
		(p_as_of_date::timestamp + interval '12 hours') at time zone 'America/Sao_Paulo'
	);

	return hito_staging.hito_312_status(p_user_id);
end;
$$;

create function hito_staging.hito_312_reset(p_user_id uuid)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
	v_global jsonb;
	v_task_workout_ids uuid[];
begin
	if p_user_id is null then
		raise exception 'HITO-312 shared owner is required.';
	end if;

	if not exists (select 1 from auth.users where id = p_user_id) then
		raise exception 'HITO-312 shared owner does not exist in Auth.';
	end if;

	v_global := hito_staging.hito_312_global_task_residue(p_user_id);
	if (v_global ->> 'foreignOwner')::bigint <> 0 then
		raise exception 'HITO-312 reset refuses foreign-owner task residue: %', v_global;
	end if;

	select coalesce(array_agg(id), array[]::uuid[])
	into v_task_workout_ids
	from hito_staging.planned_workouts
	where user_id = p_user_id
		and (
			plan_cycle_id = '31200000-0000-4000-8000-000000000001'::uuid
			or id in (
				'31200000-0000-4000-8000-000000000002'::uuid,
				'31200000-0000-4000-8000-000000000004'::uuid,
				'31200000-0000-4000-8000-000000000005'::uuid
			)
			or workout_identity like 'hito_312_%'
		);

	delete from hito_staging.calendar_workout_mutation_events
	where user_id = p_user_id
		and (
			planned_workout_id = any(v_task_workout_ids)
			or review_payload_version = 'hito_312_qa_v2'
			or mutation_payload_version = 'hito_312_qa_v2'
		);
	delete from hito_staging.workout_logs
	where user_id = p_user_id
		and (planned_workout_id = any(v_task_workout_ids)
			or id = '31200000-0000-4000-8000-000000000006'::uuid);
	delete from hito_staging.planned_workouts
	where user_id = p_user_id and id = any(v_task_workout_ids);
	delete from hito_staging.plan_cycles
	where user_id = p_user_id
		and (
			id = '31200000-0000-4000-8000-000000000001'::uuid
			or source_template = 'hito_312_synthetic_seed_v2'
		);
	delete from hito_staging.workout_result_assets
	where user_id = p_user_id
		and (
			id = '31200000-0000-4000-8000-000000000003'::uuid
			or original_file_name = 'hito-312-synthetic.fit'
		);
	delete from hito_staging.runner_profiles
	where user_id = p_user_id
		and display_name = 'HITO-312 Staging Runner';

	v_global := hito_staging.hito_312_global_task_residue(p_user_id);
	if (v_global ->> 'total')::bigint <> 0 then
		raise exception 'HITO-312 reset did not reach global task zero: %', v_global;
	end if;

	return hito_staging.hito_312_status(p_user_id);
end;
$$;

revoke all on function hito_staging.hito_312_task_counts(uuid)
	from public, anon, authenticated, service_role;
revoke all on function hito_staging.hito_312_global_task_residue(uuid)
	from public, anon, authenticated, service_role;
revoke all on function hito_staging.hito_312_status(uuid)
	from public, anon, authenticated, service_role;
revoke all on function hito_staging.hito_312_seed(uuid, date)
	from public, anon, authenticated, service_role;
revoke all on function hito_staging.hito_312_reset(uuid)
	from public, anon, authenticated, service_role;

comment on function hito_staging.hito_312_seed(uuid, date) is
	'HITO-312 direct-SQL lifecycle: explicit shared Auth owner and relative as-of date; never mutates Auth or Storage.';
comment on function hito_staging.hito_312_reset(uuid) is
	'HITO-312 direct-SQL lifecycle: removes only exact shared-owner task training rows and rejects foreign-owner residue.';

-- Exact rollback after proving no HITO-312 lifecycle call is active:
-- begin;
-- drop function hito_staging.hito_312_reset(uuid);
-- drop function hito_staging.hito_312_seed(uuid, date);
-- drop function hito_staging.hito_312_status(uuid);
-- drop function hito_staging.hito_312_global_task_residue(uuid);
-- drop function hito_staging.hito_312_task_counts(uuid);
-- commit;
-- The previously applied and still-revoked no-argument lifecycle remains byte-identical.
