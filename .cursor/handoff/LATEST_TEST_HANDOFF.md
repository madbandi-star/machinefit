# Test handoff — Stop collecting OAuth account emails

## Summary
머신핏은 OAuth 계정 이메일을 **수집·저장·반환·표시하지 않음**. 로그인은 `(provider, provider_user_id)` 유지.  
migration `130`으로 기존 `users.email` 등 NULL 처리.

## Git
- branch: `main`
- commits: `e61fe486` (core) · `e7efc605` (admin UI) · backup scrub follow-up if present

## Production (필수)
1. Render DB에 **migration 130** 적용
2. Render BE 재배포
3. Pages FE 배포 확인
4. Google/Kakao/Apple 로그인 스모크

## Test focus
1. OAuth 로그인/가입 정상
2. Auth API `user.email === ''`, JWT에 email 없음
3. 마이페이지 이메일 행 없음
4. 관리자 사용자 목록에 실이메일 없음
5. Polar checkout에 customer_email 없음
6. 운동 리포트 이메일 발송 없음

## Remaining (의도적·별도 연락처)
- `gym_members.email` — 헬스장 소유자가 입력하는 회원 연락처
- `trainer_applications.email` — 트레이너 지원서 연락처
- `owner` business_email — 사업자 연락처
- `LEGAL` supportEmail — 운영자 고객센터 주소 (사용자 PII 아님)

## Fast checks
```
rg -n "providerEmail: null|email: ''" backend/server/services/auth.service.ts backend/server/utils/oauth-verify.util.ts
rg -n "openid profile|scope: 'name'" frontend/src/utils/oauthClient.ts
Test-Path database/migrations/130_remove_user_email_storage.sql
```
