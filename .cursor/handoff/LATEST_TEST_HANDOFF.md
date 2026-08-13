# Test handoff — Count mode help under settings

## Summary
마이페이지 설정 > 카운트 모드 선택 영역 하단에 각 모드(일반 / 일반+터보 / AI 가속 / AI 가속+터보) 짧은 설명을 표시. 선택된 모드는 강조.

## Git
- branch: `main`
- commit: `bbd94f09`

## Test focus
1. 설정 > 음성 카운트 > 카운트 모드 아래 4줄 설명
2. 모드 변경 시 해당 설명 행 강조
3. 세션 모드가 버텨!!!만일 때는 카운트 모드(설명 포함) 숨김

## Fast checks
```
rg -n "voiceCountModeHelp_|voice-count-mode-help" frontend/src/pages/settings/SettingsPage.tsx frontend/src/i18n/locales/ko/common.json frontend/src/styles/components.css
```

## As-is → To-be
- **As-is:** 모드 라벨만
- **To-be:** 선택 영역 아래 쉬운 모드별 설명
