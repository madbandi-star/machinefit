# MachineFit performance bottleneck diagnosis

Date: 2026-08-19  
Scope: diagnosis + opt-in instrumentation only (no feature/UI/schema/API shape changes).  
Method: production curl latency, production asset sizes, source-map of page→API fan-out, prior `docs/PERF_1K_CONCURRENT.md`.

---

## 1. End-to-end flow & delay sources

```
User
 → Cloudflare (machine-fit.com DNS/TLS/rewrite)
 → GitHub Pages (/machinefit/ SPA)
 → React/Vite/PWA (JS/CSS/fonts)
 → Render API (machinefit.onrender.com /api/v1)
 → Node/Express (compression, rate-limit, auth, TTL cache)
 → pg Pool → Supabase Postgres (transaction pooler expected)
 → (media) often BYTEA via Express /api/v1/media/*  [not edge CDN]
```

| Stage | Likely delay |
|-------|----------------|
| Cloudflare TLS | First connect to `machine-fit.com` TLS ~430–470ms observed |
| Pages HTML | index ~17KB; many modulepreloads |
| Google Fonts Inter | Extra third-party CSS (~0.5s cold) before paint quality |
| Initial JS | vendor-react ~550KB + index ~195KB + dist/shared ~182KB + i18n/router… |
| API RTT Singapore/Render | Warm JSON ~140–170ms; first-after-idle often 300–900ms |
| BYTEA media | CPU + bandwidth on Render; docs already flag as hotspot |
| DB | Warm catalog OK; N+1 / untimed queries need `API_PERF_LOG=1` |

---

## 2. Instrumentation added (opt-in)

| Layer | How to enable | Output |
|-------|---------------|--------|
| FE page | Dev always; prod: `localStorage.mf_page_perf=1` or `VITE_PAGE_PERF_LOG=1` | `PAGE_PERFORMANCE` via `console.warn` |
| API | Dev always; prod: `API_PERF_LOG=1` on Render | `API_PERFORMANCE` with total/db/external/processing |
| DB | Automatic when API perf enabled | `pg.Pool.query` timed via AsyncLocalStorage |

Files: `frontend/src/utils/pagePerformance.ts`, axios + `OpsTelemetryBridge`, `api-perf.middleware.ts`, `database.ts`.

---

## 3. Measured production samples (2026-08-19, KR client)

### API (Render)

| Endpoint | First / idle-ish | Warm repeat | Notes |
|----------|------------------|-------------|-------|
| GET /health | 380ms | — | Always On (not free sleep) |
| GET /warmup | 498ms | — | Boot pool warm |
| GET /brands | 533ms | **149–167ms** | TTL cache helps |
| GET /machines?page=1&pageSize=20 | 928ms | **146–156ms** | Catalog ~2332 machines |
| GET /machines/search?q=press | 390ms | — | |
| GET /machines/:code (detail) | 313ms | **137–159ms** | |
| GET /auth/oauth/client-config | 164ms | — | Fast |
| GET /notices/banner | 478ms | — | |
| GET /motivation-media | 305ms | — | |

### Frontend / CDN

| Resource | Size | Total time (this probe) |
|----------|------|---------------------------|
| HTML machine-fit.com/machinefit/ | ~17KB | 751ms (TLS heavy) |
| vendor-react-*.js | **550KB** | ~1.1s |
| index-*.js | 195KB | ~1.0s |
| dist-*.js (shared) | 182KB | ~0.9s |
| vendor-i18n | 70KB | ~1.1s |
| vendor-router | 97KB | ~0.9s |
| CSS sum (sampled critical set) | ~274KB | — |
| fortune JPG (largest static) | 147KB | ~1.3s cold |
| Google Fonts CSS | 1KB | 482ms cold |

**Note:** Browser cache + SW will improve repeat visits; curl does not model SW.

---

## 4. Page → API call order (source analysis)

