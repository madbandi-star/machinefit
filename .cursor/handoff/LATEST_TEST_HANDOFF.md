# Latest test handoff — Push friend send fix

**Branch:** `main`

## Change

회원→친구 푸시 발송 실패 수정 (demo_test17 → demo_test99a 등).

- `member_exact`: 수신자 **member 등급만** 허용 제거 → 연결된 친구면 역할 무관
- 수신자 조회: 닉네임 + **이메일 + 아이디(@ 앞)** 매칭
- 친구 푸시(`member_exact`)는 **마케팅 opt-in** 필터 제외
- 회원 발송 UI: **친구 목록 라디오 선택** + 구체적 오류 메시지

## Test focus

1. demo_test17(모바일) → demo_test99a(PC) 친구 푸시 성공
2. 역방향도 동일
3. 친구 목록에서 선택 / 아이디 입력 모두 동작
4. 비친구·미존재 시 명확한 토스트

## Fast checks

```bash
cd backend && npx tsx server/services/push-audience.service.test.ts
npm run build --prefix frontend
```

**Backend Render redeploy 필요** (`backend/` 변경)
