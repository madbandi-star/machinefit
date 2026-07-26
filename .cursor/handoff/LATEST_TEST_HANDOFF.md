# Latest test handoff — My Page Lab submenu moves

**Branch:** `main`  
**Scope:** 실험실 섹션으로 7개 서브메뉴 이동

## Change

**실험실** 섹션으로 이동 (순서):

1. 지금 누가 운동 중?
2. 나의 성장 하이라이트 릴
3. 운동 리포트 이메일 (접이식)
4. 성장 분석
5. 푸시 알림 보내기 (회원)
6. 온라인 PT (회원)
7. 내 PT 질문 (회원)

**제거 위치:** 바로가기, 개인설정(푸시), 더보기(온라인 PT)

**바로가기 잔여:** 업적, 리프터 DNA, 들어올린 무게

## Test focus

1. 실험실 섹션 항목·순서
2. 바로가기/개인설정/더보기에서 해당 링크 없음
3. 운동 리포트 이메일 펼치기·동작

## Fast checks

```bash
npm run build --prefix frontend
```

## Deploy

- Frontend: GitHub Pages (push to `main`)
