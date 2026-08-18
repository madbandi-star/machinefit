# Test handoff ??Performance diagnosis + opt-in timing

## Summary
Diagnosed MachineFit bottlenecks and added opt-in `PAGE_PERFORMANCE` / `API_PERFORMANCE` instrumentation. No product/UI/schema changes.

## Test focus
1. Dev navigate: console shows `PAGE_PERFORMANCE` after route settle
2. Backend with `API_PERF_LOG=1`: `API_PERFORMANCE` lines include `db=` when hitting catalog endpoints
3. Confirm API responses and UI unchanged

## Fast checks
- `frontend/src/utils/pagePerformance.ts` contains `PAGE_PERFORMANCE`
- `backend/server/middlewares/api-perf.middleware.ts` contains `API_PERFORMANCE`
- `docs/PERF_BOTTLENECK_DIAGNOSIS_2026-08-19.md` exists

## As-is ??To-be
- as-is: no page landing timing; limited DB attribution
- to-be: opt-in page + API timing with pool.query DB ms; diagnosis report for paid vs code ROI

## Enable
- FE: `localStorage.setItem('mf_page_perf','1')` or `VITE_PAGE_PERF_LOG=1`
- BE: `API_PERF_LOG=1` (always on in development)

**Branch:** `main`  
**Commit:** 14ed9ccd
