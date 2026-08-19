# MachineFit performance bottleneck diagnosis (refresh)

Date: **2026-08-19** (post Storage/CDN migration)  
Scope: **diagnosis + opt-in instrumentation only** — no feature / UI / schema / API contract / auth / payment / routing / PWA behavior changes.  
Method: production probes (KR client), source-map of page→API fan-out, bundle GET sizes, Storage verify docs, existing `PAGE_PERFORMANCE` / `API_PERFORMANCE` tooling.

---

## 1. Current overall performance state

```
User
 → Cloudflare (machine-fit.com DNS/TLS/HTML rewrite)
 → GitHub Pages (/machinefit/ SPA + hashed assets)
 → React/Vite/PWA
 → Render Express (machinefit.onrender.com /api/v1)  [CF PROXY in front]
 → pg Pool → Supabase Postgres
 → Images: prefer Supabase Storage public URLs (covers/muscle); BYTEA fallback retained
 → Motivation audio: still Render-proxied private bucket (by design this pass)
```

| Layer | Status (solo / warm) | Dominant delay |
|-------|----------------------|----------------|
| Cold SPA shell | **HIGH** | JS ~1.2MB critical vendors+index+shared; Google Fonts Inter |
| Warm catalog JSON | **OK** | brands/machines detail ~120–170ms |
| Catalog idle / first | **MEDIUM** | machines list often 500–700ms first, then ~150ms |
| Auth home usable | **HIGH fan-out** | 6–10+ APIs; RUM totals = **측정 필요** (`mf_page_perf=1`) |
| Cover images | **IMPROVED** | Direct Storage WebP ~200KB; no Render BYTEA body when URL present |
| Concurrent load | **MEDIUM–HIGH** | Render Starter CPU; not proven by this solo probe |

**Verdict:** Perceived “slow” for a single user is still mostly **FRONTEND (bundle + fonts) + API fan-out on Home/Search/Records**, not “Render plan too small for warm JSON”. Storage migration **removed the biggest paid media lever for machine covers**; remaining money wins are concurrency (Render) and optional CF rules for Storage — **after** code work.

---

## 2. Instrumentation (already present; refined this pass)

| Layer | Enable | Output |
|-------|--------|--------|
| FE page | Dev always; prod `localStorage.mf_page_perf=1` or `VITE_PAGE_PERF_LOG=1` | `PAGE_PERFORMANCE` (`console.warn`) |
| API | Dev / `API_PERF_LOG=1` on Render | `API_PERFORMANCE` total/db/external/processing/auth/status |
| DB | When API perf on | `pg.Pool.query` via AsyncLocalStorage |

**This pass:** `pagePerformance.ts` also logs Navigation Timing:
`dns` / `connection` / `response` / `dom_loading` (cold document; SPA soft-nav ≈ 0).

How to capture RUM: open prod → DevTools → `localStorage.setItem('mf_page_perf','1')` → hard refresh → navigate target pages → copy `PAGE_PERFORMANCE` warns.

---

## 3. Measured production samples (2026-08-19)

### 3.1 API (Render via Cloudflare)

| Endpoint | Sample (ms) | Notes |
|----------|-------------|--------|
| GET /machines?page=1&pageSize=20 | **581 → 149 → 169** | First after idle slower; warm ~150–170 |
| GET /machines/search?q=press | 425 | ~28KB body |
| GET /machines/FW_BARBELL | 310 | Storage URL in payload |
| GET /machines/FW_BARBELL?muscle=chest | 147 | Muscle Storage URL |
| GET /brands | 135–147 | Cache-Control max-age=120 |
| GET /muscle-group-images | 214 | Storage URLs in JSON |
| GET /notices/banner | 420 | |
| GET /motivation-media | 277 | |
| GET /health | 148–568 cold | Always On (not free sleep) |
| GET /auth/oauth/client-config | 118 | |
| Auth / workout / report / favorites POST | **측정 필요** | Needs session + `API_PERF_LOG` |

All sampled JSON responses show Cloudflare `CF-Cache-Status: DYNAMIC` (expected for API origin).

### 3.2 Frontend / Pages / CF

