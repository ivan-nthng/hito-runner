create table public.runner_entitlements (
	user_id uuid primary key references auth.users (id) on delete cascade,
	tier text not null check (tier in ('basic', 'pro')),
	source text not null check (
		source in (
			'prebilling_default_pro',
			'manual_override',
			'subscription',
			'promo'
		)
	),
	status text not null default 'active' check (status in ('active', 'inactive')),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.runner_capability_usage (
	user_id uuid not null references auth.users (id) on delete cascade,
	capability_key text not null check (length(trim(capability_key)) > 0),
	period_key text not null default 'lifetime' check (length(trim(period_key)) > 0),
	used_count integer not null default 0 check (used_count >= 0),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	primary key (user_id, capability_key, period_key)
);

create index runner_capability_usage_user_capability_idx
	on public.runner_capability_usage (user_id, capability_key);

create trigger runner_entitlements_set_updated_at
before update on public.runner_entitlements
for each row
execute function public.set_updated_at();

create trigger runner_capability_usage_set_updated_at
before update on public.runner_capability_usage
for each row
execute function public.set_updated_at();

alter table public.runner_entitlements enable row level security;
alter table public.runner_capability_usage enable row level security;

create policy "runner_entitlements_select_own"
	on public.runner_entitlements
	for select
	to authenticated
	using (auth.uid() = user_id);

create policy "runner_capability_usage_select_own"
	on public.runner_capability_usage
	for select
	to authenticated
	using (auth.uid() = user_id);
