-- Seed official MachineFit Q&A (100 articles). Idempotent by slug.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'getting_started',
  0,
  '머신핏은 어떤 서비스인가요?',
  '머신핏(MachineFit)은 헬스장 머신의 설정·추천과 운동 기록을 돕는 피트니스 앱입니다. 브랜드별 머신 정보, 신체·수준에 맞춘 설정 참고값, 운동 기록·타이머·템플릿 등을 한곳에서 사용할 수 있어요.

홈·기구(/machines)·기록(/records)·마이페이지를 중심으로 이용하며, 커뮤니티(머신 요청·템플릿 공유 등)와 헬창운세·포인트(헬창력) 같은 부가 콘텐츠도 있습니다.

의료·재활 서비스가 아니며, 추천·분석은 일반적인 피트니스 참고용입니다. 통증·질환이 있으면 전문가와 상담하세요.',
  ARRAY['머신핏','소개','서비스','MachineFit']::text[],
  'qa-001-machinefit-what',
  1,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'getting_started',
  0,
  '머신핏은 어떻게 사용하나요?',
  '카카오 또는 구글로 로그인한 뒤, 프로필(키·목표·경험 등)을 입력하면 추천이 더 잘 맞춰집니다. Apple 로그인은 화면에서 ‘곧 지원’으로 안내되며 아직 이용할 수 없어요.

기구 탭(/machines)에서 머신을 찾거나 추천을 받고, 좌석·패드 등 설정을 확인한 뒤 기록 탭(/records)에 세트를 남기면 됩니다. 홈의 타이머·휴식 타이머로 운동 리듬을 맞출 수 있어요.

자주 쓰는 루틴은 마이페이지 → 내 템플릿에 저장하고, 궁금한 점은 마이페이지 → Q&A 또는 /support 문의로 확인하세요.',
  ARRAY['시작','사용법','가이드','첫이용']::text[],
  'qa-002-how-to-use',
  2,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'getting_started',
  0,
  '머신핏에서 어떤 운동을 할 수 있나요?',
  '머신핏은 헬스장 머신·프리웨이트 카탈로그를 바탕으로 부위별·브랜드별 운동을 찾고, 추천 중량·설정·기록을 관리하는 서비스입니다.

가슴·등·하체·어깨·팔 등 근육군으로 둘러보거나 검색으로 특정 머신을 고른 뒤, 추천·설정을 참고해 세트를 기록할 수 있어요.

카탈로그에 없는 머신은 커뮤니티 → 머신 요청 게시판(/community/requests)에 남겨 주세요. 등록 범위는 서비스 카탈로그·브랜드 목록을 기준으로 합니다.',
  ARRAY['운동','머신','프리웨이트','부위']::text[],
  'qa-003-what-workouts',
  3,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'getting_started',
  0,
  '머신핏의 머신 추천은 어떻게 이루어지나요?',
  '머신핏은 프로필(신체·목표·경험 등)과 이용 기록·선호를 바탕으로 알고리즘·AI 기반 추천을 제공합니다. 홈·기구 화면에서 추천 머신을 확인할 수 있어요.

추천은 참고용이며 의료 진단이 아닙니다. 컨디션·장비·헬스장 환경에 따라 맞지 않을 수 있으니, 직접 조정하거나 무시해도 됩니다.

Lifter DNA 등 성향 분석도 같은 맥락의 참고 콘텐츠입니다. 최종 운동 선택은 항상 본인 판단으로 하세요.',
  ARRAY['추천','알고리즘','맞춤','머신추천']::text[],
  'qa-004-machine-recommend-how',
  4,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'getting_started',
  0,
  '머신핏의 머신 설정 추천은 정확한가요?',
  '머신 설정 추천은 키·신체 정보와 카탈로그 기준을 반영한 참고값입니다. 실제 머신 모델·시리얼·마모 상태에 따라 느낌이 다를 수 있어요.

처음에는 추천값을 출발점으로 삼고, 가동 범위·압박이 편한지 확인한 뒤 직접 미세 조정하세요. 잘 맞은 값은 기록·템플릿에 남겨 두면 다음에 쓰기 쉽습니다.

머신핏은 의료기기가 아니며, 통증·이상 감각이 있으면 즉시 중단하고 전문가와 상담하세요.',
  ARRAY['설정','정확도','좌석','패드']::text[],
  'qa-005-settings-accurate',
  5,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'getting_started',
  0,
  '머신핏의 추천 결과를 그대로 따라 해도 되나요?',
  '그대로 따라도 되지만, 반드시 본인 컨디션에 맞게 조절하세요. 추천은 일반 피트니스 참고용이며 ‘반드시 지켜야 할 처방’이 아닙니다.

중량·횟수·설정이 버겁거나 아프면 낮추거나 건너뛰어도 됩니다. 설정·기록 화면에서 값을 직접 바꿀 수 있어요.

부상·질환·재활 중이라면 의사·트레이너 지침을 우선하세요. 머신핏 안내보다 전문가 지시가 앞섭니다.',
  ARRAY['추천','따라하기','주의','안전']::text[],
  'qa-006-follow-recommend',
  6,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'getting_started',
  0,
  '머신핏은 의료 서비스인가요?',
  '아니요. 머신핏은 의료 서비스가 아닙니다. 헬스장 운동을 돕는 피트니스·기록 앱입니다.

추천·운세·DNA 분석 등은 엔터테인먼트 또는 일반 운동 참고 정보이며, 진료·처방·재활 계획을 대신하지 않습니다.

건강 문제는 의료 전문가와 상담하세요. 응급 상황이 의심되면 즉시 응급실·119 등 공식 의료 경로를 이용하세요.',
  ARRAY['의료','병원','진단','면책']::text[],
  'qa-007-medical-service',
  7,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'getting_started',
  0,
  '머신핏의 운동 정보는 의료 진단이나 치료를 대신하나요?',
  '대체하지 않습니다. 머신핏의 운동·설정·분석 정보는 의료 진단·치료·처방이 아닙니다.

통증, 어지럼, 가슴 통증, 호흡 곤란 등이 있으면 운동을 멈추고 의료 기관을 이용하세요. 앱 안내만으로 판단하지 마세요.

서비스는 일반적인 피트니스 참고용으로만 사용해 주세요.',
  ARRAY['진단','치료','의료','면책']::text[],
  'qa-008-not-diagnosis',
  8,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'login_account',
  0,
  '카카오 로그인은 어떻게 하나요?',
  '로그인/시작 화면에서 ‘카카오로 계속’을 누르면 카카오 인증 후 머신핏에 로그인됩니다. 별도 이메일·비밀번호 가입은 기본 흐름이 아닙니다.

카카오에서 동의한 범위의 정보가 계정 연결에 사용됩니다. 처음이면 약관·필수 동의 안내를 확인한 뒤 진행하세요.

실패하면 팝업/쿠키 차단, 네트워크, 카카오 계정 상태를 확인한 뒤 다시 시도하고, 계속되면 /support로 문의해 주세요.',
  ARRAY['카카오','로그인','소셜','가입']::text[],
  'qa-009-kakao-login',
  9,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'login_account',
  0,
  '구글 로그인은 어떻게 하나요?',
  '로그인 화면에서 ‘Google로 계속’을 선택해 구글 계정으로 인증하면 머신핏에 로그인됩니다.

카카오와 마찬가지로 소셜 로그인 중심이며, 구글에서 허용한 정보가 계정 연결에 사용됩니다.

기기·브라우저에 여러 구글 계정이 있으면 원하는 계정을 고른 뒤 진행하세요. 문제가 반복되면 /support로 알려 주세요.',
  ARRAY['구글','Google','로그인','소셜']::text[],
  'qa-010-google-login',
  10,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'login_account',
  0,
  '로그인 계정을 변경할 수 있나요?',
  '설정 → 연결된 로그인(/settings/linked-logins)에서 소셜 로그인 연결을 관리할 수 있습니다. 로그인에 쓰는 제공자를 확인·연결하는 화면이에요.

카카오·구글 등 제공자별로 연결 상태가 표시됩니다. Apple은 UI상 곧 지원 예정이며, 지금은 카카오·구글 위주로 이용하세요.

