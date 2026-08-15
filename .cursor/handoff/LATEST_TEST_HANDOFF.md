# Test handoff ? 기록 도구 버튼 색 통일

## Summary
기록 툴바 도구(설정) 버튼이 시트 CSS 오버라이드로 달력·정렬과 색이 달랐음. 오버라이드 제거로 `records.css` 공통 스타일 사용.

## Git
- Branch: `main`
- Commit: _d8e51a92_

## Test focus
1. 달력 / 도구 / 정렬 기본·호버 색 동일
2. 도구 메뉴 열린 상태도 프라이머리 톤

## As-is → To-be
- **As-is:** 도구만 surface/border 톤
- **To-be:** 달력·정렬과 동일 glass + primary
