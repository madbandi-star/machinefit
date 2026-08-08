# Test handoff: Show photo board on My Page for member

## Summary
마이페이지 「둘러보기」의 사진게시판 링크가 `premium_member` 이상만 보이던 제한을 제거하고, `member`도 자유게시판처럼 보이도록 했습니다.

## Git
- Branch: `main`
- Commit: `PENDING`

## Test focus
1. member 계정 → 마이페이지 → 사진게시판 링크 표시
2. 링크 진입 `/community/photo` 정상
3. premium 이상도 기존처럼 표시

## Fast checks
```bash
rg -n "PHOTO_BOARD|showAboveMember" frontend/src/pages/my-page/MyPage.tsx
```
(기대: PHOTO_BOARD ListNavLink가 showAboveMember 밖에 있음)

## Notes
- FE Pages only.

## as-is → to-be
| as-is | to-be |
|-------|--------|
| member 마이페이지에 사진게시판 없음 | member도 사진게시판 링크 표시 |
