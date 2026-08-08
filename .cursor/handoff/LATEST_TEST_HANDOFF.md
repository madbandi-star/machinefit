# Test handoff: Hide data-scarcity fortune messaging

## Summary
헬창운세 UI에서 「기록이 부족하다 / 쌓이면 분석한다」류 문구를 제거했습니다. 추천·리포트는 운세 톤으로만 말하고, API 데이터 기반 계산은 그대로입니다.

## Git
- Branch: `main`
- Commit: `3b2e0d16`

## Test focus
1. 데이터 부족/개인화 제한 문구 없음
2. 왜 오늘 이 운동인가 / 헬창 리포트는 스타일·부위 안내만 표시

## Fast checks
```bash
rg -n "충분하지|기록이 쌓|Personalization is limited|dataLimited" frontend/src/components/fortune frontend/src/i18n/locales/ko/fortune.json || true
```
