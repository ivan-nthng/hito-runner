alter table public.runner_profiles
	drop constraint if exists runner_profiles_heart_rate_profile_object_check;

create or replace function public.validate_runner_heart_rate_profile_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
	if tg_op = 'UPDATE'
		and new.heart_rate_profile is not distinct from old.heart_rate_profile then
		return new;
	end if;

	if new.heart_rate_profile is null then
		return new;
	end if;

	if not coalesce((
		jsonb_typeof(new.heart_rate_profile) = 'object'
		and new.heart_rate_profile ->> 'version' = 'runner_hr_profile_v2'
		and (
			(
				new.heart_rate_profile ->> 'source' = 'estimated'
				and new.heart_rate_profile - array['version', 'source'] = '{}'::jsonb
			)
			or (
				new.heart_rate_profile ->> 'source' = 'personal'
				and new.heart_rate_profile - array['version', 'source', 'zones'] = '{}'::jsonb
				and jsonb_typeof(new.heart_rate_profile -> 'zones') = 'array'
				and jsonb_array_length(new.heart_rate_profile -> 'zones') = 5
				and new.heart_rate_profile -> 'zones' -> 0 ->> 'reference' = 'Z1'
				and new.heart_rate_profile -> 'zones' -> 1 ->> 'reference' = 'Z2'
				and new.heart_rate_profile -> 'zones' -> 2 ->> 'reference' = 'Z3'
				and new.heart_rate_profile -> 'zones' -> 3 ->> 'reference' = 'Z4'
				and new.heart_rate_profile -> 'zones' -> 4 ->> 'reference' = 'Z5'
				and (new.heart_rate_profile -> 'zones' -> 0)
					- array['reference', 'minBpm', 'maxBpm'] = '{}'::jsonb
				and (new.heart_rate_profile -> 'zones' -> 1)
					- array['reference', 'minBpm', 'maxBpm'] = '{}'::jsonb
				and (new.heart_rate_profile -> 'zones' -> 2)
					- array['reference', 'minBpm', 'maxBpm'] = '{}'::jsonb
				and (new.heart_rate_profile -> 'zones' -> 3)
					- array['reference', 'minBpm', 'maxBpm'] = '{}'::jsonb
				and (new.heart_rate_profile -> 'zones' -> 4)
					- array['reference', 'minBpm', 'maxBpm'] = '{}'::jsonb
				and not jsonb_path_exists(
					new.heart_rate_profile,
					'$.zones[*] ? (
						!exists(@.minBpm)
						|| @.minBpm.type() != "number"
						|| @.minBpm < 60
						|| @.minBpm > 200
						|| @.minBpm != @.minBpm.floor()
						|| !exists(@.maxBpm)
						|| @.maxBpm.type() != "number"
						|| @.maxBpm < 60
						|| @.maxBpm > 200
						|| @.maxBpm != @.maxBpm.floor()
						|| @.minBpm > @.maxBpm
					)'
				)
				and case
					when jsonb_path_exists(
						new.heart_rate_profile,
						'$.zones[*] ? (
							@.minBpm.type() != "number"
							|| @.maxBpm.type() != "number"
						)'
					) then false
					else
						((new.heart_rate_profile -> 'zones' -> 1 ->> 'minBpm')::numeric
							>= (new.heart_rate_profile -> 'zones' -> 0 ->> 'minBpm')::numeric)
						and ((new.heart_rate_profile -> 'zones' -> 2 ->> 'minBpm')::numeric
							>= (new.heart_rate_profile -> 'zones' -> 1 ->> 'minBpm')::numeric)
						and ((new.heart_rate_profile -> 'zones' -> 3 ->> 'minBpm')::numeric
							>= (new.heart_rate_profile -> 'zones' -> 2 ->> 'minBpm')::numeric)
						and ((new.heart_rate_profile -> 'zones' -> 4 ->> 'minBpm')::numeric
							>= (new.heart_rate_profile -> 'zones' -> 3 ->> 'minBpm')::numeric)
						and ((new.heart_rate_profile -> 'zones' -> 1 ->> 'maxBpm')::numeric
							>= (new.heart_rate_profile -> 'zones' -> 0 ->> 'maxBpm')::numeric)
						and ((new.heart_rate_profile -> 'zones' -> 2 ->> 'maxBpm')::numeric
							>= (new.heart_rate_profile -> 'zones' -> 1 ->> 'maxBpm')::numeric)
						and ((new.heart_rate_profile -> 'zones' -> 3 ->> 'maxBpm')::numeric
							>= (new.heart_rate_profile -> 'zones' -> 2 ->> 'maxBpm')::numeric)
						and ((new.heart_rate_profile -> 'zones' -> 4 ->> 'maxBpm')::numeric
							>= (new.heart_rate_profile -> 'zones' -> 3 ->> 'maxBpm')::numeric)
				end
			)
		)
	), false) then
		raise check_violation using
			message = 'Personal heart-rate guidance must contain ordered whole-BPM bands from 60 to 200.',
			schema = 'public',
			table = 'runner_profiles',
			constraint = 'runner_profiles_heart_rate_profile_write_check';
	end if;

	return new;
end;
$$;

revoke all on function public.validate_runner_heart_rate_profile_write() from public;

drop trigger if exists runner_profiles_validate_heart_rate_profile_write
	on public.runner_profiles;

create trigger runner_profiles_validate_heart_rate_profile_write
before insert or update of heart_rate_profile on public.runner_profiles
for each row
execute function public.validate_runner_heart_rate_profile_write();
