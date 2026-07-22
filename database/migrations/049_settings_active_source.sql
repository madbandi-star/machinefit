-- Distinguish whether AI recommended or user-adjusted settings are active per machine.
ALTER TABLE user_machine_preferences
  ADD COLUMN IF NOT EXISTS active_source VARCHAR(20) NOT NULL DEFAULT 'recommended';

ALTER TABLE user_machine_preferences
  DROP CONSTRAINT IF EXISTS user_machine_preferences_active_source_check;

ALTER TABLE user_machine_preferences
  ADD CONSTRAINT user_machine_preferences_active_source_check
  CHECK (active_source IN ('recommended', 'adjusted'));

-- Existing rows with non-empty custom settings should keep using adjusted values.
UPDATE user_machine_preferences
SET active_source = 'adjusted'
WHERE active_source = 'recommended'
  AND custom_settings IS NOT NULL
  AND custom_settings <> '{}'::jsonb
  AND EXISTS (
    SELECT 1
    FROM jsonb_each(custom_settings) AS kv(key, value)
    WHERE value IS NOT NULL
      AND value::text NOT IN ('null', '""', '[]', '{}')
  );
