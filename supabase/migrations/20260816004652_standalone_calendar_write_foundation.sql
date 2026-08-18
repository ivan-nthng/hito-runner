-- Calendar workouts are runner-owned truth. The legacy plan_cycle_id name is retained only as the
-- physical source-provenance column until the read/materialization slice can rename its consumers.

do $$
declare
	v_legacy_event_count bigint;
	v_legacy_event_hash text;
begin
	if exists (
		select 1
		from public.planned_workouts
		group by user_id, workout_date
		having count(*) > 1
	) then
		raise exception 'Standalone Calendar migration stopped: runner/date occupancy is not unique.';
	end if;

	if exists (
		select 1
		from public.planned_workouts workout
		left join public.plan_cycles source
			on source.id = workout.plan_cycle_id
		where source.id is null or source.user_id <> workout.user_id
	) then
		raise exception 'Standalone Calendar migration stopped: workout source ownership is invalid.';
	end if;

	if exists (
		select 1
		from public.planned_workouts workout
		join public.plan_cycles materialized on materialized.id = workout.plan_cycle_id
		where materialized.saved_plan_payload is null
			and materialized.source_kind not in (
				'manual_user_built_plan_v1',
				'manual_user_built_v1',
				'ai_authored_plan_first_v1',
				'training_plan_v2_import'
			)
	) then
		raise exception 'Standalone Calendar migration stopped: a workout origin cannot be classified.';
	end if;

	if exists (
		select 1
		from public.planned_workouts workout
		join public.plan_cycles materialized on materialized.id = workout.plan_cycle_id
		left join public.plan_cycles saved
			on saved.id = case
				when coalesce(materialized.goal_metadata->>'saved_plan_record_id', '')
					~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
					then (materialized.goal_metadata->>'saved_plan_record_id')::uuid
				else null
			end
		where materialized.saved_plan_payload is null
			and materialized.source_kind in ('ai_authored_plan_first_v1', 'training_plan_v2_import')
			and (
				coalesce(materialized.goal_metadata->>'saved_plan_record_id', '')
					!~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
				or saved.id is null
				or saved.user_id <> workout.user_id
				or saved.saved_plan_payload is null
				or saved.saved_plan_review_checksum is distinct from
					materialized.goal_metadata->>'saved_plan_review_checksum'
			)
	) then
		raise exception 'Standalone Calendar migration stopped: immutable source-plan linkage is incomplete.';
	end if;

	if exists (
		select 1
		from public.plan_cycles plan
		where (
			plan.goal_metadata ?| array['active_plan_user_edit', 'active_plan_user_edits']
			or plan.plan_preferences ?| array['active_plan_user_edit', 'active_plan_user_edits']
		)
		and (
			jsonb_typeof(plan.goal_metadata->'active_plan_user_edits') is distinct from 'array'
			or jsonb_array_length(plan.goal_metadata->'active_plan_user_edits') = 0
			or jsonb_typeof(plan.goal_metadata->'active_plan_user_edit') is distinct from 'object'
			or jsonb_typeof(plan.plan_preferences->'active_plan_user_edits') is distinct from 'array'
			or jsonb_typeof(plan.plan_preferences->'active_plan_user_edit') is distinct from 'object'
			or plan.goal_metadata->'active_plan_user_edits'
				is distinct from plan.plan_preferences->'active_plan_user_edits'
			or plan.goal_metadata->'active_plan_user_edit'
				is distinct from plan.plan_preferences->'active_plan_user_edit'
			or plan.goal_metadata->'active_plan_user_edit'
				is distinct from plan.goal_metadata->'active_plan_user_edits'
					-> (jsonb_array_length(plan.goal_metadata->'active_plan_user_edits') - 1)
		)
	) then
		raise exception 'Standalone Calendar migration stopped: mirrored mutation history is divergent.';
	end if;

	if exists (
		select 1
		from public.plan_cycles plan
		cross join lateral jsonb_array_elements(
			case
				when jsonb_typeof(plan.goal_metadata->'active_plan_user_edits') = 'array'
					then plan.goal_metadata->'active_plan_user_edits'
				else '[]'::jsonb
			end
		) event
		where jsonb_typeof(event) <> 'object'
			or event->>'mutation_source' <> 'active_plan_user_edit_v1'
			or event->>'mutation_kind' not in (
				'user_added_workout',
				'user_cleared_workout',
				'user_moved_workout',
				'user_copied_workout',
				'user_edited_workout'
			)
			or coalesce(event->>'planned_workout_id', '')
				!~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
			or coalesce(event->>'review_checksum', '') !~ '^[0-9a-f]{64}$'
			or (
				event ? 'previous_workout'
				and jsonb_typeof(event->'previous_workout') <> 'object'
			)
			or (
				event ? 'undo_expires_at'
				and coalesce(event->>'undo_expires_at', '') !~ '^\d{4}-\d{2}-\d{2}T.*Z$'
			)
	) then
		raise exception 'Standalone Calendar migration stopped: legacy mutation evidence is malformed.';
	end if;

	select count(*), md5(coalesce(string_agg(event.item::text, E'\n' order by plan.id, event.ordinal), ''))
	into v_legacy_event_count, v_legacy_event_hash
	from public.plan_cycles plan
	cross join lateral jsonb_array_elements(
		case
			when jsonb_typeof(plan.goal_metadata->'active_plan_user_edits') = 'array'
				then plan.goal_metadata->'active_plan_user_edits'
			else '[]'::jsonb
		end
	) with ordinality as event(item, ordinal);

	create temporary table standalone_calendar_migration_evidence (
		legacy_event_count bigint not null,
		legacy_event_hash text not null
	) on commit drop;

	insert into standalone_calendar_migration_evidence values (v_legacy_event_count, v_legacy_event_hash);
