alter table public.runner_profiles
	add column calendar_timezone text not null default 'UTC',
	add column calendar_timezone_source text not null default 'fallback_utc';

alter table public.runner_profiles
	add constraint runner_profiles_calendar_timezone_source_check
	check (calendar_timezone_source in ('fallback_utc', 'browser', 'user'));

create or replace function public.validate_runner_profile_calendar_timezone()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
	if not exists (
		select 1
		from pg_catalog.pg_timezone_names
		where name = new.calendar_timezone
	) then
		raise exception 'calendar_timezone must be a recognized IANA timezone'
			using errcode = '23514';
	end if;

	return new;
end;
$$;

revoke all on function public.validate_runner_profile_calendar_timezone() from public;
revoke all on function public.validate_runner_profile_calendar_timezone() from anon;
revoke all on function public.validate_runner_profile_calendar_timezone() from authenticated;

create trigger runner_profiles_validate_calendar_timezone
before insert or update of calendar_timezone on public.runner_profiles
for each row
execute function public.validate_runner_profile_calendar_timezone();

comment on column public.runner_profiles.calendar_timezone is
	'Canonical current-calendar IANA timezone for this runner; independent of activity historical timezone.';

comment on column public.runner_profiles.calendar_timezone_source is
	'How the canonical runner calendar timezone was established: explicit UTC recovery fallback, browser initialization, or user choice.';
