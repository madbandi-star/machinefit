# Test handoff — Author role emoji badges

## Summary
게시글·댓글·대댓글 작성자 이름 옆에 권한 등급을 **이모지만** 표시합니다 (텍스트 등급명 없음).

매핑: 🧑‍🌾 게스트 · ⚔️ 회원 · 🔱 프리미엄 · 👑 VIP · 🧙 트레이너 · 🏰 오너 · 🔮 관리자

## Git
- branch: `main`
- commit: `c948eb0d`

## Changed surfaces
- Free board list/detail + comments/replies
- Photo board list/detail + comments/replies
- Machine request list/detail + comments
- Machine showcase detail + comments
- Template share hub/detail + comments

## Fast checks
- `shared/src/constants/roles.ts` has `ROLE_EMOJI`
- `frontend/src/components/common/AuthorWithRole.tsx` uses `getRoleEmoji`
- types expose `authorRoleCode`

## As-is → To-be
- **As-is:** 작성자 이름만 표시
- **To-be:** `⚔️ Alice` 형태로 이모지 + 이름만 (등급 텍스트 없음)

## Deploy
- Frontend Pages: success — https://github.com/madbandi-star/machinefit/actions/runs/32490596614
- Backend Render: success — https://github.com/madbandi-star/machinefit/actions/runs/32490596179
