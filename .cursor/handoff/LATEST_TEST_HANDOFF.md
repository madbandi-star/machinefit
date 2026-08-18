# Test handoff — 자랑하기 작성 glance UI

## Summary
우리 헬스장 기구 자랑 **자랑하기(작성)** 화면을 한눈에 보이는 작곡기로 바꿨습니다. 사진 먼저, 헬스장 선택, 기구 칩, 한마디/태그, 상단 등록.

## Test focus
1. 목록 → 자랑하기: 첫 화면에서 사진 추가·헬스장·기구가 보이는지
2. 머신 상세 자랑하기: 기구가 미리 선택된 칩인지
3. 사진 추가/탭 삭제, 6장 제한
4. 짐+기구+사진일 때만 등록 활성화

## Fast checks
- `showcase-write__drop` 가 Write 페이지에 있는지

## As-is → To-be
- as-is: 5개 단계 카드 스택
- to-be: 한 화면 작곡기

**Branch:** `main`
