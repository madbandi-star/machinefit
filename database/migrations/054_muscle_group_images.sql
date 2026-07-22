-- Muscle group representative images (admin-managed). One image per muscle group.

CREATE TABLE IF NOT EXISTS muscle_group_images (
  muscle_group TEXT PRIMARY KEY
    CHECK (muscle_group IN (
      'back', 'chest', 'shoulders', 'legs',
      'biceps', 'triceps', 'arms', 'core'
    )),
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  storage_path TEXT,
  thumbnail_storage_path TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER,
  width INTEGER,
  height INTEGER,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_muscle_group_images_updated_at
  ON muscle_group_images (updated_at DESC);
