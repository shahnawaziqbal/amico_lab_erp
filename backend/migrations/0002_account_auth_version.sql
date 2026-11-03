-- Step 59B: authentication generation per user.
-- Apply through the verified migration procedure in a later step.
-- DO NOT apply this migration to the tracked database.
ALTER TABLE user_profiles
  ADD COLUMN auth_version INTEGER NOT NULL DEFAULT 0;
