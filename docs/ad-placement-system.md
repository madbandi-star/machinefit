# Ad placement system

Unified policy engine over the existing CMS banner creatives.

## Apply migration

```bash
# Supabase / Postgres
psql "$DATABASE_URL" -f database/migrations/140_ad_placement_system.sql
```

Then redeploy the Render backend.

## Feature flags (admin `/admin/ads`)

| Flag | Default |
|------|---------|
| ADS_ENABLED | true |
| INLINE_CMS_ENABLED | true |
| INLINE_ENABLED | false |
| INTERSTITIAL_ENABLED | false |
| STICKY_BANNER_ENABLED | false |
| REWARDED_AD_ENABLED | false |
| NATIVE_AD_ENABLED | false |
| PAGE_TRANSITION_AD_ENABLED | false |

## Public API

- `GET /ads/decision?placement=&event=&sessionId=&eventCount=`
- `POST /ads/events`
- `POST /ads/reward/claim` (stub — no quota grant)

## Wiring a new SDK

1. Implement `AdProvider` (`initialize`, `showBanner`, `showInterstitial`, `showRewarded`).
2. Switch provider via flag / env.
3. Complete rewarded claim with signed mediation callback before granting quota.