잘못 다른 계정으로 들어갔다면 마이페이지에서 로그아웃한 뒤 원하는 소셜 계정으로 다시 로그인하세요. 계정 통합·이전은 정책에 따라 지원 범위가 다를 수 있어, 복잡한 경우 /support로 문의해 주세요.',
  ARRAY['계정변경','연동','연결된로그인','소셜']::text[],
  'qa-011-change-login',
  11,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'login_account',
  0,
  '로그아웃은 어떻게 하나요?',
  '마이페이지에서 로그아웃을 선택하면 현재 기기 세션이 종료됩니다.

로그아웃해도 서버에 저장된 운동 기록·설정은 유지됩니다. 같은 소셜 계정으로 다시 로그인하면 이어서 쓸 수 있어요.

공용 기기에서는 사용 후 꼭 로그아웃해 주세요.',
  ARRAY['로그아웃','마이페이지','종료']::text[],
  'qa-012-logout',
  12,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'login_account',
  0,
  '회원탈퇴는 어떻게 하나요?',
  '설정 메뉴에서 회원탈퇴(계정 삭제)를 진행할 수 있습니다. 마이페이지 로그아웃과는 다른, 계정·데이터 정리 절차예요.

탈퇴 시 서비스 이용이 종료되며, 개인정보·기록은 관련 법령과 개인정보 처리방침에 따라 파기되거나 일정 기간 보관될 수 있습니다. 세부 내용은 처리방침·탈퇴 안내 문구를 확인하세요.

개인정보 열람·삭제·동의 철회 등 권리는 설정 → 프라이버시 권리 센터(/settings/privacy-rights)에서도 요청할 수 있으며, 회원탈퇴와는 별도 절차입니다. 결제·구독이 있으면 해지·환불 정책(/refund)도 함께 확인하세요.',
  ARRAY['탈퇴','회원탈퇴','계정삭제','설정']::text[],
  'qa-013-withdraw',
  13,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'workout_recommend',
  0,
  '내가 사용하는 머신을 어떻게 찾나요?',
  '기구 탭(/machines)에서 이름·부위로 검색하거나 브랜드·근육군으로 둘러보면 됩니다.

머신 상세에서 설정 추천·팁·기록 진입이 가능합니다. 최근 사용·즐겨찾기가 있으면 홈·기록 쪽에서도 빠르게 열 수 있어요.

안 보이면 철자·영문/한글 표기를 바꿔 검색하고, 그래도 없으면 /community/requests에 요청해 주세요.',
  ARRAY['검색','머신찾기','기구','machines']::text[],
  'qa-014-find-machine',
  14,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'workout_recommend',
  0,
  '머신 이름이나 브랜드를 모르는데 어떻게 찾나요?',
  '부위(가슴·등·하체 등)나 동작 유형으로 카탈로그를 좁힌 뒤, 화면의 머신 이미지·이름과 헬스장 기구를 비교해 보세요.

브랜드 목록이 있으면 로고·프레임 색을 단서로 고를 수 있습니다. 확신이 없으면 비슷한 후보를 열어 설정 항목(좌석·패드 등)이 실제와 같은지 확인하세요.

끝까지 모르겠으면 커뮤니티 머신 요청에 사진·설명을 남겨 주시면 등록·안내에 도움이 됩니다.',
  ARRAY['브랜드모름','검색','부위','카탈로그']::text[],
  'qa-015-unknown-brand',
  15,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'workout_recommend',
  0,
  '내가 찾는 머신이 등록되어 있지 않으면 어떻게 하나요?',
  '커뮤니티 → 머신 요청 게시판(/community/requests)에 없는 머신을 요청할 수 있습니다.

가능하면 브랜드명, 보이는 모델명, 사진, 사용 부위를 적어 주세요. 운영·카탈로그 반영까지 시간이 걸릴 수 있어요.

그동안은 가장 비슷한 머신으로 기록하거나, 메모·개인 팁에 실제 머신명을 남겨 두면 나중에 찾기 쉽습니다.',
  ARRAY['미등록','머신요청','requests','추가요청']::text[],
  'qa-016-missing-machine',
  16,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'machine_settings',
  0,
  '머신 설정 추천을 받으려면 어떤 정보가 필요한가요?',
  '키·신체 관련 정보와 운동 수준·목표 등 프로필이 반영됩니다. 프로필을 채워 둘수록 설정·중량 참고값이 더 잘 맞춰져요.

마이페이지·설정에서 신체 정보와 단위(cm/inch, kg/lb)를 확인할 수 있습니다. 정보가 비어 있으면 일반 기본값에 가까워질 수 있어요.

프로필은 언제든 수정할 수 있고, 수정 후 추천·설정을 다시 확인해 보세요.',
  ARRAY['신체정보','키','프로필','설정추천']::text[],
  'qa-017-settings-needed',
  17,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'machine_settings',
  0,
  '키와 운동 수준에 따라 추천 결과가 달라지나요?',
  '네. 키·신체 정보와 경험·목표 등에 따라 설정·중량 추천이 달라질 수 있습니다.

같은 머신도 사람마다 좌석·패드·중량 느낌이 다르므로, 추천은 시작점이고 실제 감각에 맞게 조정하는 것이 정상입니다.

수준이 바뀌면 프로필을 갱신해 주세요. 기록이 쌓이면 추천·분석 참고값도 더 개인화될 수 있어요.',
  ARRAY['키','수준','경험','맞춤']::text[],
  'qa-018-height-level',
  18,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'machine_settings',
  0,
  '추천된 머신 설정이 실제 머신과 다를 수 있나요?',
  '그럴 수 있습니다. 같은 이름이라도 브랜드·연식·옵션에 따라 조절 눈금이 다를 수 있어요.

추천값을 넣은 뒤 가동 범위와 관절·패드의 압박을 확인하고, 불편하면 한 칸씩 조정하세요. 잘 맞는 값은 기록해 두면 다음에 빠릅니다.

카탈로그 정보가 명백히 잘못된 것 같으면 머신 요청·문의(/support)로 알려 주세요.',
  ARRAY['차이','모델','설정불일치','조정']::text[],
  'qa-019-settings-mismatch',
  19,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'workout_records',
  0,
  '운동 기록은 어떻게 저장하나요?',
  '기록 탭(/records) 또는 머신·추천 흐름에서 세트의 중량·횟수 등을 입력하면 저장됩니다. 완료한 세트는 해당 날짜 기록에 쌓여요.

운동 중에는 타이머·음성 카운트와 함께 쓰는 경우가 많고, 나중에 같은 화면에서 수정할 수도 있습니다.

저장 후 목록·캘린더에 바로 반영되지 않으면 새로고침하거나 네트워크를 확인한 뒤 다시 저장해 보세요.',
  ARRAY['기록저장','세트','로그','records']::text[],
  'qa-020-save-record',
  20,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'workout_records',
  0,
  '내 운동 기록은 어디에서 확인하나요?',
  '하단 기록 탭(/records)에서 날짜별·머신별로 확인할 수 있습니다.

캘린더·목록에서 날짜를 고르면 그날의 카드(세트·볼륨 등)를 볼 수 있어요. 마이페이지의 인사이트·업적·DNA 등도 기록을 바탕으로 한 요약입니다.

다른 회원(멀티 멤버)을 쓰는 권한이 있으면, 선택된 회원 기준으로 기록이 보일 수 있으니 상단 회원/헬스장 선택을 확인해 주세요.',
  ARRAY['기록확인','기록탭','캘린더','히스토리']::text[],
  'qa-021-view-records',
  21,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'workout_records',
  0,
  '운동 기록을 삭제하거나 수정할 수 있나요?',
  '네. 기록 화면에서 기존 세트의 중량·횟수 등을 수정하거나, 카드·날짜 단위로 삭제할 수 있습니다.

잘못 입력한 세트는 해당 기록 카드를 열어 고치세요. 하루 전체를 지우는 경우 복구가 어려울 수 있으니 한 번 더 확인해 주세요.

수정·삭제 권한이 없거나 버튼이 안 보이면 로그인·선택 회원 범위를 확인하거나 /support로 문의해 주세요.',
  ARRAY['수정','삭제','기록편집','세트수정']::text[],
  'qa-022-edit-delete-record',
  22,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'workout_records',
  0,
  '운동 기록은 다른 사람에게 공개되나요?',
  '기본적으로 전체 공개 피드에 올리지 않습니다. 친구에게 보이는 범위는 친구 프라이버시 설정(/friends/privacy)에서 조절합니다.

