# Storage migration production verification

Date: 2026-08-19  
BYTEA: **not deleted** (fallback retained)

Migration claim: ok **30** / skip **94** / fail **0** / total **124**

---

## Verification method

```bash
npm run media:verify-storage
```

Checks DB URLs with HTTP HEAD, probes `/media/machine-covers` for 302, samples Storage latency.

---

## Results (live DB + HTTP)

| Metric | Value |
|--------|------:|
| HTTP URLs checked | **135** |
| HTTP OK | **135** |
| missing URL | **0** |
| broken / 404 / 403 | **0** |
| Covers with Storage URL | **52 / 52** |
| Covers still with API `/media/...` URL in DB | **0** |
| Covers BYTEA still present (fallback only) | **52** (intentional) |
| Muscle Storage URL | **8 / 8** |
| Muscle BYTEA still present | **8** (intentional) |
| migration_log status=ok | **30** |

### Sample Storage HEAD latency (direct)

| Machine | ms | bytes | Cache-Control |
|---------|---:|------:|---------------|
| FW_CABLE | 124–126 | ~179–200KB | `no-cache`* |
| FW_DUMBBELL | 67 | ~190KB | `no-cache` |
| FW_KETTLEBELL | 137 | ~193KB | `no-cache` |
| BW_BULGARIAN_SPLIT_SQUAT | 191 | ~189KB | `no-cache` |

\*Upload sets `cacheControl: 31536000`; Supabase response header observed as `no-cache` on HEAD — Cloudflare cache rule still recommended.

### 302 probe (legacy API path)

`GET /api/v1/media/machine-covers/{code}/main` → **302** → `*.supabase.co/storage/v1/object/public/machine-cover-images/...` (~210–339ms first hop).  
Binary body is **not** returned on that hop when Storage URL exists.

---

## Frontend usage path

| Surface | How images resolve | Storage direct? |
|---------|--------------------|-----------------|
| Search / list | `primaryImageUrl` from API ← cover `image_url` | **Yes** (DB already Storage URLs) |
| Detail / history | same `primaryImageUrl` | **Yes** when cover exists |
| Records fallback | `machineCoverMediaUrl()` → `/media/...` | **302 then Storage** if no primary URL |
| Packaged SVG | GitHub Pages `/assets/machines/...` | Pages (not BYTEA) |
| Brand chips | `logoUrl` or packaged SVG | Storage if brand_assets URL set |
| Banners | `imageUrl` (now prefers public Storage URL) | Prefer direct; API path 302 after this fix |
| Photo/trade/showcase | tokenized API URL or signed Storage | Private UGC may still hit API then signed 302 |
| Motivation audio | API proxy (private) | Still Render stream (by design) |

---

## API binary inventory (still capable of binary)

| Endpoint | Current preferred | BYTEA/stream fallback |
|----------|-------------------|----------------------|
| `/media/machine-covers/*` | 302 Storage | BYTEA if no object URL |
| `/media/muscle-group-images/*` | 302 Storage | BYTEA |
| `/media/brand-assets/*` | 302 Storage | BYTEA |
| `/media/banner-images/*` | **302 Storage** (this verify pass) | stream Storage file |
| `/media/notice-attachments/*` | **302 Storage** | stream |
| `/media/motivation-covers/*` | **302 Storage** | stream |
| `/media/motivation-audio/*` | private stream | **Render binary (keep)** |
| `/photo-board/images/*` etc. | signed 302 if migrated | BYTEA |

JSON list/detail APIs return **URL strings**, not Buffer/base64.

---

## BYTEA fallback usage

- Catalog covers/muscle: **all have Storage URLs** → normal FE path should **not** load BYTEA.
- Fallback only if something still requests `/media/...` **and** object URL missing, or Storage down.
- Added opt-in log `BYTEA_FALLBACK` when `API_PERF_LOG=1` and cover BYTEA is served.
- Production call counts: **not available in this session** (need Render logs with `API_PERF_LOG=1`). Expected near-zero for covers/muscle given 52/52 + 8/8 Storage URLs.

