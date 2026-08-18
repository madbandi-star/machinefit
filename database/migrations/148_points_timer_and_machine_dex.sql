-- Award 헬창력 (POWER) for timer sessions and machine-dex actions.
INSERT INTO point_policies (
  action_code, action_name, points, daily_limit, user_limit, cooldown_seconds, enabled, description
) VALUES
  (
    'timer_session_complete',
    '타이머 세션 완료',
    15,
    8,
    NULL,
    30,
    TRUE,
    '홈 타이머를 1분 이상 사용하고 세션이 저장된 경우'
  ),
  (
    'showcase_post',
    '머신도감 자랑 작성',
    20,
    10,
    NULL,
    30,
    TRUE,
    '머신도감/자랑 게시글 작성'
  ),
  (
    'showcase_claim',
    '머신도감 보유 등록',
    10,
    15,
    NULL,
    5,
    TRUE,
    '우리 짐에도 있음 — 신규 보유 등록'
  ),
  (
    'machine_dex_discover',
    '머신도감 신규 발견',
    25,
    20,
    NULL,
    0,
    TRUE,
    '개인 도감에 머신을 처음 등록할 때 1회'
  )
ON CONFLICT (action_code) DO NOTHING;

UPDATE qa_articles
SET
  answer = '포인트(헬창력)는 회원가입·운동 기록 저장·타이머 사용·머신도감(자랑 작성·보유 등록·신규 발견)·머신 검색·템플릿 이용·커뮤니티 활동 등 서비스 이용에 따라 적립될 수 있습니다.

적립 기준과 한도는 운영 정책에 따라 달라질 수 있으며, 마이페이지 → 포인트에서 잔액과 적립 내역을 확인할 수 있습니다.

일부 활동은 하루 한도나 쿨다운이 있을 수 있어요. 내역에 반영되지 않았다면 잠시 후 다시 확인하거나 고객지원으로 문의해 주세요.',
  updated_at = NOW()
WHERE slug = 'qa-074-earn-points';
