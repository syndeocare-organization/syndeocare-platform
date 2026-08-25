-- Align the database phone constraint with the shared onboarding contract.
-- Standard-conforming PostgreSQL strings need one backslash to escape the
-- literal plus sign in the regular expression.

alter table public.profiles
  drop constraint if exists profiles_phone_check;

alter table public.profiles
  add constraint profiles_phone_check
  check (phone is null or phone ~ '^\+?[0-9 ()-]{7,20}$');
