# Test handoff — My Page UI trim

## Summary
마이페이지에서 아이디 [변경] 옆 잔여 횟수 상시 문구 제거(편집 중에는 유지). 내 헬창력 한 줄의 `상위 N%` 제거.

## Fast checks
```bash
npm run typecheck --prefix frontend
```

## As-is → To-be
- **As-is:** `[변경] 아이디 변경 3/3회 남음` + 헬창력 `· 상위 N%`
- **To-be:** `[변경]`만 노출 / 편집 시 잔여 횟수 표시 / 헬창력은 이모지·칭호·점수만
