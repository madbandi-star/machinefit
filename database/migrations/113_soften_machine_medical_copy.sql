-- Soften machine catalog safety copy that could be read as clinical triage.
-- Content-only UPDATE; no schema change and no user data deletion.
-- [법률 검토 필요 — 표현 완화이며 법적 효력 판단이 아님]

UPDATE machines
SET warnings = replace(replace(replace(replace(replace(replace(warnings::text,
      '수술 이력이나 현재 통증이 있다면, 이 머신을 무리해서 쓰기 전에 전문가에게 확인하세요.',
      '운동 중 불편하거나 무리한 느낌이 들면 즉시 중단하고, 무게와 자세를 다시 확인해 주세요.'),
      '날카로운 통증이 느껴지면',
      '날카롭거나 강한 불편감이 느껴지면'),
      '통증을 참고 더 깊거나 더 멀리 움직이지 마세요',
      '불편함을 참고 억지로 더 깊거나 더 멀리 움직이지 마세요'),
      '통증 없는 범위',
      '편안한 가동범위'),
      '통증 없이 편했던',
      '편하게 느껴졌던'),
      '관절 부담이 커질 수 있습니다',
      '움직임 통제가 어려워질 수 있습니다')::jsonb
WHERE warnings IS NOT NULL
  AND (
    warnings::text LIKE '%수술 이력%'
    OR warnings::text LIKE '%날카로운 통증%'
    OR warnings::text LIKE '%통증을 참고%'
    OR warnings::text LIKE '%통증 없는%'
    OR warnings::text LIKE '%관절 부담%'
  );

UPDATE machines
SET warnings = replace(replace(replace(replace(warnings::text,
      'If you have a surgery history or current pain, get professional guidance before loading this machine hard.',
      'If you feel uncomfortable or overly strained, stop immediately and reassess load and position.'),
      'sharp pain',
      'sharp discomfort'),
      'never force extra range through pain',
      'never force extra range through discomfort'),
      'pain-free',
      'comfortable')::jsonb
WHERE warnings IS NOT NULL
  AND (
    warnings::text LIKE '%surgery history%'
    OR warnings::text LIKE '%sharp pain%'
    OR warnings::text LIKE '%through pain%'
    OR warnings::text LIKE '%pain-free%'
  );

UPDATE machines
SET tips = replace(replace(replace(tips::text,
      '통증 없이 편했던',
      '편하게 느껴졌던'),
      '통증 없는 범위',
      '편안한 가동범위'),
      '다음 날 관절 반응을 확인하세요',
      '다음 운동 전까지 컨디션을 확인해 보세요')::jsonb
WHERE tips IS NOT NULL
  AND (
    tips::text LIKE '%통증 없이%'
    OR tips::text LIKE '%통증 없는%'
    OR tips::text LIKE '%관절 반응%'
  );

UPDATE machines
SET tips = replace(tips::text, 'pain-free', 'comfortable')::jsonb
WHERE tips IS NOT NULL AND tips::text LIKE '%pain-free%';

UPDATE machines
SET beginner_tips = replace(replace(beginner_tips::text,
      '통증 없이 편했던',
      '편하게 느껴졌던'),
      '통증 없는 범위',
      '편안한 가동범위')::jsonb
WHERE beginner_tips IS NOT NULL
  AND (
    beginner_tips::text LIKE '%통증 없이%'
    OR beginner_tips::text LIKE '%통증 없는%'
  );

UPDATE machines
SET beginner_tips = replace(beginner_tips::text, 'pain-free', 'comfortable')::jsonb
WHERE beginner_tips IS NOT NULL AND beginner_tips::text LIKE '%pain-free%';

UPDATE machines
SET how_to = replace(how_to::text,
      '관절 정렬을 편하게 만드세요',
      '자세가 자연스럽게 느껴지도록 맞추세요')::jsonb
WHERE how_to IS NOT NULL AND how_to::text LIKE '%관절 정렬을 편하게%';
