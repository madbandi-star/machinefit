# Test handoff — 머신도감 등급 컬렉션 UI

## Summary
머신도감 페이지의 등급 UI를 전용 SVG 엠블럼 컬렉션으로 바꿨습니다. API·등급 판정·필터 토글·카드 이동은 그대로입니다.

## Test focus
1. `/my-page/machine-dex` — 컬렉션 키커, 발견 N / 전체, 진행률(전체 수가 있을 때만)
2. 등급 바 가로 스크롤: 전체 + 7등급, 엠블럼, 실제 보유 수
3. 등급 클릭 → 해당 등급만, 같은 등급 다시 클릭 → 전체 (기존 동작)
4. 0개 등급 선택 시 큰 엠블럼 + “이 등급에서 발견한 머신이 없어요.”
5. 카드 클릭 → 기구 상세 `/machines/:code`
6. 공유관 목록/상세 등급 배지(엠블럼 + 로컬라이즈 라벨) 레이아웃

## Fast checks
`npm run test:smoke:changed`

## As-is → To-be
- as-is: 텍스트 위주 등급 칩, 유니코드 마크
- to-be: 통일된 메달 엠블럼, 가로 Collection Bar, 등급이 올라갈수록 카드 존재감 증가

**Branch:** `main`  
**Commit:** pending