### Home (authenticated) — highest fan-out
Global: `GET /warmup`, `GET /users/me/home-bootstrap`  
Page: `GET /users/me`  
Children (parallel): notices banner, fortune today, planned/missed workout cards, recent history, favorites, banners/ads  
→ **Often 6–10+ requests** before “fully usable”.

### Search `/machines`
brands, brand-favorites, machines list/search, favorites, muscle images, optional day marks (workout cards + history + logs).

### Recommend `/recommend/:code`
`POST /recommendations` then navigate → result `GET /recommendations/:id` (+ log/prefs panels).

### Machine detail
`GET /machines/:code` + WorkoutLogPanel / prefs / favorites as opened.

### Records `/records`
history, workout logs, favorites, display order, workout cards, banner.

### Timer
Local-first (Zustand); API on end / `/timer-history`.

### My page
`/users/me`, location, points (`staleTime: 0`).

### Login
`/auth/oauth/client-config` + OAuth POSTs.

---

## 5. Area verdicts

| Area | Bottleneck? | Paid upgrade helps single-user feel? |
|-------|-------------|----------------------------------------|
| **FRONTEND** | **HIGH** — large initial JS, many preloads, Google Fonts, home chatty | Low (money doesn’t shrink JS) |
| **API / code** | **HIGH** — fan-out, media through API | Code first |
| **RENDER** | **MEDIUM** for latency; **HIGH** for concurrency | Warm JSON already ~150ms; Starter CPU limits under load |
| **SUPABASE** | **MEDIUM** unknown without `API_PERF_LOG` p95; catalog warm OK | Plan rarely fixes bad queries |
| **IMAGE** | **MEDIUM** static OK; **HIGH** if BYTEA/UGC heavy | Storage+CDN > bigger Render alone |
| **NETWORK/CF** | **LOW–MEDIUM** — TLS/rewrite; static cache OK | Pro unlikely to beat code/CDN media move |

### Render plan upgrade likelihood (single-session speed)
**MEDIUM** — Already paid Always On; warm API ~150ms. Higher plan helps under CPU contention / media / concurrency more than empty-home click latency.

---

## 6. Investment comparison (A–G)

| Option | Cost↑ | Speed↑ | Feel | Difficulty | Risk | Recommend |
|--------|-------|--------|------|------------|------|-----------|
| A Render higher | $$ | Med (load) / Low–Med (idle) | Med | Low | Low | Yes for growth, not first for “feels slow alone” |
| B Supabase higher | $$ | Low–Med | Low | Low | Low | Only if pool/CPU metrics prove it |
| C Cloudflare Pro | $ | Low | Low | Low | Low | Low priority |
| D Image CDN/Storage | $$ | **High** on media pages | High | Med | Med | **Yes** (BYTEA out of Express) |
| E Bundle optimize | $0 | **High** on landing | High | Med | Low | **Do first** |
| F API optimize | $0 | **High** on home/search | High | Med | Low | **Do first** |
| G DB index/query | $0 | Med–High if slow SQL | Med | Med | Low | After API_PERF evidence |

---

## 7. Report tables (honest labels)

### Slowest pages (estimated from fan-out; full RUM = 측정 필요)

| Rank | Page | Why | Usable speed |
|------|------|-----|--------------|
| 1 | Home (authed) | 6–10+ APIs + eager home bundle | 측정 필요 (likely 2–3s+) |
| 2 | Search | brands+list+marks | 측정 필요 |
| 3 | Records | multi list APIs | 측정 필요 |
| 4 | Recommend result | recommend get + panels | 측정 필요 |
| 5 | Machine detail | detail + log panel | 측정 필요 |
| 6 | Cold first visit (any) | JS+fonts+TLS | Shell ~1–2s measured assets |
| 7 | My page | me+points no stale | 측정 필요 |
| 8 | Timer history | month/date | 측정 필요 |
| 9 | Login landing | mostly static + oauth config | Faster |
| 10 | Guest home | AuthLanding, few APIs | Faster |

### Slowest APIs (measured samples — not ops p95)

