-- Machine request "나도 원함" votes (user demand signal)

ALTER TABLE machine_requests
  ADD COLUMN IF NOT EXISTS vote_count INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_machine_requests_vote_count
  ON machine_requests (vote_count DESC);

CREATE TABLE IF NOT EXISTS machine_request_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES machine_requests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, request_id)
);

CREATE INDEX IF NOT EXISTS idx_machine_request_votes_request_id
  ON machine_request_votes (request_id);

COMMENT ON TABLE machine_request_votes IS 'Users who also want an existing machine request ("나도 원함")';
