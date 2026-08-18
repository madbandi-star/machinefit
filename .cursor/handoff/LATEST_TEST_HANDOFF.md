# Test handoff — 자랑글 상세 glance UI

## Summary
우리 헬스장 기구 자랑 **게시글 상세**를 한눈에 보이게 바꿨습니다. 사진 위에 헬스장·기구명, 아래에 희귀도 칩과 짧은 CTA.

## Test focus
1. 목록에서 글 클릭 → 첫 화면에서 사진·헬스장·기구·희귀도·좋아요
2. 사진 여러 장 → 썸네일 전환
3. 우리 짐에도 있음 / 기구카드 / 도감이 한 줄
4. 목록 복귀

## Fast checks
- `showcase-detail__overlay` 가 Detail 페이지에 있는지

## As-is → To-be
- as-is: 정사각 히어로 + 중복 제목 + 풀폭 버튼 스택
- to-be: 오버레이 카드 + 칩 + 짧은 CTA

**Branch:** `main`
