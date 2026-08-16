# Abuse prevention & free-plan quotas

MachineFit keeps the existing **usage_policies / user_usage_daily / user_usage_monthly** stack and turns on server-side enforcement for abuse-critical features.

Frontend buttons are UX only. **All hard limits are enforced in Node + PostgreSQL.** The SPA does not call Supabase for writes.

## Free plan defaults (central)

Source: `shared/src/constants/free-plan-limits.ts` (`getFreePlanLimits()`).

| Limit | Default | Env override |
|-------|---------|--------------|
| Max equipment cards (stock) | 30 | `FREE_MAX_EQUIPMENT_CARDS` |
| Daily card creates | 10 | `FREE_DAILY_EQUIPMENT_CARD_CREATES` |
| Daily recommendations | 30 | `FREE_DAILY_RECOMMENDATION_CALLS` |
| Recommendations / minute | 10 | `FREE_RECOMMENDATION_PER_MINUTE` |
| Daily workout record saves | 100 | `FREE_DAILY_WORKOUT_RECORDS` |
| Max templates (stock) | 20 | `FREE_MAX_TEMPLATES` |
| Daily image uploads | 10 | `FREE_DAILY_IMAGE_UPLOADS` |
| API requests / minute (auth) | 60 | `API_RATE_LIMIT_PER_MINUTE` |
| API burst / 10s (auth) | 20 | `API_BURST_LIMIT` |

Premium stock/daily defaults are **unlimited (null)** unless set in `usage_policies` or env.

Plan tiers: `FREE` | `PREMIUM` | `ADMIN` (admin skips consume / stock).

Timezone for daily buckets: **Asia/Seoul** (`seoulDateKey`).

## Stock vs daily (cards / templates)

- **Stock**: concurrent owned count. Delete does **not** restore daily create quota.
- **Daily**: creates/saves per Seoul day via atomic `consumeIfUnderLimit` (advisory lock).

Order on create: stock check → daily `assertUsageAllowed`.

## Feature codes (enforced by migration 138)

| Code | What |
|------|------|
| `exercise_card_create` | stock 30 + daily 10 |
| `exercise_record_save` | daily 100 |
| `template_create` | stock 20 (+ daily 20) |
| `recommendation` | daily 30 (+ minute rate limit) |
| `image_upload` | daily 10 (photo board create) |

Updates/deletes/login/timer/voice/insight remain trackable with **limits_enforced = false**.

## Rate limits

| Layer | Scope |
|-------|-------|
| Cloudflare | Bot / volumetric (ops) |
| Global Express | 3000 / 15m per IP (existing) |
| Auth user burst | 20 / 10s (JWT user) |
| Auth user minute | 60 / min (JWT user) |
| Recommendation | 10 / min (user or IP) |

Anonymous traffic is not keyed to the tight user budgets (gym NAT); recommendation still has its own limiter.

## API errors (429)

Quota / stock / rate use HTTP **429** with existing envelope:

```json
{
  "success": false,
  "error": {
    "code": "DAILY_QUOTA_EXCEEDED",
    "message": "...",
    "details": { "featureCode": "...", "used": 30, "limit": 30, "resetAt": "..." }
  }
}
```

Codes: `DAILY_QUOTA_EXCEEDED`, `MONTHLY_QUOTA_EXCEEDED`, `STOCK_LIMIT_EXCEEDED`, `RATE_LIMIT_EXCEEDED`, legacy `USAGE_LIMIT` / `RATE_LIMIT`.

## DB (migration 138)

- `usage_policies.free_stock_limit` / `premium_stock_limit`
- Seed/update abuse-critical policies with `limits_enforced = true`
- `abuse_events` (user_id, ip_hash, endpoint, event_type, severity, metadata) — **no raw IP**

Retention: abuse events are operational; align purge with data-retention jobs as needed (short window recommended).

## Admin

- Existing usage stats / users / policies
- **Abuse events**: `/admin/usage/abuse` → `GET /admin/usage/abuse-events`

## Frontend

- `apiErrorCatalog` maps quota/rate codes to KO/EN messages
- No client-side trust for limits; `GET /usage/check/:featureCode` remains available for soft UI

## Extending to paid plans

1. Set premium_* limits on `usage_policies` (or leave null = unlimited).
2. Billing entitlement already maps to `PREMIUM` via `usageService.resolvePlanTier`.
3. Do not fork a second quota engine — change policy rows / env only.

## Tests

- `shared` usage constants
- `backend` `usage-limit-decision.test.ts`
- Manual: parallel recommend with remaining=1 → only one success (atomic consume)
- Regression: login, cards update/delete, templates edit, timers

## Apply migration

Run the project’s usual migration path so `138_abuse_prevention_quotas.sql` is applied on Supabase/Postgres before relying on enforcement in production.