친구 기능·프로필 공유를 쓸 때만 설정한 항목이 상대에게 보일 수 있어요. 공개를 원치 않으면 프라이버시에서 관련 항목을 끄세요.

커뮤니티에 직접 올리는 글·사진·공유 카드는 별도 게시이므로, 올릴 내용만 신중히 선택해 주세요.',
  ARRAY['공개','친구','프라이버시','피드']::text[],
  'qa-023-record-visibility',
  23,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'privacy_rights',
  0,
  '머신핏은 어떤 개인정보를 수집하나요?',
  '서비스 제공에 필요한 계정·프로필·운동 기록·기기/로그성 정보 등을 처리합니다. 소셜 로그인 시 제공자가 동의한 범위의 식별 정보가 포함될 수 있어요.

정확한 항목·목적·보관 기간은 개인정보 처리방침과 가입·동의 화면 안내를 기준으로 합니다. 헬창운세 등 일부 기능은 생년월일·탄생시 등 추가 정보가 필요할 수 있습니다.

처리방침·이용약관은 앱 내 링크와 푸터에서 확인할 수 있습니다. 권리 행사는 /settings/privacy-rights를 이용하세요.',
  ARRAY['개인정보','수집','처리방침','동의']::text[],
  'qa-024-what-pii',
  24,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'privacy_rights',
  0,
  '내 개인정보를 삭제하거나 동의를 철회할 수 있나요?',
  '설정 → 프라이버시 권리 센터(/settings/privacy-rights)에서 열람·정정·삭제·처리 정지·동의 철회·내보내기 등을 요청할 수 있습니다.

마케팅 수신 동의와 서비스/이벤트 알림 동의는 구분되어 관리됩니다. 회원탈퇴는 설정의 탈퇴 메뉴에서 진행하며, 권리 요청과는 별개입니다.

법령상 보관이 필요한 정보는 즉시 파기되지 않을 수 있습니다. 처리 결과는 요청 현황에서 확인해 주세요.',
  ARRAY['삭제','동의철회','권리센터','탈퇴']::text[],
  'qa-025-delete-consent',
  25,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'login_account',
  1,
  '카카오와 구글 계정을 동시에 사용할 수 있나요?',
  '네. 한 계정에 카카오와 구글 로그인을 함께 연결해 사용할 수 있습니다.

마이페이지 → 설정 → 연결된 로그인에서 다른 소셜 계정을 추가 연결할 수 있어요. 이미 쓰는 계정으로 로그인한 뒤 연결해야, 운동 기록과 설정이 한곳으로 모입니다.

각각 따로 로그인만 하면 계정이 분리될 수 있으니, 같은 기록을 이어가려면 반드시 연결을 진행해 주세요.',
  ARRAY['연동','다중로그인','카카오','구글']::text[],
  'qa-026-kakao-google-both',
  26,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'login_account',
  1,
  '같은 사람인데 카카오와 구글로 로그인하면 계정이 어떻게 되나요?',
  '연결하지 않은 채로 카카오와 구글로 각각 로그인하면, 서로 다른 계정으로 보일 수 있습니다.

같은 사람의 기록을 하나로 쓰려면, 한쪽 계정으로 로그인한 뒤 설정 → 연결된 로그인에서 다른 제공자를 연결하세요.

이미 계정이 둘로 나뉜 경우에는 고객지원(/support)으로 문의해 주시면 안내해 드립니다. 임의로 데이터를 합치지 않습니다.',
  ARRAY['계정분리','연동','합치기','소셜']::text[],
  'qa-027-separate-accounts',
  27,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'login_account',
  1,
  '로그인할 때 이메일을 꼭 제공해야 하나요?',
  '소셜 로그인 시 이메일은 서비스 계정 식별·안내에 활용될 수 있으며, 제공자(카카오/구글)에서 이메일을 주지 않는 경우 머신핏이 안전한 내부용 이메일을 배정할 수 있습니다.

로그인 화면에서 카카오 또는 구글을 선택하면 되며, 이메일 입력을 별도로 강제하지는 않습니다.

자세한 수집 항목은 개인정보 처리방침과 개인정보·권리 센터에서 확인할 수 있습니다.',
  ARRAY['이메일','동의','소셜','필수']::text[],
  'qa-028-email-required',
  28,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'login_account',
  1,
  '카카오나 구글에서 제공하는 정보는 무엇인가요?',
  '일반적으로 계정 식별에 필요한 정보(예: 제공자 계정 ID, 동의 시 이메일·프로필 관련 정보)가 전달될 수 있습니다. 구체 항목은 로그인 시 동의 화면과 개인정보 처리방침을 확인하세요.

머신핏은 서버에서 임의의 사용자명을 부여하는 등, 불필요한 실명 수집을 줄이는 방향으로 동작하는 부분이 있습니다.

제공 범위를 바꾸려면 카카오·구글 계정 보안/앱 연결 설정에서 권한을 관리할 수 있습니다.',
  ARRAY['OAuth','제공정보','카카오','구글']::text[],
  'qa-029-oauth-data',
  29,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'login_account',
  1,
  '내 로그인 정보가 머신핏에 어떻게 저장되나요?',
  '로그인에 필요한 식별 정보(제공자, 제공자 사용자 ID, 이메일 등)는 계정 연동과 보안을 위해 서버에 안전하게 저장됩니다.

비밀번호를 머신핏이 따로 보관하는 방식이 아니라, 카카오·구글 인증 결과를 확인한 뒤 세션(토큰)을 발급하는 구조입니다.

연결된 로그인 현황은 설정 → 연결된 로그인에서 확인할 수 있고, 개인정보 처리 내용은 개인정보 처리방침을 참고해 주세요.',
  ARRAY['저장','토큰','세션','보안']::text[],
  'qa-030-login-storage',
  30,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'login_account',
  1,
  '로그인 계정과 개인정보는 어떻게 관리되나요?',
  '계정·프로필·기록은 서비스 운영에 필요한 범위에서 처리되며, 처리방침에 고지된 목적·기간을 따릅니다.

이용자는 프라이버시 권리 센터에서 열람·정정·삭제 등을 요청할 수 있고, 설정에서 알림·마케팅 동의를 구분해서 관리할 수 있어요.

보안을 위해 최신 브라우저를 쓰고, 공용 기기 로그아웃, 의심스러운 링크 주의가 필요합니다.',
  ARRAY['관리','개인정보','보안','권리']::text[],
  'qa-031-account-privacy',
  31,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'login_account',
  1,
  '다른 기기에서도 같은 계정을 사용할 수 있나요?',
  '네. 같은 카카오 또는 구글 계정으로 다른 휴대폰·PC에서도 로그인하면 서버에 저장된 기록을 이어서 볼 수 있습니다.

브라우저 저장 설정·캐시에 따라 로컬만의 임시 상태가 다를 수 있으니, 중요한 기록은 저장이 완료됐는지 확인해 주세요.

기기마다 알림 권한은 따로 허용해야 푸시를 받을 수 있습니다.',
  ARRAY['다른기기','동기화','멀티디바이스','로그인']::text[],
  'qa-032-multi-device',
  32,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'workout_recommend',
  1,
  '머신핏에서 지원하는 브랜드는 무엇인가요?',
  '머신핏은 브랜드·머신 카탈로그를 제공하며, 기구 화면에서 브랜드별로 둘러볼 수 있습니다. 지원 목록은 계속 늘어날 수 있어요.

특정 브랜드가 ‘전부’ 수록됐다고 단정하지 않습니다. 보이는 카탈로그와 검색 결과가 현재 기준입니다.

없는 브랜드·모델은 /community/requests로 요청해 주세요.',
  ARRAY['브랜드','카탈로그','해머','라이프피니스']::text[],
  'qa-033-brands',
  33,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'workout_recommend',
  1,
  '해머스트렝스 머신도 지원하나요?',
  '네. 카탈로그에 Hammer Strength(해머스트렝스) 머신이 포함되어 있으며, 브랜드·검색으로 찾을 수 있습니다.

모든 모델·변형이 다 있는 것은 아닐 수 있어요. 없으면 머신 요청 게시판에 남겨 주세요.

