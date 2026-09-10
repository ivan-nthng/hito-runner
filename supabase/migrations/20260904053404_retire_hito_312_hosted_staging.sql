-- HITO-312: retire the abandoned hosted staging dataset without changing public data or behavior.
-- The three historical staging migrations remain immutable migration history.

begin;

do $hito_312_retirement$
declare
  v_tables constant text[] := array[
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
  v_functions constant text[] := array[
    'hito_312_reset(uuid)',
    'hito_312_seed(uuid,date)',
    'hito_312_status(uuid)',
    'hito_312_global_task_residue(uuid)',
    'hito_312_task_counts(uuid)',
    'hito_312_reset()',
    'hito_312_seed()',
    'hito_312_status()',
    'hito_312_owned_counts(uuid)',
    'hito_312_assert_runtime_dataset()',
    'append_runner_activity_evidence_revision(uuid,uuid,uuid,text,text,integer,text,numeric,numeric,date,text,text,uuid,text,timestampwithtimezone,uuid)',
    'apply_calendar_workout_content_edit(uuid,uuid,date,jsonb,jsonb,jsonb)',
    'apply_calendar_workout_mutation(uuid,date,text,jsonb,jsonb,jsonb,jsonb,jsonb)',
    'delete_runner_activity_from_history(uuid,uuid)',
    'finalize_runner_activity_planned_workout_projection(uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid)',
    'list_runner_activity_history_page(uuid,integer,date,timestampwithtimezone,uuid)',
    'list_runner_fit_completed_planned_workouts(uuid,uuid[])',
    'persist_runner_activity_garmin_source(uuid,text,jsonb,jsonb)',
    'sync_workout_log_runner_activity_rpe(uuid,uuid,text,uuid,text)',
    'protect_saved_plan_record_immutability()',
    'set_updated_at()',
    'sync_runner_activity_match_from_result_asset()',
    'sync_runner_activity_match_rpe_trigger()',
    'sync_runner_activity_revision_rpe_trigger()',
    'sync_workout_log_runner_activity_rpe_trigger()',
    'sync_workout_log_user_id()',
    'validate_runner_heart_rate_profile_write()',
    'validate_runner_profile_calendar_timezone()'
  ];
  v_triggers constant text[] := array[
    'plan_cycles:plan_cycles_saved_plan_record_immutability',
    'plan_cycles:plan_cycles_set_updated_at',
    'runner_activities:runner_activities_set_updated_at',
    'runner_activities:runner_activities_sync_revision_rpe',
    'runner_activity_planned_workout_matches:runner_activity_matches_sync_runner_activity_rpe',
    'runner_activity_sources:runner_activity_sources_set_updated_at',
    'runner_manual_workout_templates:runner_manual_workout_templates_set_updated_at',
    'runner_profiles:runner_profiles_set_updated_at',
    'runner_profiles:runner_profiles_validate_calendar_timezone',
    'runner_profiles:runner_profiles_validate_heart_rate_profile_write',
    'workout_actual_metrics:workout_actual_metrics_set_updated_at',
    'workout_ai_insights:workout_ai_insights_set_updated_at',
    'workout_logs:workout_logs_set_updated_at',
    'workout_logs:workout_logs_sync_runner_activity_rpe',
    'workout_logs:workout_logs_sync_user_id',
    'workout_result_assets:workout_result_assets_set_updated_at',
    'workout_result_assets:workout_result_assets_sync_runner_activity_match'
  ];
  v_foreign_keys constant text[] := array[
    'calendar_workout_mutation_events:calendar_workout_mutation_events_undo_of_event_id_fkey',
    'calendar_workout_mutation_events:calendar_workout_mutation_events_user_id_fkey',
    'plan_cycles:plan_cycles_user_id_fkey',
    'planned_workouts:planned_workouts_source_owner_fkey',
    'planned_workouts:planned_workouts_user_id_fkey',
    'runner_activities:runner_activities_current_revision_id_fkey',
    'runner_activities:runner_activities_user_id_fkey',
    'runner_activity_evidence_revisions:runner_activity_evidence_revisions_activity_id_fkey',
    'runner_activity_evidence_revisions:runner_activity_evidence_revisions_activity_revision_id_fkey',
    'runner_activity_evidence_revisions:runner_activity_evidence_revisions_actor_user_id_fkey',
    'runner_activity_evidence_revisions:runner_activity_evidence_revisions_predecessor_revision_id_fkey',
    'runner_activity_evidence_revisions:runner_activity_evidence_revisions_user_id_fkey',
    'runner_activity_evidence_revisions:runner_activity_evidence_revisions_workout_log_id_fkey',
    'runner_activity_fact_snapshots:runner_activity_fact_snapshots_user_id_fkey',
    'runner_activity_metric_observations:runner_activity_metric_observations_activity_id_fkey',
    'runner_activity_metric_observations:runner_activity_metric_observations_activity_revision_id_fkey',
    'runner_activity_metric_observations:runner_activity_metric_observations_evidence_revision_id_fkey',
    'runner_activity_metric_observations:runner_activity_metric_observations_source_revision_id_fkey',
    'runner_activity_metric_observations:runner_activity_metric_observations_user_id_fkey',
    'runner_activity_metric_snapshots:runner_activity_metric_snapshots_user_id_fkey',
    'runner_activity_planned_workout_matches:runner_activity_planned_workout_matches_activity_id_fkey',
    'runner_activity_planned_workout_matches:runner_activity_planned_workout_matches_planned_workout_id_fkey',
    'runner_activity_planned_workout_matches:runner_activity_planned_workout_matches_source_revision_id_fkey',
    'runner_activity_planned_workout_matches:runner_activity_planned_workout_matches_user_id_fkey',
    'runner_activity_revisions:runner_activity_revisions_activity_id_fkey',
    'runner_activity_revisions:runner_activity_revisions_source_revision_id_fkey',
    'runner_activity_revisions:runner_activity_revisions_user_id_fkey',
    'runner_activity_source_revisions:runner_activity_source_revisions_source_id_fkey',
    'runner_activity_source_revisions:runner_activity_source_revisions_user_id_fkey',
    'runner_activity_sources:runner_activity_sources_activity_id_fkey',
    'runner_activity_sources:runner_activity_sources_current_revision_id_fkey',
    'runner_activity_sources:runner_activity_sources_user_id_fkey',
    'runner_manual_workout_templates:runner_manual_workout_templates_user_id_fkey',
    'runner_profiles:runner_profiles_user_id_fkey',
    'workout_actual_metrics:workout_actual_metrics_activity_id_fkey',
    'workout_actual_metrics:workout_actual_metrics_activity_revision_id_fkey',
    'workout_actual_metrics:workout_actual_metrics_planned_workout_id_fkey',
    'workout_actual_metrics:workout_actual_metrics_result_asset_id_fkey',
    'workout_actual_metrics:workout_actual_metrics_user_id_fkey',
    'workout_actual_metrics:workout_actual_metrics_workout_log_id_fkey',
    'workout_ai_insights:workout_ai_insights_actual_metrics_id_fkey',
    'workout_ai_insights:workout_ai_insights_comparison_id_fkey',
    'workout_ai_insights:workout_ai_insights_planned_workout_id_fkey',
    'workout_ai_insights:workout_ai_insights_user_id_fkey',
    'workout_comparisons:workout_comparisons_actual_metrics_id_fkey',
    'workout_comparisons:workout_comparisons_planned_workout_id_fkey',
    'workout_comparisons:workout_comparisons_user_id_fkey',
    'workout_logs:workout_logs_planned_workout_id_fkey',
    'workout_logs:workout_logs_user_id_fkey',
    'workout_result_assets:workout_result_assets_activity_source_revision_id_fkey',
    'workout_result_assets:workout_result_assets_planned_workout_id_fkey',
    'workout_result_assets:workout_result_assets_user_id_fkey',
    'workout_result_assets:workout_result_assets_workout_log_id_fkey'
  ];
  v_actual text[];
  v_item text;
  v_record record;
  v_role_settings text[];
  v_db_schemas text;
  v_pre_request text;
  v_row_count bigint;
begin
  if to_regnamespace('hito_staging') is null
     or to_regrole('hito_staging_authenticated') is null then
    raise exception 'HITO-312 retirement requires the exact staging schema and role.';
  end if;

  if obj_description(to_regnamespace('hito_staging'), 'pg_namespace') is distinct from
     'HITO-312 isolated synthetic staging dataset; never Production data or a promotion source.' then
    raise exception 'HITO-312 retirement refuses an unexpected staging schema identity.';
  end if;

  select coalesce(array_agg(c.relname order by c.relname), array[]::text[])
    into v_actual
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'hito_staging'
    and c.relkind in ('r', 'p');
  if v_actual is distinct from v_tables then
    raise exception 'HITO-312 retirement table manifest mismatch: %', v_actual;
  end if;

  foreach v_item in array v_tables loop
    execute format('select count(*) from hito_staging.%I', v_item) into v_row_count;
    if v_row_count <> 0 then
      raise exception 'HITO-312 retirement refuses nonzero staging table %: %', v_item, v_row_count;
    end if;
  end loop;

  select coalesce(
    array_agg(
      p.proname || '(' || replace(pg_catalog.oidvectortypes(p.proargtypes), ' ', '') || ')'
      order by p.proname, replace(pg_catalog.oidvectortypes(p.proargtypes), ' ', '')
    ),
    array[]::text[]
  ) into v_actual
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'hito_staging';
  if v_actual is distinct from (
    select array_agg(signature order by split_part(signature, '(', 1), signature)
    from unnest(v_functions) signature
  ) then
    raise exception 'HITO-312 retirement function manifest mismatch: %', v_actual;
  end if;

  select coalesce(array_agg(c.relname || ':' || t.tgname order by c.relname, t.tgname), array[]::text[])
    into v_actual
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'hito_staging'
    and not t.tgisinternal;
  if v_actual is distinct from v_triggers then
    raise exception 'HITO-312 retirement trigger manifest mismatch: %', v_actual;
  end if;

  select coalesce(array_agg(c.relname || ':' || con.conname order by c.relname, con.conname), array[]::text[])
    into v_actual
  from pg_constraint con
  join pg_class c on c.oid = con.conrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'hito_staging'
    and con.contype = 'f';
  if v_actual is distinct from v_foreign_keys then
    raise exception 'HITO-312 retirement foreign-key manifest mismatch: %', v_actual;
  end if;

  if encode(extensions.digest(array_to_string(v_actual, E'\n') || E'\n', 'sha256'), 'hex')
     <> '85bd2a498f3749c6e4f08d519c1fbfb4ae0f27b83f2487ff95021cffa1bf5635' then
    raise exception 'HITO-312 retirement foreign-key digest mismatch.';
  end if;

  if exists (
    select 1
    from pg_stat_activity
    where pid <> pg_backend_pid()
      and state <> 'idle'
      and query ~* '\mhito_staging\M'
  ) then
    raise exception 'HITO-312 retirement refuses an active staging database request.';
  end if;

  if (select count(*) from storage.objects where bucket_id = 'hito-staging-workout-result-assets') <> 0 then
    raise exception 'HITO-312 retirement refuses nonzero staging Storage objects.';
  end if;
  if exists (
    select 1
    from storage.buckets
    where id = 'hito-staging-workout-result-assets'
      or name = 'hito-staging-workout-result-assets'
  ) then
    raise exception 'HITO-312 retirement requires the empty staging bucket to be removed through the Storage API first.';
  end if;

  select coalesce(array_agg(policyname order by policyname), array[]::text[])
    into v_actual
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and policyname like 'hito_staging_storage_%_own';
  if v_actual is distinct from array[
    'hito_staging_storage_delete_own',
    'hito_staging_storage_insert_own',
    'hito_staging_storage_select_own',
    'hito_staging_storage_update_own'
  ]::text[] then
    raise exception 'HITO-312 retirement Storage policy manifest mismatch: %', v_actual;
  end if;

  select s.setconfig into v_role_settings
  from pg_db_role_setting s
  where s.setdatabase = 0
    and s.setrole = 'authenticator'::regrole;
  select split_part(setting, '=', 2) into v_db_schemas
  from unnest(coalesce(v_role_settings, array[]::text[])) setting
  where split_part(setting, '=', 1) = 'pgrst.db_schemas';
  select split_part(setting, '=', 2) into v_pre_request
  from unnest(coalesce(v_role_settings, array[]::text[])) setting
  where split_part(setting, '=', 1) = 'pgrst.db_pre_request';
  if regexp_replace(coalesce(v_db_schemas, ''), '\s+', '', 'g')
     <> 'public,storage,graphql_public,hito_staging'
     or v_pre_request is distinct from 'hito_staging.hito_312_assert_runtime_dataset' then
    raise exception 'HITO-312 retirement refuses unexpected PostgREST staging settings.';
  end if;

  if exists (
    select 1
    from unnest(array['authenticator', 'anon', 'authenticated', 'service_role']) runtime_role
    where pg_has_role(runtime_role, 'hito_staging_authenticated', 'MEMBER')
  ) or exists (
    select 1
    from pg_auth_members membership
    join pg_roles member_role on member_role.oid = membership.member
    join pg_database database_record on database_record.datname = current_database()
    join pg_namespace staging_schema on staging_schema.nspname = 'hito_staging'
    where membership.roleid = 'hito_staging_authenticated'::regrole
      and not (
        member_role.rolsuper
        or member_role.rolcreaterole
        or member_role.oid = database_record.datdba
        or member_role.oid = staging_schema.nspowner
        or member_role.rolname = 'pg_database_owner'
      )
  ) then
    raise exception 'HITO-312 retirement refuses an unexpected staging role membership.';
  end if;

  -- All preceding checks are read-only. Every following mutation is task-owned
  -- and remains inside this transaction; any dependency error rolls it back.
  drop policy "hito_staging_storage_delete_own" on storage.objects;
  drop policy "hito_staging_storage_insert_own" on storage.objects;
  drop policy "hito_staging_storage_select_own" on storage.objects;
  drop policy "hito_staging_storage_update_own" on storage.objects;

  alter role authenticator reset pgrst.db_pre_request;
  alter role authenticator reset pgrst.db_schemas;

  foreach v_item in array v_triggers loop
    execute format(
      'drop trigger %I on hito_staging.%I',
      split_part(v_item, ':', 2),
      split_part(v_item, ':', 1)
    );
  end loop;

  foreach v_item in array v_foreign_keys loop
    execute format(
      'alter table hito_staging.%I drop constraint %I',
      split_part(v_item, ':', 1),
      split_part(v_item, ':', 2)
    );
  end loop;

  for v_record in
    select format('%I.%I(%s)', n.nspname, p.proname, pg_get_function_identity_arguments(p.oid))
      as object_identity
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'hito_staging'
    order by
      case when p.proname like 'hito_312_%' then 0 else 1 end,
      p.proname,
      pg_get_function_identity_arguments(p.oid)
  loop
    execute format('drop function %s', v_record.object_identity);
  end loop;

  foreach v_item in array v_tables loop
    execute format('drop table hito_staging.%I', v_item);
  end loop;

  revoke all privileges on storage.objects from hito_staging_authenticated;
  drop schema hito_staging;

  for v_record in
    select member_role.rolname as member_name
    from pg_auth_members membership
    join pg_roles member_role on member_role.oid = membership.member
    where membership.roleid = 'hito_staging_authenticated'::regrole
  loop
    execute format('revoke hito_staging_authenticated from %I', v_record.member_name);
  end loop;
  drop role hito_staging_authenticated;

  perform pg_notify('pgrst', 'reload config');
  perform pg_notify('pgrst', 'reload schema');
end
$hito_312_retirement$;

commit;

-- Rollback is forward-only: generate a new migration that reapplies the three
-- immutable HITO-312 migrations in order after exact zero-residue and provider
-- admission. Never edit or mark this retirement migration reverted.
