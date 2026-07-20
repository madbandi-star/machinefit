# Latest test handoff

> 프로그램테스트 에이전트: 이 파일 + `latest.json`을 먼저 읽으세요.  
> Agent URL: https://cursor.com/agents/bc-019f7d59-bc4b-7526-a842-4068cf31def4  
> Agent name: **프로그램테스트**

## Summary

세트 사이 **음성 카운트** 추가: `띠띠띠 → 5 4 3 2 1 → 시작! → 하나 둘 …` + 선택 **하나더(원모어)**.

## as-is → to-be

- **as-is:** 휴식 타이머만 있고 음성 안내 없음
- **to-be:** 트레이너 페이스 음성 카운트 + 원모어 옵션 + 휴식 후 자동 시작

## Test focus

1. 운동 기록 패널에 **음성 카운트** UI
2. **카운트 시작** → 비프 → 카운트다운 → 시작 → 한글 횟수
3. **하나더** 켜면 목표 횟수 후 `하나더!` 반복 (중지 버튼으로 종료)
4. **휴식 후 자동 시작** 옵션
5. 설정 페이지에서 기본값 저장
6. `npm run typecheck` / `npm run build:frontend`

## Fast checks

```bash
npm run test:smoke:changed
```

## Notes

- 모바일: 세트 완료 또는 시작 버튼을 한 번 눌러야 브라우저 오디오가 잠금 해제됩니다.
