# Glanceable admin moderation + banners UX

## Summary
Moderation and banner list/create/slots/stats redesigned with shared `ag-*` KPIs, chips, dense expandable rows, and side preview/editor panels.

## Git
- branch: `main`
- commit: pending

## Test focus
1. `/admin/moderation` ? KPI tabs, pending chips, expand actions
2. `/admin/banners` ? status KPIs, slot chips, dense rows
3. `/admin/banners/new` and edit ? form + sticky preview side
4. `/admin/banners/slots` ? KPIs, create side editor, activate/delete
5. `/admin/banners/stats` ? KPIs, expandable slot/banner rows + search

## Fast checks
```bash
rg -n "admin-glance|className=\"ag\"" frontend/src/pages/admin/moderation frontend/src/pages/admin/banners
```

## as-is ¡æ to-be
- **as-is:** Wide tables, tab cards, tall edit form without sticky preview
- **to-be:** ag-* KPI + chips + dense queues + side preview/editor
