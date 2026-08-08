# Test handoff: Fit feedback choice prompt copy update

## Summary
기구카드 핏 피드백 안내 문구를 「아래 버튼을 눌러 기본값을 설정하세요.」로 변경했습니다 (ko/en/ja/zh).

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. 기록 카드 핏 피드백 미선택 상태: choicePrompt 문구가 「아래 버튼을 눌러 기본값을 설정하세요.」

## Fast checks
```bash
rg -n "아래 버튼을 눌러 기본값을 설정하세요" frontend/src/i18n/locales/ko/machines.json
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 세팅이 잘 맞았나요? 아래 버튼을 눌러 선택하세요 | 아래 버튼을 눌러 기본값을 설정하세요. |
