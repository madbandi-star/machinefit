# Test handoff: Today’s Helchang Fortune v1

## Summary
오늘의 헬창운세 v1: 생년월일/탄생시(모름=간단 운세), seed 기반 Fortune + 운동 데이터 분석 + 추천 3계층, 홈 카드/상세, 관리자 콘텐츠 CRUD. **Render 마이그레이션 105 필수.**

## Git
- Branch: `main`
- Commit: `PENDING`

## Test focus
1. 설정 → 생년월일 + 탄생시(또는 모름) 저장 → 홈 카드 노출
2. 같은 날 새로고침 → 동일 결과
3. 상세: 「오늘의 운세」와 「내 운동 데이터 분석」 분리
4. `/admin/fortune` 콘텐츠 추가/수정/비활성
5. 생년 미입력 → 설정 `#birth-profile` CTA
6. API 오류 시 카드가 앱 전체를 깨지 않음

## Fast checks
```bash
rg -n "fortune/today|fortune_content_items|buildFortuneSeedKey|HomeFortuneCard" database/migrations/105_user_birth_and_fortune_content.sql backend/server/routes/fortune.routes.ts shared/src/utils/fortune-seed.ts frontend/src/components/home/HomeFortuneCard/HomeFortuneCard.tsx
cd shared && npx vitest run src/utils/fortune-seed.test.ts
```

## Notes
- **Render backend redeploy + migration 105 required**
- Birth not required at signup
- Entertainment disclaimer on fortune UI

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 헬창운세 없음 | 일일 운세+데이터분석+관리자 카탈로그 |