설정 눈금은 실제 장비와 다를 수 있으니 추천값은 참고 후 조정하세요.',
  ARRAY['해머스트렝스','Hammer','브랜드','HS']::text[],
  'qa-034-hammer-strength',
  34,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'workout_recommend',
  1,
  '머신 코드란 무엇인가요?',
  '머신 코드는 카탈로그·검색·기록에서 쓰는 내부 식별자입니다. 화면의 머신 이름과 1:1로 매칭되는 키 역할이에요.

같은 이름이라도 브랜드가 다르면 코드가 달라 기록이 구분됩니다. 문의·요청 시 코드나 정확한 머신명을 알려 주시면 확인이 빨라요.

일반 사용자는 이름·이미지로 골라도 되고, 코드는 관리·연동용으로 이해하시면 됩니다.',
  ARRAY['머신코드','machineCode','식별자','검색']::text[],
  'qa-035-machine-code',
  35,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'machine_settings',
  1,
  '같은 머신인데 설정 방법이 다른 이유는 무엇인가요?',
  '브랜드·모델마다 좌석·패드·레버 구조와 눈금이 다르기 때문입니다. 이름만 같아도 설정 방식이 다를 수 있어요.

머신핏은 카탈로그에 등록된 항목 기준으로 추천합니다. 헬스장 장비가 변형·구형이면 눈금이 어긋날 수 있습니다.

본인에게 맞는 값을 기록·템플릿에 저장해 두면 다음 방문이 편합니다.',
  ARRAY['설정차이','브랜드','모델','눈금']::text[],
  'qa-036-different-settings',
  36,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'machine_settings',
  1,
  '머신의 좌석 높이는 어떻게 추천하나요?',
  '키·신체 정보와 해당 머신의 설정 항목을 바탕으로 좌석 등 추천값을 제시합니다.

추천은 시작점입니다. 발·무릎·엉덩이 위치가 편한지 확인한 뒤 한 칸씩 조정하세요.

좌석 항목이 없는 머신도 있습니다. 상세 화면의 설정 목록이 그 머신의 기준입니다.',
  ARRAY['좌석','높이','설정','키']::text[],
  'qa-037-seat-height',
  37,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'machine_settings',
  1,
  '머신 설정 추천 결과가 마음에 들지 않으면 어떻게 하나요?',
  '추천을 무시하고 직접 원하는 값으로 바꾸면 됩니다. 강제가 아니에요.

편한 값을 찾은 뒤 기록·즐겨찾기·템플릿에 남겨 두면 다음에 그대로 쓸 수 있습니다.

반복적으로 어긋나면 프로필(키 등)을 재확인하거나, 잘못된 카탈로그로 의심되면 요청·문의로 알려 주세요.',
  ARRAY['재조정','무시','수동','설정']::text[],
  'qa-038-dislike-settings',
  38,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'machine_settings',
  1,
  '추천 결과를 직접 조정해도 되나요?',
  '네. 오히려 권장합니다. 추천은 참고이고, 실제 감각에 맞게 조정하는 것이 안전한 사용법입니다.

중량·횟수·좌석 등 대부분의 값은 기록·상세 화면에서 바꿀 수 있어요.

통증이 있으면 무리하지 말고 중단하세요. 머신핏 추천보다 몸 신호가 우선입니다.',
  ARRAY['조정','수동','커스텀','추천']::text[],
  'qa-039-adjust-ok',
  39,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'machine_settings',
  1,
  '머신 설정 정보가 잘못되어 있으면 어떻게 알려주나요?',
  '커뮤니티 머신 요청(/community/requests)에 오정보·누락을 남기거나, /support로 문의해 주세요. 가능하면 머신명·브랜드·사진·잘못된 항목을 적어 주시면 좋습니다.

운영 반영까지 시간이 걸릴 수 있어요. 그동안은 본인에게 맞는 설정을 기록에 메모해 두세요.

긴급 안전 문제(고장·위험)는 헬스장 스태프에게 먼저 알리는 것이 우선입니다.',
  ARRAY['오류제보','수정요청','카탈로그','문의']::text[],
  'qa-040-report-wrong-settings',
  40,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'workout_recommend',
  1,
  '새로운 머신을 등록해 달라고 요청할 수 있나요?',
  '네. /community/requests 머신 요청 게시판에서 새 머신 등록을 요청할 수 있습니다.

브랜드, 모델, 사진, 사용 부위를 함께 올리면 검토에 도움이 됩니다. ‘원해요’ 등 반응으로 관심을 표시할 수 있는 UI가 있을 수 있어요.

요청이 곧 등록을 보장하지는 않으며, 카탈로그 정책·일정에 따라 반영됩니다.',
  ARRAY['신규등록','요청','커뮤니티','requests']::text[],
  'qa-041-request-new-machine',
  41,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'workout_records',
  1,
  '운동 세트는 어떻게 기록하나요?',
  '기록 화면에서 머신·날짜를 선택한 뒤 세트별로 중량과 횟수(및 관련 값)를 입력해 저장합니다.

추천 중량이 있으면 불러온 뒤 수정할 수 있고, 쉬운 입력(이지 모드 등) 흐름도 앱에서 안내됩니다.

저장 후 같은 날 카드에서 세트를 추가·수정할 수 있어요.',
  ARRAY['세트','횟수','중량','기록']::text[],
  'qa-042-log-sets',
  42,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'workout_records',
  1,
  '중량은 kg과 lb 중 어떤 단위를 사용할 수 있나요?',
  '설정에서 중량 단위를 kg 또는 lb로 선택할 수 있습니다.

단위를 바꾸면 입력·표시 기준이 달라지므로, 평소 헬스장 표기에 맞춰 두세요.

이미 저장된 기록 해석에 영향을 줄 수 있으니 변경 후 숫자 표시를 한 번 확인해 주세요.',
  ARRAY['kg','lb','단위','설정']::text[],
  'qa-043-weight-unit',
  43,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'workout_records',
  1,
  '키는 cm와 inch 중 어떤 단위를 사용할 수 있나요?',
  '설정에서 키/길이 단위를 cm 또는 inch로 선택할 수 있습니다.

설정 추천이 키를 참고하므로, 실제 키와 맞는 단위·값인지 확인해 주세요.

단위 변경 후 프로필 숫자가 기대한 값인지 다시 살펴보는 것이 좋습니다.',
  ARRAY['cm','inch','키','단위']::text[],
  'qa-044-height-unit',
  44,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'workout_records',
  1,
  '운동 기록에서 총중량은 무엇인가요?',
  '운동 기록의 총중량(총 무게)은 해당 머신/운동에서 수행한 세트들의 무게를 합산한 값입니다.

기록 카드·운동 로그 화면에서 세트별 무게와 함께 합계를 확인할 수 있어요. 단위는 설정의 kg/lb 선택에 맞춰 표시됩니다.

추천 설정값과 실제 수행 무게가 다를 수 있으니, 기록할 때는 실제로 든 무게를 기준으로 저장하는 것이 좋습니다.',
  ARRAY['총중량','합계','기록','중량']::text[],
  'qa-045-total-weight',
  45,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'workout_records',
  1,
  '총중량과 총볼륨은 무엇이 다른가요?',
  '총중량은 보통 ‘이번에 든 무게의 합’을 가리키고, 총볼륨(총 수행량)은 무게×횟수 등으로 계산한 운동량을 의미하는 경우가 많습니다.

머신핏에서는 기록·리포트·성장 분석 화면에서 수행량(볼륨) 지표를 확인할 수 있으며, 표시 이름이나 계산 방식은 화면마다 안내를 따릅니다.

기록을 꾸준히 남기면 날짜별·운동별 변화 추이를 비교하기 쉬워집니다.',
  ARRAY['총볼륨','총중량','차이','계산']::text[],
  'qa-046-weight-vs-volume',
  46,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'workout_records',
  1,
  '운동 기록을 날짜별로 볼 수 있나요?',
  '네. 기록 탭의 캘린더·날짜 선택으로 하루 단위 기록을 볼 수 있습니다.

운동한 날짜에는 표시(점 등)가 나타날 수 있어요. 미래 날짜 계획 카드가 있는 경우도 있으니, 실제 수행 기록과 구분해 보세요.

마이페이지 운동 캘린더에서도 요약 형태로 확인할 수 있습니다.',
  ARRAY['날짜','캘린더','일별','기록']::text[],
  'qa-047-by-date',
  47,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'workout_records',
  1,
  '운동별 기록을 확인할 수 있나요?',
  '네. 특정 머신 기록 카드·히스토리에서 해당 운동의 과거 세트·중량을 확인할 수 있습니다.