end;
$$;

create table public.calendar_workout_mutation_events (
	id bigint generated always as identity primary key,
	user_id uuid not null references auth.users (id) on delete cascade,
	mutation_kind text not null check (
		mutation_kind in (
			'user_added_workout',
			'user_cleared_workout',
			'user_moved_workout',
			'user_copied_workout',
			'user_edited_workout'
		)
	),
	planned_workout_id uuid not null,
	source_workout_id uuid,
	target_workout_id uuid,
	source_workout_date date,
	target_date date,
	before_workout jsonb check (before_workout is null or jsonb_typeof(before_workout) = 'object'),
	after_workout jsonb check (after_workout is null or jsonb_typeof(after_workout) = 'object'),
	displaced_workout jsonb check (
		displaced_workout is null or jsonb_typeof(displaced_workout) = 'object'
	),
	review_payload_version text not null,
	review_checksum text not null check (review_checksum ~ '^[0-9a-f]{64}$'),
	mutation_payload_version text,
	mutation_checksum text check (mutation_checksum is null or mutation_checksum ~ '^[0-9a-f]{64}$'),
	event_payload jsonb not null check (jsonb_typeof(event_payload) = 'object'),
	occurred_at timestamptz,
	undo_expires_at timestamptz,
	undo_of_event_id bigint references public.calendar_workout_mutation_events (id) on delete restrict,
	migrated_from_plan_id uuid,
	legacy_ordinal integer check (legacy_ordinal is null or legacy_ordinal > 0),
	created_at timestamptz not null default now(),
	check (
		(migrated_from_plan_id is null and legacy_ordinal is null and occurred_at is not null)
		or (migrated_from_plan_id is not null and legacy_ordinal is not null and occurred_at is null)
	)
);

create unique index calendar_workout_mutation_events_legacy_order_idx
	on public.calendar_workout_mutation_events (migrated_from_plan_id, legacy_ordinal)
	where migrated_from_plan_id is not null;

create index calendar_workout_mutation_events_runner_workout_idx
	on public.calendar_workout_mutation_events (user_id, planned_workout_id, id desc);

alter table public.calendar_workout_mutation_events enable row level security;

revoke all privileges on table public.calendar_workout_mutation_events
	from public, anon, authenticated, service_role;
grant select, insert, delete on table public.calendar_workout_mutation_events to service_role;
grant usage, select on sequence public.calendar_workout_mutation_events_id_seq to service_role;

insert into public.calendar_workout_mutation_events (
	user_id,
	mutation_kind,
	planned_workout_id,
	source_workout_id,
	target_workout_id,
	source_workout_date,
	target_date,
	before_workout,
	displaced_workout,
	review_payload_version,
	review_checksum,
	mutation_payload_version,
	mutation_checksum,
	event_payload,
	migrated_from_plan_id,
	legacy_ordinal
)
select
	plan.user_id,
	event.item->>'mutation_kind',
	(event.item->>'planned_workout_id')::uuid,
	case
		when coalesce(event.item->>'source_workout_id', '')
			~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
			then (event.item->>'source_workout_id')::uuid
		else null
	end,
	case
		when coalesce(event.item->>'target_workout_id', '')
			~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
			then (event.item->>'target_workout_id')::uuid
		else null
	end,
	coalesce(
		nullif(event.item->>'source_workout_date', '')::date,
		nullif(event.item->>'previous_workout_date', '')::date
	),
	nullif(event.item->>'target_date', '')::date,
	nullif(event.item->'previous_workout', 'null'::jsonb),
	case
		when event.item->>'mutation_kind' = 'user_moved_workout'
			and (
				event.item#>>'{target_replacement,workoutType}' = 'rest'
				or event.item#>>'{previous_workout,workout_type}' = 'rest'
			)
			then nullif(event.item->'previous_workout', 'null'::jsonb)
		else null
	end,
	event.item->>'review_payload_version',
	event.item->>'review_checksum',
	event.item->>'mutation_payload_version',
	nullif(event.item->>'mutation_checksum', ''),
	event.item,
	plan.id,
	event.ordinal::integer
from public.plan_cycles plan
cross join lateral jsonb_array_elements(
	case
		when jsonb_typeof(plan.goal_metadata->'active_plan_user_edits') = 'array'
			then plan.goal_metadata->'active_plan_user_edits'
		else '[]'::jsonb
	end
) with ordinality as event(item, ordinal);

