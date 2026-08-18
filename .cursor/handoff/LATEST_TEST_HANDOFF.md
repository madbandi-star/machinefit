# Test handoff — 타이머·머신도감 POWER 적립

## Summary
타이머 세션 저장(1분 이상)과 머신도감 핵심 활동(자랑 작성, 보유 등록, 신규 발견)에도 헬창력 POWER가 적립됩니다.

## Test focus
1. 홈 타이머를 **1분 이상** 쓰고 종료 → 세션 저장 후 마이페이지 포인트에 `타이머 세션 완료` +15 (하루 최대 8회)
2. 1분 미만 타이머 종료 → POWER 없음
3. 머신도감 자랑 글 작성 → `머신도감 자랑 작성` +20
4. 처음 보는 머신이면 추가로 `머신도감 신규 발견` +25
5. 「우리 짐에도 있음」 신규 등록 → `머신도감 보유 등록` +10 (이미 있으면 없음)

## Fast checks
- `npx tsx shared/src/constants/points.test.ts`
- `Select-String -Path shared/src/constants/points.ts,backend/server/services/timer-history.service.ts,backend/server/services/machine-showcase.service.ts -Pattern "timer_session_complete|showcase_post|showcase_claim|machine_dex_discover"`

## Production checks
- **Render 재배포 + `npm run db:migrate` (148) 이후**에만 실제 적립됨
- 마이페이지 → 내 헬창력 내역에서 위 항목 확인

## As-is → To-be
- as-is: POWER는 운동 기록/세트 완료·커뮤니티 등만 적립
- to-be: 타이머 세션(1분+)·머신도감 자랑/보유/첫 발견도 적립

**Branch:** `main`  
**Commit:** `33fec92e`
