# Test handoff — Search default brand = 맨몸

## Summary
검색 페이지 진입 시 근육군 **전체**, 브랜드 **맨몸**이 기본 선택. 브랜드 「전체」는 `brand=all`로 유지되어 다시 맨몸으로 되돌아가지 않음.

## Test focus
1. `/machines` 진입 → 근육 전체, 브랜드 맨몸
2. 브랜드 전체 선택 유지
3. `?brand=OTHER` 딥링크 유지

## Fast checks
```
rg -n "DEFAULT_SEARCH_BRAND_CODE|brand === null" frontend/src/constants/machine-search-defaults.ts frontend/src/pages/machine-search/MachineSearchPage.tsx
```

## As-is → To-be
- as-is: 브랜드도 전체
- to-be: 브랜드 맨몸 기본
