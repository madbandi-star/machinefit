# Test handoff — User cancel privacy rights requests

## Summary
개인정보 권리센터에서 정정/삭제(접수·확인중)·처리정지(적용완료) 요청을 사용자가 직접 취소. 처리정지 취소 시 선택적 처리 정지도 해제. DB status `cancelled` 추가(migration 127).

## Test focus
1. 정정/삭제 접수 후 「요청 취소」→ 상태 취소됨
2. 처리정지 후 취소 → 배너/정지 해제
3. 완료·반려된 정정/삭제는 취소 버튼 없음
4. 관리자 목록에 취소됨 필터/상태 표시

## Fast checks
```
rg -n "cancelRightsRequest|cancelled|PRIVACY_RIGHTS_USER_CANCELLABLE" frontend/src backend/server shared/src database/migrations/127_privacy_rights_cancelled_status.sql
```

## Deploy note
- migration `127_privacy_rights_cancelled_status.sql` 적용
- Render BE + Pages FE