### Cause taxonomy if fallback appears

| Code | Meaning | Current risk |
|-------|---------|--------------|
| A | migration miss | Low for covers/muscle |
| B | image_url missing | **0** for covers |
| C | Storage object missing | **0** broken among 135 checks |
| D | FE still uses `/media/` | Only fallback helpers / no-primaryImageUrl |
| E | API returns binary | Only fallback / audio / unmigrated UGC |
| F | UGC private signed | Expected for private UGC |
| G | intentional legacy | BYTEA columns retained |

---

## Performance (measured this verify)

| Path | Sample latency |
|-------|----------------|
| Direct Storage HEAD | **~67–191 ms** |
| API → 302 (no body) | **~210–339 ms** |
| Pre-migration BYTEA via Render | historically worse under load (see PERF docs); exact paired before/after wall clock for same assets: **측정 필요** if you need a lab A/B |

Payload: Storage objects ~10KB thumbs / ~180–200KB mains (webp). Render no longer sends those bodies when redirecting.

---

## Final table

| 항목 | 결과 |
|------|------|
| Storage migration 대상 | 124 |
| 실제 업로드 | 30 |
| 기존 Storage/skip | 94 |
| migration 실패 | 0 |
| Storage URL 정상 | **135/135 HTTP OK** |
| Storage object 정상 | **135/135** (broken 0) |
| broken URL | **0** |
| BYTEA fallback 호출 | **예상 0 (covers/muscle); Render 로그로 재확인 권장** |
| Render binary response | **audio + unmigrated UGC + explicit fallback only** |
| 302 redirect | **있음** (legacy `/media/covers` still 302) |
| 직접 Storage URL | **API JSON `primaryImageUrl` / cover `image_url` = Storage** |
| 평균 이미지 로딩(HEAD) | Storage **~67–191 ms** |
| migration 전 이미지 로딩 | 동일 asset A/B 미실시 → **측정 필요** |
| migration 후 이미지 로딩 | Storage **~67–191 ms** (sample) |

---

## Judgement answers

1. **모든 migrated media가 Storage에서 정상 제공되는가?**  
   검증한 DB URL **135개 전부 HTTP 200**. covers/muscle 전수 Storage URL.

2. **이미지 binary가 Render를 통과하지 않는가?**  
   **카탈로그 covers/muscle 정상 경로: 통과하지 않음** (직접 Storage 또는 302).  
   **예외:** motivation audio, 미이전 UGC BYTEA, Storage 실패 시 fallback.

3. **아직 Render를 통과하는 media는?**  
   - Motivation **audio** (private proxy)  
   - Legacy `/media/*` hit → 302 only (no body) when Storage OK  
   - UGC token endpoint → signed redirect or BYTEA  
   - Packaged Pages SVG (not Render)

4. **BYTEA fallback은 아직 필요한가?**  
   **예 (안전망).** covers/muscle는 사실상 불필요에 가깝지만 삭제 조건 미충족.

5. **302 redirect를 제거할 수 있는가?**  
   **FE/API가 이미 Storage URL을 주면 대부분의 302는 회피 가능.**  
   `/media/machine-covers` 헬퍼는 호환용으로 유지 가능 (302만). 완전 제거는 별도 cleanup.

6. **Storage/CDN 구조가 production에 안전한가?**  
   **예 (검증 범위 내).** Cache-Control이 `no-cache`로 보이는 점은 Cloudflare 캐시 규칙으로 보강 권장.

7. **BYTEA 삭제를 위한 조건이 충족되었는가?**  
   **아니오.** 조건 제안: `API_PERF_LOG`로 `BYTEA_FALLBACK` **7일간 0** + UGC/브랜드 전수 Storage + 명시적 승인 후 별도 작업.

---

## Safe code tweaks in this verify pass

- Banner / notice / motivation-cover media controllers: prefer **302 to public Storage URL** instead of streaming bytes through Render.
- Cover BYTEA path: `BYTEA_FALLBACK` log when `API_PERF_LOG=1`.
- `npm run media:verify-storage` verifier script.

**BYTEA columns were not deleted.**
