# Test handoff: Empty date CTA to load workout template

## Summary
선택한 날짜에 기록이 없을 때 EmptyState에 「템플릿 불러오기」 버튼을 추가해 날짜 관리 시트에서 템플릿을 적용할 수 있게 했습니다. 기록이 전무한 경우에도 시트가 열리도록 빈 화면 분기를 통합했습니다.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. 날짜 선택 + 기록 없음 → 「템플릿 불러오기」 버튼 표시
2. 버튼 탭 → 이 날짜 관리 시트에서 템플릿 적용
3. 기록이 전혀 없는 계정에서도 동일하게 시트 열림
4. 템플릿 적용 후 해당 날짜에 카드/수행값이 나타남

## Fast checks
```bash
rg -n "planTemplateLoadAction|showLoadTemplateOnEmpty" frontend/src/components/records/HistoryListPanel/HistoryListPanel.tsx frontend/src/i18n/locales/ko/machines.json
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 빈 날짜 EmptyState에 템플릿 진입점 없음 | 「템플릿 불러오기」로 시트 열어 템플릿 적용 |
