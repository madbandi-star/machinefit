# Test handoff — Member ID remaining count beside Change button

## Summary
My Page member ID remaining text sits immediately to the right of the Change button instead of wrapping onto its own line.

## Git
- Branch: `main`
- Commit: `637bb995`

## Test focus
1. My Page profile row: `아이디값` → `[변경]` → `아이디 변경 n/n회 남음` on one line (wraps only if screen is very narrow).

## Fast checks
```bash
rg -n "member-id-remaining|changeMemberId" frontend/src/components/my-page/MemberIdEditor/MemberIdEditor.tsx frontend/src/styles/components.css
```

## Deploy
Frontend Pages only.
