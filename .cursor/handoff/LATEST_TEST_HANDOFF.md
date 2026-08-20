# Test handoff — Fix favorites bulk select-delete

## Summary
즐겨찾기 페이지 `[선택 삭제]`가 동작하지 않던 문제를 수정했습니다.

- API: `DELETE /favorites/bulk` (body) → `POST /favorites/bulk-delete` (body `{ ids }`). DELETE-with-body는 프록시/클라이언트에서 body가 비는 경우가 많음.
- FE: POST 호출, 백엔드 미배포(404) 시 단건 `DELETE /favorites/:id` 폴백.
- `useHomeBootstrap` useEffect가 stale bootstrap으로 favorites 캐시를 다시 덮어쓰지 않도록 제거.

## Test focus
1. 홈 → 즐겨찾기 전체보기
2. 체크박스로 1개 이상 선택 → **선택 삭제** → confirm
3. 목록에서 즉시/새로고침 후에도 사라짐
4. 홈으로 돌아가도 삭제 항목이 다시 나타나지 않음
5. (선택) ♥ 단건 제거도 정상

## Fast checks
```
rg -n "bulk-delete" backend/server/routes/favorite.routes.ts frontend/src/api/index.ts
rg -n "Do not re-seed favorites" frontend/src/hooks/useHomeBootstrap.ts
```

## As-is → To-be
- **as-is**: 선택 삭제해도 항목이 남음 (또는 잠깐 사라졌다가 복구)
- **to-be**: 선택 삭제 후 서버·캐시에서 제거 유지

## Deploy note
`backend/` 변경 → **Render 백엔드 재배포 필요**. FE만 먼저 나가도 404 폴백(단건 DELETE)으로 동작함.
