-- Multi-provider OAuth identities (Google / Kakao / Apple).
-- Business data keeps referencing users.id only; providers live here.

ALTER TABLE users
  ALTER COLUMN password_hash DROP NOT NULL;

CREATE TABLE IF NOT EXISTS auth_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('google', 'kakao', 'apple')),
  provider_user_id VARCHAR(255) NOT NULL,
  provider_email VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_auth_providers_user_provider UNIQUE (user_id, provider),
  CONSTRAINT uq_auth_providers_provider_uid UNIQUE (provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_auth_providers_user_id ON auth_providers (user_id);
CREATE INDEX IF NOT EXISTS idx_auth_providers_provider ON auth_providers (provider);

CREATE TRIGGER trg_auth_providers_updated_at
  BEFORE UPDATE ON auth_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
