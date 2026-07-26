# Latest test handoff — Community board compact list UI

**Branch:** `main`

## Change

기구요청·자유 게시판 목록 UI를 **컴팩트 인덱스 스타일**로 개선.

- 카드형(제목+본문 미리보기) → **한 줄 제목 + 날짜/댓글/상태** 행
- 행 높이 ~34px → 스마트폰에서 **8개 이상** 제목 동시 노출
- 공통 `BoardIndexPanel`, `BoardIndexSkeleton`, `BoardRequestRow` 추가
- 페이지 헤더·뒤로가기 버튼도 컴팩트화

## Test focus

1. `/community/free`, `/community/machine-requests` — 8개+ 제목 한 화면
2. 자유 게시판: 행 탭 → 상세 이동, 댓글 수·날짜 표시
3. 기구요청: 기구명 한 줄, 상태 배지·날짜
4. 글쓰기/요청하기 폼·관리자 삭제 동작

## Fast checks

```bash
npm run build --prefix frontend
```
