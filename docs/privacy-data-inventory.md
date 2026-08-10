# MachineFit 개인정보 처리 현황 인벤토리

> 코드·DB 기준 엔지니어링 인벤토리입니다. 법률 자문이 아닙니다.  
> 기준일: 2026-08-10 · 문서 버전과 동기화: `LEGAL_DOC_VERSIONS.privacy`

## 1. 수집·처리 개요

| 구분 | 내용 |
|------|------|
| 서비스 | MachineFit (웹 PWA형 디지털 피트니스 유틸) |
| 주요 처리자 | 운영사(사업자 확정 전) |
| 가입 방식 | 소셜 로그인만 (Kakao / Google / Apple) |
| 유료 | Polar 기반 Premium 구독 + 무료체험 가능 |
| 위치 | 선택 동의 시 GPS 좌표 저장 가능 / 수동 시군구 선택 |

## 2. 데이터 항목 ↔ 저장소

| 데이터 | 목적 | 수집 경로 | 저장 | 보유·삭제 | 접근 | 국외·위탁 |
|--------|------|-----------|------|-----------|------|-----------|
| 소셜 식별자·이메일 | 계정 인증 | OAuth | `auth_providers`, `users.email` | 탈퇴 시 계정 비활성·이메일 익명화, provider_email 제거(링크 유지로 재로그인 차단) | 본인·관리자 | Kakao/Google/Apple |
| 표시명·아바타 URL | 프로필 표시 | OAuth/입력 | `users` | 탈퇴 시 익명화·NULL | 본인·공개 범위 | 호스팅/DB |
| 성별·키·몸무게·나이 | 추천·기록 | 프로필 입력 | `users` | 탈퇴 시 NULL | 본인 | Supabase 등 |
| 생년월일·출생시간 | 운세 등 | 프로필 입력 | `users.birth_*` | 탈퇴 시 NULL | 본인 | 동일 |
| 운동 목표·경험 | 추천 | 입력 | `users` | 탈퇴 시 NULL | 본인 | 동일 |
| 위치(시군구·GPS) | 주변 헬스장·랭킹 | GPS/수동 | `user_locations` | 동의철회·탈퇴 시 DELETE | 본인 | 동일 |
| 운동 기록 | 기록·분석 | 앱 이용 | `workout_logs` 등 | 탈퇴 후 일정 기간 운영·분쟁용 보관 가능 [법률전문가 확인 필요] | 본인·권한자 | 동일 |
| 커뮤니티 UGC | 게시·거래 | 작성 | posts/photos/trades | 작성자 삭제·관리자 숨김; 탈퇴 시 hard purge는 후속 | 공개·관리자 | 동일 |
| 친구·차단·신고 | 소셜 | 앱 | `friend_*` | 계정 비활성과 연동; hard purge 후속 | 당사자·관리자 | 동일 |
| 결제·구독 메타 | 유료 제공·정산 | Polar 웹훅 | `subscriptions`, `payment_history` | 전자상거래·세무 법정 보관 [법률전문가 확인 필요] | 본인·관리자 | Polar(국외 가능) |
| 동의 기록 | 증빙 | 가입/설정 | `user_consents` (+IP/UA) | 분쟁·감사 기간 보관 [법률전문가 확인 필요] | 관리자 | 호스팅 |
| 접속·로그인 로그 | 보안 | 인증 | `auth_login_events` | 보안·감사 기간 [법률전문가 확인 필요] | 관리자 | 호스팅 |
| 헬스장 회원(오너) | 회원관리 | 오너 입력 | `gym_members` | 오너·회원 정책; 플랫폼 탈퇴와 별개일 수 있음 | 해당 헬스장 권한 | 동일 |
| 고객문의 | 지원 | 문의하기 | `support_tickets*` | 처리 후 운영 정책 | 본인·관리자 | 동일 |

## 3. 처리 위탁·국외 이전 (확인 가능한 범위)

| 업체 | 역할 | 개인정보 | 비고 |
|------|------|----------|------|
| Supabase | DB·스토리지 | 계정·기록·이미지 | 리전은 운영 설정에 따름 — 배포 전 확인 [REVIEW] |
| Render | API 호스팅 | 요청 처리·로그 | 동일 |
| GitHub Pages / Cloudflare | 프론트 배포·CDN | 접속 로그(가능) | 정적 FE |
| Kakao / Google / Apple | 소셜 로그인 | 식별자·이메일(제공 시) | 각사 약관 |
| Polar | 결제·구독 | 결제 메타·고객 ID | 카드번호는 결제사 보관 |
| Sentry (선택) | 오류 모니터링 | 오류 컨텍스트 | DSN 설정 시에만 |
| YouTube | 영상 임베드 | 시청 시 제3자 쿠키 가능 | 클릭 재생 권장 [권장] |
| SMTP/Resend 등 | 이메일(설정 시) | 수신 이메일·내용 | 환경변수 설정 시에만 |

※ 실제 미사용 업체는 방침에 기재하지 않음. GA/GTM 픽셀은 코드베이스에 없음.

## 4. 동의

| 유형 | 필수/선택 | UI | 저장 |
|------|-----------|-----|------|
| 이용약관 | 필수 | `/auth/terms` | `user_consents` + users 버전 |
| 개인정보처리방침 | 필수 | 동일 | 동일 |
| 만 14세 이상 확인 | 필수(가입) | 체크박스 | 클라이언트 입증 + 서버 age≥14 |
| 위치 | 선택 | 동일 | 동의 시에만 GPS 저장 |
| 마케팅 | 선택 | 동일 | `marketing_opt_in` |

## 5. 파기·탈퇴 (구현)

`user.repository.deactivateAccount` (즉시):

- 로그인 불가(`is_active=false`), 리프레시 토큰 삭제
- 이메일·표시명 익명화, 생체·프로필·출생정보·위치동의 해제
- `user_locations` 삭제, `auth_providers.provider_email` NULL (링크 유지 → 동일 소셜로 해당 계정 재활성 로그인 차단)

`privacyRetentionService` (일일 잡, `DATA_RETENTION` 운영 기본값):

- GPS 좌표 ~30일 후 NULL (시군구 유지)
- 동의 IP/UA ~1년 후 NULL
- `auth_login_events` ~1년 후 DELETE
- 탈퇴 후 ~30일: workout/favorites/friends/UGC 등 hard purge, `auth_providers` 삭제(재가입 가능), `data_purged_at` 기록
- 결제·동의 증빙·users 행은 유지 (법정 기간 [법률전문가 확인 필요])
- `trial_identity_ledger`: 무료체험 악용 방지용 OAuth/이메일 키(해시 아님, 정규화 문자열). 탈퇴·purge 후에도 유지. 개인정보 최소 원칙상 체험 이력 확인 목적만.
- 공개 아이디(`users.display_name`): 소셜 provider 실명/닉네임과 분리. 신규 소셜 가입 시 머신핏 랜덤 생성. 상세: `docs/USERNAME_PRIVACY_DATA_FLOW.md`

## 6. 문서 정합

- 방침·약관 UI: `/privacy`, `/terms`, `/refund`, `/location-policy`, `/community-policy`, `/copyright`, `/security`
- 버전: `shared/src/constants/legal.ts` → `LEGAL_DOC_VERSIONS`
- 상세 감사: `docs/LEGAL_AUDIT_REPORT.md`
