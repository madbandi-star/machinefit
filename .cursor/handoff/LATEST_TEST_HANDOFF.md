# Test handoff ? Fortune share card redesign

## Summary
오늘의 헬창운세 공유 카드를 첨부 시안형 다크 짐 포스터로 재디자인 (스플릿 헤드라인, 네온 점수 카드 3열, 인용 박스, 해시태그 필).

## Git
- Branch: `main`
- Commit: `716d893d`

## Changed files
- `frontend/src/utils/fortuneShareCard.ts`

## Test focus
1. 홈/상세 → 공유 카드 만들기
2. 키워드 타이틀·별·헬창/PR/회복 카드·한마디·푸터 확인

## Fast checks
```powershell
rg -n "drawGymAtmosphere|drawMetricCard" frontend/src/utils/fortuneShareCard.ts
```

## As-is → To-be
- **As-is:** 밋밋한 DNA형 카드
- **To-be:** 시안과 같은 시네마틱 공유 카드
