# Latest test handoff — favorites empty page

**Branch:** `main`  
**Scope:** frontend

## Change

When favorites API returns **0 items**, navigate to **`/favorites/empty`**:

- Title: 즐겨찾기가 0건입니다
- Description + **기구 검색** button (→ `/machines`)
- Triggers: home favorites card, records favorites tab, `/favorites` entry
- If user later has favorites, empty page redirects to records list

## Test focus

1. Logged-in user with 0 favorites → tap home favorites prompt → empty page + search button
2. Records → 즐겨찾기 tab → same empty page (not inline empty state)
3. `/favorites` with items → records favorites list
4. Search button opens machine search

## Fast checks

```bash
npm run build --prefix frontend
```

## Deploy

- Frontend: GitHub Pages (push to `main`)
- Backend: not needed
