# Latest test handoff — Friends hub grid nav

**Branch:** `main`

## Change

친구 관리 UI: 가로 스크롤 탭 → **그룹 그리드 메뉴**

- **친구:** 목록 · 추가 · 받은 요청 · 보낸 요청
- **활동:** Feed · 랭킹 · 초대
- **설정:** 차단 · 공개

PageShell 제목, 짧은 라벨(`navShort`), 패널 중복 제목 제거.

## Test focus

1. 9개 메뉴 한 화면에 (가로 스크롤 없음)
2. 탭 전환·활성 표시
3. 각 섹션 콘텐츠 정상

## Fast checks

```bash
npm run build --prefix frontend
```
