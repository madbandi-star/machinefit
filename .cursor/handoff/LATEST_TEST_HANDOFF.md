# Latest test handoff — Easy mode UI + photo board + push compose

**Branch:** `main`

## Change

### Easy mode (primary)
- **Home:** MachineFit logo only; remove menu/title; switch-to-normal below start CTA
- **Step 1:** Remove camera/QR; intro card with gym pill; full-width find machine
- **Step 2:** Settings/tips `<details>` open by default; remove fit-later hint
- **Step 3:** Card-based set logging with progress bar and done toggles
- **Rate:** One-tap “잘 맞아요”; card choices; adjust panel for bad fit
- **Done:** Celebration hero; card actions; remove stats footnote; **오늘 운동 끝내기** → `/records?tab=history&date=today`

### Also in this commit
- Photo board: unified filter panel, title/author/stats on cards
- Push compose: 3-step layout with live preview

## Test focus

1. `/easy` → start workout → full flow through rate → done
2. Done → **오늘 운동 끝내기** opens records on today’s history tab
3. `/photo-board` — filters, card info, write button
4. Push compose UI (if accessible)

## Fast checks

```bash
npm run build --prefix frontend
npm run test:smoke:changed
```

## as-is → to-be

| Area | As-is | To-be |
|------|-------|-------|
| Easy mode | Cluttered wizard/log/rate/done | Card UI, one-tap rating, records exit |
| Photo board | Overlay-only thumbnails | Scannable cards with title/stats |
| Push | Flat form | 3-step compose + preview |
