# Test handoff — Records tools button color

## Summary
Records toolbar tools (settings) button mismatched calendar/sort due to a sheet CSS override. Override removed so shared `records.css` styles apply.

## Git
- Branch: `main`
- Commit: `d8e51a92`

## Test focus
1. Calendar / tools / sort default + hover colors match
2. Tools menu open state uses primary tone

## As-is → To-be
- **As-is:** Tools alone used surface/border tones
- **To-be:** Same glass + primary as calendar/sort