검색·최근 사용 목록에서 머신을 열어 이전 수행을 이어 기록할 수도 있어요.

성장·인사이트 메뉴는 여러 기록을 모아 보여 주는 요약 화면입니다.',
  ARRAY['머신별','운동별','히스토리','추이']::text[],
  'qa-048-by-exercise',
  48,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'workout_records',
  1,
  '운동 기록을 기반으로 변화 추이를 확인할 수 있나요?',
  '네. 마이페이지의 인사이트·성장·Lifter DNA·들어올린 무게 등 메뉴에서 기록 기반 요약을 볼 수 있습니다.

표시 항목은 기능마다 다르며, 의료적 평가가 아닌 참고용 통계·콘텐츠입니다.

데이터가 적으면 추이가 단순하거나 비어 보일 수 있어요. 꾸준히 기록할수록 의미가 커집니다.',
  ARRAY['추이','성장','인사이트','분석']::text[],
  'qa-049-progress',
  49,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'workout_records',
  1,
  '운동 기록이 사라졌다면 어떻게 하나요?',
  '먼저 같은 소셜 계정으로 로그인했는지, 다른 회원/헬스장이 선택되지 않았는지 확인하세요. 계정이 나뉘면 기록이 다른 쪽에 있을 수 있습니다.

네트워크 오류로 저장이 안 됐을 수도 있어요. 가능하면 다시 입력하고, 브라우저 캐시·시크릿 모드 여부도 점검해 보세요.

그래도 없으면 /support에 대략 날짜·머신·계정을 적어 문의해 주세요. 백업·복구 정책은 운영 방침에 따릅니다.',
  ARRAY['기록사라짐','복구','동기화','문의']::text[],
  'qa-050-missing-records',
  50,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'timer',
  1,
  '운동 타이머는 어떻게 사용하나요?',
  '홈 등에서 제공하는 운동 타이머로 세션 시간을 측정할 수 있습니다. 시작 후 경과 시간이 표시돼요.

운동 중 화면을 유지하면 타이머를 보기 쉽고, 음성 카운트·휴식 타이머와 함께 쓸 수 있습니다.

상세 버튼 배치는 버전에 따라 다를 수 있으니 홈·기록 화면의 타이머 영역을 확인해 주세요.',
  ARRAY['타이머','홈','세션','시간']::text[],
  'qa-051-workout-timer',
  51,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'timer',
  1,
  '운동 시작과 종료는 어떻게 기록하나요?',
  '운동 세션 타이머에서 시작을 누르면 경과 시간이 기록되고, 종료하면 해당 세션의 운동 시간이 정리됩니다.

홈·운동 화면의 타이머 컨트롤로 시작/종료할 수 있어요. 세트·무게 기록은 운동 기록(로그)에 별도로 저장합니다.

타이머만 켜 두고 기록을 저장하지 않으면 세트 데이터는 남지 않을 수 있으니, 운동이 끝나면 기록 저장도 함께 확인해 주세요.',
  ARRAY['시작','종료','세션','타이머']::text[],
  'qa-052-start-end',
  52,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'timer',
  1,
  '타이머를 일시정지할 수 있나요?',
  '네. 운동 세션 타이머와 휴식 타이머 모두 일시정지할 수 있습니다.

일시정지 중에는 경과(또는 남은 시간)가 멈추고, 다시 시작하면 이어서 진행됩니다. 휴식 타이머는 세트 사이 휴식에 맞춰 사용할 수 있어요.

화면이 꺼지거나 앱을 완전히 종료하면 환경에 따라 동작이 달라질 수 있으니, 운동 중에는 가능하면 화면을 켠 상태로 사용해 주세요.',
  ARRAY['일시정지','pause','타이머','재개']::text[],
  'qa-053-timer-pause',
  53,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'timer',
  1,
  '휴식 타이머는 어떻게 사용하나요?',
  '세트 사이 휴식 타이머로 쉬는 시간을 잴 수 있습니다. 설정에서 기본 휴식 시간을 바꿀 수 있어요.

기록·홈 흐름에서 세트 완료 후 휴식이 이어지도록 연결된 경우가 많습니다. 음성 안내 옵션이 켜져 있으면 휴식·팁 음성이 나올 수 있어요.

휴식 중에도 다음 세트 중량을 미리 확인해 두면 템포가 안정됩니다.',
  ARRAY['휴식','rest','세트사이','타이머']::text[],
  'qa-054-rest-timer',
  54,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'timer',
  1,
  '타이머가 백그라운드에서도 작동하나요?',
  '화면이 켜진 상태에서는 스크린 wake lock·오디오 등으로 타이머 유지에 도움이 될 수 있습니다. 다만 OS가 앱을 완전히 종료하면 백그라운드 전용 타이머 서비스처럼 보장되지는 않습니다.

잠금 화면·다른 앱 전환 시 기기·브라우저 정책에 따라 지연되거나 멈출 수 있어요.

정확한 휴식이 필요하면 화면을 켠 채로 두거나, 기기 기본 시계 앱을 보조로 쓰는 것이 안전합니다.',
  ARRAY['백그라운드','화면꺼짐','wake lock','제한']::text[],
  'qa-055-timer-background',
  55,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'templates',
  1,
  '운동 템플릿은 무엇인가요?',
  '자주 쓰는 운동 구성을 저장해 두고 다시 불러오는 루틴 저장 기능입니다. 매번 같은 머신을 새로 고르지 않아도 돼요.

내 템플릿은 마이페이지 → 내 템플릿(/my-page/templates)에서 관리합니다.

커뮤니티 템플릿 공유 허브(/community/templates)에서 다른 사람 템플릿을 참고할 수도 있습니다.',
  ARRAY['템플릿','루틴','저장','계획']::text[],
  'qa-056-what-template',
  56,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'templates',
  1,
  '내 운동 루틴을 템플릿으로 저장할 수 있나요?',
  '네. 수행·계획한 구성을 내 템플릿으로 저장할 수 있습니다. 저장 진입점은 기록·템플릿 관련 화면의 저장 버튼을 이용하세요.

저장 후 마이페이지 → 내 템플릿에서 이름 확인·재사용이 가능합니다.

내용이 바뀌면 템플릿을 다시 저장하거나 수정해 최신 루틴을 유지하세요.',
  ARRAY['저장','루틴','템플릿','내템플릿']::text[],
  'qa-057-save-template',
  57,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'templates',
  1,
  '저장한 템플릿은 어디에서 확인하나요?',
  '마이페이지 → 내 템플릿(/my-page/templates)에서 확인할 수 있습니다.

목록에서 템플릿을 열어 구성 머신을 보고, 운동 시 불러와 기록으로 이어갈 수 있어요.

없으면 다른 계정으로 로그인했는지, 아직 저장하지 않았는지 확인해 주세요.',
  ARRAY['내템플릿','마이페이지','확인','목록']::text[],
  'qa-058-view-templates',
  58,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'templates',
  1,
  '다른 사용자의 템플릿을 사용할 수 있나요?',
  '네. 커뮤니티 템플릿 공유 허브(/community/templates)에서 공유된 템플릿을 보고 활용할 수 있습니다.

다른 사람 루틴은 참고용입니다. 본인 수준·장비에 맞게 수정한 뒤 사용하세요.

공유 게시 상태·공개 범위는 작성자·운영 정책에 따릅니다.',
  ARRAY['공유','커뮤니티','템플릿허브','가져오기']::text[],
  'qa-059-use-shared-template',
  59,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'templates',
  1,
  '내가 만든 템플릿을 다른 사람에게 공유할 수 있나요?',
  '네. 템플릿 공유 허브를 통해 내가 만든 템플릿을 공유할 수 있습니다. 내 템플릿·공유 관련 화면의 공유하기 흐름을 따르세요.

공유 시 루틴 구성이 다른 사용자에게 보일 수 있으니, 개인 메모·민감 정보는 제외하는 것이 좋습니다.

