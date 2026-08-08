# Test handoff: Birth date/time scroll pickers

## Summary
설정 생년월일·탄생시에서 네이티브 date/time 입력을 제거하고, 신체 프로필과 같은 ScrollPicker 휠 + 요약 스트립 + 탄생시 있음/모름 세그먼트로 UI/UX를 개선했습니다.

## Git
- Branch: `main`
- Commit: `PENDING` (set after push)

## Test focus
1. 설정 → 생년월일·탄생시: 년/월/일 스크롤 휠 (네이티브 날짜 창 없음)
2. 탄생시: 「시간 선택」시 시/분(5분 단위) 휠, 「탄생시 모름」시 힌트만
3. 상단 요약이 스크롤에 따라 갱신되고, 저장 후 새로고침해도 값 유지

## Fast checks
```bash
npm run test:smoke:changed
rg -n "BirthProfileFields|birth-profile-fields" frontend/src/pages/settings/SettingsPage.tsx frontend/src/components/settings/BirthProfileFields/
```

## productionChecks
- Pages 배포 후 선택: Settings `#birth-profile`에서 휠 UI 확인

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 네이티브 date/time 다이얼로그 | 인라인 ScrollPicker + 요약 |
| 체크박스 탄생시 모름 | 세그먼트(시간 선택 / 모름) |
