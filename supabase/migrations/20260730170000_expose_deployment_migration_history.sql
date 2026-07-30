create or replace function public.list_hito_applied_migration_versions()
returns table(version text)
language sql
stable
security definer
set search_path = ''
as $$
	select migration.version::text
	from supabase_migrations.schema_migrations as migration
	order by migration.version;
$$;

revoke all on function public.list_hito_applied_migration_versions() from public;
revoke all on function public.list_hito_applied_migration_versions() from anon;
revoke all on function public.list_hito_applied_migration_versions() from authenticated;
grant execute on function public.list_hito_applied_migration_versions() to service_role;
