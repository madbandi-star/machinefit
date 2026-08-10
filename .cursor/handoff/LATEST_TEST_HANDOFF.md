# Test handoff — Fix withdrawn schedule sync

## Summary
관리자 **데이터 보존·삭제**의 **탈퇴 계정 스케줄 동기화**가 DB 타입 충돌(Postgres `42P08`)로 실패하던 문제를 수정했습니다. `subject_id`(varchar)와 `user_id`(uuid)에 같은 `$3`를 쓰지 않고 `$3::text` / `$4::uuid`로 분리했습니다.

## Git
- branch: `main`
- commit: (push 후 갱신)

## Changed files
- `backend/server/repositories/data-retention.repository.ts`

## Test focus
1. 관리자 > 데이터 보존·삭제 > **탈퇴 계정 스케줄 동기화** 클릭 → 성공 토스트 (`n`건 반영)
2. 요약 KPI / 삭제 예정 목록에 탈퇴 계정 스케줄이 보이는지

## Fast checks
```bash
rg -n "\$3::text,\$4::uuid" backend/server/repositories/data-retention.repository.ts
```

## Production checks
- **Render backend redeploy 필요** (backend-only 변경)
- 배포 후 동일 버튼으로 재확인

## as-is → to-be
- **as-is:** 버튼 클릭 시 "처리하지 못했어요…" 일반 오류
- **to-be:** 동기화 성공 + upsert 건수 토스트
