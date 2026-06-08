ALTER TABLE hd_camera_products ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(64);
ALTER TABLE ip_camera_products ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(64);
ALTER TABLE wifi_camera_products ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(64);
ALTER TABLE solar_camera_products ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(64);
ALTER TABLE sim_4g_camera_products ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(64);
ALTER TABLE body_worn_camera_products ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(64);
ALTER TABLE hd_combo_products ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(64);
ALTER TABLE ip_combo_products ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(64);
