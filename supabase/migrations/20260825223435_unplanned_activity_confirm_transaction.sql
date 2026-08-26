-- HITO-255: one Activity-confirm branch in the existing Calendar transaction
-- owner plus comparison-optional completion for neutral recorded_run rows.
-- Existing rows are not rewritten.

alter table public.calendar_workout_mutation_events
  drop constraint if exists calendar_workout_mutation_events_mutation_kind_check;
alter table public.calendar_workout_mutation_events
  add constraint calendar_workout_mutation_events_mutation_kind_check check (
    mutation_kind in (
      'user_added_workout',
      'user_cleared_workout',
      'user_moved_workout',
      'user_copied_workout',
      'user_edited_workout',
      'user_confirmed_activity'
    )
  );

do $migration$
declare
  v_definition text;
  v_original text;
begin
  select pg_get_functiondef(
    'public.apply_calendar_workout_mutation(uuid,date,text,jsonb,jsonb,jsonb,jsonb,jsonb)'::regprocedure
  ) into v_definition;
  v_original := v_definition;

  v_definition := replace(
    v_definition,
    $needle$if p_mutation_kind not in ('add', 'clear', 'move')$needle$,
    $replacement$if p_mutation_kind not in ('add', 'clear', 'move', 'confirm_activity')$replacement$
  );
  v_definition := replace(
    v_definition,
    $needle$or (p_mutation_kind = 'move' and v_event_kind <> 'user_moved_workout')$needle$,
    $replacement$or (p_mutation_kind = 'move' and v_event_kind <> 'user_moved_workout')
		or (p_mutation_kind = 'confirm_activity' and v_event_kind <> 'user_confirmed_activity')$replacement$
  );
  v_definition := replace(
    v_definition,
    $needle$	perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

	if p_mutation_kind = 'add' then$needle$,
    $replacement$	perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

	if p_mutation_kind = 'confirm_activity' then
		if jsonb_typeof(coalesce(p_workout_update, 'null'::jsonb)) <> 'object'
			or p_workout_update->>'version' <> 'unplanned_activity_review_v1'
			or p_mutation_event->>'placement_intent' not in ('materialize_on_rest', 'associate_existing')
			or coalesce(p_workout_update->>'activityId', '')
				!~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
			or coalesce(p_workout_update->>'activityRevisionId', '')
				!~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
			or coalesce(p_workout_update->>'sourceRevisionId', '')
				!~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
			or coalesce(p_workout_update->>'assetId', '')
				!~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
			or p_mutation_event->>'activity_id' is distinct from p_workout_update->>'activityId'
			or p_mutation_event->>'activity_revision_id' is distinct from p_workout_update->>'activityRevisionId'
			or p_mutation_event->>'source_revision_id' is distinct from p_workout_update->>'sourceRevisionId'
			or p_mutation_event->>'result_asset_id' is distinct from p_workout_update->>'assetId'
			or p_mutation_event->>'target_date' is distinct from p_workout_update->>'localDate'
		then
			return jsonb_build_object('ok', false, 'reason', 'invalid_input',
				'message', 'The sealed Activity Review payload is invalid.');
		end if;

		-- Lost acknowledgement is idempotent: the original Activity/workout/event identities win.
		select workout.* into v_mutated
		from public.runner_activity_planned_workout_matches match
		join public.planned_workouts workout
			on workout.id = match.planned_workout_id and workout.user_id = p_user_id
		where match.user_id = p_user_id
			and match.activity_id = (p_workout_update->>'activityId')::uuid
			and match.source_revision_id = (p_workout_update->>'sourceRevisionId')::uuid
		limit 1;

		if found then
			if v_mutated.workout_date::text is distinct from p_workout_update->>'localDate' then
				return jsonb_build_object('ok', false, 'reason', 'conflict',
					'message', 'The Activity is already confirmed on another Calendar date.');
			end if;
			select * into v_event
			from public.calendar_workout_mutation_events
			where user_id = p_user_id
				and planned_workout_id = v_mutated.id
				and mutation_kind = 'user_confirmed_activity'
				and event_payload->>'activity_id' = p_workout_update->>'activityId'
			order by id asc limit 1;
			if v_event.id is null then
				raise exception 'The confirmed Activity is missing its immutable Calendar audit event.';
			end if;
			return jsonb_build_object(
				'ok', true,
				'mutated_workout', to_jsonb(v_mutated),
				'deleted_workout', null,
				'restored_workout', null,
				'mutation_event', to_jsonb(v_event),
				'undo_expires_at', null,
				'idempotent', true
			);
		end if;

		if nullif(p_workout_update->>'localDate', '') is null
			or (p_workout_update->>'localDate')::date >= p_current_date
			or not exists (
				select 1
				from public.runner_activities activity
				join public.runner_activity_revisions activity_revision
					on activity_revision.id = activity.current_revision_id
					and activity_revision.user_id = p_user_id
					and activity_revision.activity_id = activity.id
					and activity_revision.source_revision_id = (p_workout_update->>'sourceRevisionId')::uuid
				join public.runner_activity_source_revisions source_revision
					on source_revision.id = activity_revision.source_revision_id
					and source_revision.user_id = p_user_id
					and source_revision.raw_state <> 'removed'
				join public.runner_activity_sources source
					on source.id = source_revision.source_id
					and source.user_id = p_user_id
					and source.activity_id = activity.id
					and source.current_revision_id = source_revision.id
				join public.workout_result_assets asset
					on asset.id = (p_workout_update->>'assetId')::uuid
					and asset.user_id = p_user_id
					and asset.activity_source_revision_id = source_revision.id
					and asset.primary_file_kind = 'fit'
					and asset.parse_status = 'parsed'
				where activity.id = (p_workout_update->>'activityId')::uuid
					and activity.user_id = p_user_id
					and activity.current_revision_id = (p_workout_update->>'activityRevisionId')::uuid
					and activity.sport = 'run'
					and activity.recording_kind = 'recorded'
					and activity.quality_state = 'accepted'
					and activity_revision.activity_local_date::text = p_workout_update->>'localDate'
			)
		then
			return jsonb_build_object('ok', false, 'reason', 'stale_review',
				'message', 'The Activity source or local date changed after Review.');
		end if;

		if p_mutation_event->>'placement_intent' = 'materialize_on_rest' then
			if jsonb_typeof(coalesce(p_workout_insert, 'null'::jsonb)) <> 'object'
				or p_workout_insert->>'id' is distinct from p_mutation_event->>'planned_workout_id'
				or p_workout_insert->>'user_id' is distinct from p_user_id::text
				or p_workout_insert->>'workout_date' is distinct from p_workout_update->>'localDate'
				or p_workout_insert->>'origin_kind' <> 'file_import'
				or nullif(p_workout_insert->>'plan_cycle_id', '') is not null
				or p_workout_insert->>'workout_type' <> 'recorded_run'
				or p_workout_insert->>'source_workout_type' <> 'recorded_activity'
				or p_workout_insert->>'workout_family' <> 'recorded'
				or p_workout_insert->>'workout_identity' <> 'recorded_activity'
				or p_workout_insert->>'calendar_icon_key' <> 'recorded'
				or p_workout_insert->'goal_context' <> 'null'::jsonb
				or p_workout_insert->'metric_mode'->>'executable_mode' <> 'none'
				or coalesce((p_workout_insert->'metric_mode'->>'pace_targets_allowed')::boolean, true)
				or coalesce((p_workout_insert->'metric_mode'->>'hr_targets_allowed')::boolean, true)
				or jsonb_array_length(p_workout_insert->'steps') <> 1
				or p_workout_insert->'steps'->0->'prescription'->>'mode' <> 'none'
			then
				return jsonb_build_object('ok', false, 'reason', 'invalid_input',
					'message', 'A recorded Activity must use the neutral non-prescriptive Calendar vocabulary.');
			end if;

			if p_expected_source_workout is null or p_expected_source_workout = 'null'::jsonb then
				if exists (
					select 1 from public.planned_workouts
					where user_id = p_user_id
						and workout_date = (p_workout_update->>'localDate')::date
				) then
					return jsonb_build_object('ok', false, 'reason', 'stale_review',
						'message', 'The reviewed Rest date is no longer empty.');
				end if;
			else
				select * into v_source from public.planned_workouts
				where id = (p_expected_source_workout->>'id')::uuid
					and user_id = p_user_id
					and workout_date = (p_workout_update->>'localDate')::date
				for update;
				if not found or to_jsonb(v_source) is distinct from p_expected_source_workout
					or v_source.workout_type <> 'rest'
					or exists (select 1 from public.workout_logs where user_id = p_user_id and planned_workout_id = v_source.id)
					or exists (select 1 from public.workout_result_assets where user_id = p_user_id and planned_workout_id = v_source.id)
					or exists (select 1 from public.workout_actual_metrics where user_id = p_user_id and planned_workout_id = v_source.id)
					or exists (select 1 from public.workout_comparisons where user_id = p_user_id and planned_workout_id = v_source.id)
					or exists (select 1 from public.workout_ai_insights where user_id = p_user_id and planned_workout_id = v_source.id)
					or exists (select 1 from public.runner_activity_planned_workout_matches where user_id = p_user_id and planned_workout_id = v_source.id)
				then
					return jsonb_build_object('ok', false, 'reason', 'protected_day',
						'message', 'The stored Rest changed or became protected after Review.');
				end if;
				delete from public.planned_workouts where id = v_source.id and user_id = p_user_id
				returning * into v_deleted;
			end if;

			insert into public.planned_workouts (
				id, plan_cycle_id, user_id, origin_kind, workout_date, weekday, week_number,
				phase, workout_type, source_workout_id, source_workout_type, workout_family,
				workout_identity, calendar_icon_key, goal_context, metric_mode, title, notes,
				planned_rpe, estimated_fatigue, recovery_priority, steps, display_order
			) values (
				(p_workout_insert->>'id')::uuid, null, p_user_id, 'file_import',
				(p_workout_insert->>'workout_date')::date, p_workout_insert->>'weekday',
				(p_workout_insert->>'week_number')::integer, p_workout_insert->>'phase',
				'recorded_run'::public.workout_type, null, 'recorded_activity', 'recorded',
				'recorded_activity', 'recorded', null, p_workout_insert->'metric_mode',
				p_workout_insert->>'title', null, null, null, null, p_workout_insert->'steps',
				(p_workout_insert->>'display_order')::integer
			) returning * into v_mutated;
		else
			if p_workout_insert is not null and p_workout_insert <> 'null'::jsonb then
				return jsonb_build_object('ok', false, 'reason', 'invalid_input',
					'message', 'Occupied Activity association cannot insert a Calendar workout.');
			end if;
			if jsonb_typeof(coalesce(p_expected_source_workout, 'null'::jsonb)) <> 'object' then
				return jsonb_build_object('ok', false, 'reason', 'stale_review',
					'message', 'The occupied Calendar review is missing its exact row.');
			end if;
			select * into v_source from public.planned_workouts
			where id = (p_expected_source_workout->>'id')::uuid
				and user_id = p_user_id
				and workout_date = (p_workout_update->>'localDate')::date
			for update;
			if not found or to_jsonb(v_source) is distinct from p_expected_source_workout
				or v_source.workout_type = 'rest'
				or exists (select 1 from public.workout_logs where user_id = p_user_id and planned_workout_id = v_source.id)
				or exists (select 1 from public.workout_result_assets where user_id = p_user_id and planned_workout_id = v_source.id and activity_source_revision_id is distinct from (p_workout_update->>'sourceRevisionId')::uuid)
				or exists (select 1 from public.workout_actual_metrics where user_id = p_user_id and planned_workout_id = v_source.id and status <> 'superseded')
				or exists (select 1 from public.workout_comparisons where user_id = p_user_id and planned_workout_id = v_source.id)
				or exists (select 1 from public.workout_ai_insights where user_id = p_user_id and planned_workout_id = v_source.id)
				or exists (select 1 from public.runner_activity_planned_workout_matches where user_id = p_user_id and planned_workout_id = v_source.id)
			then
				return jsonb_build_object('ok', false, 'reason', 'protected_day',
					'message', 'The occupied workout changed or contains incompatible evidence.');
			end if;
			v_mutated := v_source;
		end if;

		update public.workout_result_assets
		set planned_workout_id = v_mutated.id,
			workout_log_id = null,
			parse_status = 'parsed',
			parse_error = null
		where id = (p_workout_update->>'assetId')::uuid
			and user_id = p_user_id
			and activity_source_revision_id = (p_workout_update->>'sourceRevisionId')::uuid
			and primary_file_kind = 'fit'
			and parse_status = 'parsed';
		if not found then
			raise exception 'The reviewed parsed FIT asset changed during Activity confirmation.';
		end if;

		insert into public.runner_activity_planned_workout_matches (
			user_id, activity_id, planned_workout_id, source_revision_id, match_method
		) values (
			p_user_id,
			(p_workout_update->>'activityId')::uuid,
			v_mutated.id,
			(p_workout_update->>'sourceRevisionId')::uuid,
			'runner_selected'
		);

		insert into public.calendar_workout_mutation_events (
			user_id, mutation_kind, planned_workout_id, source_workout_id, target_workout_id,
			source_workout_date, target_date, before_workout, after_workout, displaced_workout,
			review_payload_version, review_checksum, mutation_payload_version, mutation_checksum,
			event_payload, occurred_at
		) values (
			p_user_id, 'user_confirmed_activity', v_mutated.id,
			case when v_deleted.id is null then v_source.id else v_deleted.id end,
			v_mutated.id,
			case when v_deleted.id is null then v_source.workout_date else v_deleted.workout_date end,
			v_mutated.workout_date,
			case when v_deleted.id is not null then to_jsonb(v_deleted) else to_jsonb(v_source) end,
			to_jsonb(v_mutated), null,
			p_mutation_event->>'review_payload_version', p_mutation_event->>'review_checksum',
			p_mutation_event->>'mutation_payload_version', nullif(p_mutation_event->>'mutation_checksum', ''),
			p_mutation_event, clock_timestamp()
		) returning * into v_event;

		return jsonb_build_object(
			'ok', true,
			'mutated_workout', to_jsonb(v_mutated),
			'deleted_workout', case when v_deleted.id is null then null else to_jsonb(v_deleted) end,
			'restored_workout', null,
			'mutation_event', to_jsonb(v_event),
			'undo_expires_at', null,
			'idempotent', false
		);
	end if;

	if p_mutation_kind = 'add' then$replacement$
  );

  if v_definition = v_original
    or position('confirm_activity' in v_definition) = 0
    or position('user_confirmed_activity' in v_definition) = 0
  then
    raise exception 'The pinned Calendar mutation owner did not match the HITO-255 extension anchors.';
  end if;

  execute v_definition;
