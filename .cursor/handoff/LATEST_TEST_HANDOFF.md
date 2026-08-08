# Test handoff: No double-tap back on fresh recommend detail

## Summary
기구검색→추천 상세에서 더블탭 시 `navigate(-1)`로 검색으로 돌아가던 문제를 수정했습니다. 기록(`logDate`)에서 연 상세에서만 더블탭으로 기록 목록으로 돌아갑니다.

## Git
- Branch: `main`
- Commit: a4a60c47

## Test focus
1. Search → recommend → detail: tap/double-tap does NOT return to search
2. Records → card → detail (with logDate): double-tap still returns to records

## Fast checks
```bash
rg -n "recordsReturnDate|enabled: Boolean\\(recordsReturnDate\\)" frontend/src/pages/recommendation-result/RecommendationResultPage.tsx
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| Fresh recommend detail double-tap → search | No back navigation without logDate |