Warm: brands/machines/detail ~140–170ms.  
Idle-first: machines list **928ms**, brands **533ms**.  
Auth/workout/report: **측정 필요** (requires session; enable `API_PERF_LOG` + Admin Ops slowApis).

### DB queries TOP 20
**측정 필요** — enable `API_PERF_LOG=1` after deploy; pool timing now automatic. Prior indexes: 039/051/053/075/094/095/145. Recommendations only until measured: review machines list COUNT+list, home-bootstrap fan-in SQL, media blob SELECT.

### Largest images (repo public/)

Most machine assets are SVG ~1–2KB (우수). Largest: fortune/share JPGs **67–144KB** (양호). BYTEA admin covers not in repo — measure via `/media/*` in Ops.

### Largest JS (production)

1. vendor-react **550KB**  
2. index **195KB**  
3. dist/shared **182KB**  
4. vendor-router **97KB**  
5. vendor-i18n **70KB**  
6. vendor-axios **45KB**  
7. vendor-query **40KB**

### Caching already present
React Query 5m default; BE TTL for machines/brands/gyms; HTTP Cache-Control catalog 120s; media ETag/304; PWA precache hashed assets.

### Cache candidates (recommend only)
brands, muscle maps, machine list pages, oauth client-config, notice banners — extend SWR / CDN for media after Storage migration.

---

## 8. Final priorities

### 돈을 쓰기 전에 해야 할 것 TOP 10
1. Enable PAGE_PERF + API_PERF_LOG and capture real home/search totals  
2. Reduce home initial API fan-out (defer fortune/ads/non-critical) without removing data  
3. Trim modulepreload of non-critical home chunks  
4. Self-host or subset Inter (or system font for LCP)  
5. Move BYTEA media → Supabase Storage + CF cache  
6. Confirm transaction pooler `:6543?pgbouncer=true`  
7. Parallelize only independent search day-mark queries (already mostly parallel)  
8. Inspect Admin Ops `slowApis` / `slowQueries`  
9. Ensure media 304 hit rate under real browsers  
10. Avoid refetch points with `staleTime: 0` where safe

### 돈을 쓰면 효과가 큰 것 TOP 5
1. Image/Storage CDN path (D)  
2. Render scale-out for concurrent users (A) when load grows  
3. (Optional) sharper CPU when media still on Express short-term  
4. Observability (Sentry/perf sampling already partial)  
5. Not Cloudflare Pro as first spend

### 현재는 돈을 써도 효과가 작은 것
- Cloudflare Pro alone for SPA feel  
- Supabase plan upgrade without slow-query proof  
- Bigger Render for warm empty catalog clicks (~150ms already)

---

## 9. Missed / adjacent tech stack

Not in the user’s initial list but material to performance:

1. **Google Fonts (Inter)** — third-party render-blocking CSS  
2. **PWA / Workbox / Service Worker** — repeat visit cache; first visit cost  
3. **Sentry** (FE+BE) — small JS + sampling overhead  
4. **Polar** payments webhooks (not landing path)  
5. **OAuth** Google / Kakao / Apple  
6. **ops ingest / sampled API latency DB writes**  
7. **Sharp** image processing on backend uploads  
8. **html5-qrcode** (lazy chunk)  
9. **Zustand** client timer state  
10. **React Query** cache layer  
11. **Cloudflare HTML rewrite** `/` → `/machinefit/`  
12. **Absence of Redis** — in-process TTL only (multi-instance cache drift)

---

## 10. Six-area money conclusion

| Spend first? | Area | Conclusion |
|--------------|------|------------|
| Code first | FRONTEND + API | Highest ROI for perceived speed |
| Then infra | IMAGE (Storage+CDN) | Biggest paid win for media |
| Then scale | RENDER | Needed for concurrent SLA; medium for solo latency |
| Evidence-gated | SUPABASE | Upgrade only with query/pool metrics |
| Low | NETWORK/CF Pro | TLS/CDN tweaks; not primary lever |
