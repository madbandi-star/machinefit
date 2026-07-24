-- Online PT (question-ticket) platform — isolated module.
-- Extensible for shared/premium/VIP tickets, live/video/group/AI PT later.

CREATE TABLE IF NOT EXISTS online_pt_policies (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  min_ticket_price INT NOT NULL DEFAULT 3000 CHECK (min_ticket_price >= 0),
  max_ticket_price INT NOT NULL DEFAULT 50000 CHECK (max_ticket_price >= min_ticket_price),
  platform_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 20.00
    CHECK (platform_fee_percent >= 0 AND platform_fee_percent <= 100),
  answer_deadline_hours INT NOT NULL DEFAULT 48 CHECK (answer_deadline_hours IN (24, 48, 72)),
  overdue_action VARCHAR(20) NOT NULL DEFAULT 'refund'
    CHECK (overdue_action IN ('refund', 'reassign')),
  followup_days INT NOT NULL DEFAULT 7 CHECK (followup_days >= 0 AND followup_days <= 90),
  followup_max_count INT NOT NULL DEFAULT 3 CHECK (followup_max_count >= 0 AND followup_max_count <= 20),
  min_payout_amount INT NOT NULL DEFAULT 50000 CHECK (min_payout_amount >= 0),
  trainer_approval_required BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO online_pt_policies (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS online_pt_trainer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  ticket_price INT NOT NULL DEFAULT 10000,
  accepting_questions BOOLEAN NOT NULL DEFAULT FALSE,
  max_questions_per_day INT NOT NULL DEFAULT 10 CHECK (max_questions_per_day >= 0 AND max_questions_per_day <= 200),
  avg_answer_target_hours INT NOT NULL DEFAULT 24 CHECK (avg_answer_target_hours >= 1 AND avg_answer_target_hours <= 168),
  specialties TEXT[] NOT NULL DEFAULT '{}',
  intro TEXT NOT NULL DEFAULT '',
  career TEXT NOT NULL DEFAULT '',
  certifications TEXT[] NOT NULL DEFAULT '{}',
  region_label TEXT NOT NULL DEFAULT '',
  gym_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  approval_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected', 'suspended')),
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  answer_count INT NOT NULL DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  rating_sum INT NOT NULL DEFAULT 0,
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  answered_on_time_count INT NOT NULL DEFAULT 0,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_online_pt_trainers_status_price
  ON online_pt_trainer_profiles (approval_status, accepting_questions, ticket_price);
CREATE INDEX IF NOT EXISTS idx_online_pt_trainers_rating
  ON online_pt_trainer_profiles (rating_avg DESC, review_count DESC);
CREATE INDEX IF NOT EXISTS idx_online_pt_trainers_answer_count
  ON online_pt_trainer_profiles (answer_count DESC);

CREATE TRIGGER trg_online_pt_trainer_profiles_updated_at
  BEFORE UPDATE ON online_pt_trainer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- product_type reserved for future shared/premium/vip tickets
CREATE TABLE IF NOT EXISTS online_pt_ticket_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_type VARCHAR(30) NOT NULL DEFAULT 'trainer_specific'
    CHECK (product_type IN ('trainer_specific', 'shared', 'premium', 'vip')),
  balance INT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, trainer_id, product_type)
);

CREATE INDEX IF NOT EXISTS idx_online_pt_ticket_balances_user
  ON online_pt_ticket_balances (user_id);