end;
$migration$;

-- Comparison is optional only for the neutral recorded_run row. Authored workouts
-- retain the existing deterministic planned-versus-actual comparison contract.
create or replace function public.finalize_runner_activity_planned_workout_projection(
  p_user_id uuid,
  p_planned_workout_id uuid,
  p_activity_id uuid,
  p_activity_revision_id uuid,
  p_source_revision_id uuid,
  p_asset_id uuid,
  p_metrics_id uuid,
  p_comparison_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.planned_workouts workout
    join public.runner_activities activity
      on activity.id = p_activity_id and activity.user_id = p_user_id
      and activity.sport = 'run' and activity.recording_kind = 'recorded'
      and activity.quality_state = 'accepted' and activity.current_revision_id = p_activity_revision_id
    join public.runner_activity_revisions activity_revision
      on activity_revision.id = p_activity_revision_id and activity_revision.user_id = p_user_id
      and activity_revision.activity_id = p_activity_id
      and activity_revision.source_revision_id = p_source_revision_id
    join public.runner_activity_source_revisions source_revision
      on source_revision.id = p_source_revision_id and source_revision.user_id = p_user_id
    join public.runner_activity_sources source
      on source.id = source_revision.source_id and source.user_id = p_user_id
      and source.activity_id = p_activity_id and source.current_revision_id = p_source_revision_id
    join public.workout_result_assets asset
      on asset.id = p_asset_id and asset.user_id = p_user_id
      and asset.planned_workout_id = p_planned_workout_id
      and asset.activity_source_revision_id = p_source_revision_id
      and asset.primary_file_kind = 'fit'
    join public.workout_actual_metrics metrics
      on metrics.id = p_metrics_id and metrics.user_id = p_user_id
      and metrics.planned_workout_id = p_planned_workout_id
      and metrics.result_asset_id = p_asset_id and metrics.activity_id = p_activity_id
      and metrics.activity_revision_id = p_activity_revision_id and metrics.source_kind = 'garmin_fit'
    left join public.workout_comparisons comparison
      on comparison.id = p_comparison_id and comparison.user_id = p_user_id
      and comparison.planned_workout_id = p_planned_workout_id
      and comparison.actual_metrics_id = p_metrics_id
      and comparison.comparison_formula_version = 'deterministic_workout_comparison_v1'
    where workout.id = p_planned_workout_id and workout.user_id = p_user_id
      and (
        (workout.workout_type = 'recorded_run' and p_comparison_id is null)
        or (
          workout.workout_type <> 'recorded_run'
          and p_comparison_id is not null
          and exists (
            select 1 from jsonb_array_elements(comparison.difference_payload->'signals') signal
            where signal->>'key' = 'activity_type' and signal->>'status' = 'matched'
              and lower(trim(signal->>'actualValue')) in ('run', 'running')
          )
        )
      )
  ) then
    raise exception 'The planned-workout FIT projection is not a complete current running chain.';
  end if;

  if exists (
    select 1
    from public.runner_activity_planned_workout_matches
    where user_id = p_user_id and activity_id = p_activity_id
      and planned_workout_id is not null and planned_workout_id <> p_planned_workout_id
  ) then
    raise exception 'The runner activity is already attached to another planned workout.';
  end if;

  update public.runner_activity_planned_workout_matches
  set planned_workout_id = null
  where user_id = p_user_id and planned_workout_id = p_planned_workout_id
    and activity_id <> p_activity_id;

  insert into public.runner_activity_planned_workout_matches (
    user_id, activity_id, planned_workout_id, source_revision_id, match_method
  ) values (
    p_user_id, p_activity_id, p_planned_workout_id, p_source_revision_id, 'runner_selected'
  )
  on conflict (activity_id) do update
  set planned_workout_id = excluded.planned_workout_id,
    source_revision_id = excluded.source_revision_id,
    match_method = excluded.match_method
  where runner_activity_planned_workout_matches.user_id = excluded.user_id;

  update public.workout_actual_metrics
  set status = 'superseded'
  where user_id = p_user_id and planned_workout_id = p_planned_workout_id
    and id <> p_metrics_id and status <> 'superseded';

  update public.workout_actual_metrics
  set status = 'normalized'
  where id = p_metrics_id and user_id = p_user_id;

  update public.workout_result_assets
  set parse_status = 'parsed', parse_error = null
  where id = p_asset_id and user_id = p_user_id;
