# MachineFit 개인정보 처리 현황 인벤토리

> 코드·DB 기준 엔지니어링 인벤토리입니다. 법률 자문이 아닙니다.  
> 기준일: 2026-08-17 · `LEGAL_DOC_VERSIONS.privacy`

## 1. 수집·처리 개요

| 구분 | 내용 |
|------|------|
| 서비스 | MachineFit (웹 PWA형 디지털 피트니스 유틸) |
| 주요 처리자 | 운영사(사업자 확정 전) |
| 가입 방식 | 소셜 로그인만 (Kakao / Google / Apple) |
| 유료 | Polar 기반 Premium 구독 + 무료체험 가능 |
| 위치 | **회원 GPS 비수집**. 이용자가 선택한 시군구 등 행정구역만 저장 |

## 2. 데이터 항목 ↔ 저장소

| 데이터 | 목적 | 수집 경로 | 저장 | 보유·삭제 |
|--------|------|-----------|------|-----------|
| 소셜 식별자·이메일 | 계정 인증 | OAuth | `auth_providers`, `users.email` | 탈퇴 시 live 링크 삭제; `auth_provider_withdrawals`에 아카이브 장기 보관 |
| 표시명·아바타 URL | 프로필 | OAuth/입력 | `users` | 탈퇴 시 익명화·NULL |
| 성별·키·몸무게·나이·경력·목표 | 추천·기록 | 프로필 | `users` | 탈퇴 시 NULL; 기능 동의 `body_metrics` |
| 생년월일·출생시간 | 연령·운세 | 가입/설정 | `users.birth_*` | 탈퇴 시 NULL; 기능 동의 `birth_profile` |
| 지역(시군구)·홈헬스장 | 랭킹·검색 | 설정 | `user_locations`, `users.home_gym_*` | 탈퇴/삭제 시 제거; GPS lat/lng는 upsert 시 항상 NULL |
| 운동·템플릿·업적 | 기록·분석 | 앱 | `workout_*`, `user_achievements` 등 | 탈퇴 후 ~30일 hard purge |
| 기능 사용량 | 한도·품질 | 앱/API | `user_usage_daily/monthly` | 탈퇴 후 ~30일 purge |
| 운영 텔레메트리 | 장애·보안·품질 | `/ops/ingest` | `ops_*` | 활동일·집계 ~1년; 앱로그 ~180일; 회원 연결분은 탈퇴 purge |
| 동의·로그인 로그 | 증빙·보안 | 인증/동의 | `user_consents`, `auth_login_events` | IP/UA ~1년 scrub; login events ~1년 delete; 동의 사실 장기 |
| 배너 이벤트 | 운영 | 배너 API | `banner_events` | session id만, user_id null; ~90일 |
| 결제·구독 메타 | 유료 | Polar | `subscriptions`, `payment_history`, `users.polar_*` | 탈퇴 후에도 장기 보관(자동만료 잡 없음) |
| trial identity | 체험 남용 방지 | 탈퇴/체험 | `trial_identity_ledger` | 장기 보관 |
| 브라우저 저장 | UX | FE | sessionStorage / localStorage / HttpOnly cookie | 기기 로컬; 서버 미전송(토큰 제외) |

## 3. 처리 위탁·국외 이전

| 업체 | 역할 | 비고 |
|------|------|------|
| Supabase | DB·스토리지 | |
| Render | API 호스팅 | |
| GitHub Pages | 정적 FE | |
| Cloudflare | 커스텀 도메인 CDN(사용 시) | |
| Kakao / Google / Apple | 소셜 로그인 | |
| Polar | 결제·구독 | |
| Sentry | 오류(설정 시) | `sendDefaultPii: false` |
| SMTP / Resend | 이메일(설정 시) | |
| FormSubmit | 이메일 폴백 | **`FORMSUBMIT_FALLBACK=true`일 때만** |
| YouTube | 임베드 | |

## 4. 동의

| 유형 | 필수/선택 | UI |
|------|-----------|-----|
| 이용약관·개인정보·만14세 | 필수 | `/auth/terms` |
| 마케팅 | 선택 | 가입·권리센터 (인앱 알림 중심) |
| 신체정보 / 생년월일·탄생시 / 지역·헬스장 | 해당 필드 저장 시 필수 | 설정 섹션 기능 동의 |
| 위치(GPS) | **없음** (GPS 미사용) | — |

## 5. 파기·탈퇴

즉시 (`user.repository.deactivateAccount`): 비활성·익명화·지역/프로필 NULL·`auth_providers` 아카이브 후 삭제·토큰 삭제.

~30일 (`privacyRetentionService.purgeDeactivatedUserData`): 운동/UGC/친구/사용량/`ops_user_activity_daily` 등 + FK sweep.

장기 보관(자동 만료 잡 없음): `payment_history`, `subscriptions`, `user_consents`, `trial_identity_ledger`, `auth_provider_withdrawals`, `admin_audit_logs`.

일일 잡: GPS 잔존 scrub, consent IP scrub, login delete, banner delete, withdrawn purge.  
Ops prune: app logs / error / page·feature·activity stats per `DATA_RETENTION`.