CREATE TRIGGER trg_online_pt_ticket_balances_updated_at
  BEFORE UPDATE ON online_pt_ticket_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS online_pt_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_type VARCHAR(30) NOT NULL DEFAULT 'trainer_specific',
  quantity INT NOT NULL CHECK (quantity >= 1 AND quantity <= 100),
  unit_price INT NOT NULL CHECK (unit_price >= 0),
  total_amount INT NOT NULL CHECK (total_amount >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  payment_method VARCHAR(40) NOT NULL DEFAULT 'demo',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_online_pt_orders_buyer
  ON online_pt_orders (buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_online_pt_orders_trainer
  ON online_pt_orders (trainer_id, created_at DESC);

CREATE TRIGGER trg_online_pt_orders_updated_at
  BEFORE UPDATE ON online_pt_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS online_pt_payment_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES online_pt_orders(id) ON DELETE SET NULL,
  question_id UUID,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(40) NOT NULL,
  amount INT NOT NULL DEFAULT 0,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_online_pt_payment_audits_created
  ON online_pt_payment_audits (created_at DESC);

CREATE TABLE IF NOT EXISTS online_pt_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'received'
    CHECK (status IN (
      'received', 'answering', 'answered', 'followup', 'closed', 'auto_refunded', 'reassigned'
    )),
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  workout_goal VARCHAR(40),
  machine_code VARCHAR(80),
  brand_code VARCHAR(80),
  muscle_group VARCHAR(80),
  photo_urls TEXT[] NOT NULL DEFAULT '{}',
  video_urls TEXT[] NOT NULL DEFAULT '{}',
  workout_log_ref TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  ticket_unit_price INT NOT NULL DEFAULT 0,
  platform_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 20,
  trainer_earning INT NOT NULL DEFAULT 0,
  deadline_at TIMESTAMPTZ NOT NULL,
  answered_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  followup_used INT NOT NULL DEFAULT 0,
  followup_expires_at TIMESTAMPTZ,
  reassigned_from UUID REFERENCES online_pt_questions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_online_pt_questions_member
  ON online_pt_questions (member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_online_pt_questions_trainer_status
  ON online_pt_questions (trainer_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_online_pt_questions_deadline
  ON online_pt_questions (deadline_at)
  WHERE status IN ('received', 'answering', 'followup');

CREATE TRIGGER trg_online_pt_questions_updated_at
  BEFORE UPDATE ON online_pt_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE online_pt_payment_audits
  DROP CONSTRAINT IF EXISTS online_pt_payment_audits_question_id_fkey;
-- question_id is soft-linked to avoid circular create order; no FK required

CREATE TABLE IF NOT EXISTS online_pt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES online_pt_questions(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL DEFAULT '',
  photo_urls TEXT[] NOT NULL DEFAULT '{}',
  video_urls TEXT[] NOT NULL DEFAULT '{}',
  audio_urls TEXT[] NOT NULL DEFAULT '{}',
  is_followup_reply BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_online_pt_answers_question
  ON online_pt_answers (question_id, created_at ASC);

CREATE TRIGGER trg_online_pt_answers_updated_at
  BEFORE UPDATE ON online_pt_answers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS online_pt_answer_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id UUID NOT NULL REFERENCES online_pt_answers(id) ON DELETE CASCADE,
  editor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  photo_urls TEXT[] NOT NULL DEFAULT '{}',
  video_urls TEXT[] NOT NULL DEFAULT '{}',
  audio_urls TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_online_pt_answer_revisions_answer
  ON online_pt_answer_revisions (answer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS online_pt_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES online_pt_questions(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  photo_urls TEXT[] NOT NULL DEFAULT '{}',
  video_urls TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_online_pt_followups_question
  ON online_pt_followups (question_id, created_at ASC);

CREATE TABLE IF NOT EXISTS online_pt_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL UNIQUE REFERENCES online_pt_questions(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_online_pt_reviews_trainer
  ON online_pt_reviews (trainer_id, created_at DESC);

CREATE TRIGGER trg_online_pt_reviews_updated_at
  BEFORE UPDATE ON online_pt_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS online_pt_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES online_pt_questions(id) ON DELETE CASCADE,
  review_id UUID REFERENCES online_pt_reviews(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(40) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_online_pt_reports_status
  ON online_pt_reports (status, created_at DESC);

CREATE TABLE IF NOT EXISTS online_pt_wallet_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES online_pt_questions(id) ON DELETE SET NULL,
  payout_request_id UUID,
  entry_type VARCHAR(30) NOT NULL
    CHECK (entry_type IN ('earning', 'refund_clawback', 'payout', 'adjustment')),
  amount INT NOT NULL,
  balance_after INT NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_online_pt_wallet_trainer
  ON online_pt_wallet_ledger (trainer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS online_pt_payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INT NOT NULL CHECK (amount > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  admin_note TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_online_pt_payouts_status
  ON online_pt_payout_requests (status, created_at DESC);

CREATE TRIGGER trg_online_pt_payout_requests_updated_at
  BEFORE UPDATE ON online_pt_payout_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
