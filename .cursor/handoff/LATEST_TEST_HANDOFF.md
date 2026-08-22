# Test handoff — Hellpower ledger filter UX

## Summary
내 헬창력 페이지의 내역 검색·날짜 필터 UI/UX 개선.  
텍스트 검색 + 날짜 퀵칩(전체/오늘/어제/7일) + 날짜 선택 + 필터 초기화. API/적립 로직 변경 없음.

## Git
- branch: `main`
- commit: `9782f5f7039848fb4707ec2f79cfab654162e9c3`

## Test focus
1. `/my-page/points` 헬창력 내역 필터 카드
2. 오늘/어제/7일/날짜선택 동작
3. 검색+날짜 동시 적용, 초기화
4. 결과 없음 → 필터 초기화 버튼

## Fast checks
```bash
npm run typecheck --prefix frontend
```

## As-is → To-be
- **As-is:** 검색창 + 네이티브 date input 세로 배치, 해제 UX 빈약
- **To-be:** 통합 필터 패널 + 퀵칩 + 캘린더 칩 + 건수/초기화
