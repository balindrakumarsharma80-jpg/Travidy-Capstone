-- ============================================================
-- Travidy Backend: Fixes from dev branch review
-- Migration: fix_trip_alerts_and_profile_trigger
-- ============================================================

-- Context for whoever reviews this: two small gaps found while reviewing
-- 20260809100000_add_travidy_backend_requirements.sql against the original
-- spec. Neither is breaking anything currently deployed — both are safe to
-- apply any time before the trip_alerts UI and profile-name display ship.


-- ============================================================
-- 1. trip_alerts was read-only — add update access for the owner
-- ============================================================

-- Original migration only added a "select" policy, so once the frontend
-- tries to mark an alert as read, RLS silently blocks the update with no
-- rows affected (not an error — just a no-op that looks like a bug).

create policy "Users update own trip alerts"
on trip_alerts
for update
using (
  exists (
    select 1
    from trips
    where trips.id = trip_alerts.trip_id
      and trips.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from trips
    where trips.id = trip_alerts.trip_id
      and trips.user_id = auth.uid()
  )
);


-- ============================================================
-- 2. handle_new_user() should populate full_name at signup
-- ============================================================

-- Original trigger only inserts the profile id, leaving full_name blank
-- until a user manually edits their profile. This pulls it from the
-- auth signup metadata instead, matching what the signup form already
-- collects (Google sign-in populates this automatically; email/password
-- signup needs to pass full_name in the signUp() options.data object on
-- the frontend for this to have something to read).

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');

  return new;
end;
$$;

-- No need to recreate the trigger itself — it already points at this
-- function by name, so replacing the function body is sufficient.