do $$
declare
	v_expected_count bigint;
	v_expected_hash text;
	v_actual_count bigint;
	v_actual_hash text;
begin
	select legacy_event_count, legacy_event_hash
	into v_expected_count, v_expected_hash
	from standalone_calendar_migration_evidence;

	select count(*), md5(coalesce(string_agg(event_payload::text, E'\n' order by migrated_from_plan_id, legacy_ordinal), ''))
	into v_actual_count, v_actual_hash
	from public.calendar_workout_mutation_events
	where migrated_from_plan_id is not null;

	if v_actual_count is distinct from v_expected_count
		or v_actual_hash is distinct from v_expected_hash
	then
		raise exception 'Standalone Calendar migration stopped: event count/checksum equality failed.';
	end if;
end;
$$;

update public.plan_cycles
set goal_metadata = case
		when goal_metadata is null then null
		else goal_metadata - 'active_plan_user_edit' - 'active_plan_user_edits'
	end,
	plan_preferences = case
		when plan_preferences is null then null
		else plan_preferences - 'active_plan_user_edit' - 'active_plan_user_edits'
	end
where goal_metadata ?| array['active_plan_user_edit', 'active_plan_user_edits']
	or plan_preferences ?| array['active_plan_user_edit', 'active_plan_user_edits'];

alter table public.planned_workouts add column origin_kind text;

update public.planned_workouts workout
set origin_kind = case
		when source.source_kind in ('manual_user_built_plan_v1', 'manual_user_built_v1') then 'manual'
		when source.source_kind = 'ai_authored_plan_first_v1' then 'ai'
		when source.source_kind = 'training_plan_v2_import' then 'file_import'
	end
from public.plan_cycles source
where source.id = workout.plan_cycle_id;

update public.planned_workouts workout
set plan_cycle_id = case
		when source.saved_plan_payload is not null then source.id
		when source.source_kind in ('manual_user_built_plan_v1', 'manual_user_built_v1') then null
		else (source.goal_metadata->>'saved_plan_record_id')::uuid
	end
from public.plan_cycles source
where source.id = workout.plan_cycle_id;

alter table public.planned_workouts
	drop constraint planned_workouts_plan_cycle_id_fkey,
	drop constraint planned_workouts_plan_cycle_id_workout_date_key,
	alter column plan_cycle_id drop not null,
	alter column origin_kind set not null,
	add constraint planned_workouts_origin_kind_check
		check (origin_kind in ('manual', 'ai', 'file_import')),
	add constraint planned_workouts_user_workout_date_key unique (user_id, workout_date);

alter table public.plan_cycles
	add constraint plan_cycles_user_id_id_key unique (user_id, id);

alter table public.planned_workouts
	add constraint planned_workouts_source_owner_fkey
		foreign key (user_id, plan_cycle_id)
		references public.plan_cycles (user_id, id)
		on delete restrict;

comment on column public.planned_workouts.plan_cycle_id is
	'Legacy physical name for optional immutable source-plan provenance; never Calendar authority.';
comment on column public.planned_workouts.origin_kind is
	'Immutable creation origin only: manual, ai, or file_import; never mutation authority.';

revoke insert, update, delete on table public.plan_cycles from authenticated;
revoke insert, update, delete on table public.planned_workouts from authenticated;
drop policy if exists "plan_cycles_insert_own" on public.plan_cycles;
drop policy if exists "plan_cycles_update_own" on public.plan_cycles;
drop policy if exists "planned_workouts_insert_own" on public.planned_workouts;
drop policy if exists "planned_workouts_update_own" on public.planned_workouts;

drop function if exists public.apply_calendar_workout_mutation(
	uuid, uuid, timestamptz, date, text, jsonb, jsonb, jsonb, jsonb, jsonb
);

