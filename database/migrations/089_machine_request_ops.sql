-- Machine request ops: hide, assignee, priority, votes ("나도 원함")

ALTER TABLE machine_requests
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS assignee_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS priority VARCHAR(16) NOT NULL DEFAULT 'normal';

ALTER TABLE machine_requests
  ADD COLUMN IF NOT EXISTS vote_count INT NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'machine_requests_priority_check'
  ) THEN
    ALTER TABLE machine_requests
      ADD CONSTRAINT machine_requests_priority_check
      CHECK (priority IN ('low', 'normal', 'high'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_machine_requests_is_hidden
  ON machine_requests (is_hidden) WHERE is_hidden = FALSE;
CREATE INDEX IF NOT EXISTS idx_machine_requests_assignee
  ON machine_requests (assignee_user_id) WHERE assignee_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_machine_requests_priority
  ON machine_requests (priority, created_at DESC);
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