| Resource | Size | Transfer (HIT) | CF |
|----------|------|----------------|-----|
| HTML `/machinefit/` | ~17KB | 244–823ms | DYNAMIC |
| vendor-react | **537 KB** | ~1.3s cold / HIT later | HIT |
| index-*.js | **190 KB** | ~275ms HIT | HIT |
| dist/shared | **178 KB** | ~292ms HIT | HIT |
| vendor-router | 95 KB | | HIT |
| vendor-i18n | 68 KB | | HIT |
| axios-client | 48 KB | | HIT |
| vendor-axios | 44 KB | | HIT |
| vendor-query | 39 KB | | HIT |
| index CSS | 67 KB | | HIT |
| components CSS | 50 KB | | HIT |
| **Sampled critical sum** | **~1.37 MB** | | Assets `max-age=14400` |

Google Fonts Inter still linked from `frontend/index.html` (extra third-party RTT on cold paint).

### 3.3 Images

| Asset | Size | Grade | Path |
|--------|------|-------|------|
| FW_BARBELL main WebP (Storage) | **199 KB** | 양호 | supabase storage, `Cache-Control: public, max-age=31536000` |
| FW_BARBELL chest WebP | **197 KB** | 양호 | Storage |
| Muscle group WebP | ~27–49 KB | 우수 | Storage |
| Fortune JPGs (public) | 66–144 KB | 양호 | Pages |
| Packaged machine SVG | ~1–2 KB | 우수 | Pages |
| Motivation audio | n/a (stream) | — | **Still Render proxy** |

FE still falls back to `/api/v1/media/machine-covers/...` when no `primaryImageUrl` → **302 → Storage** (not BYTEA body) when migrated.

---

## 4. Page → API waterfalls (source)

### Home `/` (authenticated) — highest fan-out
Shell: warmup, oauth client-config, **home-bootstrap**, billing, notifications, today workout-cards  
Page parallel after gym/member: notices banner/popup, fortune, planned+missed cards, history(40)/favorites (often cache), ads×2  
→ **Often 6–10+ network calls** before “fully usable”.

### Search `/machines`
Parallel: brands, muscle-group-images, machines list; then day marks (cards+history+logs)+favorites.

### Recommend
FW stays on detail + CTA; POST `/recommendations` then result GETs (recommendation, logs, prefs, feedback, favorite check, ads). Prefs/logs can duplicate between panel and hooks.

### Machine detail
`GET /machines/:code[?muscle=]` + optional history snippet, showcase, ads, log panel.

### Records `/records`
history(100), workout-logs, favorites, display-order, wide workout-cards, templates, ads — **chatty**.

### Timer
Local Zustand during session; `/timer-history*` on history screens.

### Today report
Modal on Home end: parallel workout-logs + points (+ optional prefs).

### My page
`/users/me`, gyms, locations, points (`staleTime: 0`), power-box, member-profile-requests, ads.

### Login
oauth client-config + provider POSTs.

---

## 5. Slowest pages TOP 10

*Full page totals = **측정 필요** with `mf_page_perf=1`. Ranking by fan-out + cold shell evidence.*

| Rank | Page | Why slow | Usable feel |
|------|------|----------|-------------|
| 1 | Home (authed) | 6–10+ APIs + eager chunks | 측정 필요 (likely 2–3s+) |
| 2 | Cold first visit (any) | JS+fonts+TLS | Shell assets ~1–2s |
| 3 | Search | brands+list+marks | 측정 필요 |
| 4 | Records | multi large lists | 측정 필요 |
| 5 | Recommend result | multi GETs + possible dup prefs/logs | 측정 필요 |
| 6 | Machine detail + FW muscle | detail + cover (~200KB) + CTA | Improved vs BYTEA era |
| 7 | My page | points staleTime 0 | 측정 필요 |
| 8 | Timer history month | date + month GETs | 측정 필요 |
| 9 | Login | mostly static + oauth cfg | Faster |
| 10 | Guest home | AuthLanding | Faster |

**Rubric:** &lt;500ms 매우 빠름 … ≥3s 문제 — apply only after RUM; do **not** invent numbers.

---

## 6. Slowest API TOP 20 (measured public samples + gaps)

| # | Endpoint | ms (sample) | Evidence |
|----|----------|-------------|----------|
| 1 | GET /machines list (idle-first) | ~580–930 | Probes today + earlier |
| 2 | GET /notices/banner | ~420–480 | |
| 3 | GET /machines/search | ~390–425 | |
| 4 | GET /machines/:code (first) | ~310 | |
| 5 | GET /motivation-media | ~277–305 | |
| 6 | GET /muscle-group-images | ~214–264 | |
| 7 | GET /warmup | ~257–498 | |
| 8 | GET /health (cold) | ~380–568 | |
| 9 | GET /brands (idle) | ~365–533 | warm ~130 |
| 10 | GET /machines (warm) | ~150–180 | |
| 11–20 | login, recommend POST, history, workout-logs, favorites, report, home-bootstrap, ads/decision, billing, timer-history | **측정 필요** | Enable `API_PERF_LOG=1` + Admin Ops slowApis |

