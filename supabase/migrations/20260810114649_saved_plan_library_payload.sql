alter table public.plan_cycles
	add column saved_plan_payload jsonb,
	add column saved_plan_review_checksum text,
	add column library_removed_at timestamptz;

alter table public.plan_cycles
	add constraint plan_cycles_saved_plan_payload_object_check
		check (saved_plan_payload is null or jsonb_typeof(saved_plan_payload) = 'object'),
	add constraint plan_cycles_saved_plan_record_shape_check
		check (
			(
				saved_plan_payload is null
				and saved_plan_review_checksum is null
				and library_removed_at is null
			)
			or (
				saved_plan_payload is not null
				and saved_plan_review_checksum ~ '^[0-9a-f]{64}$'
				and status = 'archived'
			)
		);

drop policy "plan_cycles_insert_own" on public.plan_cycles;
create policy "plan_cycles_insert_own"
	on public.plan_cycles
	for insert
	to authenticated
	with check (
		auth.uid() = user_id
			and saved_plan_payload is null
			and saved_plan_review_checksum is null
			and library_removed_at is null
	);

drop policy "plan_cycles_update_own" on public.plan_cycles;
create policy "plan_cycles_update_own"
	on public.plan_cycles
	for update
	to authenticated
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id and saved_plan_payload is null);

create unique index plan_cycles_saved_plan_review_checksum_idx
	on public.plan_cycles (user_id, saved_plan_review_checksum)
	where saved_plan_review_checksum is not null;

create or replace function public.protect_saved_plan_record_immutability()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
	if old.saved_plan_payload is null then
		if new.saved_plan_payload is not null
			or new.saved_plan_review_checksum is not null
			or new.library_removed_at is not null
		then
			raise exception 'Existing plan rows cannot become saved plan records.';
		end if;

		return new;
	end if;

	if new.id is distinct from old.id
		or new.user_id is distinct from old.user_id
		or new.status is distinct from old.status
		or new.title is distinct from old.title
		or new.goal_summary is distinct from old.goal_summary
		or new.source_template is distinct from old.source_template
		or new.schema_version is distinct from old.schema_version
		or new.source_kind is distinct from old.source_kind
		or new.start_date is distinct from old.start_date
		or new.end_date is distinct from old.end_date
		or new.target_date is distinct from old.target_date
		or new.goal_metadata is distinct from old.goal_metadata
		or new.plan_preferences is distinct from old.plan_preferences
		or new.saved_plan_payload is distinct from old.saved_plan_payload
		or new.saved_plan_review_checksum is distinct from old.saved_plan_review_checksum
		or new.created_at is distinct from old.created_at
		or (
			old.library_removed_at is not null
			and new.library_removed_at is distinct from old.library_removed_at
		)
	then
		raise exception 'Saved plan records are immutable except for first logical removal.';
	end if;

	return new;
end;
$$;

revoke execute on function public.protect_saved_plan_record_immutability() from public, anon, authenticated;

create trigger plan_cycles_saved_plan_record_immutability
before update on public.plan_cycles
for each row
execute function public.protect_saved_plan_record_immutability();

drop function if exists public.apply_reviewed_import_persistence(
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
	boolean
);

