# Latest test handoff

> 프로그램테스트 에이전트: 이 파일 + `latest.json`을 먼저 읽으세요.  
> Agent URL: https://cursor.com/agents/bc-019f7d59-bc4b-7526-a842-4068cf31def4  
> Agent name: **프로그램테스트**

## Summary

운동기록 카드·추천 결과·기구 상세 최근 추천 카드에 **접기/펴기** 추가. 기구별 **나만의 팁 메모장**은 운동팁 위에 표시되며 기존 **저장하기**와 함께 저장.

## as-is → to-be

- **as-is:** 카드 섹션 항상 펼침, 기구별 개인 팁 저장 없음
- **to-be:** 카드 접기/펴기, `personal_tip_memo` DB 저장

## Test focus

1. History record cards — 헤더 chevron 접기/펴기
2. Recommendation result — 본문 카드 접기
3. Machine detail — 최근 추천 카드 접기
4. Personal tip — 저장하기로 함께 저장
5. typecheck + build

## Fast checks

```bash
npm run test:smoke:changed
```

## After merge

- `npm run db:migrate` (029, 028 미적용 시)
- Render 백엔드 재배포
