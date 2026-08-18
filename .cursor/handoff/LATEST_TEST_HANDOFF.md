# Test handoff — 기구 자랑 glance UI

## Summary
기구 추천 흐름의 머신 상세 페이지에 있던 **우리 헬스장 기구 자랑** 영역을, 한눈에 보이는 카드(제목+자랑하기 / 희귀도·건수·지역 칩 / 사진 스트립)로 바꿨습니다. 목록은 `machineCode`로 필터됩니다.

## Test focus
1. 로그인 → 머신 검색 → 머신 상세: 자랑 영역이 큰 버튼 2개가 아니라 컴팩트 카드인지
2. **자랑하기** → 글쓰기에 해당 기구가 미리 선택되는지
3. 제목 또는 자랑 수 칩 → 목록이 그 기구만 나오고, **해제**하면 전체인지

## Fast checks
- `npm run typecheck --prefix frontend`

## As-is → To-be
- as-is: 보조 버튼 2개 + 안내 문구, 한눈에 안 보임
- to-be: 카드 한 장에서 통계·사진·CTA를 바로 확인

**Branch:** `main`
