-- Power Box (헬창력 랜덤박스): daily claim via points ledger.
-- reward_date is stored as point_transactions.reference_id (YYYY-MM-DD Asia/Seoul).
-- Duplicate prevention: policy daily_limit=1 + idempotency key + unique index below.

INSERT INTO point_policies (
  action_code, action_name, points, daily_limit, user_limit, cooldown_seconds, enabled, description
) VALUES (
  'power_box_claim',
  '파워박스 일일 보상',
  100,
  1,
  NULL,
  0,
  TRUE,
  '마이페이지 파워박스: 하루 1회 서버 랜덤 1~100 Power (points 컬럼은 상한/표시용, 실제 지급은 override)'
)
ON CONFLICT (action_code) DO NOTHING;

-- Hard guarantee: one EARN per user per Seoul calendar day for power_box_claim.
CREATE UNIQUE INDEX IF NOT EXISTS uq_point_tx_power_box_day
  ON point_transactions (user_id, reference_id)
  WHERE action_code = 'power_box_claim'
    AND transaction_type = 'EARN'
    AND reference_id IS NOT NULL;
