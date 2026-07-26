# Latest test handoff — My Page Lab section level

**Branch:** `main`  
**Scope:** 실험실 메뉴를 개인설정·친구 관리와 동일한 섹션 레벨로 정리

## Change

- **실험실** 섹션에 `my-page-section__title` 추가 (개인설정, 친구 관리와 동일 패턴)
- 위치: **친구 관리** 다음, **더보기** 이전
- 기존 더보기 아래 단독 nav 블록 제거

## Test focus

1. 마이페이지에서 **실험실**이 섹션 제목과 함께 표시되는지
2. 순서: 개인설정 → (회원) 친구 관리 → **실험실** → 더보기
3. 실험실 링크 → `/my-page/lab` 정상 이동

## Fast checks

```bash
npm run build --prefix frontend
```

## Deploy

- Frontend: GitHub Pages (push to `main`)
