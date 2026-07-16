INSERT INTO languages (code, name, native_name) VALUES
  ('ko', 'Korean', '한국어'),
  ('en', 'English', 'English'),
  ('ja', 'Japanese', '日本語'),
  ('zh', 'Chinese', '中文')
ON CONFLICT (code) DO NOTHING;
