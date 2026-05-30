-- Add DVR/NVR and GST-inclusive price columns to hd_combo_products

ALTER TABLE hd_combo_products
  ADD COLUMN IF NOT EXISTS dvr BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS nvr BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS price_note TEXT,
  ADD COLUMN IF NOT EXISTS price_including_gst DECIMAL(10, 2);
