# Test handoff — Fortune birth-gate UI polish

## Summary
생년월일 미입력 시 `/fortune/today` 게이트(및 홈 운세 카드 게이트) UI를 운세 히어로 톤에 맞게 개선했습니다.

## Test focus
1. 생년월일 없는 계정으로 `/fortune/today` → 히어로·잠금 프리뷰·CTA·안내 문구
2. CTA → 설정 `#birth-profile`
3. 홈 운세 카드 게이트도 제목+본문+노트

## Fast checks
```
rg FortuneBirthGate frontend/src/pages/fortune/FortuneDetailPage.tsx
rg fr-gate frontend/src/styles/fortune-reading.css
```

## as-is → to-be
- as-is: 이모지 + 한 줄 문구 + 버튼
- to-be: 히어로 구성 + 잠금 프리뷰 리스트 + 탄생시 모름 안내 + CTA
