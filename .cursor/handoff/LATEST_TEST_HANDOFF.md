# Latest test handoff

> 프로그램테스트 에이전트: 이 파일 + `latest.json`을 먼저 읽으세요.  
> Agent URL: https://cursor.com/agents/bc-019f7d59-bc4b-7526-a842-4068cf31def4  
> Agent name: **프로그램테스트**

## Summary

기구별 **나만의 팁 메모장** 마무리 + 카드 접기/펴기.

## Layout (추천 결과)

1. 운동일지  
2. **나만의 팁 메모장** (기구별, 운동팁 바로 위)  
3. **저장하기** (일지+팁 함께 저장, 별도 팁 저장 버튼 없음)  
4. RecommendationTips (운동팁)

## Test focus

1. 팁 입력 후 저장하기 → 새로고침해도 유지  
2. 바이트 `n/500`  
3. 팁만 수정해도 북마크가 “변경 저장”  
4. 카드 접기/펴기  
5. typecheck + build

## After merge

- `npm run db:migrate` (029)
- Render 백엔드 재배포
