# Test handoff — Photo board & backup open to MEMBER

## Summary
Free-open: photo board and user backup are available to all logged-in members (`FREE_OPEN_MEMBER_FEATURES_MIN_ROLE = member`). Admin photo moderation unchanged. Other My Page “above member” links stay premium-gated.

## Test focus
1. Member login → Community → 사진게시판 visible and posts load (not 403)
2. My Page → 데이터 관리 visible; export/history works
3. Logged-out → those URLs redirect to login
4. Member still does **not** see lab / friends / gyms / push compose (still premium+)

## as-is → to-be
- as-is: `requireMinRole(PREMIUM_MEMBER)` blocked Polar-paid `member` role
- to-be: login-only gate; paid conversion later via constant + `requirePremium()`
