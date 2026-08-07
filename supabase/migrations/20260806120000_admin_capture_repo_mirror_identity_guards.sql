do $$
begin
	if exists (
		select 1
		from public.admin_capture_items
		where metadata @> '{"imported_from_repo": true}'::jsonb
			and nullif(metadata ->> 'work_item_id', '') is not null
		group by metadata ->> 'work_item_id'
		having count(*) > 1
	) then
		raise exception 'Cannot add admin repo mirror identity guard: duplicate work_item_id values exist';
	end if;

	if exists (
		select 1
		from public.admin_capture_items
		where metadata @> '{"imported_from_repo": true}'::jsonb
			and nullif(metadata ->> 'source_type', '') is not null
			and nullif(metadata ->> 'source_path', '') is not null
		group by metadata ->> 'source_type', metadata ->> 'source_path'
		having count(*) > 1
	) then
		raise exception 'Cannot add admin repo mirror source guard: duplicate source identities exist';
	end if;
end;
$$;

create unique index if not exists admin_capture_items_repo_work_item_id_uidx
	on public.admin_capture_items ((metadata ->> 'work_item_id'))
	where metadata @> '{"imported_from_repo": true}'::jsonb
		and nullif(metadata ->> 'work_item_id', '') is not null;

create unique index if not exists admin_capture_items_repo_source_uidx
	on public.admin_capture_items ((metadata ->> 'source_type'), (metadata ->> 'source_path'))
	where metadata @> '{"imported_from_repo": true}'::jsonb
		and nullif(metadata ->> 'source_type', '') is not null
		and nullif(metadata ->> 'source_path', '') is not null;
