# Free-plan abuse prevention (server quotas)

## Summary
Server-enforced free quotas (cards/templates/recommend/uploads/workout saves), stock+daily atomic limits, auth burst/minute rate limits, `abuse_events` + admin Abuse page. See `docs/abuse-prevention.md`. **Apply migration 138** on Postgres/Render.

## Git
- branch: `main`
- commit: `PENDING`

## Test focus
1. Migration 138 applied
2. FREE: 31st owned card → stock 429; 11th create same day → daily 429
3. Recommend over daily/minute → 429
4. Admin → 남용·제한 이벤트 lists events

## Fast checks
```bash
node scripts/i18n-audit.mjs
npm run build --workspace=shared
rg -n "assertStockAllowed|recommendationRateLimit|abuse_events" backend shared database
```

## as-is → to-be
- **as-is:** Policies tracked but not enforced; recommend/uploads open
- **to-be:** Server 429 enforcement + abuse monitoring
