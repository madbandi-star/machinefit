-- Push campaign consent audit fields (recipient filtering / category).

ALTER TABLE push_campaigns
  ADD COLUMN IF NOT EXISTS consent_category VARCHAR(32),
  ADD COLUMN IF NOT EXISTS skipped_consent_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failed_count INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN push_campaigns.consent_category IS
  'marketing | service — which user consent gate was applied at send time';
COMMENT ON COLUMN push_campaigns.skipped_consent_count IS
  'Recipients removed because required consent was not granted at send time';
