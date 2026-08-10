-- Persist per-card voice-count picker + session snapshot for templates / plan hydrate.
ALTER TABLE workout_cards
  ADD COLUMN IF NOT EXISTS voice_prefs JSONB;

COMMENT ON COLUMN workout_cards.voice_prefs IS
  'Optional voice-count prefs: card pickers (targetReps/repGapMs/oneMoreCount/holdDurationSec) + session snapshot (pack/mode/prep/flow/toggles).';