create function public.apply_calendar_workout_mutation(
	p_user_id uuid,
	p_current_date date,
	p_mutation_kind text,
	p_expected_source_workout jsonb,
	p_expected_target_workout jsonb,
	p_workout_insert jsonb,
	p_workout_update jsonb,
	p_mutation_event jsonb
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
	v_source public.planned_workouts%rowtype;
	v_target public.planned_workouts%rowtype;
	v_mutated public.planned_workouts%rowtype;
	v_deleted public.planned_workouts%rowtype;
	v_restored public.planned_workouts%rowtype;
	v_event public.calendar_workout_mutation_events%rowtype;
	v_latest_event public.calendar_workout_mutation_events%rowtype;
	v_matching_undo_event public.calendar_workout_mutation_events%rowtype;
	v_restore jsonb;
	v_restore_origin text;
	v_target_date date;
	v_source_date date;
	v_undo_expires_at timestamptz;
	v_event_kind text;
begin
	if p_mutation_kind not in ('add', 'clear', 'move')
		or jsonb_typeof(coalesce(p_mutation_event, 'null'::jsonb)) <> 'object'
		or p_mutation_event->>'mutation_source' <> 'calendar_workout_mutation_v1'
		or coalesce(p_mutation_event->>'review_payload_version', '') = ''
		or coalesce(p_mutation_event->>'review_checksum', '') !~ '^[0-9a-f]{64}$'
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_input',
			'message', 'The reviewed Calendar workout mutation payload is invalid.'
		);
	end if;

	v_event_kind := p_mutation_event->>'mutation_kind';
	if (p_mutation_kind = 'add' and v_event_kind not in ('user_added_workout', 'user_copied_workout'))
		or (p_mutation_kind = 'clear' and v_event_kind <> 'user_cleared_workout')
		or (p_mutation_kind = 'move' and v_event_kind <> 'user_moved_workout')
	then
		return jsonb_build_object(
			'ok', false,
			'reason', 'invalid_input',
			'message', 'The Calendar mutation kind does not match its review evidence.'
		);
	end if;

	perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

	if p_mutation_kind = 'add' then
		if jsonb_typeof(coalesce(p_workout_insert, 'null'::jsonb)) <> 'object'
			or coalesce(p_workout_insert->>'id', '')
				!~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
			or coalesce(p_workout_insert->>'origin_kind', '') not in ('manual', 'ai', 'file_import')
			or (p_workout_insert->>'workout_date')::date < p_current_date
			or p_mutation_event->>'planned_workout_id' <> p_workout_insert->>'id'
			or p_mutation_event->>'target_date' <> p_workout_insert->>'workout_date'
			or p_mutation_event->>'origin_kind' is distinct from p_workout_insert->>'origin_kind'
		then
			return jsonb_build_object(
				'ok', false,
				'reason', 'protected_day',
				'message', 'The reviewed workout can no longer be added on that date.'
			);
		end if;

		v_target_date := (p_workout_insert->>'workout_date')::date;

		if nullif(p_workout_insert->>'plan_cycle_id', '') is not null
			and not exists (
				select 1 from public.plan_cycles source
				where source.id = (p_workout_insert->>'plan_cycle_id')::uuid
					and source.user_id = p_user_id
			)
		then
			return jsonb_build_object(
				'ok', false,
				'reason', 'unsafe_source_state',
				'message', 'The workout source provenance is not owned by this runner.'
			);
		end if;

		if p_expected_source_workout is not null and p_expected_source_workout <> 'null'::jsonb then
			if v_event_kind <> 'user_copied_workout' then
				return jsonb_build_object('ok', false, 'reason', 'invalid_input',
					'message', 'A copied workout requires copy review evidence.');
			end if;

			if jsonb_typeof(p_expected_source_workout) <> 'object' then
				return jsonb_build_object('ok', false, 'reason', 'invalid_input',
					'message', 'The copied workout fingerprint is invalid.');
			end if;

			select * into v_source
			from public.planned_workouts
			where id = (p_expected_source_workout->>'id')::uuid and user_id = p_user_id
			for share;

			if not found or to_jsonb(v_source) is distinct from p_expected_source_workout
				or v_source.workout_type = 'rest'
				or p_mutation_event->>'source_workout_id' <> v_source.id::text
				or p_mutation_event->>'source_workout_date' <> v_source.workout_date::text
			then
				return jsonb_build_object('ok', false, 'reason', 'stale_review',
					'message', 'The copied source workout changed before Paste.');
			end if;

			if (p_workout_insert->>'plan_cycle_id') is distinct from v_source.plan_cycle_id::text
				or p_workout_insert->>'origin_kind' is distinct from v_source.origin_kind
				or (p_workout_insert->>'week_number')::integer is distinct from v_source.week_number
				or p_workout_insert->>'phase' is distinct from v_source.phase
				or (p_workout_insert->'steps') is distinct from v_source.steps
				or (p_workout_insert->'metric_mode') is distinct from v_source.metric_mode
				or (p_workout_insert->'goal_context') is distinct from v_source.goal_context
				or p_workout_insert->>'workout_type' is distinct from v_source.workout_type::text
				or p_workout_insert->>'source_workout_id' is distinct from v_source.source_workout_id
				or p_workout_insert->>'source_workout_type' is distinct from v_source.source_workout_type
				or p_workout_insert->>'workout_family' is distinct from v_source.workout_family
				or p_workout_insert->>'workout_identity' is distinct from v_source.workout_identity
				or p_workout_insert->>'calendar_icon_key' is distinct from v_source.calendar_icon_key
				or p_workout_insert->>'title' is distinct from v_source.title
				or p_workout_insert->>'notes' is distinct from v_source.notes
				or p_workout_insert->>'planned_rpe' is distinct from v_source.planned_rpe::text
				or p_workout_insert->>'estimated_fatigue' is distinct from v_source.estimated_fatigue
				or p_workout_insert->>'recovery_priority' is distinct from v_source.recovery_priority
			then
				return jsonb_build_object('ok', false, 'reason', 'unsafe_source_state',
					'message', 'Paste must copy only the reviewed workout prescription.');
			end if;
		elsif v_event_kind <> 'user_added_workout'
			or p_mutation_event ? 'source_workout_id'
			or p_mutation_event ? 'source_workout_date'
		then
			return jsonb_build_object('ok', false, 'reason', 'invalid_input',
				'message', 'A direct Calendar Add cannot claim copied-source evidence.');
		end if;

		if exists (
			select 1 from public.planned_workouts
			where user_id = p_user_id and workout_date = v_target_date
		) then
			return jsonb_build_object('ok', false, 'reason', 'stale_review',
				'message', 'Paste requires a truly empty date; the existing row is unchanged.');
		end if;

		insert into public.planned_workouts (
			id, plan_cycle_id, user_id, origin_kind, workout_date, weekday, week_number,
			phase, workout_type, source_workout_id, source_workout_type, workout_family,
			workout_identity, calendar_icon_key, goal_context, metric_mode, title, notes,
			planned_rpe, estimated_fatigue, recovery_priority, steps, display_order
		) values (
			(p_workout_insert->>'id')::uuid,
			nullif(p_workout_insert->>'plan_cycle_id', '')::uuid,
			p_user_id,
			p_workout_insert->>'origin_kind',
			v_target_date,
			p_workout_insert->>'weekday',
			(p_workout_insert->>'week_number')::integer,
			p_workout_insert->>'phase',
			(p_workout_insert->>'workout_type')::public.workout_type,
			p_workout_insert->>'source_workout_id',
			p_workout_insert->>'source_workout_type',
			p_workout_insert->>'workout_family',
			p_workout_insert->>'workout_identity',
			p_workout_insert->>'calendar_icon_key',
			nullif(p_workout_insert->'goal_context', 'null'::jsonb),
			nullif(p_workout_insert->'metric_mode', 'null'::jsonb),
			p_workout_insert->>'title',
			p_workout_insert->>'notes',
			(p_workout_insert->>'planned_rpe')::smallint,
			p_workout_insert->>'estimated_fatigue',
			p_workout_insert->>'recovery_priority',
			p_workout_insert->'steps',
			(p_workout_insert->>'display_order')::integer
		) returning * into v_mutated;

	else
		if jsonb_typeof(coalesce(p_expected_source_workout, 'null'::jsonb)) <> 'object' then
			return jsonb_build_object('ok', false, 'reason', 'invalid_input',
				'message', 'The reviewed source workout fingerprint is invalid.');
		end if;

		select * into v_source
		from public.planned_workouts
		where id = (p_expected_source_workout->>'id')::uuid and user_id = p_user_id
		for update;

		if not found or to_jsonb(v_source) is distinct from p_expected_source_workout then
			return jsonb_build_object('ok', false, 'reason', 'stale_review',
				'message', 'The source workout changed before the mutation was saved.');
		end if;

		if p_mutation_event->>'planned_workout_id' <> v_source.id::text then
			return jsonb_build_object('ok', false, 'reason', 'invalid_input',
				'message', 'The review evidence does not identify the locked workout.');
		end if;

		if p_mutation_event->>'origin_kind' is distinct from v_source.origin_kind
			or p_mutation_event->>'previous_workout_date' <> v_source.workout_date::text
		then
			return jsonb_build_object('ok', false, 'reason', 'invalid_input',
				'message', 'The review evidence does not match the locked workout origin and date.');
		end if;

		if v_source.workout_type = 'rest'
			or exists (select 1 from public.workout_logs where user_id = p_user_id and planned_workout_id = v_source.id)
			or exists (select 1 from public.workout_result_assets where user_id = p_user_id and planned_workout_id = v_source.id)
			or exists (select 1 from public.workout_actual_metrics where user_id = p_user_id and planned_workout_id = v_source.id)
			or exists (select 1 from public.workout_comparisons where user_id = p_user_id and planned_workout_id = v_source.id)
			or exists (select 1 from public.workout_ai_insights where user_id = p_user_id and planned_workout_id = v_source.id)
			or exists (select 1 from public.runner_activity_planned_workout_matches where user_id = p_user_id and planned_workout_id = v_source.id)
		then
			return jsonb_build_object('ok', false, 'reason', 'protected_day',
				'message', 'Logged, evidence-backed, or Rest workouts cannot be moved or cleared.');
		end if;

		if p_mutation_kind = 'clear' then
			if v_source.workout_date < p_current_date
				or p_mutation_event->>'target_workout_id' <> v_source.id::text
				or p_mutation_event->>'target_date' <> v_source.workout_date::text
			then
				return jsonb_build_object('ok', false, 'reason', 'protected_day',
					'message', 'Past workouts and stale review evidence cannot be cleared.');
			end if;

			delete from public.planned_workouts
			where id = v_source.id and user_id = p_user_id
			returning * into v_deleted;
		else
			if jsonb_typeof(coalesce(p_workout_update, 'null'::jsonb)) <> 'object'
				or p_workout_update ? 'restore_displaced_rest'
				or (p_workout_update->>'workout_date')::date < p_current_date
				or (p_workout_update->>'week_number')::integer <> v_source.week_number
			then
				return jsonb_build_object('ok', false, 'reason', 'protected_day',
					'message', 'The reviewed workout can no longer move to that date.');
			end if;

			v_target_date := (p_workout_update->>'workout_date')::date;
			v_source_date := v_source.workout_date;

			if p_mutation_event->>'source_workout_id' <> v_source.id::text
				or p_mutation_event->>'source_workout_date' <> v_source_date::text
				or p_mutation_event->>'target_date' <> v_target_date::text
			then
				return jsonb_build_object('ok', false, 'reason', 'invalid_input',
					'message', 'The move review evidence does not match the locked Calendar dates.');
			end if;

			select * into v_latest_event
			from public.calendar_workout_mutation_events
			where user_id = p_user_id and planned_workout_id = v_source.id
			order by id desc limit 1;

			select * into v_matching_undo_event
			from public.calendar_workout_mutation_events
			where user_id = p_user_id
				and planned_workout_id = v_source.id
				and mutation_kind = 'user_moved_workout'
				and source_workout_date = v_target_date
				and target_date = v_source_date
				and displaced_workout->>'workout_type' = 'rest'
			order by id desc limit 1;

			if v_matching_undo_event.id is not null then
				if v_latest_event.id is distinct from v_matching_undo_event.id then
					return jsonb_build_object('ok', false, 'reason', 'stale_review',
						'message', 'The stored Rest Undo state is no longer the latest Calendar change.');
				end if;
				if v_matching_undo_event.undo_expires_at is null
					or v_matching_undo_event.undo_expires_at <= clock_timestamp()
				then
					return jsonb_build_object('ok', false, 'reason', 'undo_expired',
						'message', 'The stored Rest Undo window expired without changing the Calendar.');
				end if;
				if p_expected_target_workout is not null and p_expected_target_workout <> 'null'::jsonb then
					return jsonb_build_object('ok', false, 'reason', 'unsafe_target_state',
						'message', 'A displaced Rest can only be restored onto its empty source date.');
				end if;
				v_restore := v_matching_undo_event.displaced_workout;
			end if;

			if p_expected_target_workout is null or p_expected_target_workout = 'null'::jsonb then
				if p_mutation_event->>'target_workout_id' <> v_source.id::text then
					return jsonb_build_object('ok', false, 'reason', 'invalid_input',
						'message', 'The move review evidence does not identify the empty target operation.');
				end if;

				if exists (
					select 1 from public.planned_workouts
					where user_id = p_user_id and workout_date = v_target_date and id <> v_source.id
				) then
					return jsonb_build_object('ok', false, 'reason', 'stale_review',
						'message', 'The target date changed before the workout was moved.');
				end if;
			else
				if v_restore is not null or jsonb_typeof(p_expected_target_workout) <> 'object' then
					return jsonb_build_object('ok', false, 'reason', 'unsafe_target_state',
						'message', 'The reviewed replacement target is invalid.');
				end if;

				select * into v_target
				from public.planned_workouts
				where id = (p_expected_target_workout->>'id')::uuid
					and user_id = p_user_id and workout_date = v_target_date
				for update;

				if not found or to_jsonb(v_target) is distinct from p_expected_target_workout then
					return jsonb_build_object('ok', false, 'reason', 'stale_review',
						'message', 'The target workout changed before the move was saved.');
				end if;

				if p_mutation_event->>'target_workout_id' <> v_target.id::text then
					return jsonb_build_object('ok', false, 'reason', 'invalid_input',
						'message', 'The move review evidence does not identify the locked target row.');
				end if;

				if v_target.workout_date <= p_current_date
					or exists (select 1 from public.workout_logs where user_id = p_user_id and planned_workout_id = v_target.id)
					or exists (select 1 from public.workout_result_assets where user_id = p_user_id and planned_workout_id = v_target.id)
					or exists (select 1 from public.workout_actual_metrics where user_id = p_user_id and planned_workout_id = v_target.id)
					or exists (select 1 from public.workout_comparisons where user_id = p_user_id and planned_workout_id = v_target.id)
					or exists (select 1 from public.workout_ai_insights where user_id = p_user_id and planned_workout_id = v_target.id)
					or exists (select 1 from public.runner_activity_planned_workout_matches where user_id = p_user_id and planned_workout_id = v_target.id)
				then
					return jsonb_build_object('ok', false, 'reason', 'protected_day',
						'message', 'The target workout became protected before the move was saved.');
				end if;

				delete from public.planned_workouts where id = v_target.id and user_id = p_user_id
				returning * into v_deleted;
				if v_target.workout_type = 'rest' then
					v_restore := to_jsonb(v_target);
					v_undo_expires_at := clock_timestamp() + interval '45 seconds';
				end if;
			end if;

			update public.planned_workouts
			set workout_date = v_target_date,
				weekday = p_workout_update->>'weekday'
			where id = v_source.id and user_id = p_user_id
			returning * into v_mutated;

			if v_matching_undo_event.id is not null then
				if jsonb_typeof(v_restore) <> 'object'
					or v_restore->>'user_id' <> p_user_id::text
					or v_restore->>'workout_date' <> v_source_date::text
					or v_restore->>'workout_type' <> 'rest'
					or exists (select 1 from public.planned_workouts where id = (v_restore->>'id')::uuid)
				then
					raise exception 'Authoritative displaced Rest state failed fail-closed restoration.';
				end if;

				v_restore_origin := coalesce(nullif(v_restore->>'origin_kind', ''), 'manual');
				if v_restore_origin not in ('manual', 'ai', 'file_import') then
					raise exception 'Authoritative displaced Rest origin is invalid.';
				end if;

				if nullif(v_restore->>'plan_cycle_id', '') is not null
					and not exists (
						select 1 from public.plan_cycles source
						where source.id = (v_restore->>'plan_cycle_id')::uuid
							and source.user_id = p_user_id
					)
				then
					raise exception 'Authoritative displaced Rest provenance is no longer owned.';
				end if;

				insert into public.planned_workouts (
					id, plan_cycle_id, user_id, origin_kind, workout_date, weekday, week_number,
					phase, workout_type, source_workout_id, source_workout_type, workout_family,
					workout_identity, calendar_icon_key, goal_context, metric_mode, title, notes,
					planned_rpe, estimated_fatigue, recovery_priority, steps, display_order, created_at
				) values (
					(v_restore->>'id')::uuid,
					nullif(v_restore->>'plan_cycle_id', '')::uuid,
					p_user_id,
					v_restore_origin,
					(v_restore->>'workout_date')::date,
					v_restore->>'weekday',
					(v_restore->>'week_number')::integer,
					v_restore->>'phase',
					'rest'::public.workout_type,
					v_restore->>'source_workout_id',
					v_restore->>'source_workout_type',
					v_restore->>'workout_family',
					v_restore->>'workout_identity',
					v_restore->>'calendar_icon_key',
					nullif(v_restore->'goal_context', 'null'::jsonb),
					nullif(v_restore->'metric_mode', 'null'::jsonb),
					v_restore->>'title',
					v_restore->>'notes',
					(v_restore->>'planned_rpe')::smallint,
					v_restore->>'estimated_fatigue',
					v_restore->>'recovery_priority',
					v_restore->'steps',
					(v_restore->>'display_order')::integer,
					(v_restore->>'created_at')::timestamptz
				) returning * into v_restored;
			end if;
		end if;
	end if;

	insert into public.calendar_workout_mutation_events (
		user_id, mutation_kind, planned_workout_id, source_workout_id, target_workout_id,
		source_workout_date, target_date, before_workout, after_workout, displaced_workout,
		review_payload_version, review_checksum, mutation_payload_version, mutation_checksum,
		event_payload, occurred_at, undo_expires_at, undo_of_event_id
	) values (
		p_user_id,
		v_event_kind,
		coalesce(v_mutated.id, v_deleted.id),
		case
			when p_mutation_kind = 'add' and v_event_kind <> 'user_copied_workout' then null
			else v_source.id
		end,
		coalesce(v_deleted.id, v_mutated.id),
		coalesce(v_source_date, v_source.workout_date),
		coalesce(v_target_date, v_mutated.workout_date, v_deleted.workout_date),
		case
			when p_mutation_kind = 'add' or v_source.id is null then null
			else to_jsonb(v_source)
		end,
		case when v_mutated.id is null then null else to_jsonb(v_mutated) end,
		case
			when p_mutation_kind = 'move'
				and v_matching_undo_event.id is null
				and v_deleted.id is not null
				then to_jsonb(v_deleted)
			else null
		end,
		p_mutation_event->>'review_payload_version',
		p_mutation_event->>'review_checksum',
		p_mutation_event->>'mutation_payload_version',
		nullif(p_mutation_event->>'mutation_checksum', ''),
		p_mutation_event,
		clock_timestamp(),
		v_undo_expires_at,
		case when v_matching_undo_event.id is null then null else v_matching_undo_event.id end
	) returning * into v_event;

	return jsonb_build_object(
		'ok', true,
		'mutation_kind', p_mutation_kind,
		'mutated_workout', case when v_mutated.id is null then null else to_jsonb(v_mutated) end,
		'deleted_workout', case when v_deleted.id is null then null else to_jsonb(v_deleted) end,
		'restored_workout', case when v_restored.id is null then null else to_jsonb(v_restored) end,
		'mutation_event', to_jsonb(v_event),
		'undo_expires_at', v_event.undo_expires_at
	);
