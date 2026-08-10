# Test handoff — Admin delete on machine-request board

## Summary
기구요청 게시판 상세에서 **admin**도 게시글을 삭제할 수 있게 UI를 맞춤 (자유/사진 게시판과 동일 권한 의도). 백엔드 `deleteMachineRequest`는 이미 admin soft-hide를 지원.

## Git
- branch: `main`
- commit: (push 후 갱신)

## Changed files
- `frontend/src/pages/machine-request-board/MachineRequestDetailPage.tsx`

## Test focus
1. admin으로 타인 기구요청 상세 → **삭제** 버튼 보임
2. 확인 후 삭제 → 목록 복귀, 해당 글 비노출
3. 작성자 본인 → 수정+삭제 유지 / 비관리자 타인 글 → 삭제 없음

## Fast checks
```bash
rg -n "isMine || isAdmin|hasMinRole\(user\?\.roleCode, Role.ADMIN\)" frontend/src/pages/machine-request-board/MachineRequestDetailPage.tsx
```

## as-is → to-be
- **as-is:** `isMine`만 삭제 가능
- **to-be:** `isMine || isAdmin` 삭제 가능