공유 게시물 수정·삭제는 해당 허브·내 게시 관리에서 진행합니다.',
  ARRAY['공유하기','템플릿공유','커뮤니티','게시']::text[],
  'qa-060-share-my-template',
  60,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'ai_recommend',
  2,
  '머신핏의 AI 추천은 어떻게 작동하나요?',
  '프로필·운동 기록·선호 등을 바탕으로 알고리즘/AI가 머신·중량·설정 참고값을 제시합니다. Lifter DNA 같은 분석 콘텐츠도 기록을 해석해 보여 줘요.

결과는 통계·규칙·모델 기반 참고이며, 실시간 코칭 전문가가 옆에 있는 것과는 다릅니다.

언제든지 추천을 무시하고 수동으로 선택·조정할 수 있습니다.',
  ARRAY['AI','추천','알고리즘','DNA']::text[],
  'qa-061-ai-how',
  61,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'ai_recommend',
  2,
  'AI 추천 결과가 항상 정확한가요?',
  '항상 정확하지 않을 수 있습니다. 데이터 부족, 컨디션, 장비 차이로 오차가 날 수 있어요.

추천은 일반 피트니스 참고용이며 의료·재활 판단이 아닙니다. 불편하면 즉시 조정하세요.

피드백(예: 설정 잘 맞음/조정 필요)이 있으면 남겨 주시면 품질 개선에 도움이 됩니다.',
  ARRAY['정확도','오류','참고','AI']::text[],
  'qa-062-ai-accurate',
  62,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'ai_recommend',
  2,
  'AI 추천과 실제 운동 데이터 분석은 무엇이 다른가요?',
  '추천은 ‘다음에 무엇을/어떤 설정으로’를 제안하는 기능에 가깝고, 데이터 분석(인사이트·DNA 등)은 지난 기록을 요약·해석하는 기능에 가깝습니다.

둘 다 참고용이며 서로 보완적으로 쓰일 수 있어요. 화면 목적(추천 vs 리포트)을 구분해 보시면 됩니다.

헬창운세는 전통 운세 스타일 엔터테인먼트로, 위 분석과도 성격이 다릅니다.',
  ARRAY['분석','추천','차이','DNA']::text[],
  'qa-063-ai-vs-analysis',
  63,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'ai_recommend',
  2,
  'AI가 운동 데이터를 분석하나요?',
  '네. 저장된 운동 기록을 바탕으로 요약·성향 분석(예: Lifter DNA)·인사이트 등을 제공합니다.

분석은 자동 생성 참고 콘텐츠이며, 전문 트레이너 상담이나 의료 평가를 대체하지 않습니다.

기록이 없거나 적으면 분석이 제한될 수 있어요.',
  ARRAY['분석','Lifter DNA','인사이트','기록']::text[],
  'qa-064-ai-analyzes',
  64,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'ai_recommend',
  2,
  '운동 데이터가 많아지면 추천 결과도 달라지나요?',
  '네. 기록이 쌓이면 개인화 추천·분석 참고값이 더 잘 맞춰질 수 있습니다.

최근 패턴이 바뀌면 결과도 달라질 수 있어요. 프로필(목표·수준)도 함께 업데이트해 주세요.

그래도 최종 중량·설정은 당일 컨디션으로 결정하는 것이 좋습니다.',
  ARRAY['데이터','개인화','학습','추천']::text[],
  'qa-065-more-data',
  65,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'ai_recommend',
  2,
  'AI 추천을 사용하지 않을 수도 있나요?',
  '네. 검색·브랜드 브라우즈로 머신을 직접 고르고, 중량·설정을 수동 입력하면 됩니다.

추천 카드가 보여도 무시하거나 값을 덮어쓰면 됩니다. 필수 사용이 아니에요.

템플릿에 직접 구성한 루틴만 반복해도 충분히 사용할 수 있습니다.',
  ARRAY['비사용','수동','무시','검색']::text[],
  'qa-066-skip-ai',
  66,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'fortune',
  2,
  '헬창운세는 무엇인가요?',
  '헬창운세는 전통 운세 요소를 운동 콘텐츠 톤으로 재해석한 오늘의 엔터테인먼트입니다. 홈·운세 메뉴(/fortune/today)에서 확인할 수 있어요.

과학적으로 검증된 예측이나 의료 진단이 아닙니다. 재미·동기 부여용으로 봐 주세요.

이용을 위해 생년월일·탄생시 등 출생 프로필이 필요할 수 있으며, 동의 안내를 확인한 뒤 입력하세요.',
  ARRAY['헬창운세','운세','엔터테인먼트','오늘']::text[],
  'qa-067-fortune-what',
  67,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'fortune',
  2,
  '헬창운세는 실제 운동 데이터 분석인가요?',
  '아니요. 헬창운세는 운동 로그를 통계 분석한 리포트가 아니라, 운세 스타일 콘텐츠입니다.

실제 수행량·PR·볼륨 분석은 기록·인사이트·Lifter DNA 쪽에서 확인하세요.

운세 문구와 오늘 기록이 달라도 오류가 아니라 콘텐츠 성격 차이입니다.',
  ARRAY['운세','데이터분석','차이','엔터']::text[],
  'qa-068-fortune-not-data',
  68,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'fortune',
  2,
  '헬창운세와 운동 데이터 분석은 어떻게 다른가요?',
  '헬창운세=엔터테인먼트성 오늘의 메시지, 운동 데이터 분석=기록 기반 요약·성향 해석으로 나뉘어 있습니다.

둘 다 ‘참고’이지만 근거가 다릅니다. 훈련 판단은 기록·컨디션·전문가 조언을 우선하세요.

면책 문구가 운세 화면에 표시되니 함께 읽어 주세요.',
  ARRAY['비교','운세','분석','차이']::text[],
  'qa-069-fortune-vs-analysis',
  69,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'fortune',
  2,
  '헬창운세 결과는 매일 달라지나요?',
  '네. 기본적으로 하루 단위 콘텐츠로 제공됩니다. 날짜가 바뀌면 내용이 달라질 수 있어요.

출생 프로필이 같더라도 일자 기준으로 결과가 달라지는 구조입니다.

하루에도 앱 새로고침만으로 내용이 바뀌지 않는 것이 정상이며, 안내는 화면 기준을 따르면 됩니다.',
  ARRAY['매일','오늘','갱신','운세']::text[],
  'qa-070-fortune-daily',
  70,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'fortune',
  2,
  '헬창운세는 실제 운동 결과를 예측하나요?',
  '실제 운동 결과(중량·PR·부상 여부 등)를 예측하지 않습니다.

재미·분위기용 문구이므로, 운세 때문에 무리를 하거나 치료를 미루지 마세요.

훈련 계획은 기록과 컨디션을 기준으로 세우세요.',
  ARRAY['예측','기록','운세','아님']::text[],
  'qa-071-fortune-predict',
  71,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'fortune',
  2,
  '헬창운세를 믿고 운동해도 되나요?',
  '엔터테인먼트로만 즐기세요. 운세만 믿고 고중량·고난도 운동을 강제할 필요는 없습니다.

통증·피로가 있으면 운세와 무관하게 쉬거나 강도를 낮추세요.

머신핏 전체와 마찬가지로 의료 조언이 아닙니다.',
  ARRAY['신뢰','주의','면책','운세']::text[],
  'qa-072-fortune-trust',
  72,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'points',
  2,
  '머신핏 포인트는 무엇인가요?',
  '머신핏 포인트는 ‘헬창력’으로 부르며, 활동에 따라 쌓이는 서비스 포인트입니다. 마이페이지 → 포인트(/my-page/points)에서 잔액·내역을 볼 수 있어요.

현재는 적립과 내역 확인이 중심이며, 사용·환전 방식은 서비스 정책을 따릅니다.

이벤트·정책에 따라 적립 기준이 바뀔 수 있으니 화면·공지 안내를 확인하세요.',
  ARRAY['포인트','헬창력','적립','마이페이지']::text[],
  'qa-073-points-what',
  73,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'points',
  2,
  '포인트는 어떻게 받을 수 있나요?',
  '포인트(헬창력)는 회원가입·운동 기록 저장·머신 검색·템플릿 이용·커뮤니티 활동 등 서비스 이용에 따라 적립될 수 있습니다.

적립 기준과 한도는 운영 정책에 따라 달라질 수 있으며, 마이페이지 → 포인트에서 잔액과 적립 내역을 확인할 수 있습니다.