end;
$$;

revoke execute on function public.finalize_runner_activity_planned_workout_projection(
  uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid
) from public, anon, authenticated;
grant execute on function public.finalize_runner_activity_planned_workout_projection(
  uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid
) to service_role;

create or replace function public.list_runner_fit_completed_planned_workouts(
  p_user_id uuid,
  p_planned_workout_ids uuid[]
)
returns table (planned_workout_id uuid)
language sql
stable
security invoker
set search_path = ''
as $$
  select match.planned_workout_id
  from public.runner_activity_planned_workout_matches match
  join public.planned_workouts workout
    on workout.id = match.planned_workout_id and workout.user_id = p_user_id
  join public.runner_activities activity
    on activity.id = match.activity_id and activity.user_id = p_user_id
    and activity.sport = 'run' and activity.recording_kind = 'recorded'
    and activity.quality_state = 'accepted'
  join public.runner_activity_revisions activity_revision
    on activity_revision.id = activity.current_revision_id
    and activity_revision.user_id = p_user_id and activity_revision.activity_id = activity.id
    and activity_revision.source_revision_id = match.source_revision_id
  join public.runner_activity_source_revisions source_revision
    on source_revision.id = match.source_revision_id and source_revision.user_id = p_user_id
  join public.runner_activity_sources source
    on source.id = source_revision.source_id and source.user_id = p_user_id
    and source.activity_id = activity.id and source.current_revision_id = source_revision.id
  join public.workout_actual_metrics metrics
    on metrics.user_id = p_user_id and metrics.planned_workout_id = match.planned_workout_id
    and metrics.activity_id = activity.id and metrics.activity_revision_id = activity_revision.id
    and metrics.source_kind = 'garmin_fit' and metrics.status <> 'superseded'
  join public.workout_result_assets asset
    on asset.id = metrics.result_asset_id and asset.user_id = p_user_id
    and asset.planned_workout_id = match.planned_workout_id
    and asset.activity_source_revision_id = source_revision.id
    and asset.parse_status = 'parsed' and asset.primary_file_kind = 'fit'
  left join public.workout_comparisons comparison
    on comparison.user_id = p_user_id
    and comparison.planned_workout_id = match.planned_workout_id
    and comparison.actual_metrics_id = metrics.id
    and comparison.comparison_formula_version = 'deterministic_workout_comparison_v1'
  where match.user_id = p_user_id
    and match.planned_workout_id = any(p_planned_workout_ids)
    and (
      workout.workout_type = 'recorded_run'
      or exists (
        select 1 from jsonb_array_elements(comparison.difference_payload->'signals') signal
        where signal->>'key' = 'activity_type' and signal->>'status' = 'matched'
          and lower(trim(signal->>'actualValue')) in ('run', 'running')
      )
    );
$$;

revoke execute on function public.list_runner_fit_completed_planned_workouts(uuid, uuid[])
  from public, anon, authenticated;
grant execute on function public.list_runner_fit_completed_planned_workouts(uuid, uuid[])
  to service_role;