---

## 7. Slowest DB query TOP 20

**측정 필요.** Pool timing exists when `API_PERF_LOG=1`. Do **not** add indexes without evidence.

Likely hotspots (code review only — recommendations):

1. Machines list COUNT + page (2332 machines)
2. home-bootstrap fan-in SQL
3. Records wide workout-cards / history(100)+logs(200)
4. Recommendation engine writes/reads
5. Media BYTEA SELECT **only on fallback** (expect near-zero for covers after migration)
6–20. Auth/session, favorites checks, ads decide, points ledger — need logs

Existing index migrations (do not re-apply blindly): 039/051/053/075/094/095/145…

---

## 8. Largest images TOP 20

| Rank | Asset | KB | Grade |
|------|-------|----|-------|
| 1 | Storage FW covers (sample) | ~197–200 | 양호 |
| 2–15 | fortune/*.jpg | 66–144 | 양호 |
| 16 | life_fitness_wordmark.png | 76 | 우수–양호 |
| 17+ | muscle WebP | 27–49 | 우수 |
| — | machine SVG catalog | 1–2 | 우수 |

WebP already used for admin covers/muscle. AVIF: optional future encode on upload (quality-preserving) — **recommend only**, no schema change this pass.

---

## 9. Largest JS / CSS chunks (production GET)

1. vendor-react **537 KB**
2. index **190 KB**
3. dist/shared **178 KB**
4. vendor-router **95 KB**
5. vendor-i18n **68 KB**
6. index CSS **67 KB**
7. components CSS **50 KB**
8. axios-client **48 KB**
9. vendor-axios **44 KB**
10. vendor-query **39 KB**

Route-level splitting exists (many tiny lazy chunks). Initial HTML still **modulepreloads** a large critical set → cold landing dominated by vendors + index + shared.

---

## 10. API-heavy pages & parallelization

| Page | Pattern | Parallelize? |
|------|---------|--------------|
| Home | Many independent widgets | Defer fortune/ads/non-critical **after** first paint (no data removal) |
| Search | Catalog already parallel; day marks after gym | OK |
| Records | Several large lists | Prefer shared keys / avoid limit 40 vs 100 double history |
| Recommend result | prefs + logs duplicated | Dedupe query keys (safe) |
| Detail | Mostly sequential deps OK | — |

Do **not** force-parallel dependent gym→member→scoped queries.

---

## 11. Caching analysis

**Present:** React Query 5m default; BE TTL machines/brands; HTTP Cache-Control catalog 120s; Pages assets 4h; PWA SW; Storage max-age 1y on objects; media ETag/302.

**Candidates (recommend only):** extend SWR for oauth client-config; ensure FE prefers Storage URL over media hop; Cloudflare cache rule for `*.supabase.co/storage` if edge HIT low; avoid `staleTime: 0` on points where safe.

---

## 12. Render plan upgrade likelihood (solo feel)

### **MEDIUM**

**Why not HIGH:** Warm JSON already ~150ms; Always On; compression enabled; Storage offloads cover bytes from Express.

**Why not LOW:** Idle-first catalog spikes; media fallback / audio / concurrency still tax CPU; multi-user SLA needs headroom.

Higher Render plan helps **under load / CPU contention** more than empty warm clicks.

---

## 13. Area bottleneck matrix

| Area | Bottleneck | Paid upgrade helps solo feel? |
|------|------------|--------------------------------|
| **FRONTEND** | **HIGH** | Low (money ≠ smaller JS) |
| **API** | **HIGH** (fan-out / idle spikes) | Code first |
| **RENDER** | **MEDIUM** latency / **HIGH** concurrency | Growth / load |
| **SUPABASE** | **MEDIUM** unknown p95 | Plan only with proof |
| **IMAGE** | **MEDIUM** (covers fixed; audio still API; ~200KB covers) | CF Storage rules / AVIF optional |
| **NETWORK/CF** | **LOW–MEDIUM** | Pro alone weak for SPA feel |

---

## 14. Investment A–G

| Option | Cost↑ | Speed↑ | Feel | Difficulty | Risk | Recommend |
|--------|-------|--------|------|------------|------|-----------|
| A Render higher | $$ | Med load / Low–Med idle | Med | Low | Low | For growth, not first for solo feel |
| B Supabase higher | $$ | Low–Med | Low | Low | Low | Only with pool/CPU proof |
| C Cloudflare Pro | $ | Low | Low | Low | Low | Low priority |
| D Image CDN/Storage | $$ | **Already largely done for covers** | High if incomplete | Med | Med | Finish CF rules; audio stay proxy OK |
| E Bundle optimize | $0 | **High** landing | High | Med | Low | **Do first** |
| F API optimize | $0 | **High** home/search | High | Med | Low | **Do first** |
| G DB index/query | $0 | Med–High if slow SQL | Med | Med | Low | After `API_PERF_LOG` |

**Code-before-money:** E, F, (G with evidence), defer non-critical home APIs.  
**Money-before-more-code:** A when concurrent SLA fails; optional CF cache for Storage; **not** CF Pro as primary.

---

## Final report checklist

### 1) Overall state
Cold shell + authed Home fan-out dominate feel; warm API OK; covers on Storage.

### 2–13)
See sections 5–13 above.

### [돈을 쓰기 전에 해야 할 것 TOP 10]
1. Capture RUM: `mf_page_perf=1` on Home/Search/Records  
2. Set `API_PERF_LOG=1` temporarily; read Admin Ops slowApis/slowQueries  
3. Reduce Home initial fan-out (defer fortune/ads) without removing UI data  
4. Trim non-critical modulepreload / defer shared chunks  
5. Self-host or subset Inter (or system font for LCP)  
6. Dedupe Records history keys / recommend prefs+logs  
7. Confirm `BYTEA_FALLBACK` near-zero for 7 days before any BYTEA drop  
8. Prefer Storage URLs in all FE surfaces (already mostly done)  
9. Avoid unsafe `staleTime: 0` refetches  
10. Confirm DB pooler settings (`:6543?pgbouncer=true`)

### [돈을 쓰면 효과가 큰 것 TOP 5]
1. Render scale when concurrent users / CPU saturation proven  
2. Cloudflare cache rules for Supabase Storage (edge HIT)  
3. Observability (already partial Sentry) to find real p95  
4. (Optional) sharper CPU while any media still hits Express  
5. Not “Supabase plan” or “CF Pro alone” as first spend

### [현재는 돈을 써도 효과가 작은 것]
- Cloudflare Pro alone for SPA feel  
- Supabase plan without slow-query proof  
- Bigger Render for warm empty catalog (~150ms already)  
- Re-buying “image CDN” for covers already on Storage

---

## Six-area money conclusion

| Spend? | Area | Conclusion |
|--------|------|------------|
| Code first | **FRONTEND + API** | Highest ROI for perceived speed |
| Infra next | **RENDER** | When concurrency/CPU proven |
| Mostly done | **IMAGE** | Covers/muscle Storage live; polish CF + audio policy |
| Evidence-gated | **SUPABASE** | Upgrade only with query/pool metrics |
| Low | **NETWORK/CF Pro** | TLS/CDN tweaks; not primary lever |

---

## Missed / adjacent tech stack (not in user’s initial list)

1. **Google Fonts (Inter)** + report fonts (Barlow Condensed / Caveat)  
2. **PWA / Workbox / Service Worker**  
3. **Sentry** (FE+BE)  
4. **Polar** payments webhooks  
5. **OAuth** Google / Kakao / Apple  
6. **Ops ingest / sampled API latency DB**  
7. **Sharp** on upload pipelines  
8. **html5-qrcode** (lazy)  
9. **Zustand** timer state  
10. **React Query** + BE in-process TTL (**no Redis**)  
11. **Cloudflare HTML rewrite** `/` → `/machinefit/`  
12. **Supabase Storage** (now primary for covers/muscle)  
13. **Motivation audio private bucket** via Render proxy  
14. **Ads decision** endpoints on many pages  

---

## Change log vs earlier same-day diagnosis

- Covers/muscle: BYTEA streaming → **Storage URLs** (verified 135/135).  
- IMAGE paid lever for machine covers: **largely realized**.  
- Remaining solo bottlenecks: **JS shell + Home/Search/Records API fan-out**.  
- Instrumentation: Navigation Timing fields added to `PAGE_PERFORMANCE`.