일부 활동은 하루 한도나 쿨다운이 있을 수 있어요. 내역에 반영되지 않았다면 잠시 후 다시 확인하거나 고객지원으로 문의해 주세요.',
  ARRAY['적립','활동','헬창력','받는법']::text[],
  'qa-074-earn-points',
  74,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'points',
  2,
  '포인트 적립 내역은 어디에서 확인하나요?',
  '마이페이지 → 포인트(/my-page/points)에서 현재 헬창력과 적립·변동 내역을 확인할 수 있습니다.

내역이 비어 있으면 아직 적립 활동이 없거나, 다른 계정으로 로그인했을 수 있어요.

관리자·정책 화면에 별도 포인트 관리가 있으나, 일반 사용자는 마이페이지 내역이 기준입니다.',
  ARRAY['내역','원장','헬창력','포인트']::text[],
  'qa-075-points-ledger',
  75,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'points',
  2,
  '포인트를 사용할 수 있나요?',
  '현재 포인트는 적립과 내역 확인이 중심이며, 별도의 상점에서 자유롭게 교환하는 기능은 단계적으로 제공될 수 있습니다.

사용·차감·환급 등은 서비스 정책과 관리자 운영에 따라 처리될 수 있으니, 마이페이지 → 포인트 안내와 공지를 확인해 주세요.

무리하게 “지금 바로 결제 대신 쓸 수 있다”고 단정하지 마시고, 실제 제공 범위를 화면 안내 기준으로 이해해 주시면 됩니다.',
  ARRAY['사용','차감','상점','헬창력']::text[],
  'qa-076-spend-points',
  76,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'points',
  2,
  '포인트가 사라질 수도 있나요?',
  '포인트는 정책에 따라 만료·차감·정정될 수 있습니다.

부정 적립 보정, 운영상 조정, 만료 규칙 등이 적용될 수 있으며, 변경 사항은 공지 또는 포인트 내역으로 확인할 수 있어요.

정확한 잔액은 마이페이지 → 포인트 화면의 최신 내역을 기준으로 보시면 됩니다.',
  ARRAY['소멸','만료','회수','정책']::text[],
  'qa-077-points-expire',
  77,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'subscription',
  2,
  '머신핏은 무료로 사용할 수 있나요?',
  '네. 기본 기능은 무료로 사용할 수 있습니다. 일부 고급 기능은 프리미엄 구독으로 제공될 수 있어요.

무료 범위는 정책·시기에 따라 달라질 수 있으니, 결제·업그레이드 화면의 안내를 확인하세요.

결제가 필요한 기능을 열면 프리미엄 안내가 표시됩니다.',
  ARRAY['무료','요금','프리미엄','구독']::text[],
  'qa-078-free-use',
  78,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'subscription',
  2,
  '머신핏 유료 구독은 무엇인가요?',
  '프리미엄 플랜은 유료로 추가 기능을 쓰는 구독입니다. 결제는 Polar 체크아웃 등 안내된 결제 흐름으로 진행됩니다.

구독 상태·혜택은 마이페이지·결제 관련 화면에서 확인할 수 있어요.

카드 등 민감 결제정보는 결제사가 처리하며, 머신핏이 카드번호를 직접 보관하지 않는 구성입니다.',
  ARRAY['유료','Premium','Polar','구독']::text[],
  'qa-079-premium-what',
  79,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'subscription',
  2,
  '구독하면 어떤 기능을 사용할 수 있나요?',
  '프리미엄(유료) 구독 또는 프리미엄 권한이 있으면, 무료 요금제보다 넉넉한 헬스장·회원 등록 한도와 일부 고급 기능(예: 성장 분석·라이브·온라인 PT 등 프리미엄 이상 메뉴)을 이용할 수 있습니다.

실제 열려 있는 메뉴는 계정 권한과 요금제에 따라 마이페이지에 표시됩니다. 결제는 Polar 등 결제 수단을 통한 체크아웃으로 진행됩니다.

결제·해지·내역은 결제 내역 화면과 환불 정책을 함께 확인해 주세요.',
  ARRAY['혜택','프리미엄기능','차이','구독']::text[],
  'qa-080-premium-features',
  80,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'subscription',
  2,
  '무료 이용과 유료 이용의 차이는 무엇인가요?',
  '무료로도 머신 검색·추천·운동 기록 등 핵심 기능을 사용할 수 있습니다. 유료(프리미엄)는 헬스장/회원 한도 확대와 일부 프리미엄 메뉴 이용이 차이입니다.

예를 들어 무료는 등록 가능한 헬스장·회원 수가 더 작고, 프리미엄은 한도가 커집니다. 역할(트레이너·오너 등)에 따라 보이는 메뉴도 달라질 수 있어요.

업그레이드는 프리미엄 안내/결제 흐름에서 진행하고, 내역은 마이페이지 결제 관련 화면에서 확인하세요.',
  ARRAY['무료','유료','비교','플랜']::text[],
  'qa-081-free-vs-paid',
  81,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'subscription',
  2,
  '구독 결제는 어떻게 하나요?',
  '프리미엄 업그레이드 흐름에서 Polar 체크아웃 등 안내된 결제 페이지로 이동해 결제합니다.

결제 내역은 /my-page/billing/history에서 확인할 수 있습니다.

결제 오류 시 카드사·결제사 메시지와 네트워크를 확인한 뒤 재시도하고, 중복 결제 의심 시 내역 캡처와 함께 /support로 연락해 주세요.',
  ARRAY['결제','Polar','체크아웃','구독']::text[],
  'qa-082-checkout',
  82,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'subscription',
  2,
  '구독을 해지하면 어떻게 되나요?',
  '구독 해지(취소) 기능을 통해 자동 갱신을 멈출 수 있습니다. 해지 후에도 이미 결제한 이용 기간까지는 정책에 따라 유지될 수 있어요.

재개(resume)도 지원되는 흐름이 있으니, 결제/구독 관리 화면 안내를 따르세요.

스토어·결제사 쪽 구독이 따로 있다면 해당 계정에서도 해지가 필요할 수 있습니다. 상세는 결제 내역·고객지원을 이용해 주세요.',
  ARRAY['해지','취소','재개','구독']::text[],
  'qa-083-cancel-sub',
  83,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'subscription',
  2,
  '결제 후 환불받을 수 있나요?',
  '환불은 환불 정책 페이지(/refund)와 관련 법령·약관에 따릅니다. 자동으로 즉시 전액 환불된다고 단정하지 마세요.

결제 내역(/my-page/billing/history)을 확인한 뒤, 정책에 해당하면 안내된 절차 또는 /support로 요청하세요.

결제사·카드사 심사 기간이 있을 수 있습니다.',
  ARRAY['환불','refund','청약철회','정책']::text[],
  'qa-084-refund',
  84,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'notifications',
  2,
  '머신핏에서 어떤 알림을 보내나요?',
  '서비스 운영·이벤트·역할별 안내용 인앱/푸시 알림이 있을 수 있습니다. 트레이너·헬스장 등 역할에 따라 푸시 작성 기능이 다를 수 있어요.

마케팅 수신과 서비스/이벤트 알림 동의는 프라이버시 권리 센터(/settings/privacy-rights) 등에서 구분 관리됩니다.

기기 알림 권한이 꺼져 있으면 푸시가 오지 않을 수 있으니 OS 설정도 확인해 주세요.',
  ARRAY['알림','푸시','인앱','마케팅']::text[],
  'qa-085-what-notifications',
  85,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'mypage_data',
  3,
  '내 운동 기록은 안전하게 보관되나요?',
  '운동 기록은 계정에 연결되어 서버에 저장되며, 서비스 인프라 보안 관행에 따라 보호됩니다. 절대 유출 없음과 같은 보장은 어떤 온라인 서비스도 단정하기 어렵습니다.

공용 기기 로그아웃, 최신 브라우저 사용, 피싱 주의가 중요합니다.

권리·삭제 요청은 /settings/privacy-rights, 탈퇴는 설정 탈퇴 메뉴를 이용하세요.',
  ARRAY['보안','보관','암호화','안전']::text[],
  'qa-086-record-security',
  86,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'mypage_data',
  3,
  '내 운동 데이터를 다른 사용자가 볼 수 있나요?',
  '기본적으로 모든 사용자에게 공개되지 않습니다. 친구에게 보이는 항목은 /friends/privacy 설정에 따릅니다.

