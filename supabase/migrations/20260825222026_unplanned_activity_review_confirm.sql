-- HITO-255 additive neutral vocabulary. PostgreSQL requires the enum value to
-- commit before a later migration can compile functions that reference it.

alter type public.workout_type add value if not exists 'recorded_run';
