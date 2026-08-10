# Test handoff — Ops alerts show occurrence time

## Summary
운영모니터링 **알림** 탭에 발생시각을 **시:분:초**까지 표시합니다.

## Git
- branch: `main`
- commit: (push 후 갱신)

## Changed files
- `frontend/src/pages/admin/ops/AdminOpsPage.tsx`

## Test focus
1. `/admin/ops` → 알림 → 시각 컬럼에 시분초 포함

## Fast checks
```bash
rg -n "fmtDateTime\(a.createdAt\)" frontend/src/pages/admin/ops/AdminOpsPage.tsx
```
