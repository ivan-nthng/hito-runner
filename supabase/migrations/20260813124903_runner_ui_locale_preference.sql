alter table public.runner_profiles
	add column ui_locale_preference text not null default 'system';

alter table public.runner_profiles
	add constraint runner_profiles_ui_locale_preference_check
	check (ui_locale_preference in ('system', 'en', 'pt-BR'));

comment on column public.runner_profiles.ui_locale_preference is
	'Runner-synchronized UI locale preference. System resolution remains request-relative and is never persisted as an inferred explicit locale.';
