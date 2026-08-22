# Test handoff — Hellpower date filter

## Summary
`/points` 헬창력 내역에 날짜 선택 필터 추가. 텍스트 검색과 AND 조건. Asia/Seoul 일자 기준.

## Fast checks
```bash
npm run typecheck --prefix frontend
```

## As-is → To-be
- **As-is:** 날짜 문자열 띄어쓰기 맞춰 검색
- **To-be:** `type=date` 선택 + 해제 버튼
