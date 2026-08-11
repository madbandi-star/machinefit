# Test handoff — Data management under Settings reset

## Summary
데이터관리 left My Page 개인설정. It is a Settings collapsible directly under 설정값 초기화 (still member-gated).

## Test focus
1. My Page 개인설정 has no 데이터관리
2. Settings: after 설정값 초기화, 데이터관리 section → `/settings/data`

## as-is → to-be
- as-is: 데이터관리 on My Page under 설정
- to-be: 데이터관리 on Settings page below reset

## Fast checks
```
rg DATA_MANAGEMENT frontend/src/pages/my-page/MyPage.tsx frontend/src/pages/settings/SettingsPage.tsx
```
