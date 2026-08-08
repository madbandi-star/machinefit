# Test handoff: Remove birth picker unit key leak

## Summary
생년월일·탄생시 휠 라벨 아래 `settings.birthMonthUnit` 등 빈 단위 키가 노출되던 문제를 제거했습니다. 단위 줄 자체를 렌더하지 않습니다.

## Git
- Branch: `main`
- Commit: `6599df84`

## Test focus
1. 설정 → 생년월일·탄생시: 월/일/시/분 아래 `settings.*` 문자열 없음
2. 라벨은 연도·월·일·시·분만 표시

## Fast checks
```bash
rg -n "birthMonthUnit|body-metrics-inline__unit" frontend/src/components/settings/BirthProfileFields/BirthProfileFields.tsx || true
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 라벨 아래 settings.* 키 노출 | 라벨만 표시 |
