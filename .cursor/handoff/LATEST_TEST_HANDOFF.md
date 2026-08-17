# Test handoff — Banner SPA cache fix

## Summary
화면 이동 후 배너가 F5 전까지 안 나오던 문제: `AdSlot`이 인증 복원 전에 decide하고 빈 결과를 캐시. `authReady` 대기 + viewerId 키 + 로그인 시 ads 캐시 제거.

## Test focus
1. 로그인 후 홈 ↔ 기록 ↔ 마이 ↔ 커뮤니티 이동 시 배너 즉시 표시
2. 새로고침 없이도 동일
3. 관리자 배너 저장 후 공개 화면에 반영

## As-is → To-be
- as-is: SPA 이동 시 배너 공백, F5 후 표시
- to-be: 인증 준비 후 decide, 이동 시에도 표시

**Commit:** pending
