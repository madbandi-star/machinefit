# Test handoff — Storage media verification

## Summary
Production Storage URLs verified 135/135 HTTP 200. Covers/muscle all Storage URLs. BYTEA not deleted. Banner/notice/motivation-cover prefer Storage 302.

## Test focus
1. `npm run media:verify-storage` → failCount 0
2. Machine list `primaryImageUrl` hosts on supabase storage
3. BYTEA columns still present

## Fast checks
- `docs/MEDIA_STORAGE_VERIFY_2026-08-19.md` exists
- `scripts/verify-storage-media.mjs` exists

## As-is → To-be
- as-is: migration complete, unverified
- to-be: verified healthy Storage URLs; BYTEA kept as safety net

**Branch:** `main`  
**Commit:** PENDING
