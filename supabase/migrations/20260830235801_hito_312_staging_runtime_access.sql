-- HITO-312: expose the already-isolated training schema to the trusted server runtime.
-- Production continues to use public; the runtime resolver owns the schema selection.

do $hito_312_runtime_prerequisites$
declare
  v_schema_comment text;
begin
  if to_regnamespace('hito_staging') is null
     or to_regrole('hito_staging_authenticated') is null then
    raise exception 'hito_312_runtime_staging_dataset_missing';
  end if;

  select obj_description(to_regnamespace('hito_staging'), 'pg_namespace')
    into v_schema_comment;

  if v_schema_comment is distinct from
     'HITO-312 isolated synthetic staging dataset; never Production data or a promotion source.' then
    raise exception 'hito_312_runtime_staging_dataset_identity_mismatch';
  end if;

  if to_regprocedure('hito_staging.hito_312_assert_runtime_dataset()') is not null then
    raise exception 'hito_312_runtime_target_already_materialized';
  end if;
end
$hito_312_runtime_prerequisites$;

do $$
declare
  v_role_settings text[];
  v_db_schemas text;
  v_pre_request text;
  v_expected_tables constant text[] := array[
    'calendar_workout_mutation_events',
    'plan_cycles',
    'planned_workouts',
    'runner_activities',
    'runner_activity_evidence_revisions',
    'runner_activity_fact_snapshots',
    'runner_activity_metric_observations',
    'runner_activity_metric_snapshots',
    'runner_activity_planned_workout_matches',
    'runner_activity_revisions',
    'runner_activity_source_revisions',
    'runner_activity_sources',
    'runner_manual_workout_templates',
    'runner_profiles',
    'workout_actual_metrics',
    'workout_ai_insights',
    'workout_comparisons',
    'workout_logs',
    'workout_result_assets'
  ];
  v_actual_tables text[];
begin
  if to_regnamespace('hito_staging') is null then
    raise exception 'HITO-312 staging runtime access requires the applied staging dataset.';
  end if;

  select coalesce(array_agg(c.relname order by c.relname), array[]::text[])
    into v_actual_tables
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'hito_staging'
    and c.relkind in ('r', 'p');

  if v_actual_tables is distinct from v_expected_tables then
    raise exception 'HITO-312 staging runtime table manifest differs from the accepted dataset.';
  end if;

  select s.setconfig
    into v_role_settings
  from pg_db_role_setting s
  where s.setdatabase = 0
    and s.setrole = 'authenticator'::regrole;

  select split_part(setting, '=', 2)
    into v_db_schemas
  from unnest(coalesce(v_role_settings, array[]::text[])) setting
  where split_part(setting, '=', 1) = 'pgrst.db_schemas';

  select split_part(setting, '=', 2)
    into v_pre_request
  from unnest(coalesce(v_role_settings, array[]::text[])) setting
  where split_part(setting, '=', 1) = 'pgrst.db_pre_request';

  if v_db_schemas is not null then
    raise exception 'HITO-312 refuses to replace an existing PostgREST schema override.';
  end if;

  if v_pre_request is not null then
    raise exception 'HITO-312 refuses to replace an existing PostgREST pre-request override.';
  end if;
end
$$;

create function hito_staging.hito_312_assert_runtime_dataset()
returns void
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_headers jsonb := coalesce(
    nullif(current_setting('request.headers', true), '')::jsonb,
    '{}'::jsonb
  );
  v_dataset text := nullif(v_headers ->> 'x-hito-dataset', '');
  v_profile text := coalesce(
    nullif(v_headers ->> 'content-profile', ''),
    nullif(v_headers ->> 'accept-profile', ''),
    'public'
  );
begin
  if v_dataset is not null and v_dataset not in ('production', 'staging') then
    raise insufficient_privilege using message = 'Unsupported Hito dataset request.';
  end if;

  if v_profile = 'hito_staging' and v_dataset is distinct from 'staging' then
    raise insufficient_privilege using message = 'Staging schema requires the trusted staging dataset header.';
  end if;

  if v_dataset = 'staging' and v_profile <> 'hito_staging' then
    raise insufficient_privilege using message = 'Staging runtime cannot target a non-staging schema.';
  end if;

  if v_dataset = 'production' and v_profile = 'hito_staging' then
    raise insufficient_privilege using message = 'Production runtime cannot target the staging schema.';
  end if;
end
$$;

