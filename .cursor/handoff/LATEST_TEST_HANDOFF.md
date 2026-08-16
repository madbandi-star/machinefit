# Glanceable admin usage / points / retention UX

## Summary
Nine admin screens redesigned with shared `ag-*` glance pattern: KPI filters, chips, dense expandable rows, and side editors for usage stats/users/policies, points policies/users, and data retention suite.

## Git
- branch: `main`
- commit: `8dfe317a`

## Test focus
1. `/admin/usage` ? KPI + range chips + chart
2. `/admin/usage/users` ? live search, dense rows, period side panel
3. `/admin/usage/policies` ? KPI filters, side editor save
4. `/admin/points/policies` ? enabled KPIs, side editor save
5. `/admin/points/users` ? balance list, adjust + tx side panel
6. `/admin/data-retention` ? KPI jump + dense policies + period edit impact confirm
7. `/admin/data-retention/scheduled` ? overdue/hold KPIs, in-row hold
8. `/admin/data-retention/logs` ? fail-first KPI filter
9. `/admin/data-retention/audit` ? action chips + dense log rows

## Fast checks
```bash
rg -n "className=\"ag\"|admin-glance" frontend/src/pages/admin/usage frontend/src/pages/admin/points frontend/src/pages/admin/data-retention
node -e "JSON.parse(require('fs').readFileSync('frontend/src/i18n/locales/ko/admin.json','utf8')); console.log('ok')"
```

## as-is ¡æ to-be
- **as-is:** AdminPanel splits, tall forms, bulky fact cards, weak filters
- **to-be:** Shared ag-* KPI + chips + dense queue + side editor across nine screens
