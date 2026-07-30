# Latest test handoff — Free-weight covers per muscle

**Branch:** `main` · **Commit:** *(after push)*

## Change

이전에는 **기구 코드당 이미지 1장**만 가능해서 `등-프리-바벨` / `가슴-프리-바벨`을 다르게 보여줄 수 없었음.

기존 **관리자 → 머신 대표 이미지**를 확장:

- 프리웨이트(`FW_*`)에 **부위별(등/가슴/하체/어깨/이두/삼두/팔/코어) 슬롯** 추가
- 검색 목록·상세는 선택된 부위의 커버를 우선 표시
- DB migration `083_machine_cover_muscle_variants.sql` 필요

## Test focus

1. Admin 로그인 → 머신 대표 이미지 → Free Weight → 바벨 카드의 부위별 업로드
2. 검색: 등 + 프리 → 바벨 썸네일 = 등용 사진; 가슴 + 프리 → 가슴용 사진
3. 상세 `?muscle=back` 이미지도 부위 반영

## Fast checks

```bash
npm run build --prefix shared
npm run db:migrate   # production DATABASE_URL — migration 083
```

## Deploy

- Frontend: Pages on `main` push
- **Backend Render redeploy required**
- **DB migrate 083 required** (로그인 수정처럼 서버/DB 반영이 핵심)

## as-is → to-be

- **as-is:** 바벨 이미지 부위별 관리 불가
- **to-be:** Admin에서 부위별 업로드 후 검색에서 부위별로 다른 바벨 사진 표시
