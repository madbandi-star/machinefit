# Latest test handoff — Friends menu simplification

**Branch:** `main`

## Change

- **개인설정:** 친구 목록 → **친구관리** (`/my-page/friends`)
- **제거:** 친구 관리 섹션 전체 (받은/보낸 요청, 차단, 공개 설정, 피드, 랭킹, 초대)

## Test focus

1. 개인설정에 **친구관리**만 표시 (회원)
2. 마이페이지에 친구 관리 섹션 없음
3. 친구관리 링크 동작

## Fast checks

```bash
npm run build --prefix frontend
```
