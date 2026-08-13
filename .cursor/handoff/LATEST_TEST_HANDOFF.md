# Test handoff — Power Box (파워박스)

## Summary
마이페이지 **내 헬창력** 우측에 🎁 파워박스 추가.  
서버에서 1~100 랜덤 Power를 **서울 기준 하루 1회** 지급 (points ledger 재사용).

## Git
- branch: `main`
- commit: `50c69335`

## Migration
`129_power_box_daily_claim.sql` — policy `power_box_claim` + unique `(user_id, reference_id)` for daily claim  
**Render DB 적용 필수**

## APIs
- `GET /points/power-box`
- `POST /points/power-box/claim`

## Test focus
1. 첫 클릭 → 1~100 지급, 총량 증가, +N 애니메이션
2. 같은 날 재클릭/더블클릭/새로고침 → 미지급
3. 비활성 + 「오늘의 POWER는 이미 획득했습니다」+ 남은 시간
4. 기존 헬창력/내역 정상

## Fast checks
```
rg -n "power_box_claim|claimPowerBox|PowerBox" backend/server frontend/src shared/src
```

## Production
**Pages FE + Render BE + migration 129**

## As-is → To-be
- **As-is:** 파워박스 없음
- **To-be:** 하루 1회 랜덤 Power 상자
