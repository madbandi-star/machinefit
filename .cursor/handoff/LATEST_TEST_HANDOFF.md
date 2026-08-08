# Test handoff: Day menu — template delete + centered panel

## Summary
일자조회 ⋯ 메뉴에서 템플릿을 상단에 두고 적용/삭제를 제공하며, 패널을 화면 하단 도킹 대신 중앙에 표시합니다.

## Git
- Branch: `main`
- Commit: `6fda5e08`

## Test focus
1. Records → 일자조회 ⋯ → 패널이 화면 중앙에 뜸
2. 템플릿 목록이 상단, 각 행에 적용 / 삭제
3. 삭제 → 확인 후 목록에서 사라짐
4. 템플릿으로 저장 / 운동 추가 / 일자 삭제는 그대로 동작

## Fast checks
```bash
npm run test:smoke:changed
rg -n "onDeleteTemplate|deleteTemplateMutation|day-actions-sheet-overlay" frontend/src/components/records
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 템플릿 적용만 있고 삭제 없음 | 템플릿별 적용 + 삭제(확인) |
| 메뉴가 화면 최하단에 붙음 | 화면 중앙 패널 |
| 템플릿 영역이 아래쪽 | 템플릿 섹션이 상단 |
