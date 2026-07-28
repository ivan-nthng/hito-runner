-- QA lifecycle cleanup uses the server-only service role and must be able to remove
-- test-owned entitlement and usage rows before retaining or deleting a tester identity.
grant delete on table
  public.runner_entitlements,
  public.runner_capability_usage
to service_role;
