-- HITO-312: one isolated synthetic dataset inside the existing Supabase project.
-- The schema is intentionally absent from the Data API. Hosted lifecycle data
-- operations run only through the admitted direct-SQL connector.

do $migration$
declare
  v_staging_role constant text := 'hito_staging_authenticated';
  v_runtime_roles constant text[] := array[
    'authenticator',
    'anon',
    'authenticated',
    'service_role'
  ];
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
  v_function_signatures constant text[] := array[
    'public.append_runner_activity_evidence_revision(uuid,uuid,uuid,text,text,integer,text,numeric,numeric,date,text,text,uuid,text,timestamp with time zone,uuid)',
    'public.apply_calendar_workout_content_edit(uuid,uuid,date,jsonb,jsonb,jsonb)',
    'public.apply_calendar_workout_mutation(uuid,date,text,jsonb,jsonb,jsonb,jsonb,jsonb)',
    'public.delete_runner_activity_from_history(uuid,uuid)',
    'public.finalize_runner_activity_planned_workout_projection(uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid)',
    'public.list_runner_activity_history_page(uuid,integer,date,timestamp with time zone,uuid)',
    'public.list_runner_fit_completed_planned_workouts(uuid,uuid[])',
    'public.persist_runner_activity_garmin_source(uuid,text,jsonb,jsonb)',
    'public.protect_saved_plan_record_immutability()',
    'public.set_updated_at()',
    'public.sync_runner_activity_match_from_result_asset()',
    'public.sync_runner_activity_match_rpe_trigger()',
    'public.sync_runner_activity_revision_rpe_trigger()',
    'public.sync_workout_log_runner_activity_rpe(uuid,uuid,text,uuid,text)',
    'public.sync_workout_log_runner_activity_rpe_trigger()',
    'public.sync_workout_log_user_id()',
    'public.validate_runner_heart_rate_profile_write()',
    'public.validate_runner_profile_calendar_timezone()'
  ];
  v_function_names constant text[] := array[
    'append_runner_activity_evidence_revision',
    'apply_calendar_workout_content_edit',
    'apply_calendar_workout_mutation',
    'delete_runner_activity_from_history',
    'finalize_runner_activity_planned_workout_projection',
    'list_runner_activity_history_page',
    'list_runner_fit_completed_planned_workouts',
    'persist_runner_activity_garmin_source',
    'protect_saved_plan_record_immutability',
    'set_updated_at',
    'sync_runner_activity_match_from_result_asset',
    'sync_runner_activity_match_rpe_trigger',
    'sync_runner_activity_revision_rpe_trigger',
    'sync_workout_log_runner_activity_rpe',
    'sync_workout_log_runner_activity_rpe_trigger',
    'sync_workout_log_user_id',
    'validate_runner_heart_rate_profile_write',
    'validate_runner_profile_calendar_timezone'
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
  v_identity_columns constant text[] := array[
    'calendar_workout_mutation_events:id'
  ];
  v_actual text[];
  v_definition text;
  v_item text;
  v_name text;
  v_oid oid;
  v_record record;
begin
  if to_regnamespace('hito_staging') is not null then
    raise exception 'HITO-312 staging schema must be absent before initial materialization.';
  end if;

  select array_agg(table_name order by table_name)
  into v_actual
  from unnest(v_tables) table_name
  where to_regclass(format('public.%I', table_name)) is not null;

  if coalesce(v_actual, array[]::text[]) <> v_tables then
    raise exception 'HITO-312 public table manifest differs from the admitted Calendar/Activity/FIT manifest.';
  end if;

  select array_agg(c.relname || ':' || t.tgname order by c.relname, t.tgname)
  into v_actual
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = any(v_tables)
    and not t.tgisinternal;

  if coalesce(v_actual, array[]::text[]) <> v_triggers then
    raise exception 'HITO-312 public trigger manifest differs from the admitted Calendar/Activity/FIT manifest.';
  end if;

  select array_agg(c.relname || ':' || con.conname order by c.relname, con.conname)
  into v_actual
  from pg_constraint con
  join pg_class c on c.oid = con.conrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = any(v_tables)
    and con.contype = 'f';

  if coalesce(v_actual, array[]::text[]) <> v_foreign_keys then
    raise exception 'HITO-312 public foreign-key manifest differs from the admitted Calendar/Activity/FIT manifest.';
  end if;

  select array_agg(c.relname || ':' || a.attname order by c.relname, a.attname)
  into v_actual
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = any(v_tables)
    and a.attidentity <> '';

  if coalesce(v_actual, array[]::text[]) <> v_identity_columns then
    raise exception 'HITO-312 public identity-sequence manifest differs from the admitted Calendar/Activity/FIT manifest.';
  end if;

  if exists (
    select 1
    from pg_attrdef d
    join pg_class c on c.oid = d.adrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = any(v_tables)
      and pg_get_expr(d.adbin, d.adrelid) ~* '(nextval\s*\(|public\.)'
  ) then
    raise exception 'HITO-312 admitted table default contains a Production sequence or row dependency.';
  end if;

  foreach v_item in array v_function_signatures loop
    if to_regprocedure(v_item) is null then
      raise exception 'HITO-312 required public function is missing: %', v_item;
    end if;
  end loop;

  if exists (
    select 1
    from pg_constraint con
    join pg_class source_table on source_table.oid = con.conrelid
    join pg_namespace source_schema on source_schema.oid = source_table.relnamespace
    join pg_class target_table on target_table.oid = con.confrelid
    join pg_namespace target_schema on target_schema.oid = target_table.relnamespace
    where source_schema.nspname = 'public'
      and source_table.relname = any(v_tables)
      and con.contype = 'f'
      and target_schema.nspname not in ('auth', 'public')
  ) or exists (
    select 1
    from pg_constraint con
    join pg_class source_table on source_table.oid = con.conrelid
    join pg_namespace source_schema on source_schema.oid = source_table.relnamespace
    join pg_class target_table on target_table.oid = con.confrelid
    join pg_namespace target_schema on target_schema.oid = target_table.relnamespace
    where source_schema.nspname = 'public'
      and source_table.relname = any(v_tables)
      and con.contype = 'f'
      and target_schema.nspname = 'public'
      and target_table.relname <> all(v_tables)
  ) then
    raise exception 'HITO-312 admitted foreign key targets a relation outside Auth and the explicit staging manifest.';
  end if;

  foreach v_item in array v_function_signatures loop
    v_oid := to_regprocedure(v_item);
    v_definition := pg_get_functiondef(v_oid);
    v_definition := replace(v_definition, 'public.', 'hito_staging.');
    v_definition := regexp_replace(
      v_definition,
      'SET search_path TO ''?public''?(, ''?pg_temp''?)?',
      'SET search_path TO hito_staging, pg_temp',
      'gi'
    );
    v_definition := replace(v_definition, 'hito_staging.runner_goal_type', 'public.runner_goal_type');
    v_definition := replace(v_definition, 'hito_staging.plan_cycle_status', 'public.plan_cycle_status');
    v_definition := replace(v_definition, 'hito_staging.workout_type', 'public.workout_type');
    v_definition := replace(v_definition, 'hito_staging.workout_outcome', 'public.workout_outcome');
    v_definition := replace(v_definition, 'hito_staging.runner_setup_state', 'public.runner_setup_state');

    if exists (
      select 1
      from regexp_matches(v_definition, 'hito_staging\.([a-zA-Z0-9_]+)', 'g') match
      where match[1] <> all(v_tables)
        and match[1] <> all(v_function_names)
    ) then
      raise exception 'HITO-312 function % contains a dependency outside the explicit staging manifest.', v_item;
    end if;
    if exists (
      select 1
      from pg_class relation_class
      join pg_namespace relation_schema on relation_schema.oid = relation_class.relnamespace
      where relation_schema.nspname = 'public'
        and relation_class.relkind in ('r', 'p', 'v', 'm', 'f')
        and relation_class.relname <> all(v_tables)
        and v_definition ~* ('public\.' || relation_class.relname || '\M')
    ) then
      raise exception 'HITO-312 function % references a Production relation outside the explicit staging manifest.', v_item;
    end if;
  end loop;

  foreach v_item in array v_triggers loop
    select
      pg_get_triggerdef(t.oid, false) as definition,
      n.nspname as source_schema,
      c.relname as source_table,
      function_schema.nspname as function_schema,
      function_proc.proname as function_name
    into v_record
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_proc function_proc on function_proc.oid = t.tgfoid
    join pg_namespace function_schema on function_schema.oid = function_proc.pronamespace
    where n.nspname = 'public'
      and c.relname = split_part(v_item, ':', 1)
      and t.tgname = split_part(v_item, ':', 2)
      and not t.tgisinternal;

    if not found then
      raise exception 'HITO-312 admitted trigger is missing: %', v_item;
    end if;
    if v_record.source_schema <> 'public'
      or not (v_record.source_table = any(v_tables))
      or v_record.function_schema <> 'public'
      or not (v_record.function_name = any(v_function_names))
    then
      raise exception 'HITO-312 admitted trigger % has an unapproved source %.% or function %.%.',
        v_item,
        v_record.source_schema,
        v_record.source_table,
        v_record.function_schema,
        v_record.function_name;
    end if;
  end loop;

  if to_regrole(v_staging_role) is not null then
    raise exception 'HITO-312 staging database role must be absent before initial materialization.';
  end if;

  if exists (
    select 1
    from pg_class table_class
    join pg_namespace table_schema on table_schema.oid = table_class.relnamespace
    cross join lateral aclexplode(
      coalesce(table_class.relacl, acldefault('r', table_class.relowner))
    ) acl
    where table_schema.nspname = 'public'
      and table_class.relkind in ('r', 'p')
      and acl.grantee = 0
      and acl.privilege_type in (
        'SELECT',
        'INSERT',
        'UPDATE',
        'DELETE',
        'TRUNCATE',
        'REFERENCES',
        'TRIGGER'
      )
  ) or exists (
    select 1
    from pg_class sequence_class
    join pg_namespace sequence_schema on sequence_schema.oid = sequence_class.relnamespace
    cross join lateral aclexplode(
      coalesce(sequence_class.relacl, acldefault('S', sequence_class.relowner))
    ) acl
    where sequence_schema.nspname = 'public'
      and sequence_class.relkind = 'S'
      and acl.grantee = 0
      and acl.privilege_type in ('USAGE', 'SELECT', 'UPDATE')
  ) then
    raise exception 'HITO-312 PUBLIC has a Production table or sequence grant that a staging role would inherit.';
  end if;

  if exists (
    select 1
    from pg_proc function_proc
    join pg_namespace function_schema on function_schema.oid = function_proc.pronamespace
    cross join lateral aclexplode(
      coalesce(function_proc.proacl, acldefault('f', function_proc.proowner))
    ) acl
    where function_schema.nspname = 'public'
      and function_proc.prosecdef
      and acl.privilege_type = 'EXECUTE'
      and acl.grantee = 0
      and function_proc.proname <> all(v_function_names)
      and exists (
        select 1
        from pg_class relation_class
        join pg_namespace relation_schema on relation_schema.oid = relation_class.relnamespace
        where relation_schema.nspname = 'public'
          and relation_class.relkind in ('r', 'p', 'v', 'm', 'f')
          and pg_get_functiondef(function_proc.oid)
            ~* ('public\.' || relation_class.relname || '\M')
      )
  ) then
    raise exception 'HITO-312 staging identity could reach Production rows through a PUBLIC-executable SECURITY DEFINER function.';
  end if;

  -- Every source/census check above this point is read-only. No object or grant
  -- is created until the complete remote-head manifest has matched.
  execute 'create role hito_staging_authenticated nologin noinherit nobypassrls';
  execute 'create schema hito_staging';
  execute 'revoke all on schema hito_staging from public, anon, authenticated, service_role, hito_staging_authenticated';

  foreach v_name in array v_tables loop
    execute format('create table hito_staging.%I (like public.%I including all)', v_name, v_name);
    execute format('alter table hito_staging.%I enable row level security', v_name);
    execute format('alter table hito_staging.%I force row level security', v_name);
  end loop;

  foreach v_item in array v_foreign_keys loop
    select
      con.oid,
      c.relname,
      target_schema.nspname as target_schema,
      target_table.relname as target_table,
      pg_get_constraintdef(con.oid, true) as definition
    into v_record
    from pg_constraint con
    join pg_class c on c.oid = con.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_class target_table on target_table.oid = con.confrelid
    join pg_namespace target_schema on target_schema.oid = target_table.relnamespace
    where n.nspname = 'public'
      and c.relname = split_part(v_item, ':', 1)
      and con.conname = split_part(v_item, ':', 2)
      and con.contype = 'f';

    if not found then
      raise exception 'HITO-312 admitted foreign key is missing: %', v_item;
    end if;

    if v_record.target_schema = 'public' and v_record.target_table = any(v_tables) then
      v_name := 'hito_staging';
    elsif v_record.target_schema = 'auth' and v_record.target_table = 'users' then
      v_name := 'auth';
    else
      raise exception 'HITO-312 admitted foreign key % targets an unapproved relation %.%.',
        v_item,
        v_record.target_schema,
        v_record.target_table;
    end if;

    v_definition := replace(
      v_record.definition,
      format('REFERENCES %I.%I', v_record.target_schema, v_record.target_table),
      format('REFERENCES %I.%I', v_name, v_record.target_table)
    );
    v_definition := replace(
      v_definition,
      format('REFERENCES %I', v_record.target_table),
      format('REFERENCES %I.%I', v_name, v_record.target_table)
    );
    if position(format('REFERENCES %I.%I', v_name, v_record.target_table) in v_definition) = 0 then
      raise exception 'HITO-312 admitted foreign key % could not be qualified from catalog truth.',
        v_item;
    end if;
    execute format(
      'alter table hito_staging.%I add constraint %I %s',
      v_record.relname,
      split_part(v_item, ':', 2),
      v_definition
    );
  end loop;

  if exists (
    select 1
    from pg_constraint con
    join pg_class source_table on source_table.oid = con.conrelid
    join pg_namespace source_schema on source_schema.oid = source_table.relnamespace
    join pg_class target_table on target_table.oid = con.confrelid
    join pg_namespace target_schema on target_schema.oid = target_table.relnamespace
    where source_schema.nspname = 'hito_staging'
      and con.contype = 'f'
      and target_schema.nspname = 'public'
  ) then
    raise exception 'HITO-312 staging foreign key retains a Production row dependency.';
  end if;

  foreach v_item in array v_function_signatures loop
    v_oid := to_regprocedure(v_item);
    v_definition := pg_get_functiondef(v_oid);
    v_definition := replace(v_definition, 'public.', 'hito_staging.');
    v_definition := regexp_replace(
      v_definition,
      'SET search_path TO ''?public''?(, ''?pg_temp''?)?',
      'SET search_path TO hito_staging, pg_temp',
      'gi'
    );

    -- LIKE keeps canonical enum types. Only immutable type dependencies return to public.
    v_definition := replace(v_definition, 'hito_staging.runner_goal_type', 'public.runner_goal_type');
    v_definition := replace(v_definition, 'hito_staging.plan_cycle_status', 'public.plan_cycle_status');
    v_definition := replace(v_definition, 'hito_staging.workout_type', 'public.workout_type');
    v_definition := replace(v_definition, 'hito_staging.workout_outcome', 'public.workout_outcome');
    v_definition := replace(v_definition, 'hito_staging.runner_setup_state', 'public.runner_setup_state');

    if exists (
      select 1
      from regexp_matches(v_definition, 'hito_staging\.([a-zA-Z0-9_]+)', 'g') match
      where match[1] <> all(v_tables)
        and match[1] <> all(v_function_names)
    ) then
      raise exception 'HITO-312 function % contains a dependency outside the explicit staging manifest.', v_item;
    end if;

    if exists (
      select 1
      from pg_class relation_class
      join pg_namespace relation_schema on relation_schema.oid = relation_class.relnamespace
      where relation_schema.nspname = 'public'
        and relation_class.relkind in ('r', 'p', 'v', 'm', 'f')
        and v_definition ~* ('public\.' || relation_class.relname || '\M')
    ) then
      raise exception 'HITO-312 function % retains a Production row dependency.', v_item;
    end if;

    execute v_definition;
  end loop;

  foreach v_item in array v_triggers loop
    select
      pg_get_triggerdef(t.oid, false) as definition,
      n.nspname as source_schema,
      c.relname as source_table,
      function_schema.nspname as function_schema,
      function_proc.proname as function_name
    into v_record
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_proc function_proc on function_proc.oid = t.tgfoid
    join pg_namespace function_schema on function_schema.oid = function_proc.pronamespace
    where n.nspname = 'public'
      and c.relname = split_part(v_item, ':', 1)
      and t.tgname = split_part(v_item, ':', 2)
      and not t.tgisinternal;

    if not found then
      raise exception 'HITO-312 admitted trigger is missing: %', v_item;
    end if;
    if v_record.source_schema <> 'public'
      or not (v_record.source_table = any(v_tables))
      or v_record.function_schema <> 'public'
      or not (v_record.function_name = any(v_function_names))
    then
      raise exception 'HITO-312 admitted trigger % has an unapproved source %.% or function %.%.',
        v_item,
        v_record.source_schema,
        v_record.source_table,
        v_record.function_schema,
        v_record.function_name;
    end if;

    v_definition := replace(
      v_record.definition,
      format(' ON %I.%I ', v_record.source_schema, v_record.source_table),
      format(' ON hito_staging.%I ', v_record.source_table)
    );
    v_definition := replace(
      v_definition,
      format(' ON %I ', v_record.source_table),
      format(' ON hito_staging.%I ', v_record.source_table)
    );
    v_definition := replace(
      v_definition,
      format('EXECUTE FUNCTION %I.%I(', v_record.function_schema, v_record.function_name),
      format('EXECUTE FUNCTION hito_staging.%I(', v_record.function_name)
    );
    v_definition := replace(
      v_definition,
      format('EXECUTE FUNCTION %I(', v_record.function_name),
      format('EXECUTE FUNCTION hito_staging.%I(', v_record.function_name)
    );
    if position(format(' ON hito_staging.%I ', v_record.source_table) in v_definition) = 0
      or position(
        format('EXECUTE FUNCTION hito_staging.%I(', v_record.function_name)
        in v_definition
      ) = 0
    then
      raise exception 'HITO-312 admitted trigger % could not be qualified from catalog truth.',
        v_item;
    end if;
    execute v_definition;
  end loop;

  revoke all on all tables in schema hito_staging
    from public, anon, authenticated, service_role, hito_staging_authenticated;
  revoke all on all sequences in schema hito_staging
    from public, anon, authenticated, service_role, hito_staging_authenticated;
  revoke all on all functions in schema hito_staging
    from public, anon, authenticated, service_role, hito_staging_authenticated;

  if exists (
    select 1
    from unnest(v_runtime_roles) runtime_role
    where to_regrole(runtime_role) is not null
      and pg_has_role(to_regrole(runtime_role), to_regrole(v_staging_role), 'MEMBER')
  )
    or exists (
      select 1
      from pg_auth_members membership
      join pg_roles member_role
        on member_role.oid = membership.member
      join pg_database current_database_record
        on current_database_record.datname = current_database()
      join pg_namespace staging_schema
        on staging_schema.nspname = 'hito_staging'
      where membership.roleid = to_regrole(v_staging_role)
        and not (
          member_role.rolsuper
          or member_role.rolcreaterole
          or member_role.oid = current_database_record.datdba
          or member_role.oid = staging_schema.nspowner
          or member_role.rolname = 'pg_database_owner'
        )
    )
  then
    raise exception 'HITO-312 staging database role must not be assumable by a runtime or ordinary role.';
  end if;

  if exists (
    select 1
    from pg_class table_class
    join pg_namespace table_schema on table_schema.oid = table_class.relnamespace
    where table_schema.nspname = 'public'
      and table_class.relkind in ('r', 'p')
      and has_table_privilege(
        v_staging_role,
        format('%I.%I', table_schema.nspname, table_class.relname),
        'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'
      )
  ) then
    raise exception 'HITO-312 staging database role can access a Production table.';
  end if;

  if exists (
    select 1
    from pg_class sequence_class
    join pg_namespace sequence_schema on sequence_schema.oid = sequence_class.relnamespace
    where sequence_schema.nspname = 'public'
      and sequence_class.relkind = 'S'
      and has_sequence_privilege(
        v_staging_role,
        format('%I.%I', sequence_schema.nspname, sequence_class.relname),
        'USAGE, SELECT, UPDATE'
      )
  ) then
    raise exception 'HITO-312 staging database role can access a Production sequence.';
  end if;
end;
$migration$;

create function hito_staging.hito_312_owned_counts(p_user_id uuid)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_count bigint;
  v_counts jsonb := '{}'::jsonb;
  v_table text;
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
begin
  foreach v_table in array v_tables loop
    execute pg_catalog.format(
      'select count(*) from hito_staging.%I where user_id = $1',
      v_table
    ) into v_count using p_user_id;
    v_counts := v_counts || pg_catalog.jsonb_build_object(v_table, v_count);
  end loop;
  return v_counts;
end;
$$;

create function hito_staging.hito_312_status()
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_counts jsonb;
  v_total bigint;
  v_user_id uuid;
begin
  select id
  into v_user_id
  from auth.users
  where lower(email) = 'qa-hito312-staging@hito.invalid'
    and role = 'hito_staging_authenticated'
    and raw_app_meta_data ->> 'hito_dataset' = 'staging'
    and raw_app_meta_data ->> 'hito_staging_seed_version' = 'hito_312_staging_seed_v1';

  v_counts := hito_staging.hito_312_owned_counts(v_user_id);
  select coalesce(sum(value::text::bigint), 0)
  into v_total
  from pg_catalog.jsonb_each(v_counts);

  return pg_catalog.jsonb_build_object(
    'dataset', 'hito_staging',
    'identityPresent', v_user_id is not null,
    'ownedRows', v_counts,
    'totalOwnedRows', v_total
  );
end;
$$;

create function hito_staging.hito_312_seed()
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_existing jsonb;
  v_user_count bigint;
  v_user_id uuid;
begin
  select count(*), (array_agg(id order by id))[1]
  into v_user_count, v_user_id
  from auth.users
  where lower(email) = 'qa-hito312-staging@hito.invalid'
    and role = 'hito_staging_authenticated'
    and raw_app_meta_data ->> 'hito_dataset' = 'staging'
    and raw_app_meta_data ->> 'hito_test_user' = 'true'
    and raw_app_meta_data ->> 'hito_staging_seed_version' = 'hito_312_staging_seed_v1';

  if v_user_count <> 1 then
    raise exception 'HITO-312 expected exactly one admitted synthetic staging identity; found %.', v_user_count;
  end if;

  v_existing := hito_staging.hito_312_owned_counts(v_user_id);
  if exists (
    select 1
    from pg_catalog.jsonb_each(v_existing)
    where value::text::bigint <> 0
  ) then
    raise exception 'HITO-312 seed requires zero staging-owned rows for the admitted identity.';
  end if;

  insert into hito_staging.runner_profiles (
    user_id,
    goal_type,
    goal_label,
    baseline_sessions_per_week,
    baseline_long_run_km,
    setup_state,
    display_name,
    fitness_level,
    age,
    height_cm,
    weight_kg,
    calendar_timezone,
    calendar_timezone_source,
    training_preferences
  ) values (
    v_user_id,
    'build_consistency'::public.runner_goal_type,
    'Synthetic staging baseline',
    3,
    5,
    'completed'::public.runner_setup_state,
    'HITO-312 Staging Runner',
    'beginner',
    34,
    178,
    72,
    'America/Sao_Paulo',
    'user',
    '{"availability":4,"fixed_rest_days":["tuesday","thursday","saturday"]}'::jsonb
  );

  insert into hito_staging.plan_cycles (
    id,
    user_id,
    status,
    title,
    goal_summary,
    source_template,
    source_kind,
    start_date,
    end_date
  ) values (
    '31200000-0000-4000-8000-000000000001'::uuid,
    v_user_id,
    'active'::public.plan_cycle_status,
    'Synthetic staging plan',
    'Deterministic staging-only proof',
    'hito_312_synthetic_seed',
    'manual',
    '2026-08-31'::date,
    '2026-09-06'::date
  );

  insert into hito_staging.planned_workouts (
    id,
    plan_cycle_id,
    user_id,
    workout_date,
    weekday,
    week_number,
    phase,
    workout_type,
    workout_family,
    workout_identity,
    title,
    steps,
    display_order,
    origin_kind
  ) values (
    '31200000-0000-4000-8000-000000000002'::uuid,
    '31200000-0000-4000-8000-000000000001'::uuid,
    v_user_id,
    '2026-08-31'::date,
    'monday',
    1,
    'Synthetic staging',
    'easy'::public.workout_type,
    'easy',
    'hito_312_synthetic_easy',
    'Synthetic easy run',
    '[]'::jsonb,
    0,
    'manual'
  );

  insert into hito_staging.workout_result_assets (
    id,
    user_id,
    planned_workout_id,
    asset_kind,
    storage_bucket,
    storage_path,
    original_file_name,
    mime_type,
    file_size_bytes,
    parse_status
  ) values (
    '31200000-0000-4000-8000-000000000003'::uuid,
    v_user_id,
    '31200000-0000-4000-8000-000000000002'::uuid,
    'garmin_fit',
    'hito-staging-workout-result-assets',
    v_user_id::text || '/hito-312/31200000-0000-4000-8000-000000000003.fit',
    'hito-312-synthetic.fit',
    'application/octet-stream',
    49,
    'uploaded'
  );

  return hito_staging.hito_312_status();
end;
$$;

create function hito_staging.hito_312_reset()
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_activity record;
  v_user_id uuid;
begin
  select id
  into v_user_id
  from auth.users
  where lower(email) = 'qa-hito312-staging@hito.invalid'
    and role = 'hito_staging_authenticated'
    and raw_app_meta_data ->> 'hito_dataset' = 'staging'
    and raw_app_meta_data ->> 'hito_staging_seed_version' = 'hito_312_staging_seed_v1';

  if v_user_id is null then
    return hito_staging.hito_312_status();
  end if;

  delete from hito_staging.workout_ai_insights where user_id = v_user_id;
  delete from hito_staging.workout_comparisons where user_id = v_user_id;
  delete from hito_staging.workout_actual_metrics where user_id = v_user_id;
  delete from hito_staging.workout_result_assets where user_id = v_user_id;
  delete from hito_staging.runner_activity_metric_observations where user_id = v_user_id;
  delete from hito_staging.runner_activity_evidence_revisions where user_id = v_user_id;
  delete from hito_staging.runner_activity_planned_workout_matches where user_id = v_user_id;
  delete from hito_staging.workout_logs where user_id = v_user_id;
  delete from hito_staging.planned_workouts where user_id = v_user_id;
  delete from hito_staging.calendar_workout_mutation_events where user_id = v_user_id;
  delete from hito_staging.plan_cycles where user_id = v_user_id;
  delete from hito_staging.runner_manual_workout_templates where user_id = v_user_id;
  delete from hito_staging.runner_activity_fact_snapshots where user_id = v_user_id;
  delete from hito_staging.runner_activity_metric_snapshots where user_id = v_user_id;

  for v_activity in
    select id from hito_staging.runner_activities where user_id = v_user_id
  loop
    perform hito_staging.delete_runner_activity_from_history(v_user_id, v_activity.id);
  end loop;

  delete from hito_staging.runner_profiles where user_id = v_user_id;

  if exists (
    select 1
    from pg_catalog.jsonb_each(hito_staging.hito_312_owned_counts(v_user_id))
    where value::text::bigint <> 0
  ) then
    raise exception 'HITO-312 SQL reset did not reach zero staging-owned rows.';
  end if;

  return hito_staging.hito_312_status();
end;
$$;

revoke all on function hito_staging.hito_312_owned_counts(uuid)
  from public, anon, authenticated, service_role, hito_staging_authenticated;
revoke all on function hito_staging.hito_312_status()
  from public, anon, authenticated, service_role, hito_staging_authenticated;
revoke all on function hito_staging.hito_312_seed()
  from public, anon, authenticated, service_role, hito_staging_authenticated;
revoke all on function hito_staging.hito_312_reset()
  from public, anon, authenticated, service_role, hito_staging_authenticated;

grant select, insert, update, delete on storage.objects to hito_staging_authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hito-staging-workout-result-assets',
  'hito-staging-workout-result-assets',
  false,
  26214400,
  array[
    'application/octet-stream',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
on conflict (id) do nothing;

do $bucket_guard$
begin
  if not exists (
    select 1
    from storage.buckets
    where id = 'hito-staging-workout-result-assets'
      and name = 'hito-staging-workout-result-assets'
      and public = false
      and file_size_limit = 26214400
      and allowed_mime_types = array[
        'application/octet-stream',
        'application/zip',
        'application/x-zip-compressed'
      ]
  ) then
    raise exception 'HITO-312 staging bucket exists with a non-admitted configuration.';
  end if;
end;
$bucket_guard$;

create policy "hito_staging_storage_select_own"
  on storage.objects
  for select
  to hito_staging_authenticated
  using (
    bucket_id = 'hito-staging-workout-result-assets'
    and (select auth.jwt() -> 'app_metadata' ->> 'hito_dataset') = 'staging'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "hito_staging_storage_insert_own"
  on storage.objects
  for insert
  to hito_staging_authenticated
  with check (
    bucket_id = 'hito-staging-workout-result-assets'
    and (select auth.jwt() -> 'app_metadata' ->> 'hito_dataset') = 'staging'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "hito_staging_storage_update_own"
  on storage.objects
  for update
  to hito_staging_authenticated
  using (
    bucket_id = 'hito-staging-workout-result-assets'
    and (select auth.jwt() -> 'app_metadata' ->> 'hito_dataset') = 'staging'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'hito-staging-workout-result-assets'
    and (select auth.jwt() -> 'app_metadata' ->> 'hito_dataset') = 'staging'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "hito_staging_storage_delete_own"
  on storage.objects
  for delete
  to hito_staging_authenticated
  using (
    bucket_id = 'hito-staging-workout-result-assets'
    and (select auth.jwt() -> 'app_metadata' ->> 'hito_dataset') = 'staging'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

comment on schema hito_staging is
  'HITO-312 isolated synthetic staging dataset; never Production data or a promotion source.';
