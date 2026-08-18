# Test handoff ??BYTEA ??Storage/CDN dual-path

## Summary
Media serving prefers Supabase Storage (public or signed) with 302 redirect. BYTEA kept as fallback. Migration 152 is additive only. Bulk copy via `npm run media:migrate-storage`.

## Test focus
1. After migrate 152, catalog cover endpoints redirect to `supabase.co/storage` when `storage_path` set
2. Unmigrated rows still return BYTEA (images not broken)
3. No UI/schema breaking changes
4. Do **not** drop BYTEA yet

## Fast checks
- `152_media_storage_cdn.sql` contains `media_storage_migration_log`
- `media-cdn.ts` contains `redirectToObjectUrl`
- `scripts/migrate-bytea-to-storage.mjs` exists

## As-is ??To-be
- as-is: Render streams BYTEA for covers/brands/UGC
- to-be: Browser ??CDN/Storage when migrated; BYTEA fallback otherwise

**Branch:** `main`  
**Commit:** 61472848

