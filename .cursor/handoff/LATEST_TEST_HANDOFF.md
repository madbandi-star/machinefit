# Latest test handoff — Fix login blocked by inspection auth

**Branch:** `main` · **Commit:** `7e32446`

## Change

점검(inspection) 라우터가 API 루트에 `authMiddleware`와 함께 마운트되어 **로그인/가입까지 401**로 막히던 문제 수정.

- `inspectionRouter` → `/inspection` prefix
- 라우터 전역 auth 제거, 점검 라우트에만 auth
- 프론트 `inspectionApi` 경로를 `/inspection/...`로 맞춤

## Test focus

1. 비로그인 `POST /auth/login` → `INVALID_CREDENTIALS` (메시지 **Authentication required** 이면 실패)
2. 실제 계정으로 GitHub Pages 로그인 성공
3. 헬스장 장비 점검 메뉴가 `/inspection` API로 동작

## Fast checks

```bash
# After Render backend deploy:
# Wrong password should be INVALID_CREDENTIALS, not "Authentication required"
```

```bash
npm run test:smoke:changed
```

## Deploy

- Frontend: Pages on push to `main`
- **Backend Render redeploy required** (login fix is server-side)

## as-is → to-be

- **as-is:** 로그인 API가 Authentication required 로 막힘
- **to-be:** 로그인 핸들러까지 도달, 정상 로그인 가능
