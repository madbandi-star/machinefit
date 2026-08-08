# Test handoff: Fix birth date reset + fortune entry points

## Summary
생년월일 저장 후 입력칸이 비워지던 문제(pg DATE → 잘못된 문자열)를 수정했고, 오늘의 헬창운세를 홈 카드 외에 마이페이지 인사이트에도 링크했습니다.

## Git
- Branch: `main`
- Commit: `PENDING`

## Test focus
1. 설정 → 생년월일·탄생시 저장 → 값 유지 / 새로고침 후에도 유지
2. 홈 상단 「오늘의 헬창운세」 카드
3. 마이페이지 → 머신핏 인사이트 → 오늘의 헬창운세

## Fast checks
```bash
rg -n "normalizeBirthDate|FORTUNE_TODAY" backend/server/repositories/user.repository.ts frontend/src/pages/my-page/MyPage.tsx
```

## Notes
- **Render backend redeploy** needed for DATE normalize fix.
- 탄생시 또는 「탄생시 모름」도 저장해야 운세가 활성화됩니다.

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 생년월일 저장 후 초기화 | 저장값 유지 |
| 운세 위치 불명확 | 홈 + 마이페이지에서 진입 |
