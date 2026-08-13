# Test handoff ? Premium fortune share card

## Summary
오늘의 헬창운세 공유 카드를 인스타 포스터급으로 재제작. 시네마틱 짐 배경 이미지 + 글래스 네온 점수 카드 + 정교한 타이포.

## Git
- Branch: `main`
- Commit: `9ca0d00d`

## Changed files
- `frontend/src/utils/fortuneShareCard.ts`
- `frontend/public/assets/share/fortune-share-bg.png`

## Test focus
1. 홈/상세 → 공유 카드 만들기
2. 배경·헤드라인·점수·한마디·푸터 가독성
3. 모바일 저장/공유 후 스토리 비율 확인

## Fast checks
```powershell
Test-Path frontend/public/assets/share/fortune-share-bg.png
rg -n "fortune-share-bg|drawImageCover" frontend/src/utils/fortuneShareCard.ts
```
