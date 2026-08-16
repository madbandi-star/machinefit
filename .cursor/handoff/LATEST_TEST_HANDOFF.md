# Glanceable admin dashboard / ops / backup / users / subs / brands

## Summary
Six more admin screens use shared `ag-*` KPIs, chips, dense expandable queues, and searchable menus: dashboard, ops, backup, users, subscriptions, brands.

## Git
- branch: `main`
- commit: pending

## Test focus
1. `/admin` ? KPI overview, attention queue, searchable menu
2. `/admin/ops` ? chip tabs, overview KPIs, dense error/log/alert rows
3. `/admin/backup` ? KPI strip, settings expand, history queue, restore YES flow
4. `/admin/users` ? KPI filters, expandable role/username actions
5. `/admin/subscriptions` ? live search, status chips, step-up + expand actions
6. `/admin/brands` ? KPI/search chips, dense logo rows, create/edit modal

## Fast checks
```bash
rg -n "admin-glance|className=\"ag\"" frontend/src/pages/admin/dashboard frontend/src/pages/admin/ops frontend/src/pages/admin/backup frontend/src/pages/admin/users frontend/src/pages/admin/subscriptions frontend/src/pages/admin/brands
node -e "JSON.parse(require('fs').readFileSync('frontend/src/i18n/locales/ko/admin.json','utf8')); console.log('ok')"
```

## as-is ¡æ to-be
- **as-is:** Tall panels, wide tabs, bulky user/sub/brand cards
- **to-be:** Shared ag-* KPI + chips + dense queues across six screens
