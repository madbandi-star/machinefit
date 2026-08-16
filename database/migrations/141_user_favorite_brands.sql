-- User brand favorites (user ↔ brand relation only; brand master unchanged).
-- Express authorizes via JWT; RLS denies PostgREST anon/authenticated (project standard).

CREATE TABLE IF NOT EXISTS user_favorite_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, brand_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorite_brands_user_id
  ON user_favorite_brands (user_id);

CREATE INDEX IF NOT EXISTS idx_user_favorite_brands_brand_id
  ON user_favorite_brands (brand_id);

CREATE INDEX IF NOT EXISTS idx_user_favorite_brands_user_created
  ON user_favorite_brands (user_id, created_at DESC);

CREATE TRIGGER trg_user_favorite_brands_updated_at
  BEFORE UPDATE ON user_favorite_brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE user_favorite_brands ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    EXECUTE 'REVOKE ALL ON TABLE user_favorite_brands FROM anon, authenticated, PUBLIC';
  EXCEPTION
    WHEN undefined_object THEN NULL;
  END;
END $$;

-- Optional retention policy seed (purge also CASCADE + privacy-retention.service hook).
INSERT INTO retention_policies (
  code, name, description, data_category, table_names, retention_reason,
  is_legal_hold, legal_basis_note, related_policy_doc, consent_catalog_id,
  period_value, period_unit, start_basis, auto_delete, deletion_method
)
SELECT
  'user_favorite_brands',
  '브랜드 즐겨찾기',
  'user_favorite_brands',
  'service',
  ARRAY['user_favorite_brands'],
  'operations',
  FALSE,
  '탈퇴 후 hard purge / ON DELETE CASCADE',
  'privacy',
  c.id,
  30,
  'day',
  'withdrawn_at',
  TRUE,
  'hard_delete'
FROM retention_consent_catalog c
WHERE c.code = 'privacy'
ON CONFLICT (code) DO NOTHING;
