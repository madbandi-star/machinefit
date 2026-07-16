-- Seed AI model registry (inactive until vision feature ships)
INSERT INTO ai_models (code, name, model_type, version, provider, is_active) VALUES
  ('machine-vision-v1', 'Machine Vision Classifier', 'vision', '1.0.0', 'internal', false),
  ('machine-embedding-v1', 'Machine Image Embeddings', 'embedding', '1.0.0', 'internal', false)
ON CONFLICT (code) DO NOTHING;

-- Seed global QR codes for existing machines (deep link paths use machineCode)
INSERT INTO machine_qr_codes (machine_id, qr_code, deep_link_path, label)
SELECT m.id,
       'MF-' || m.code,
       '/machines/' || m.code,
       jsonb_build_object('en', m.name->>'en', 'ko', m.name->>'ko')
FROM machines m
ON CONFLICT (qr_code) DO NOTHING;

-- Seed machine aliases from localized names (for search / AI matching)
INSERT INTO machine_aliases (machine_id, alias, alias_type, language_code, source)
SELECT m.id, m.name->>'en', 'search', 'en', 'seed'
FROM machines m
WHERE m.name->>'en' IS NOT NULL
ON CONFLICT (machine_id, alias, alias_type) DO NOTHING;

INSERT INTO machine_aliases (machine_id, alias, alias_type, language_code, source)
SELECT m.id, m.name->>'ko', 'search', 'ko', 'seed'
FROM machines m
WHERE m.name->>'ko' IS NOT NULL
ON CONFLICT (machine_id, alias, alias_type) DO NOTHING;
