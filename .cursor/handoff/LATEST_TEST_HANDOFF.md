# Test handoff — Rename to 어시스트 풀업

## Summary
`STD_ASSISTED_PULLUP_DIP` 공통·연동 브랜드 머신 이름을 **어시스트 풀업 / 딥 → 어시스트 풀업**으로 변경. 근육군 `back` 유지. migration 186 프로덕션 적용 완료.

## Git
- branch: `main`
- commit: `f321a4db487c3f89f6e611446c03ef597a0cde9a`

## Changed files
- `database/migrations/186_rename_assisted_pullup.sql`
- `scripts/apply-186-rename-assisted-pullup.cjs`
- `.cursor/handoff/latest.json`
- `.cursor/handoff/LATEST_TEST_HANDOFF.md`

## Test focus
1. 공통/브랜드 이름에 「/ 딥」 없음 → 「어시스트 풀업」
2. 근육군 등(back) 유지

## Fast checks
```bash
node -e "require('fs').accessSync('database/migrations/186_rename_assisted_pullup.sql')"
```

## As-is → To-be
| As-is | To-be |
|-------|-------|
| 어시스트 풀업 / 딥 | 어시스트 풀업 |
