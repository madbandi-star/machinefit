# API fan-out reduction — Phase 0 baseline

Date: 2026-08-19  
Scope: Home / Search / Records entry network (pre Phase 1–5 code).

## Method
- Source waterfall analysis (React Query keys + enabled gates)
- Prior production probes (`docs/PERF_BOTTLENECK_DIAGNOSIS_2026-08-19.md`)
- RUM: enable `localStorage.mf_page_perf=1` after deploy for before/after

## Authenticated Home — typical entry requests

| Priority | Endpoint / key | Notes |
|----------|----------------|-------|
| Shell | GET /warmup, oauth client-config | boot |
| Critical | GET /users/me/home-bootstrap | seeds gyms/members/history40/favorites |
| Critical | GET /users/me | Home outside AuthGuard |
| Critical | GET /workout-cards?scheduledDate=today | BottomNav + planned card (shared key) |
| Parallel | billing/status, notifications/unread | shell |
| Secondary | notices/banner, notices/popup | above-fold / modal |
| Secondary | workout-cards/missed | missed banner |
| Deferred candidates | fortune/today, ads×2 (HOME_MIDDLE + MAIN_BOTTOM) | often fetched even when collapsed / below fold |
| Cache-hit often | history limit=40, favorites | bootstrap seed |

**As-is count:** often **6–10+** network calls before fully usable.

## Search `/machines`

| Immediate | brands, muscle-group-images, machines list, brand-favorites |
| Day marks (parallel on entry) | workout-cards(day), history(day), workout-logs(day) |
| Ads | SEARCH_NATIVE_MID |

## Records `/records`

| Immediate | history limit=100, workout-logs limit=200, favorites, display-order |
| Heavy | workout-cards 2020–2035 limit 500, templates |
| Ads | WORKOUT_BOTTOM |
| Cache miss | history100 ≠ bootstrap history40 |

## Duplicate / key issues (Phase 1 targets)

1. history `{limit:40}` vs `{limit:100}` — separate RQ keys  
2. MyPage `/me` staleTime 30s vs AuthGuard 5m  
3. machine-preferences key drift (scope undefined vs gym/member)  
4. bootstrap seed only in `useEffect` (race with useActiveGym)

## Success metrics (post Phase 1–5)

| Page | Target |
|------|--------|
| Home | Critical path ≤ ~3–4; fortune/ads/notices deferred |
| Search | Catalog first; day-marks after list/idle |
| Records | history/logs/favorites first; plans/templates deferred |

Capture `PAGE_PERFORMANCE` `api_total` after deploy for to-be.
