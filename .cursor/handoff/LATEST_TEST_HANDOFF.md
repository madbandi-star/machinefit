# Test handoff — Hide data management for member

## Summary
member 등급 마이페이지에서 데이터 관리 메뉴 숨김. `/settings/data` 라우트와 `/backup/*` API는 `PREMIUM_MEMBER` 이상만.

## Git
- branch: `main`
- commit: PENDING

## Changed files
- `frontend/src/pages/my-page/MyPage.tsx`
- `frontend/src/routes/index.tsx`
- `backend/server/routes/backup.routes.ts`

## Test focus
1. member: 개인 설정에 데이터 관리 없음
2. member: `/settings/data` 직접 접근 차단
3. premium_member+: 메뉴·백업 정상

## Fast checks
```bash
rg -n "DATA_MANAGEMENT|showAboveMember|PREMIUM_MEMBER" frontend/src/pages/my-page/MyPage.tsx frontend/src/routes/index.tsx backend/server/routes/backup.routes.ts
```

## as-is → to-be
- **as-is:** member도 데이터 관리 노출
- **to-be:** member 숨김 + 라우트/API 가드

## Note
FE + BE 배포 필요.
