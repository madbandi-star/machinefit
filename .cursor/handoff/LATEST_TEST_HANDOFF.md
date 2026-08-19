# Test handoff — Performance diagnosis refresh

## Summary
Re-measured production after Storage/CDN. Solo bottlenecks: FE shell + Home/Search/Records API fan-out. Warm API ~150ms. Covers on Storage. `PAGE_PERFORMANCE` now includes dns/connection/response/dom_loading.

## Test focus
1. `localStorage.mf_page_perf=1` → console `PAGE_PERFORMANCE` includes nav breakdown lines
2. No UI/API schema regressions (instrumentation only)
3. Report `docs/PERF_BOTTLENECK_DIAGNOSIS_2026-08-19.md` present

## Fast checks
- `pagePerformance.ts` contains `dom_loading=`
- Diagnosis doc mentions `post Storage/CDN migration`

## As-is → To-be
- as-is: image CDN spend still recommended as top paid lever
- to-be: covers Storage reflected; code-first advice for solo feel

**Branch:** `main`  
**Commit:** pending