create function public.apply_reviewed_import_persistence(
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
	p_clear_before_import boolean,
	p_current_date date default null,
	p_saved_plan_future_apply boolean default false
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
	v_current_plan public.plan_cycles%rowtype;
	v_archived_plan public.plan_cycles%rowtype;
	v_materialized_plan public.plan_cycles%rowtype;
	v_actual_history jsonb;
	v_result jsonb;
	v_plan_id uuid;
begin
	if p_clear_before_import is null then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_input',
			'message', 'Reviewed import persistence requires explicit future-replacement intent.'
		);
	elsif p_clear_before_import is false then
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
	end if;

	if p_saved_plan_future_apply is false then
		if p_expected_active_plan_id is null
			or p_expected_active_plan_updated_at is null
			or jsonb_typeof(coalesce(p_expected_history, 'null'::jsonb)) <> 'object'
			or coalesce(p_logs, 'null'::jsonb) is distinct from '[]'::jsonb
			or coalesce(p_evidence_relinks, 'null'::jsonb) is distinct from '[]'::jsonb
		then
			return jsonb_build_object(
				'ok', false,
				'reason', 'invalid_input',
				'message', 'Clear-before-import requires one reviewed active-plan snapshot without history transfer.'
			);
		end if;

		perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

		lock table
			public.planned_workouts,
			public.workout_logs,
			public.workout_result_assets,
			public.workout_actual_metrics,
			public.workout_comparisons,
			public.workout_ai_insights
		in share row exclusive mode;

		select *
		into v_current_plan
		from public.plan_cycles
		where id = p_expected_active_plan_id
			and user_id = p_user_id
			and status = 'active'
		for update;

		if not found
			or v_current_plan.updated_at is distinct from p_expected_active_plan_updated_at
		then
			return jsonb_build_object(
				'ok', false,
				'reason', 'stale_review',
				'message', 'The active plan changed before clear-before-import was saved.'
			);
		end if;

		if p_archive_goal_metadata is distinct from v_current_plan.goal_metadata then
			return jsonb_build_object(
				'ok', false,
				'reason', 'stale_review',
				'message', 'The active-plan metadata changed before clear-before-import was saved.'
			);
		end if;

		select jsonb_build_object(
			'workout_ids', coalesce((
				select jsonb_agg(to_jsonb(workout.id::text) order by workout.id)
				from public.planned_workouts workout
				where workout.user_id = p_user_id
					and workout.plan_cycle_id = p_expected_active_plan_id
			), '[]'::jsonb),
			'log_ids', coalesce((
				select jsonb_agg(to_jsonb(log.id::text) order by log.id)
				from public.workout_logs log
				join public.planned_workouts workout on workout.id = log.planned_workout_id
				where log.user_id = p_user_id
					and workout.plan_cycle_id = p_expected_active_plan_id
			), '[]'::jsonb),
			'asset_ids', coalesce((
				select jsonb_agg(to_jsonb(asset.id::text) order by asset.id)
				from public.workout_result_assets asset
				join public.planned_workouts workout on workout.id = asset.planned_workout_id
				where asset.user_id = p_user_id
					and workout.plan_cycle_id = p_expected_active_plan_id
			), '[]'::jsonb),
			'metric_ids', coalesce((
				select jsonb_agg(to_jsonb(metric.id::text) order by metric.id)
				from public.workout_actual_metrics metric
				join public.planned_workouts workout on workout.id = metric.planned_workout_id
				where metric.user_id = p_user_id
					and workout.plan_cycle_id = p_expected_active_plan_id
			), '[]'::jsonb),
			'comparison_ids', coalesce((
				select jsonb_agg(to_jsonb(comparison.id::text) order by comparison.id)
				from public.workout_comparisons comparison
				join public.planned_workouts workout on workout.id = comparison.planned_workout_id
				where comparison.user_id = p_user_id
					and workout.plan_cycle_id = p_expected_active_plan_id
			), '[]'::jsonb),
			'insight_ids', coalesce((
				select jsonb_agg(to_jsonb(insight.id::text) order by insight.id)
				from public.workout_ai_insights insight
				join public.planned_workouts workout on workout.id = insight.planned_workout_id
				where insight.user_id = p_user_id
					and workout.plan_cycle_id = p_expected_active_plan_id
			), '[]'::jsonb)
		)
		into v_actual_history;

		if v_actual_history is distinct from p_expected_history then
			return jsonb_build_object(
				'ok', false,
				'reason', 'stale_review',
				'message', 'The active-plan history changed before clear-before-import was saved.'
			);
		end if;

		update public.plan_cycles
		set status = 'archived'
		where id = v_current_plan.id
			and user_id = p_user_id
			and status = 'active'
		returning *
		into v_archived_plan;

		if not found then
			raise exception 'Active plan changed during clear-before-import persistence.';
		end if;

		v_result := public.apply_reviewed_plan_persistence(
			p_user_id,
			p_profile,
			p_plan,
			p_workouts,
			null,
			null,
			jsonb_build_object(
				'workout_ids', '[]'::jsonb,
				'log_ids', '[]'::jsonb,
				'asset_ids', '[]'::jsonb,
				'metric_ids', '[]'::jsonb,
				'comparison_ids', '[]'::jsonb,
				'insight_ids', '[]'::jsonb
			),
			null,
			'[]'::jsonb,
			'[]'::jsonb
		);

		if coalesce((v_result->>'ok')::boolean, false) is not true then
			raise exception using
				message = coalesce(
					v_result->>'message',
					'The imported plan could not be persisted after clearing the reviewed schedule.'
				);
		end if;

		return jsonb_set(v_result, '{archived_plan}', to_jsonb(v_archived_plan), true);
	end if;

	if p_current_date is null then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_input',
			'message', 'Saved-plan future apply requires the runner date.'
		);
	end if;

	if jsonb_typeof(coalesce(p_workouts, 'null'::jsonb)) <> 'array'
		or jsonb_typeof(coalesce(p_expected_history, 'null'::jsonb)) <> 'object'
		or coalesce(p_logs, 'null'::jsonb) is distinct from '[]'::jsonb
		or coalesce(p_evidence_relinks, 'null'::jsonb) is distinct from '[]'::jsonb
		or exists (
			select 1
			from jsonb_array_elements(p_workouts) item
			where (item->>'workout_date')::date < p_current_date
		)
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_input',
			'message', 'Future schedule apply accepts only reviewed rows on or after the runner date.'
		);
	end if;

	perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

	lock table
		public.planned_workouts,
		public.workout_logs,
		public.workout_result_assets,
		public.workout_actual_metrics,
		public.workout_comparisons,
		public.workout_ai_insights,
		public.runner_activity_planned_workout_matches
	in share row exclusive mode;

	select *
	into v_current_plan
	from public.plan_cycles
	where user_id = p_user_id
		and status = 'active'
	order by created_at desc
	limit 1
	for update;

	if p_expected_active_plan_id is null then
		if found then
			return jsonb_build_object(
				'ok', false,
				'reason', 'stale_review',
				'message', 'The Calendar provenance changed before future schedule apply.'
			);
		end if;
	elsif not found
		or v_current_plan.id is distinct from p_expected_active_plan_id
		or v_current_plan.updated_at is distinct from p_expected_active_plan_updated_at
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'stale_review',
			'message', 'The Calendar provenance changed before future schedule apply.'
		);
	end if;

	select jsonb_build_object(
		'workout_ids', coalesce((
			select jsonb_agg(to_jsonb(workout.id::text) order by workout.id)
			from public.planned_workouts workout
			where workout.user_id = p_user_id
		), '[]'::jsonb),
		'log_ids', coalesce((
			select jsonb_agg(to_jsonb(log.id::text) order by log.id)
			from public.workout_logs log
			where log.user_id = p_user_id
		), '[]'::jsonb),
		'asset_ids', coalesce((
			select jsonb_agg(to_jsonb(asset.id::text) order by asset.id)
			from public.workout_result_assets asset
			where asset.user_id = p_user_id
		), '[]'::jsonb),
		'metric_ids', coalesce((
			select jsonb_agg(to_jsonb(metric.id::text) order by metric.id)
			from public.workout_actual_metrics metric
			where metric.user_id = p_user_id
		), '[]'::jsonb),
		'comparison_ids', coalesce((
			select jsonb_agg(to_jsonb(comparison.id::text) order by comparison.id)
			from public.workout_comparisons comparison
			where comparison.user_id = p_user_id
		), '[]'::jsonb),
		'insight_ids', coalesce((
			select jsonb_agg(to_jsonb(insight.id::text) order by insight.id)
			from public.workout_ai_insights insight
			where insight.user_id = p_user_id
		), '[]'::jsonb)
	)
	into v_actual_history;

	if v_actual_history is distinct from p_expected_history then
		return jsonb_build_object(
			'ok', false,
			'reason', 'stale_review',
			'message', 'The runner Calendar changed before future schedule apply.'
		);
	end if;

	if exists (
		select 1
		from public.planned_workouts workout
		where workout.user_id = p_user_id
			and workout.workout_date >= p_current_date
			and (
				exists (
					select 1 from public.workout_logs row
					where row.user_id = p_user_id and row.planned_workout_id = workout.id
				)
				or exists (
					select 1 from public.workout_result_assets row
					where row.user_id = p_user_id and row.planned_workout_id = workout.id
				)
				or exists (
					select 1 from public.workout_actual_metrics row
					where row.user_id = p_user_id and row.planned_workout_id = workout.id
				)
				or exists (
					select 1 from public.workout_comparisons row
					where row.user_id = p_user_id and row.planned_workout_id = workout.id
				)
				or exists (
					select 1 from public.workout_ai_insights row
					where row.user_id = p_user_id and row.planned_workout_id = workout.id
				)
				or exists (
					select 1 from public.runner_activity_planned_workout_matches row
					where row.user_id = p_user_id and row.planned_workout_id = workout.id
				)
			)
	) then
		return jsonb_build_object(
			'ok', false,
			'reason', 'protected_future_schedule',
			'message', 'Future schedule replacement cannot remove logged or evidence-backed workouts.'
		);
	end if;

	delete from public.planned_workouts
	where user_id = p_user_id
		and workout_date >= p_current_date;

	update public.plan_cycles
	set status = 'archived'
	where user_id = p_user_id
		and status = 'active'
	returning *
	into v_archived_plan;

	v_result := public.apply_reviewed_plan_persistence(
		p_user_id,
		p_profile,
		p_plan,
		p_workouts,
		null,
		null,
		jsonb_build_object(
			'workout_ids', '[]'::jsonb,
			'log_ids', '[]'::jsonb,
			'asset_ids', '[]'::jsonb,
			'metric_ids', '[]'::jsonb,
			'comparison_ids', '[]'::jsonb,
			'insight_ids', '[]'::jsonb
		),
		null,
		'[]'::jsonb,
		'[]'::jsonb
	);

	if coalesce((v_result->>'ok')::boolean, false) is not true then
		raise exception using
			message = coalesce(v_result->>'message', 'The future schedule could not be applied.');
	end if;

	v_plan_id := (v_result->'plan_cycle'->>'id')::uuid;
	update public.plan_cycles
	set status = 'archived'
	where id = v_plan_id
		and user_id = p_user_id
	returning *
	into v_materialized_plan;

	return jsonb_set(
		jsonb_set(v_result, '{plan_cycle}', to_jsonb(v_materialized_plan), true),
		'{archived_plan}',
		case
			when v_archived_plan.id is null then 'null'::jsonb
			else to_jsonb(v_archived_plan)
		end,
		true
	);
end;
$$;

revoke execute on function public.apply_reviewed_import_persistence(
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
	boolean,
	date,
	boolean
) from public, anon, authenticated;

grant execute on function public.apply_reviewed_import_persistence(
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
	boolean,
	date,
	boolean
) to service_role;
