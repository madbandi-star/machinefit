# Glanceable admin privacy-rights queue UX

## Summary
Admin privacy-rights page is denser and easier to scan: compact rows, overdue-first, KPI status filters only, fulfill panel first in drawer.

## Git
- branch: `main`
- commit: pending

## Test focus
1. Queue shows type ， requester ， glance ， status ， due in one row
2. Stats filter status; no duplicate status chip row
3. Multi-select ≧ sticky bulk dock
4. Drawer: fulfill near top

## Fast checks
```bash
rg -n "apr-queue__head|requestGlance|showDock" frontend/src/pages/admin/compliance/AdminPrivacyRightsPage.tsx
```
