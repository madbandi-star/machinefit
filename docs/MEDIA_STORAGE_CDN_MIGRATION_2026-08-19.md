# Media Storage/CDN migration report

Date: 2026-08-19  
Scope: Prefer Supabase Storage (+ Cloudflare cache) over Render BYTEA streaming. BYTEA retained as fallback until ops verifies.

---

## A. BYTEA media inventory (pre-change)

| Kind | Table | Columns | Serve path | Notes |
|------|-------|---------|------------|-------|
| Machine covers | `machine_cover_images` | `image_data`, `thumbnail_data` | `/media/machine-covers/...` | Dual-write existed; API URL was canonical |
| Muscle groups | `muscle_group_images` | same | `/media/muscle-group-images/...` | Dual-write existed |
| Brand logo/hero | `brand_assets` | `logo_data`, `image_data` | `/media/brand-assets/...` | BYTEA-only before |
| Standard machine images | `standard_machine_images` | BYTEA | `/media/standard-machine-images/...` | Script kinds include later |
| Brand gallery | `machine_images` | BYTEA | `/media/machine-images/...` | |
| Photo board | `photo_post_images` | BYTEA | `/photo-board/images/...` | HMAC token |
| Trades | `machine_trade_images` | BYTEA | `/machine-trades/images/...` | |
| Showcase | `machine_showcase_images` | BYTEA | `/community/machine-showcase/images/...` | |
| Machine requests | `machine_request_images` | BYTEA | `/machine-requests/images/...` | |

**Already Storage (proxy or direct):** motivation audio (private), motivation covers, notices, banners, backups.  
**Not BYTEA:** packaged FE SVGs under GitHub Pages; profile avatars usually external OAuth URLs.

---

## B–C. Migrated file counts

**Not run against production in this change.** Ops must:

1. `npm run db:migrate` (applies `152_media_storage_cdn.sql`)
2. `npm run media:migrate-storage` (or `DRY_RUN=1` first)

After run, counts are in `media_storage_migration_log` (`status=ok` / `failed`).

---

## D. Storage buckets

| Bucket | Public? | Role |
|--------|---------|------|
| `machine-cover-images` | public | Machine covers (existing) |
| `muscle-group-images` | public | Muscle covers (existing) |
| `brand-assets` | public | Brand logo/hero (**new**) |
| `ugc-images` | private | Photo/trade/showcase/request (**new**) |
| `banner-images` | public | Banners (existing; URLs now direct public) |
| `notice-attachments` | public | Notices (existing; URLs now direct public) |
| `motivation-covers` | public | Motivation covers (direct public URL) |
| `motivation-audio` | private | Audio (signed/proxy; unchanged) |
| `backup` | private | Backups |

---

## E. DB columns (additive — migration 152)

- `brand_assets.logo_storage_path`, `image_storage_path`
- UGC tables: `storage_path`, `thumbnail_storage_path`, `image_url`, `thumbnail_url`, `version`
- `media_storage_migration_log` audit table  
**BYTEA columns NOT dropped.**

---

## F. API behavior changes

- Catalog media GET: **302 → Storage public URL** when available; else BYTEA fallback
- Brand/muscle/cover **uploads** store Storage `publicUrl` in `image_url` when Storage works
- Banner/notice/motivation-cover URL helpers prefer **direct** `getPublicUrl`
- Photo-board GET: after HMAC check, **302 → signed UGC URL** when `storage_path` set; else BYTEA
- JSON list fields still return URL strings (now often Supabase hosts) — schema shape unchanged

---

## G. Frontend

- No UI/workflow changes
- `resolveMachineImageUrl` already accepts remote Supabase URLs
- Brand logo resolver already returns non-`/media/` remotes

---

## H. Binary no longer intended through Render

When migration + Storage succeed:

- Machine covers / muscle / brands → browser → Cloudflare → Supabase Storage  
- Banners/notices/motivation covers → direct Storage public URL  
- UGC → signed Storage URL after token gate (one redirect hop on API, no BYTEA body)

**Still may hit Render briefly:** 302 redirect endpoints; audio private proxy; unmigrated BYTEA fallback.

---

## I–J. Timing before/after

| Metric | Before (sample) | After |
|--------|-----------------|-------|
| Idle `/media` BYTEA | Render + DB blob | **측정 필요** after migrate |
| Warm catalog JSON | ~150ms | unchanged |
| Page landing | FE-bound | Re-measure with `mf_page_perf=1` after migrate |

Baseline from prior diagnosis: fortune JPG via Pages ~1.3s cold; cover BYTEA path was Render-bound.

---

## K. Remaining BYTEA

All original BYTEA columns remain until ops confirms 100% Storage coverage and deletes in a **later** migration (not this release).

---

## L. Safe to drop BYTEA?

**No.** Only after:

1. `media_storage_migration_log` shows 0 failed for production kinds  
2. Spot-check home/search/detail/boards  
3. Confirm Cloudflare caches Storage host  
4. Explicit follow-up migration to null/drop BYTEA

---

## M. Further CDN/cache

- Cloudflare cache rule for `*.supabase.co/storage/v1/object/public/*`  
- Optional custom domain for Storage  
- UGC: refresh signed URLs in list JSON so FE never needs `/photo-board/images` hop  
- Migrate standard/gallery kinds in script when ready

---

## Final answers

| Question | Answer |
|----------|--------|
| Storage/CDN based now? | **Partially — code path prefers Storage; production needs migrate 152 + `media:migrate-storage`** |
| Binary skip Render? | **Yes when Storage URL exists; BYTEA fallback remains** |
| Features/images 100% kept? | **Designed yes (dual-path); verify after migrate** |
| Drop BYTEA now? | **No** |

### Ops checklist

```bash
npm run db:migrate
DRY_RUN=1 npm run media:migrate-storage
npm run media:migrate-storage
# optional: KINDS=covers,muscle,brands
```