커뮤니티에 직접 게시·공유한 콘텐츠는 해당 게시 범위에서 보일 수 있어요.

공개를 원치 않으면 친구 프라이버시와 공유 게시물을 점검하세요.',
  ARRAY['공개범위','친구','프라이버시','데이터']::text[],
  'qa-087-who-sees-data',
  87,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'privacy_rights',
  3,
  '개인정보 처리방침은 어디에서 확인할 수 있나요?',
  '앱 내 약관/정책 링크와 페이지 하단(푸터)에서 개인정보 처리방침을 확인할 수 있습니다.

가입·동의 화면에도 관련 문서 링크가 제공됩니다.

개정 시 공지·동의 절차가 있을 수 있으니 변경 안내를 읽어 주세요.',
  ARRAY['처리방침','약관','정책','링크']::text[],
  'qa-088-privacy-policy',
  88,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'privacy_rights',
  3,
  '개인정보 열람을 요청할 수 있나요?',
  '네. 설정 → 프라이버시 권리 센터(/settings/privacy-rights)에서 열람을 요청할 수 있습니다.

요청 후 처리 상태는 센터 내 요청 현황에서 확인하세요. 본인 확인이 필요할 수 있습니다.

회원탈퇴와는 별도 절차입니다.',
  ARRAY['열람','권리','privacy-rights','요청']::text[],
  'qa-089-access-request',
  89,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'privacy_rights',
  3,
  '개인정보 정정을 요청할 수 있나요?',
  '네. 프라이버시 권리 센터에서 정정 요청이 가능합니다. 프로필에서 직접 고칠 수 있는 항목은 마이페이지·설정에서 먼저 수정해도 됩니다.

직접 수정이 어려운 항목은 권리 요청 또는 /support를 이용해 주세요.

처리 완료까지 시간이 걸릴 수 있습니다.',
  ARRAY['정정','수정','프로필','권리']::text[],
  'qa-090-correction',
  90,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'privacy_rights',
  3,
  '개인정보 삭제를 요청할 수 있나요?',
  '네. 프라이버시 권리 센터에서 삭제를 요청할 수 있습니다. 계정 전체를 없애려면 설정의 회원탈퇴를 이용하세요.

법령·분쟁·요금 정산 등으로 일부 정보는 즉시 삭제되지 않을 수 있습니다.

삭제 요청과 탈퇴의 효과 범위가 다를 수 있으니 안내 문구를 확인하세요.',
  ARRAY['삭제','파기','권리','탈퇴']::text[],
  'qa-091-deletion',
  91,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'privacy_rights',
  3,
  '개인정보 처리정지를 요청할 수 있나요?',
  '네. 프라이버시 권리 센터에서 처리 정지를 요청할 수 있습니다.

처리 정지 시 일부 서비스 이용이 제한될 수 있어요. 화면 안내를 꼭 읽어 주세요.

요청 철회·해제 절차도 센터·지원 안내를 따릅니다.',
  ARRAY['처리정지','중단','권리','정지']::text[],
  'qa-092-processing-stop',
  92,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'privacy_rights',
  3,
  '마케팅 정보 수신 동의를 철회할 수 있나요?',
  '네. 프라이버시 권리 센터(/settings/privacy-rights)에서 마케팅 수신 동의를 철회할 수 있습니다.

마케팅과 서비스 필수·이벤트 알림은 분리되어 있으니, 원하는 항목만 끄면 됩니다.

철회 반영까지 시간이 조금 걸릴 수 있습니다.',
  ARRAY['마케팅','수신거부','동의철회','알림']::text[],
  'qa-093-marketing-optout',
  93,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'notifications',
  3,
  '서비스 알림과 마케팅 알림은 어떻게 다른가요?',
  '서비스·이벤트 알림은 이용에 필요한 안내(보안·기능·서비스 공지 등)에 가깝고, 마케팅은 광고·프로모션 성격의 정보입니다.

동의·수신 설정이 구분되어 있으며 /settings/privacy-rights에서 관리할 수 있어요.

기기 OS 알림 권한과는 별개이므로, 푸시를 받으려면 기기 설정도 허용되어 있어야 합니다.',
  ARRAY['서비스알림','마케팅','동의','구분']::text[],
  'qa-094-service-vs-marketing',
  94,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'privacy_rights',
  3,
  '회원탈퇴 후 내 데이터는 어떻게 처리되나요?',
  '탈퇴 시 계정 이용이 종료되고, 개인정보·기록은 처리방침과 법령상 보관 의무에 따라 파기 또는 분리 보관될 수 있습니다.

즉시 모든 데이터가 물리 삭제되지 않을 수 있어요. 세부 기간은 개인정보 처리방침을 확인하세요.

재가입 정책이 별도로 있을 수 있습니다. 탈퇴 전 결제·포인트·권리 요청 상태를 확인해 주세요.',
  ARRAY['탈퇴후','파기','보관','재가입']::text[],
  'qa-095-after-withdraw',
  95,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'other',
  3,
  '머신핏은 모바일에서도 사용할 수 있나요?',
  '네. 모바일 브라우저에 최적화되어 있으며, 휴대폰에서 로그인·기록·추천을 사용할 수 있습니다.

PC 브라우저로도 이용 가능하고, 화면 크기에 맞게 레이아웃이 조정됩니다.

기기가 오래되었거나 브라우저가 구버전이면 일부 기능이 제한될 수 있어요. 최신 Chrome/Safari 등을 권장합니다.',
  ARRAY['모바일','폰','반응형','브라우저']::text[],
  'qa-096-mobile',
  96,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'other',
  3,
  '머신핏을 앱처럼 사용할 수 있나요?',
  '네. 지원 브라우저에서 홈 화면에 추가(PWA)하면 앱처럼 아이콘으로 실행할 수 있습니다.

완전 네이티브 스토어 앱과 다를 수 있고, 오프라인 지원은 제한적입니다.

설치 방법은 브라우저 메뉴의 ‘홈 화면에 추가’/‘앱 설치’를 확인해 주세요.',
  ARRAY['PWA','홈화면','설치','앱']::text[],
  'qa-097-pwa',
  97,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'other',
  3,
  '운동 중 인터넷 연결이 끊기면 어떻게 되나요?',
  '머신핏의 오프라인 지원은 제한적입니다. 연결이 끊기면 저장·동기화가 실패하거나 최신 데이터가 안 보일 수 있어요.

가능하면 Wi-Fi/데이터를 다시 연결한 뒤 저장을 재시도하세요. 앱을 강제 종료하기 전에 저장 완료를 확인하면 좋습니다.

오프라인에서도 전체 운동 기록이 자동 동기화된다고 보장하지는 않습니다.',
  ARRAY['오프라인','네트워크','동기화','제한']::text[],
  'qa-098-offline',
  98,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'other',
  3,
  '문제가 발생했을 때 어디에 문의하나요?',
  '고객 지원 티켓은 /support에서 접수할 수 있습니다. 마이페이지 Q&A에서 먼저 검색해 보시면 빠른 해결에 도움이 됩니다.

문의 시 사용 계정(소셜), 대략 시각, 화면, 오류 메시지를 적어 주시면 처리가 빨라요.

결제·환불은 /refund 정책과 결제 내역을 함께 확인해 주세요.',
  ARRAY['문의','고객지원','support','티켓']::text[],
  'qa-099-support',
  99,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();

INSERT INTO qa_articles (
  category, priority, title, answer, keywords, slug,
  display_order, is_published, needs_impl_review, source
) VALUES (
  'other',
  3,
  '새로운 기능이나 개선사항을 제안할 수 있나요?',
  '네. /support로 개선 아이디어를 보내 주시거나, 기능 성격에 맞는 커뮤니티(예: 머신 요청)를 이용해 주세요.

모든 제안이 즉시 반영되지는 않지만, 우선순위 검토에 도움이 됩니다.

버그라면 재현 절차를 함께 적어 주시면 더 정확합니다.',
  ARRAY['제안','피드백','개선','요청']::text[],
  'qa-100-feedback',
  100,
  TRUE,
  FALSE,
  'official'
)
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  answer = EXCLUDED.answer,
  keywords = EXCLUDED.keywords,
  display_order = EXCLUDED.display_order,
  is_published = EXCLUDED.is_published,
  needs_impl_review = EXCLUDED.needs_impl_review,
  updated_at = NOW();
