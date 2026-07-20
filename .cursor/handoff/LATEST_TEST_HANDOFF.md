# Latest test handoff

> 프로그램테스트 에이전트: 이 파일 + `latest.json`을 먼저 읽으세요.  
> Agent URL: https://cursor.com/agents/bc-019f7d59-bc4b-7526-a842-4068cf31def4  
> Agent name: **프로그램테스트**

## Summary

기록 카드에서 **추천 중량** 오른쪽에 **추천 횟수** (예: `8–12회`) 표시.

## Test focus

1. 최근 기록 / 추천 결과 설정 그리드: 중량 다음 칸이 추천 횟수
2. 목표별 범위: 근비대 8–12, 근력 3–6 등
3. 예전 기록(DB에 reps 없음)도 프로필 목표로 fallback 표시
4. typecheck + build

## After merge

- GitHub Pages 자동 배포
- Render Manual Deploy (backend)
