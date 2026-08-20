# Test handoff: Strip PRO tip `---` separators

## Summary
Display + source cleanup for markdown `---` lines in PRO tips.

## Test focus
1. Open PRO tip on records/result → no `---` lines
2. Sections still separated by blank lines

## Note
Migration `184_strip_pro_tips_horizontal_rules.sql` must run on production DB.
