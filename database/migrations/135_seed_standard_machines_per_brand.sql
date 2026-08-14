-- Seed each OEM brand with all active standard machine types as brand machines.
-- Excludes FREE_WEIGHT and BODYWEIGHT.
-- Idempotent: skips when (brand_id, standard_type_id) already linked, or code exists.
-- Does not invent manufacturer SKUs — display name = brand + standard type name.

INSERT INTO machines (
  brand_id,
  code,
  name,
  muscle_group,
  machine_type,
  description,
  standard_type_id,
  sort_order,
  is_active,
  has_seat,
  has_back_pad,
  has_foot_plate,
  has_handle
)
SELECT
  b.id AS brand_id,
  LEFT(b.code || '_' || regexp_replace(t.code, '^STD_', ''), 80) AS code,
  jsonb_strip_nulls(
    jsonb_build_object(
      'ko',
      trim(
        BOTH
        FROM concat_ws(
          ' ',
          NULLIF(trim(COALESCE(b.name->>'ko', '')), ''),
          NULLIF(trim(COALESCE(t.name->>'ko', '')), '')
        )
      ),
      'en',
      trim(
        BOTH
        FROM concat_ws(
          ' ',
          NULLIF(trim(COALESCE(b.name->>'en', b.code)), ''),
          NULLIF(trim(COALESCE(t.name->>'en', t.code)), '')
        )
      ),
      'ja',
      NULLIF(
        trim(
          BOTH
          FROM concat_ws(
            ' ',
            NULLIF(trim(COALESCE(b.name->>'ja', '')), ''),
            NULLIF(trim(COALESCE(t.name->>'ja', '')), '')
          )
        ),
        ''
      ),
      'zh',
      NULLIF(
        trim(
          BOTH
          FROM concat_ws(
            ' ',
            NULLIF(trim(COALESCE(b.name->>'zh', '')), ''),
            NULLIF(trim(COALESCE(t.name->>'zh', '')), '')
          )
        ),
        ''
      )
    )
  ) AS name,
  t.primary_muscle_group AS muscle_group,
  CASE
    WHEN t.code = 'STD_SMITH_MACHINE' THEN 'smith'
    WHEN t.code IN (
      'STD_CABLE_CROSSOVER',
      'STD_DUAL_ADJUSTABLE_PULLEY',
      'STD_MULTI_JUNGLE_GYM'
    ) THEN 'cable'
    WHEN t.code IN ('STD_POWER_RACK', 'STD_HALF_RACK') THEN 'free_weight'
    WHEN t.code LIKE '%PLATE_LOADED%' THEN 'plate_loaded'
    ELSE 'selectorized'
  END AS machine_type,
  t.description AS description,
  t.id AS standard_type_id,
  t.sort_order AS sort_order,
  TRUE AS is_active,
  TRUE AS has_seat,
  FALSE AS has_back_pad,
  FALSE AS has_foot_plate,
  TRUE AS has_handle
FROM brands b
CROSS JOIN standard_machine_types t
WHERE b.is_active = TRUE
  AND t.is_active = TRUE
  AND b.code NOT IN ('FREE_WEIGHT', 'BODYWEIGHT')
  AND NOT EXISTS (
    SELECT 1
    FROM machines m
    WHERE m.brand_id = b.id
      AND m.standard_type_id = t.id
  )
ON CONFLICT (code) DO NOTHING;

COMMENT ON TABLE machines IS
  'Brand machines. Foundation OEM brands are seeded with standard-type catalog rows (excl. FREE_WEIGHT/BODYWEIGHT).';
