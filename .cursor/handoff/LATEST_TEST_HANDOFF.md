# Test handoff — Clear machine-request mock seeds

## Summary
관리자 기구요청용 mock 시드(`req-1` Hammer Strength Pullover, `req-2` Cybex VR3)와 투표 더미를 제거했습니다. 대시보드 `pendingRequests`는 DB `machine_requests` pending 카운트를 사용합니다.

## Git
- branch: `main`
- commit: (push 후 갱신)

## Changed files
- `backend/server/data/community.mock.ts`
- `backend/server/repositories/admin.repository.ts`

## Test focus
1. 관리자 기구요청에 샘플 2건(Downtown Fitness 등) 없음
2. 실사용자 요청만 보이거나 빈 목록
3. 대시보드 대기 요청 수 = DB pending

## Fast checks
```bash
rg -n "req-1|Pullover Machine|Downtown Fitness" backend/server/data/community.mock.ts
# no matches
rg -n "FROM machine_requests" backend/server/repositories/admin.repository.ts
```

## Note
**Render backend 재배포 필요.**

## as-is → to-be
- **as-is:** mock 2건 + 대시보드 mock 카운트
- **to-be:** mock 비움 + 대시보드 DB 카운트
