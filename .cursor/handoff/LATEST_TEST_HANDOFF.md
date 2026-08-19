# Test handoff ? API fan-out Phases 0?5

## Summary
Home/Search/Records entry fan-out reduced via deferred queries, RQ key hygiene, and optional `home-bootstrap?include=todayCards,missed`. No feature removal.

## Test focus
1. Home: collapsed fortune = no fortune API; ads after idle/in-view
2. Search: catalog loads; day-mark APIs ~200ms later
3. Records: history/logs first; workout-cards/templates deferred
4. Bootstrap include seeds today + missed card caches

## Fast checks
- `useDeferredQueryEnabled.ts` exists
- `home-bootstrap.service.ts` has `todayCards`
- Phase 0 baseline doc exists

## As-is ¡æ To-be
- as-is: 6?10+ Home APIs, Search day-marks immediate, Records cards immediate
- to-be: critical path first; secondary deferred; bootstrap includes cards

**Branch:** `main`  
**Commit:** `dc3da809`
