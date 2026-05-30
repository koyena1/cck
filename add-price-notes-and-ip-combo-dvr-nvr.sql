-- Add price_note to all category tables and DVR/NVR to combo tables

ALTER TABLE hd_combo_products
  ADD COLUMN IF NOT EXISTS dvr BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS nvr BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS price_note TEXT;

ALTER TABLE ip_combo_products
  ADD COLUMN IF NOT EXISTS dvr BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS nvr BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS price_note TEXT;

ALTER TABLE wifi_camera_products
  ADD COLUMN IF NOT EXISTS price_note TEXT;

ALTER TABLE sim_4g_camera_products
  ADD COLUMN IF NOT EXISTS price_note TEXT;

ALTER TABLE solar_camera_products
  ADD COLUMN IF NOT EXISTS price_note TEXT;

ALTER TABLE body_worn_camera_products
  ADD COLUMN IF NOT EXISTS price_note TEXT;

ALTER TABLE hd_camera_products
  ADD COLUMN IF NOT EXISTS price_note TEXT;

ALTER TABLE ip_camera_products
  ADD COLUMN IF NOT EXISTS price_note TEXT;
