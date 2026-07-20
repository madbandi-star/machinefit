# Catalog field reference

## Brand (`brands/*.json`)

| Field | Type | Notes |
|-------|------|--------|
| code | string | Unique, UPPER_SNAKE |
| slug | string | Folder/file slug (`hammer_strength`) |
| name.ko / name.en | string | Required display names |
| name.ja / name.zh | string | Optional |
| description.ko / description.en | string | Short brand intro |
| websiteUrl | string? | Official site |
| logoFile | string | Relative under `public/assets/brands/` |

## Machine (`machines/{brand_slug}.json` → `machines[]`)

| Field | Type | Notes |
|-------|------|--------|
| code | string | Unique machine code |
| name.ko / name.en | string | Required |
| muscleGroup | string | chest, back, legs, shoulders, arms, core, full_body |
| machineType | string | plate_loaded, selectorized, cable, … |
| hasSeat / hasBackPad / hasFootPlate / hasHandle | boolean | Setting flags |
| romType | string? | fixed, variable, 최대 |
| description | localized string | Short intro |
| howTo | localized string[] | Usage steps (≥10 preferred) |
| warnings | localized string[] | Cautions (≥10) |
| tips | localized string[] | Form tips (≥10) |
| beginnerTips | localized string[] | Beginner tips (≥10) |
| intermediateTips | localized string[] | Intermediate tips (future UI; optional for now) |
| advancedTips | localized string[] | Advanced tips (future UI; optional for now) |
| proTips | localized string[] | Pro tips (future UI; optional for now) |
| recommendedExperience | beginner \| intermediate \| advanced | |
| imageFile | string | Relative under `public/assets/machines/{slug}/` |
| thumbnailFile | string? | Defaults to imageFile |
