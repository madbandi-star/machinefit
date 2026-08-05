# Performance report — 1,000 concurrent users

Date: 2026-08-05  
Branch: `cursor/perf-1k-concurrent-35b3`  
Constraints honored: no feature/UI/business-logic/API response shape changes; schema additive indexes only.

---

## 1. Bottleneck analysis (priority)

| Rank | Area | Issue | Impact |
|------|------|--------|--------|
| 1 | Infra | Render `plan: free`, single Node process | Hard ceiling ~80–150 concurrent |
| 2 | DB | `pg` pool `max: 20` | Concurrent query queue |
| 3 | Ops | Unsampled API latency INSERT per response + media | Write amplification |
| 4 | Rate limit | 200/15min including `/media/*` | False 429 under image load / NAT |
| 5 | Media | BYTEA via Express; ETag without 304; gzip on webp | CPU + bandwidth |
| 6 | FE | Ops heartbeat 60s always; friends poll 15–30s in background | Steady QPS |
| 7 | Cache | `TtlCache.getOrSet` stampede on miss | Burst DB load |
| 8 | FE assets | Large muscle PNGs in dist (~28MB) | First load weight |

Already good: helmet, compression, keep-alive 65s, catalog Cache-Control 120s, route lazy-load, React Query stale 5m / no focus refetch, most workout/history indexes.

---

## 2. Changes in this release

| File | Change | Why |
|------|--------|-----|
| `backend/server/config/database.ts` + `env.ts` | `DATABASE_POOL_MAX` / idle / connect timeouts configurable | Tune per instance without code change |
| `backend/server/middlewares/rate-limit.middleware.ts` | Skip `/media/*`; max **3000**/15min | Unblock real API under concurrency |
| `backend/server/middlewares/ops-metrics.middleware.ts` | Skip `/media/*` | Cut ops write volume |
| `backend/server/services/ops.service.ts` | Prod API sample `OPS_API_SAMPLE_RATE` (default 5%); coalesce `session_ping`; sample page access logs 10% | Pool/write relief; same product APIs |
| `backend/server/app.ts` | Skip compression for `/media/*` and image/audio MIME | CPU savings |
| `backend/server/utils/media-response.ts` + media controllers | Honor `If-None-Match` → **304** | Bandwidth / serialize savings |
| `backend/server/utils/ttl-cache.ts` | Single-flight `getOrSet` | Prevent cache-miss stampede |
| `frontend/src/utils/opsTelemetry.ts` | Heartbeat 90s; skip when tab hidden | Fewer ingest POSTs |
| `frontend/src/pages/friends/FriendsHubPage.tsx` | Visibility-gated 60s refetch | Same UI; less background QPS |
| `database/migrations/094_perf_1k_friend_status_indexes.sql` | `(user_low/high_id, status)` indexes | Faster friend graph filters |
| `scripts/load-test-1k.mjs` | Concurrent latency probe | Measure TPS / p95 / errors |
| `docs/PERF_1K_CONCURRENT.md` | This report | |

API JSON response bodies and business rules are unchanged.

---

## 3. Load test

Script: `scripts/load-test-1k.mjs`

```bash
# Local / staging health probe ladder
for c in 100 300 500 700 1000; do
  CONCURRENCY=$c DURATION_SEC=20 API_BASE=https://YOUR.onrender.com/api/v1 \
    node scripts/load-test-1k.mjs || true
done
```

**Note:** Running 1000 concurrent against production free tier will fail; use a sized Render instance. Health/warmup alone underestimates real workout/history load — add authenticated paths in staging.

### Baseline measured (pre-deploy, free Render, `/health`+`/warmup` only)

| Concurrency | TPS | Avg | P95 | P99 | Error rate |
|-------------|-----|-----|-----|-----|------------|
| 100 | 168 | **512ms** | **1132ms** | 1739ms | 0% |
| 300 | 108 | **1351ms** | **2666ms** | 2887ms | 0.03% |
| 500 | 187 | **2161ms** | **4329ms** | 4600ms | 0% |

Already fails the 300ms avg / 500ms p95 targets on the free single instance — even for health probes. Authenticated workout/history traffic would be worse.

### After this code (expected)

| Metric | Same free host | Paid multi-instance (required for SLA) |
|--------|----------------|----------------------------------------|
| Comfortable concurrent open | **150–300** | **1000+** |
| Active API users | **100–200** | **1000+** |
| Avg / P95 (catalog, warm) | Improved vs media/ops contention; still host-bound | ≤300ms / ≤500ms |
| Error rate | Lower false 429 (media excluded) | &lt;1% |
| Ops DB writes | ~5% API samples; media skipped; coalesced pings | Same |
| Heartbeat @1000 visible tabs | ~11/s (was ~16.7/s) | Same |

Re-run `scripts/load-test-1k.mjs` after Render redeploy; capture Admin Ops CPU/memory/pool waiting during the ladder.

---

## 4. Expected max concurrent (this code)

| Hosting | Expected stable concurrent |
|---------|----------------------------|
| Render free, 1 instance, pool 20 | **~150–300** open / **~100–200** active |
| Render Standard×2–4 + Supabase transaction pooler + pool 10–20/instance | **1000+** open / **500–1000** active |
| + Redis rate-limit/cache + Storage CDN for media | Headroom for spikes / 2–3k |

**Code alone cannot reach a reliable 1000 on free single-instance.** Infra scale is required for the SLA.

---

## 5. Additional infrastructure (required for SLA)

1. **Render**: leave free → Standard/Pro, **2–4 instances**, autoscale on CPU  
2. **Supabase**: Pro + **transaction pooler** (6543); keep per-process `DATABASE_POOL_MAX` modest (10–20)  
3. **Redis** (optional next): shared rate limit + catalog cache when multi-instance  
4. **CDN / Storage**: serve machine covers from Supabase public URL / Cloudflare (API JSON only)  
5. Apply migration: `npm run db:migrate` (`094_perf_1k_friend_status_indexes.sql`)

---

## 6. Security checklist (unchanged / verified)

| Item | Status |
|------|--------|
| Helmet | On |
| CORS | Allowlist |
| Rate limit | On (tuned; media excluded) |
| SQL | Parameterized `pg` queries |
| XSS | React default escaping |
| CSRF | Bearer + HttpOnly refresh; no cookie session for API mutations |

---

## 7. Future improvements

- Version-only SELECT before BYTEA for 304 without loading blobs  
- Roll up `ops_api_metrics_hourly` (table exists unused)  
- Move media fully off Node to CDN  
- Redis for multi-instance cache/rate-limit  
- k6 scenarios for authenticated workout-log upserts  
- Bundle: externalize large muscle PNGs from JS chunk graph  

---

## 8. Deploy notes

- Frontend: push `main` → GitHub Pages  
- Backend: Render redeploy (Deploy Hook or dashboard)  
- DB: `npm run db:migrate` for `094_…`  
- Optional env: `DATABASE_POOL_MAX`, `OPS_API_SAMPLE_RATE`
