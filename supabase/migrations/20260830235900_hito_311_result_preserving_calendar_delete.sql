-- HITO-311: Delete removes only the Calendar projection while retained Activity
-- evidence remains factual history. The existing service-role RPC remains the
-- sole atomic Calendar mutation and audit owner.

do $migration$
declare
  v_definition text;
  v_before text;
begin
  select pg_get_functiondef(
    'public.apply_calendar_workout_mutation(uuid,date,text,jsonb,jsonb,jsonb,jsonb,jsonb)'::regprocedure
  ) into v_definition;

  v_before := v_definition;
  v_definition := replace(
    v_definition,
    $needle$if p_mutation_kind not in ('add', 'clear', 'move', 'confirm_activity')$needle$,
    $replacement$if p_mutation_kind not in ('add', 'clear', 'delete', 'move', 'confirm_activity')$replacement$
  );
  if v_definition = v_before then
    raise exception 'HITO-311 expected Calendar mutation-kind allowlist was not found.';
  end if;

  v_before := v_definition;
  v_definition := replace(
    v_definition,
    $needle$or (p_mutation_kind = 'clear' and v_event_kind <> 'user_cleared_workout')$needle$,
    $replacement$or (p_mutation_kind in ('clear', 'delete') and v_event_kind <> 'user_cleared_workout')$replacement$
  );
  if v_definition = v_before then
    raise exception 'HITO-311 expected Calendar Delete audit binding was not found.';
  end if;

  v_before := v_definition;
  v_definition := replace(
    v_definition,
    $needle$		if v_source.workout_type = 'rest'
			or exists (select 1 from public.workout_logs where user_id = p_user_id and planned_workout_id = v_source.id)
			or exists (select 1 from public.workout_result_assets where user_id = p_user_id and planned_workout_id = v_source.id)
			or exists (select 1 from public.workout_actual_metrics where user_id = p_user_id and planned_workout_id = v_source.id)
			or exists (select 1 from public.workout_comparisons where user_id = p_user_id and planned_workout_id = v_source.id)
			or exists (select 1 from public.workout_ai_insights where user_id = p_user_id and planned_workout_id = v_source.id)
			or exists (select 1 from public.runner_activity_planned_workout_matches where user_id = p_user_id and planned_workout_id = v_source.id)
		then
			return jsonb_build_object('ok', false, 'reason', 'protected_day',
				'message', 'Logged, evidence-backed, or Rest workouts cannot be moved or cleared.');
		end if;$needle$,
    $replacement$		if v_source.workout_type = 'rest'
			or (
				p_mutation_kind <> 'delete'
				and (
					exists (select 1 from public.workout_logs where user_id = p_user_id and planned_workout_id = v_source.id)
					or exists (select 1 from public.workout_result_assets where user_id = p_user_id and planned_workout_id = v_source.id)
					or exists (select 1 from public.workout_actual_metrics where user_id = p_user_id and planned_workout_id = v_source.id)
					or exists (select 1 from public.workout_comparisons where user_id = p_user_id and planned_workout_id = v_source.id)
					or exists (select 1 from public.workout_ai_insights where user_id = p_user_id and planned_workout_id = v_source.id)
					or exists (select 1 from public.runner_activity_planned_workout_matches where user_id = p_user_id and planned_workout_id = v_source.id)
				)
			)
		then
			return jsonb_build_object('ok', false, 'reason', 'protected_day',
				'message', 'Logged, evidence-backed, or Rest workouts cannot be moved.');
		end if;$replacement$
  );
  if v_definition = v_before then
    raise exception 'HITO-311 expected Calendar evidence guard was not found.';
  end if;

  v_before := v_definition;
  v_definition := replace(
    v_definition,
    $needle$		if p_mutation_kind = 'clear' then
			if v_source.workout_date < p_current_date
				or p_mutation_event->>'target_workout_id' <> v_source.id::text
				or p_mutation_event->>'target_date' <> v_source.workout_date::text
			then
				return jsonb_build_object('ok', false, 'reason', 'protected_day',
					'message', 'Past workouts and stale review evidence cannot be cleared.');
			end if;

			delete from public.planned_workouts$needle$,
    $replacement$		if p_mutation_kind in ('clear', 'delete') then
			if p_mutation_kind = 'clear' and v_source.workout_date < p_current_date then
				return jsonb_build_object('ok', false, 'reason', 'protected_day',
					'message', 'Past workouts cannot be cleared.');
			end if;

			if p_mutation_event->>'target_workout_id' <> v_source.id::text
				or p_mutation_event->>'target_date' <> v_source.workout_date::text
			then
				return jsonb_build_object('ok', false, 'reason', 'stale_review',
					'message', 'The reviewed Calendar workout identity or date changed.');
			end if;

			if p_mutation_kind = 'delete' then
				update public.workout_result_assets
				set planned_workout_id = null,
					workout_log_id = null
				where user_id = p_user_id
					and planned_workout_id = v_source.id;
			end if;

			delete from public.planned_workouts$replacement$
  );
  if v_definition = v_before then
    raise exception 'HITO-311 expected Calendar clear branch was not found.';
  end if;

  execute v_definition;
end;
$migration$;

