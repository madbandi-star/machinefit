# Test handoff — Body metrics height/weight pair pickers

## Summary
신체 정보에서 나이가 빠진 뒤에도 3열 그리드가 남아 키·몸무게 UI가 어색했습니다. 2열 트윈 카드로 맞췄습니다.

## Test focus
1. 설정 → 신체 정보
2. 키 / 몸무게가 같은 폭의 두 카드
3. 빈 세 번째 칸 없음
4. 스크롤·저장 정상

## Fast checks
```
rg body-metrics-inline--pair frontend/src/styles/components.css
rg body-metrics-inline__grid--2 frontend/src/components/settings/BodyMetricsFields/BodyMetricsFields.tsx
```

## as-is → to-be
- as-is: 3열 그리드에 키·몸무게만 → 빈 칸 / 답답함
- to-be: 2열 카드형 피커, 단위 뱃지, 선택값 강조
