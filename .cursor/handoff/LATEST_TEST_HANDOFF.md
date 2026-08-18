# Test handoff — 사진올리기 태그 칩 UX

## Summary
사진올리기 작성 페이지 태그를 기구 공유하기와 같은 칩 입력으로 맞췄습니다. 백엔드 한도(최대 10개)와 API는 그대로입니다.

## Test focus
1. 작성: 태그 입력 후 Enter 또는 쉼표 → 칩 생성. 폼 전체가 제출되면 안 됨.
2. 칩 탭 → 해당 태그 삭제.
3. 입력이 비어 있을 때 Backspace → 마지막 칩 삭제.
4. `#`/`쉼표`로 여러 태그 한 번에 추가.
5. 제출 시 입력 칸에 남은 초안 태그도 저장됨.
6. 수정(`?edit=`): 기존 태그가 칩으로 로드됨.
7. 최대 10개에서 입력이 사라짐 (기구 공유하기는 8개).

## Fast checks
`npm run test:smoke:changed`

## As-is → To-be
- as-is: 한 줄 텍스트 필드 (`workout legday`)
- to-be: 칩 + 인라인 입력, 탭해서 삭제, 최대 10개

**Branch:** `main`  
**Commit:** c67ce93b
