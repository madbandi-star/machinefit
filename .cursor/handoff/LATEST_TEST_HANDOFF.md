# Latest test handoff

## Summary

화면 데이터 로딩 성능: History N+1 → 배치 API, workout-logs limit, 홈 캐시, Growth 기간 스코프, 인덱스 031, boot health ping.

## Test focus

1. 홈 재진입 캐시(60초)
2. 기록: history 먼저 표시
3. prefs/feedback 배치 2요청
4. 마이그레이션 031
5. typecheck

## After merge

- GitHub Pages 자동
- **Render Manual Deploy + DB migration 031 적용 필요**
- Render Free 콜드스타트는 ping으로만 완화 (완전 해결은 유료 플랜)
