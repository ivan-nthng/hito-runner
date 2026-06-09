update public.admin_capture_items
set target_role = 'product'
where target_role is not null
and target_role not in (
	'architect',
	'backend',
	'frontend',
	'designer',
	'copy',
	'qa',
	'product',
	'running_coach'
);

alter table public.admin_capture_items
drop constraint if exists admin_capture_items_target_role_check;

alter table public.admin_capture_items
add constraint admin_capture_items_target_role_check
check (
	target_role is null
	or target_role in (
		'architect',
		'backend',
		'frontend',
		'designer',
		'copy',
		'qa',
		'product',
		'running_coach'
	)
);
