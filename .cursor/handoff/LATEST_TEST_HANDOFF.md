# Test handoff — Admin subscriptions UI polish

## Summary
관리자 구독 페이지 UI 정리: 검색 툴바, 상태 칩, 구조화된 회원 행(플랜/체험/만료), semantic 상태 뱃지. 기능 동일.

## Git
- branch: `main`
- commit: PENDING

## Changed files
- `frontend/src/pages/admin/subscriptions/AdminSubscriptionsPage.tsx`
- `frontend/src/styles/admin-subscriptions.css`
- `frontend/src/i18n/locales/{ko,en,ja,zh}/admin.json`

## Test focus
1. 검색·상태 칩·기타 상태 select
2. 플랜 변경 / 30일 연장 / 구독 종료
3. 모바일·데스크톱 레이아웃

## Fast checks
```bash
rg -n "admin-subs|STATUS_CHIPS|statusPillClass" frontend/src/pages/admin/subscriptions/AdminSubscriptionsPage.tsx frontend/src/styles/admin-subscriptions.css
```

## as-is → to-be
- **as-is:** 영문 raw 상태 + meta 덤프 + 인라인 flex
- **to-be:** 칩 필터 + 라벨/값 fact + 데스크톱 3열

## Note
FE only — Pages deploy.
