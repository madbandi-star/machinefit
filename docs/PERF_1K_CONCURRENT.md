# Performance report — 1,000 concurrent users (Phase 1 + Phase 2)

Date: 2026-08-05  
Branches: `cursor/perf-1k-concurrent-35b3` (phase 1), `cursor/perf-1k-phase2-35b3` (phase 2)  
Constraints honored: no feature/UI/business-logic/API response shape changes; schema additive indexes only.

---

## 1. Bottleneck analysis (priority)

| Rank | Area | Issue | Impact |
|------|------|--------|--------|
| 1 | Infra | Render free/Starter single Node | Hard ceiling well below 1k |
| 2 | DB | Pool + BYTEA media over Express | Concurrent query / bandwidth queue |
| 3 | Ops | Unsampled API latency INSERT (phase 1 fixed) | Write amplification |
| 4 | Media | BYTEA before 304 (phase 2: version-first) | CPU + serialize |
| 5 | Ops dashboard | Sequential fan-out (phase 2: Promise.all) | Admin wall-clock |
| 6 | FE poll | Ops/friends background (visibility gated) | Steady QPS |
| 7 | Lists | Sequential COUNT+list (phase 2 parallel) | Latency under load |

Already good: helmet, compression (skip media), keep-alive 65s, catalog Cache-Control, route lazy-load, React Query stale 5m, production `console.log` strip via Vite `esbuild.pure`.

---

## 2. Phase 1 changes (shipped)

| File | Change |
|------|--------|
| `database.ts` / `env.ts` | `DATABASE_POOL_MAX` / idle / connect timeouts |
| `rate-limit.middleware.ts` | Skip `/media/*`; max 3000/15min |
| `ops-metrics.middleware.ts` | Skip `/media/*` |
| `ops.service.ts` | API sample 5%; coalesce session_ping |
| `app.ts` | Skip compression for media MIME |
| `media-response.ts` | If-None-Match → 304 (after BYTEA) |
| `ttl-cache.ts` | Single-flight `getOrSet` |
| FE ops/friends | Visibility-gated poll |
| `094_perf_1k_friend_status_indexes.sql` | `(user_low/high_id, status)` |
| `scripts/load-test-1k.mjs` | Concurrent latency probe |

---

## 3. Phase 2 changes (this release)

| Area | Change | Why |
|------|--------|-----|
| Catalog media | `getBlobMeta` + version-first 304 before BYTEA | Skip blob load on revalidate |
| UGC media | photo/trade/machine-request meta + ETag 304 (same 86400 Cache-Control) | Bandwidth under gallery load |
| Ops dashboard / report | `Promise.all` fan-out; reuse `seriesActivity` once | Lower wall-clock, same JSON |
| Community `getPost` | Parallel post + comments | Same 404/payload |
| Lists | Parallel COUNT+list (photo, trade, machine-requests, friend feed/list) | Latency |
| Friends queries | `status = 'ACCEPTED'` (matches `areFriends`; enables 094 indexes) | Index Scan; same product data (rows always ACCEPTED) |
| Cover admin | `getAssetByCode` exact `m.code = $1` | No ILIKE list scan |
| Admin Ops FE | `refetchInterval` visibility gate | Zero QPS when tab hidden |
| `095_perf_1k_phase2_indexes.sql` | Trades/photo/posts/friendships/login indexes | Planner Index Scan |
| `render.yaml` | Document Standard×N + pooler env | Ops checklist |

API JSON bodies and business rules unchanged. Media 200 bodies identical; 304 when `If-None-Match` matches.

---

## 4. Indexes created

### 094
- `idx_friendships_low_status` `(user_low_id, status)`
- `idx_friendships_high_status` `(user_high_id, status)`

### 095
- `idx_machine_trades_active_list`
- `idx_machine_trades_active_popular`
- `idx_photo_posts_visible_popular`
- `idx_posts_board_pin_created`
- `idx_friendships_pair_accepted`
- `idx_auth_login_events_created`

---

## 5. Load test

```bash
for c in 100 300 500 1000; do
  CONCURRENCY=$c DURATION_SEC=20 API_BASE=https://YOUR.onrender.com/api/v1 \
    node scripts/load-test-1k.mjs || true
done
```

### Baseline (phase 1, free/Starter-class, `/health`+`/warmup`)

