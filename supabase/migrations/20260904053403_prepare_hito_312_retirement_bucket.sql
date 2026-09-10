-- HITO-312: satisfy the provider-owned empty-bucket precondition before the
-- immutable hosted-retirement migration runs during a fresh local reset.

begin;

do $hito_312_retirement_bucket$
declare
  v_bucket_count integer;
  v_deleted integer;
begin
  if (
    select count(*)
    from storage.objects
    where bucket_id = 'hito-staging-workout-result-assets'
  ) <> 0 then
    raise exception 'HITO-312 retirement preparation refuses nonempty staging Storage.';
  end if;

  select count(*)
    into v_bucket_count
  from storage.buckets
  where id = 'hito-staging-workout-result-assets'
    or name = 'hito-staging-workout-result-assets';

  if v_bucket_count = 0 then
    return;
  end if;

  if v_bucket_count <> 1 or not exists (
    select 1
    from storage.buckets
    where id = 'hito-staging-workout-result-assets'
      and name = 'hito-staging-workout-result-assets'
      and public = false
      and file_size_limit = 26214400
      and allowed_mime_types = array[
        'application/octet-stream',
        'application/zip',
        'application/x-zip-compressed'
      ]::text[]
  ) then
    raise exception 'HITO-312 retirement preparation refuses an unexpected staging bucket.';
  end if;

  perform set_config('storage.allow_delete_query', 'true', true);
  delete from storage.buckets
  where id = 'hito-staging-workout-result-assets'
    and name = 'hito-staging-workout-result-assets';

  get diagnostics v_deleted = row_count;
  if v_deleted <> 1 then
    raise exception 'HITO-312 retirement preparation did not remove exactly one empty staging bucket.';
  end if;
end
$hito_312_retirement_bucket$;

commit;