end;
$$;

revoke execute on function public.apply_calendar_workout_mutation(
	uuid, date, text, jsonb, jsonb, jsonb, jsonb, jsonb
) from public, anon, authenticated;
grant execute on function public.apply_calendar_workout_mutation(
	uuid, date, text, jsonb, jsonb, jsonb, jsonb, jsonb
) to service_role;

drop function if exists public.apply_calendar_workout_content_edit(
	uuid, uuid, uuid, timestamptz, date, jsonb, jsonb, jsonb, jsonb
);

create function public.apply_calendar_workout_content_edit(
	p_user_id uuid,
	p_workout_id uuid,
	p_current_date date,
	p_expected_workout jsonb,
	p_workout_update jsonb,
	p_mutation_event jsonb
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
	v_workout public.planned_workouts%rowtype;
	v_before public.planned_workouts%rowtype;
	v_event public.calendar_workout_mutation_events%rowtype;
begin
	if jsonb_typeof(coalesce(p_expected_workout, 'null'::jsonb)) <> 'object'
		or jsonb_typeof(coalesce(p_workout_update, 'null'::jsonb)) <> 'object'
		or jsonb_typeof(coalesce(p_mutation_event, 'null'::jsonb)) <> 'object'
		or p_mutation_event->>'mutation_source' <> 'calendar_workout_mutation_v1'
		or p_mutation_event->>'mutation_kind' <> 'user_edited_workout'
		or p_mutation_event->>'planned_workout_id' <> p_workout_id::text
		or coalesce(p_mutation_event->>'review_payload_version', '') = ''
		or coalesce(p_mutation_event->>'review_checksum', '') !~ '^[0-9a-f]{64}$'
	then
		return jsonb_build_object('ok', false, 'reason', 'invalid_input',
			'message', 'The reviewed workout document edit payload is invalid.');
	end if;

	perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

	select * into v_workout
	from public.planned_workouts
	where id = p_workout_id and user_id = p_user_id
	for update;
	v_before := v_workout;

	if not found or to_jsonb(v_workout) is distinct from p_expected_workout then
		return jsonb_build_object('ok', false, 'reason', 'stale_review',
			'message', 'The Calendar workout changed before the edit was saved.');
	end if;

	if p_mutation_event->>'origin_kind' is distinct from v_workout.origin_kind
		or p_mutation_event->>'previous_workout_date' <> v_workout.workout_date::text
		or p_mutation_event->>'target_workout_id' <> v_workout.id::text
		or p_mutation_event->>'target_date' <> v_workout.workout_date::text
	then
		return jsonb_build_object('ok', false, 'reason', 'invalid_input',
			'message', 'The workout edit review evidence does not match the locked Calendar row.');
	end if;

	if v_workout.workout_type = 'rest'
		or v_workout.workout_date < p_current_date
		or (p_workout_update->>'workout_type') = 'rest'
		or exists (select 1 from public.workout_logs where user_id = p_user_id and planned_workout_id = p_workout_id)
		or exists (select 1 from public.workout_result_assets where user_id = p_user_id and planned_workout_id = p_workout_id)
		or exists (select 1 from public.workout_actual_metrics where user_id = p_user_id and planned_workout_id = p_workout_id)
		or exists (select 1 from public.workout_comparisons where user_id = p_user_id and planned_workout_id = p_workout_id)
		or exists (select 1 from public.workout_ai_insights where user_id = p_user_id and planned_workout_id = p_workout_id)
		or exists (select 1 from public.runner_activity_planned_workout_matches where user_id = p_user_id and planned_workout_id = p_workout_id)
	then
		return jsonb_build_object('ok', false, 'reason', 'protected_day',
			'message', 'Past, logged, skipped, Rest, or evidence-backed workouts cannot be edited.');
	end if;

	update public.planned_workouts
	set workout_type = (p_workout_update->>'workout_type')::public.workout_type,
		workout_family = p_workout_update->>'workout_family',
		workout_identity = p_workout_update->>'workout_identity',
		calendar_icon_key = p_workout_update->>'calendar_icon_key',
		metric_mode = p_workout_update->'metric_mode',
		title = p_workout_update->>'title',
		notes = p_workout_update->>'notes',
		steps = p_workout_update->'steps'
	where id = p_workout_id and user_id = p_user_id
	returning * into v_workout;

	insert into public.calendar_workout_mutation_events (
		user_id, mutation_kind, planned_workout_id, target_workout_id,
		source_workout_date, target_date, before_workout, after_workout,
		review_payload_version, review_checksum, mutation_payload_version, mutation_checksum,
		event_payload, occurred_at
	) values (
		p_user_id,
		'user_edited_workout',
		p_workout_id,
		p_workout_id,
		v_before.workout_date,
		v_workout.workout_date,
		to_jsonb(v_before),
		to_jsonb(v_workout),
		p_mutation_event->>'review_payload_version',
		p_mutation_event->>'review_checksum',
		p_mutation_event->>'mutation_payload_version',
		nullif(p_mutation_event->>'mutation_checksum', ''),
		p_mutation_event,
		clock_timestamp()
	) returning * into v_event;

	return jsonb_build_object(
		'ok', true,
		'edited_workout', to_jsonb(v_workout),
		'mutation_event', to_jsonb(v_event)
	);
end;
$$;

revoke execute on function public.apply_calendar_workout_content_edit(
	uuid, uuid, date, jsonb, jsonb, jsonb
) from public, anon, authenticated;
grant execute on function public.apply_calendar_workout_content_edit(
	uuid, uuid, date, jsonb, jsonb, jsonb
) to service_role;
