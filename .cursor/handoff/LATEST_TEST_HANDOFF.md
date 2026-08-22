# Test handoff — Sync assist / pullover / seated cable to common type

## Summary
공통 유형 `STD_ASSISTED_PULLUP_DIP` 표시명을 **어시스트 풀업 / 딥**으로 맞추고, 연동 브랜드 머신 3종(어시스트·풀오버·시티드 케이블)의 **이름·근육군**을 공통 머신 설정으로 동기화했습니다. 프로덕션 DB에는 migration 185를 이미 적용했습니다.

## Git
- branch: `main`
- commit: `e6d88f45786836358c1d04f33e6df40808a87d03`

## Changed files
- `database/migrations/185_sync_std_assist_pullover_cable.sql`
- `scripts/apply-185-sync-std.cjs`
- `.cursor/handoff/latest.json`
- `.cursor/handoff/LATEST_TEST_HANDOFF.md`

## Test focus
1. 브랜드 검색/상세: **어시스트 풀업 / 딥** — 이름에 `/ 딥`, 근육군 **등(back)** (전신 아님)
2. **풀오버** — 코어(core)
3. **시티드 케이블** — 가슴(chest)
4. 관리자 공통 머신 목록: `STD_ASSISTED_PULLUP_DIP` → 「어시스트 풀업 / 딥」

## Fast checks
```bash
node -e "require('fs').accessSync('database/migrations/185_sync_std_assist_pullover_cable.sql')"
```

## Production checks
- API/검색: assisted → `muscle_group=back`, name contains `어시스트 풀업 / 딥`
- 풀오버=`core`, 시티드 케이블=`chest`

## As-is → To-be
| As-is | To-be |
|-------|-------|
| 공통 이름 「어시스트 풀업」, 브랜드 전신 | 공통·브랜드 「어시스트 풀업 / 딥」, back |
| 풀오버/시티드케이블 브랜드 전신 | core / chest (공통 primary와 동일) |
