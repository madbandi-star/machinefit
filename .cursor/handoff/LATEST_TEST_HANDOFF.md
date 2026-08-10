# Test handoff — Hide photo board for member

## Summary
`member` 등급에서는 사진게시판 메뉴/진입 숨김. `premium_member` 이상만 접근.

## Git
- branch: `main`
- commit: PENDING

## Changed files
- `frontend/src/pages/my-page/MyPage.tsx`
- `frontend/src/pages/community/CommunityPage.tsx`
- `frontend/src/routes/index.tsx`
- `backend/server/routes/photo-board.routes.ts`

## Test focus
1. member → 마이페이지/커뮤니티에 사진게시판 없음
2. member가 `/community/photo` 직접 진입 → 홈으로
3. premium_member+ → 정상 이용
4. 관리자 사진게시판 모더레이션 유지

## Fast checks
```bash
rg -n "PHOTO_BOARD|PREMIUM_MEMBER|showAboveMember|showPhotoBoard" frontend/src/pages/my-page/MyPage.tsx frontend/src/pages/community/CommunityPage.tsx frontend/src/routes/index.tsx backend/server/routes/photo-board.routes.ts
```

## as-is → to-be
- **as-is:** member도 사진게시판 노출
- **to-be:** member 숨김/차단, premium+만