comment on function public.apply_calendar_workout_mutation(
  uuid, date, text, jsonb, jsonb, jsonb, jsonb, jsonb
) is 'Service-role-only atomic Calendar workout mutation with evidence-preserving Delete and immutable audit.';

-- Exact rollback (execute as one migration if this change must be reverted):
/*
do $rollback$
declare
  v_definition text;
  v_before text;
begin
  select pg_get_functiondef(
    'public.apply_calendar_workout_mutation(uuid,date,text,jsonb,jsonb,jsonb,jsonb,jsonb)'::regprocedure
  ) into v_definition;

  v_before := v_definition;
  v_definition := replace(
    v_definition,
    $needle$if p_mutation_kind not in ('add', 'clear', 'delete', 'move', 'confirm_activity')$needle$,
    $replacement$if p_mutation_kind not in ('add', 'clear', 'move', 'confirm_activity')$replacement$
  );
  if v_definition = v_before then
    raise exception 'HITO-311 rollback expected Calendar mutation-kind allowlist was not found.';
  end if;

  v_before := v_definition;
  v_definition := replace(
    v_definition,
    $needle$or (p_mutation_kind in ('clear', 'delete') and v_event_kind <> 'user_cleared_workout')$needle$,
    $replacement$or (p_mutation_kind = 'clear' and v_event_kind <> 'user_cleared_workout')$replacement$
  );
  if v_definition = v_before then
    raise exception 'HITO-311 rollback expected Calendar Delete audit binding was not found.';
  end if;

  v_before := v_definition;
  v_definition := replace(
    v_definition,
    $needle$		if v_source.workout_type = 'rest'
			or (
				p_mutation_kind <> 'delete'
				and (
					exists (select 1 from public.workout_logs where user_id = p_user_id and planned_workout_id = v_source.id)
					or exists (select 1 from public.workout_result_assets where user_id = p_user_id and planned_workout_id = v_source.id)
					or exists (select 1 from public.workout_actual_metrics where user_id = p_user_id and planned_workout_id = v_source.id)
					or exists (select 1 from public.workout_comparisons where user_id = p_user_id and planned_workout_id = v_source.id)
					or exists (select 1 from public.workout_ai_insights where user_id = p_user_id and planned_workout_id = v_source.id)
					or exists (select 1 from public.runner_activity_planned_workout_matches where user_id = p_user_id and planned_workout_id = v_source.id)
				)
			)
		then
			return jsonb_build_object('ok', false, 'reason', 'protected_day',
				'message', 'Logged, evidence-backed, or Rest workouts cannot be moved.');
		end if;$needle$,
    $replacement$		if v_source.workout_type = 'rest'
			or exists (select 1 from public.workout_logs where user_id = p_user_id and planned_workout_id = v_source.id)
			or exists (select 1 from public.workout_result_assets where user_id = p_user_id and planned_workout_id = v_source.id)
			or exists (select 1 from public.workout_actual_metrics where user_id = p_user_id and planned_workout_id = v_source.id)
			or exists (select 1 from public.workout_comparisons where user_id = p_user_id and planned_workout_id = v_source.id)
			or exists (select 1 from public.workout_ai_insights where user_id = p_user_id and planned_workout_id = v_source.id)
			or exists (select 1 from public.runner_activity_planned_workout_matches where user_id = p_user_id and planned_workout_id = v_source.id)
		then
			return jsonb_build_object('ok', false, 'reason', 'protected_day',
				'message', 'Logged, evidence-backed, or Rest workouts cannot be moved or cleared.');
		end if;$replacement$
  );
  if v_definition = v_before then
    raise exception 'HITO-311 rollback expected Calendar evidence guard was not found.';
  end if;

  v_before := v_definition;
  v_definition := replace(
    v_definition,
    $needle$		if p_mutation_kind in ('clear', 'delete') then
			if p_mutation_kind = 'clear' and v_source.workout_date < p_current_date then
				return jsonb_build_object('ok', false, 'reason', 'protected_day',
					'message', 'Past workouts cannot be cleared.');
			end if;

			if p_mutation_event->>'target_workout_id' <> v_source.id::text
				or p_mutation_event->>'target_date' <> v_source.workout_date::text
			then
				return jsonb_build_object('ok', false, 'reason', 'stale_review',
					'message', 'The reviewed Calendar workout identity or date changed.');
			end if;

			if p_mutation_kind = 'delete' then
				update public.workout_result_assets
				set planned_workout_id = null,
					workout_log_id = null
				where user_id = p_user_id
					and planned_workout_id = v_source.id;
			end if;

			delete from public.planned_workouts$needle$,
    $replacement$		if p_mutation_kind = 'clear' then
			if v_source.workout_date < p_current_date
				or p_mutation_event->>'target_workout_id' <> v_source.id::text
				or p_mutation_event->>'target_date' <> v_source.workout_date::text
			then
				return jsonb_build_object('ok', false, 'reason', 'protected_day',
					'message', 'Past workouts and stale review evidence cannot be cleared.');
			end if;

			delete from public.planned_workouts$replacement$
  );
  if v_definition = v_before then
    raise exception 'HITO-311 rollback expected Calendar clear branch was not found.';
  end if;

  execute v_definition;
end;
$rollback$;

comment on function public.apply_calendar_workout_mutation(
  uuid, date, text, jsonb, jsonb, jsonb, jsonb, jsonb
) is null;
*/
