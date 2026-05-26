revoke execute on function public.apply_active_plan_schedule_reflow(
	uuid,
	uuid,
	timestamptz,
	jsonb,
	timestamptz,
	jsonb
) from public;

revoke execute on function public.apply_active_plan_schedule_reflow(
	uuid,
	uuid,
	timestamptz,
	jsonb,
	timestamptz,
	jsonb
) from anon;

revoke execute on function public.apply_active_plan_schedule_reflow(
	uuid,
	uuid,
	timestamptz,
	jsonb,
	timestamptz,
	jsonb
) from authenticated;

grant execute on function public.apply_active_plan_schedule_reflow(
	uuid,
	uuid,
	timestamptz,
	jsonb,
	timestamptz,
	jsonb
) to service_role;
