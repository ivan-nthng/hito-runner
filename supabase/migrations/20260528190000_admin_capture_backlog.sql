create table if not exists public.admin_capture_items (
	id uuid primary key default gen_random_uuid(),
	item_type text not null check (item_type in ('bug', 'change_request', 'context_capture')),
	status text not null default 'new' check (status in ('new', 'in_review', 'ready_for_codex', 'done', 'archived')),
	priority text null check (priority is null or priority in ('low', 'medium', 'high', 'urgent')),
	target_role text null check (
		target_role is null
		or target_role in (
			'architect',
			'backend',
			'frontend',
			'designer',
			'copy',
			'qa',
			'prompt_engineer',
			'running_coach'
		)
	),
	title text null check (title is null or char_length(title) <= 160),
	note text not null check (char_length(note) between 1 and 4000),
	page_url text not null check (char_length(page_url) between 1 and 2048),
	route text null check (route is null or char_length(route) <= 512),
	created_by_user_id text not null check (char_length(created_by_user_id) between 1 and 160),
	created_by_label text null check (created_by_label is null or char_length(created_by_label) <= 160),
	viewport_width integer null check (viewport_width is null or viewport_width between 1 and 10000),
	viewport_height integer null check (viewport_height is null or viewport_height between 1 and 10000),
	element_text text null check (element_text is null or char_length(element_text) <= 1000),
	selector text null check (selector is null or char_length(selector) <= 1000),
	dom_path text null check (dom_path is null or char_length(dom_path) <= 1500),
	nearby_heading text null check (nearby_heading is null or char_length(nearby_heading) <= 300),
	bounding_rect jsonb null check (bounding_rect is null or jsonb_typeof(bounding_rect) = 'object'),
	metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	archived_at timestamptz null
);

create table if not exists public.admin_capture_assets (
	id uuid primary key default gen_random_uuid(),
	capture_item_id uuid not null references public.admin_capture_items(id) on delete cascade,
	asset_kind text not null check (
		asset_kind in ('viewport_screenshot', 'full_page_screenshot', 'element_crop')
	),
	storage_bucket text not null check (char_length(storage_bucket) between 1 and 120),
	storage_path text not null check (char_length(storage_path) between 1 and 1024),
	mime_type text not null check (char_length(mime_type) between 1 and 120),
	width integer null check (width is null or width between 1 and 20000),
	height integer null check (height is null or height between 1 and 20000),
	byte_size integer null check (byte_size is null or byte_size between 1 and 52428800),
	checksum text null check (checksum is null or char_length(checksum) <= 160),
	created_at timestamptz not null default now()
);

create index if not exists admin_capture_items_status_created_at_idx
	on public.admin_capture_items (status, created_at desc);

create index if not exists admin_capture_items_priority_created_at_idx
	on public.admin_capture_items (priority, created_at desc)
	where priority is not null;

create index if not exists admin_capture_items_target_role_created_at_idx
	on public.admin_capture_items (target_role, created_at desc)
	where target_role is not null;

create index if not exists admin_capture_items_route_created_at_idx
	on public.admin_capture_items (route, created_at desc)
	where route is not null;

create index if not exists admin_capture_items_archived_at_idx
	on public.admin_capture_items (archived_at)
	where archived_at is not null;

create index if not exists admin_capture_assets_capture_item_id_idx
	on public.admin_capture_assets (capture_item_id);

drop trigger if exists admin_capture_items_set_updated_at on public.admin_capture_items;
create trigger admin_capture_items_set_updated_at
before update on public.admin_capture_items
for each row
execute function public.set_updated_at();

alter table public.admin_capture_items enable row level security;
alter table public.admin_capture_assets enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
	'admin-capture-assets',
	'admin-capture-assets',
	false,
	10485760,
	array[
		'image/jpeg',
		'image/png',
		'image/webp'
	]
)
on conflict (id) do update
set
	public = excluded.public,
	file_size_limit = excluded.file_size_limit,
	allowed_mime_types = excluded.allowed_mime_types;