-- The staging schema was cloned before HITO-311 was released. Apply the frozen
-- evidence-preserving Delete semantics only to its existing Calendar RPC.
do $hito_311_staging_parity$
declare
  v_definition text;
  v_before text;
begin
  select pg_get_functiondef(
    'hito_staging.apply_calendar_workout_mutation(uuid,date,text,jsonb,jsonb,jsonb,jsonb,jsonb)'::regprocedure
  ) into v_definition;

  v_before := v_definition;
  v_definition := replace(
    v_definition,
    $needle$if p_mutation_kind not in ('add', 'clear', 'move', 'confirm_activity')$needle$,
    $replacement$if p_mutation_kind not in ('add', 'clear', 'delete', 'move', 'confirm_activity')$replacement$
  );
  if v_definition = v_before then
    raise exception 'HITO-312 expected the pre-HITO-311 Calendar mutation-kind allowlist.';
  end if;

  v_before := v_definition;
  v_definition := replace(
    v_definition,
    $needle$or (p_mutation_kind = 'clear' and v_event_kind <> 'user_cleared_workout')$needle$,
    $replacement$or (p_mutation_kind in ('clear', 'delete') and v_event_kind <> 'user_cleared_workout')$replacement$
  );
  if v_definition = v_before then
    raise exception 'HITO-312 expected the pre-HITO-311 Calendar Delete audit binding.';
  end if;

  v_before := v_definition;
  v_definition := replace(
    v_definition,
    $needle$		if v_source.workout_type = 'rest'
			or exists (select 1 from hito_staging.workout_logs where user_id = p_user_id and planned_workout_id = v_source.id)
			or exists (select 1 from hito_staging.workout_result_assets where user_id = p_user_id and planned_workout_id = v_source.id)
			or exists (select 1 from hito_staging.workout_actual_metrics where user_id = p_user_id and planned_workout_id = v_source.id)
			or exists (select 1 from hito_staging.workout_comparisons where user_id = p_user_id and planned_workout_id = v_source.id)
			or exists (select 1 from hito_staging.workout_ai_insights where user_id = p_user_id and planned_workout_id = v_source.id)
			or exists (select 1 from hito_staging.runner_activity_planned_workout_matches where user_id = p_user_id and planned_workout_id = v_source.id)
		then
			return jsonb_build_object('ok', false, 'reason', 'protected_day',
				'message', 'Logged, evidence-backed, or Rest workouts cannot be moved or cleared.');
		end if;$needle$,
    $replacement$		if v_source.workout_type = 'rest'
			or (
				p_mutation_kind <> 'delete'
				and (
					exists (select 1 from hito_staging.workout_logs where user_id = p_user_id and planned_workout_id = v_source.id)
					or exists (select 1 from hito_staging.workout_result_assets where user_id = p_user_id and planned_workout_id = v_source.id)
					or exists (select 1 from hito_staging.workout_actual_metrics where user_id = p_user_id and planned_workout_id = v_source.id)
					or exists (select 1 from hito_staging.workout_comparisons where user_id = p_user_id and planned_workout_id = v_source.id)
					or exists (select 1 from hito_staging.workout_ai_insights where user_id = p_user_id and planned_workout_id = v_source.id)
					or exists (select 1 from hito_staging.runner_activity_planned_workout_matches where user_id = p_user_id and planned_workout_id = v_source.id)
				)
			)
		then
			return jsonb_build_object('ok', false, 'reason', 'protected_day',
				'message', 'Logged, evidence-backed, or Rest workouts cannot be moved.');
		end if;$replacement$
  );
  if v_definition = v_before then
    raise exception 'HITO-312 expected the pre-HITO-311 Calendar evidence guard.';
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

			delete from hito_staging.planned_workouts$needle$,
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
				update hito_staging.workout_result_assets
				set planned_workout_id = null,
					workout_log_id = null
				where user_id = p_user_id
					and planned_workout_id = v_source.id;
			end if;

			delete from hito_staging.planned_workouts$replacement$
  );
  if v_definition = v_before then
    raise exception 'HITO-312 expected the pre-HITO-311 Calendar clear branch.';
  end if;

  execute v_definition;
end
$hito_311_staging_parity$;

comment on function hito_staging.apply_calendar_workout_mutation(
  uuid, date, text, jsonb, jsonb, jsonb, jsonb, jsonb
) is 'HITO-311-parity service-only staging Calendar mutation with evidence-preserving Delete.';