| Concurrency | TPS | Avg | P95 | Error rate |
|-------------|-----|-----|-----|------------|
| 100 | 168 | **512ms** | **1132ms** | 0% |
| 300 | 108 | **1351ms** | **2666ms** | 0.03% |
| 500 | 187 | **2161ms** | **4329ms** | 0% |

Fails ≤300ms avg / ≤500ms p95 on free single instance even for health.

### After phase 2 code (expected)

| Metric | Same free/Starter | Paid multi-instance (required for SLA) |
|--------|-------------------|----------------------------------------|
| Comfortable concurrent open | **200–350** | **1000+** |
| Active API users | **120–220** | **1000+** |
| Media revalidate | Mostly **304** (no BYTEA) | Same |
| Ops dashboard wall-clock | ~parallel RT of slowest query | Same |
| Error rate | Lower media/ops contention | &lt;1% |

Re-run ladder after Render redeploy + `095` migrate; capture Admin Ops CPU/memory/pool waiting.

---

## 6. Expected max concurrent

| Hosting | Expected stable concurrent |
|---------|----------------------------|
| Render free/Starter ×1, pool 10–20 | **~150–350** open / **~100–220** active |
| Render Standard×2–4 + Supabase transaction pooler + pool 10/instance | **1000+** open / **500–1000** active |
| + Redis + CDN Storage for media | Headroom for spikes / 2–3k |

**Code alone cannot guarantee 1000 on Starter single-instance.** Infra scale is required for the SLA.

---

## 7. Cloudflare recommended settings

Apply when domain is proxied (orange cloud):

| Setting | Value |
|---------|-------|
| Proxy status | DNS only → **Proxied** for API/static hostnames as appropriate |
| SSL/TLS | Full (strict) |
| Brotli | On |
| Auto Minify | JS/CSS/HTML On (static FE) |
| HTTP/2 + HTTP/3 (QUIC) | On |
| Early Hints | Optional On |
| Cache Rules | Cache `/machinefit/assets/*` aggressively; **bypass** `/api/v1/*` JSON |
| Cache `/api/v1/*/media/*` | Cache with respect to ETag / Cache-Control (or CDN origin for Storage) |
| Rate Limiting | Protect `/api/v1/auth/*` (e.g. 20/min/IP); leave media to origin skip |
| WAF | Managed ruleset + OWASP; challenge high threat |
| DDoS | Free L3/4 + L7 defaults |
| Compression | Brotli to client; origin already gzip/brotli via Express |

CDN helps static FE + cacheable media GETs; it does **not** replace DB/CPU for authenticated workout writes.

---

## 8. Render recommended settings

| Setting | Value |
|---------|-------|
| Plan | Standard or Pro (not free/Starter for 1k) |
| Instances | 2–4; autoscale CPU ≥70% |
| Health check | `/api/v1/health` |
| Region | Near Supabase `ap-northeast-2` |
| Always On | Paid (no spin-down) |
| `DATABASE_URL` | Transaction pooler `:6543?pgbouncer=true` |
| `DATABASE_POOL_MAX` | `10` per instance |
| `OPS_API_SAMPLE_RATE` | `0.05` |
| Monitoring | CPU, Memory, Instance count; Admin Ops dashboard for API/DB |

---

## 9. Security checklist

| Item | Status |
|------|--------|
| Helmet | On |
| CORS | Allowlist |
| Rate limit | On (tuned; media excluded) |
| SQL | Parameterized `pg` |
| XSS | React escaping |
| Prod console | Vite strips `console.log/debug/info` |
| Sentry | Structure ready via ops error groups; hook SDK when DSN set |

---

## 10. Additional / next improvements

- Move BYTEA media to Supabase Storage + Cloudflare CDN (API returns URLs only)
- Redis shared rate-limit + catalog cache for multi-instance
- `ops_api_metrics_hourly` rollup job
- k6 authenticated workout-log upsert scenarios
- Externalize large muscle PNGs from JS chunk graph
- Connection pooler monitoring alerts on `waiting` count

---

## 11. Deploy notes

- Frontend: push `main` → GitHub Pages  
- Backend: **Render redeploy** (Deploy Hook or dashboard)  
- DB: `npm run db:migrate` for `094` + `095`  
- Optional env: `DATABASE_POOL_MAX=10`, `OPS_API_SAMPLE_RATE=0.05`
