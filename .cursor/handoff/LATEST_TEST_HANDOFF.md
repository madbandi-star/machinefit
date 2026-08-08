# Test handoff: Data management page UX refresh

## Summary
마이페이지 데이터 관리(`/settings/data`) UI를 액션 카드·형식 세그먼트·드롭존·상태 칩·복구 확인 모달로 재구성했습니다. 백업/복구 API 동작은 동일합니다.

## Git
- Branch: `main`
- Commit: pending (updated after push)

## Test focus
1. 마이페이지 → 데이터 관리: 안전 안내 + 백업/복구 카드 레이아웃
2. 형식 ZIP/JSON 세그먼트 전환 후 백업 버튼 동작
3. 복구: 파일 선택/드롭 → 병합·완전복원 옵션 모달 → 복구
4. 최근 기록: 상태 칩·다시 받기 버튼 표시

## Fast checks
```bash
rg -n "data-mgmt__dropzone|formatZip|modeMergeTitle" frontend/src/pages/settings/DataManagementPage.tsx frontend/src/i18n/locales/ko/common.json
Test-Path frontend/src/styles/data-management.css
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 원시 select / file input / plain list | 카드형 백업·드롭존 복구·상태 칩 이력·선택형 복구 모달 |
