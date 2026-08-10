# Test handoff — Ops tab order

## Summary
운영모니터링 탭을 **대시보드 → 오류 → 로그 → 알림** 순으로 붙였습니다.

## Git
- branch: `main`
- commit: (push 후 갱신)

## Changed files
- `frontend/src/pages/admin/ops/AdminOpsPage.tsx`

## Test focus
1. `/admin/ops` 탭 바가 오류 옆 로그, 그 옆 알림인지 확인

## Fast checks
```bash
rg -n "'errors',|'logs',|'alerts'," frontend/src/pages/admin/ops/AdminOpsPage.tsx
```
