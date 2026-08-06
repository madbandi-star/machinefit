# MachineFit equipment catalog

Extensible brand + machine catalog for Supabase/PostgreSQL import.

## Layout

```
catalog/
  brands/           # one JSON file per brand (add a file to add a brand)
  machines/         # one JSON file per brand code (machines for that brand)
  schema.md         # field reference
```

## Add a future brand (e.g. Matrix)

1. Create `brands/matrix.json`
2. Create `machines/matrix.json` with that brand’s machines
3. Add logo SVG under `frontend/public/assets/brands/matrix.svg`
4. Add machine SVGs under `frontend/public/assets/machines/matrix/`
5. Run `node database/scripts/build-catalog.mjs`
6. Apply generated SQL seed / migration output

No business-logic changes required — data + image URLs only.

## Image URL convention

Public base (GitHub Pages): `/machinefit/assets/...`

- Brand: `/machinefit/assets/brands/{slug}.svg`
- Machine: `/machinefit/assets/machines/{brand_slug}/{machine_code_lower}.svg`
- Placeholder: `/machinefit/assets/machines/placeholder.svg`

## Build

```bash
node database/scripts/build-catalog.mjs
```

Writes:

- `database/seeds/catalog_brands.sql`
- `database/seeds/catalog_machines.sql`
- `database/seeds/catalog_machine_images.sql`
- `database/seeds/catalog_machine_settings.sql`
- SVG assets under `frontend/public/assets/`
