# Test handoff — Community bottom banner on board lists

## Summary
`COMMUNITY_BOTTOM` was only on `/community` hub; users enter boards from My Page and never saw it. Banner now on free/notices/templates/photo/requests lists. Migration **143** enables admin CMS preview.

## Git
- Branch: `main`
- Commit: pending

## Ops
- Apply `database/migrations/143_cms_banner_admin_preview.sql` on Supabase.

## Test focus
1. My Page → 자유 게시판 → scroll → banner.
2. Other community boards same.
3. Marketing opt-in still required for non-admin free users.

## Fast checks
```bash
rg -n "CommunityBottomBanner" frontend/src/pages
```

## as-is → to-be
- **as-is:** Banner only on unused hub.
- **to-be:** Banner on board lists users actually open.