revoke all on function hito_staging.hito_312_assert_runtime_dataset() from public;
grant usage on schema hito_staging to anon, authenticated, service_role;
grant execute on function hito_staging.hito_312_assert_runtime_dataset()
  to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema hito_staging to service_role;
grant usage, select, update on all sequences in schema hito_staging to service_role;

grant execute on function hito_staging.append_runner_activity_evidence_revision(uuid,uuid,uuid,text,text,integer,text,numeric,numeric,date,text,text,uuid,text,timestamp with time zone,uuid) to service_role;
grant execute on function hito_staging.apply_calendar_workout_content_edit(uuid,uuid,date,jsonb,jsonb,jsonb) to service_role;
grant execute on function hito_staging.apply_calendar_workout_mutation(uuid,date,text,jsonb,jsonb,jsonb,jsonb,jsonb) to service_role;
grant execute on function hito_staging.delete_runner_activity_from_history(uuid,uuid) to service_role;
grant execute on function hito_staging.finalize_runner_activity_planned_workout_projection(uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid) to service_role;
grant execute on function hito_staging.list_runner_activity_history_page(uuid,integer,date,timestamp with time zone,uuid) to service_role;
grant execute on function hito_staging.list_runner_fit_completed_planned_workouts(uuid,uuid[]) to service_role;
grant execute on function hito_staging.persist_runner_activity_garmin_source(uuid,text,jsonb,jsonb) to service_role;
grant execute on function hito_staging.sync_workout_log_runner_activity_rpe(uuid,uuid,text,uuid,text) to service_role;

alter role authenticator
  set pgrst.db_schemas = 'public, storage, graphql_public, hito_staging';
alter role authenticator
  set pgrst.db_pre_request = 'hito_staging.hito_312_assert_runtime_dataset';

notify pgrst, 'reload config';
notify pgrst, 'reload schema';

do $$
declare
  v_role_settings text[];
  v_db_schemas text;
  v_pre_request text;
begin
  select s.setconfig
    into v_role_settings
  from pg_db_role_setting s
  where s.setdatabase = 0
    and s.setrole = 'authenticator'::regrole;

  select split_part(setting, '=', 2)
    into v_db_schemas
  from unnest(coalesce(v_role_settings, array[]::text[])) setting
  where split_part(setting, '=', 1) = 'pgrst.db_schemas';

  select split_part(setting, '=', 2)
    into v_pre_request
  from unnest(coalesce(v_role_settings, array[]::text[])) setting
  where split_part(setting, '=', 1) = 'pgrst.db_pre_request';

  if regexp_replace(coalesce(v_db_schemas, ''), '\s+', '', 'g')
     <> 'public,storage,graphql_public,hito_staging' then
    raise exception 'HITO-312 PostgREST schema exposure did not reach the exact accepted state.';
  end if;

  if v_pre_request is distinct from 'hito_staging.hito_312_assert_runtime_dataset' then
    raise exception 'HITO-312 PostgREST request guard did not reach the exact accepted state.';
  end if;

  if not has_schema_privilege('service_role', 'hito_staging', 'USAGE') then
    raise exception 'HITO-312 service role cannot use the staging schema.';
  end if;

  if exists (
    select 1
    from unnest(array[
      'hito_312_owned_counts(uuid)',
      'hito_312_status()',
      'hito_312_seed()',
      'hito_312_reset()'
    ]) signature
    where has_function_privilege(
      'service_role',
      ('hito_staging.' || signature)::regprocedure,
      'EXECUTE'
    )
  ) then
    raise exception 'HITO-312 runtime must not execute staging seed/reset lifecycle functions.';
  end if;
end
$$;

-- Exact rollback for this migration after proving no staging runtime is active:
-- alter role authenticator reset pgrst.db_pre_request;
-- alter role authenticator reset pgrst.db_schemas;
-- revoke execute on function hito_staging.hito_312_assert_runtime_dataset() from anon, authenticated, service_role;
-- revoke usage on schema hito_staging from anon, authenticated, service_role;
-- revoke select, insert, update, delete on all tables in schema hito_staging from service_role;
-- revoke usage, select, update on all sequences in schema hito_staging from service_role;
-- revoke execute on all functions in schema hito_staging from service_role;
-- drop function hito_staging.hito_312_assert_runtime_dataset();
-- notify pgrst, 'reload config';
-- notify pgrst, 'reload schema';
