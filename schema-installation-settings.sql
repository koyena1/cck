-- Create installation_settings table
CREATE TABLE IF NOT EXISTS installation_settings (
  id SERIAL PRIMARY KEY,
  installation_cost DECIMAL(10, 2) NOT NULL DEFAULT 5000.00,
  amc_options JSONB NOT NULL DEFAULT '[
    {
      "id": "amc-with-material-1yr",
      "name": "AMC WITH MATERIAL FOR 1 YEAR",
      "pricePerCamera": 400,
      "description": "Annual maintenance with all materials included"
    },
    {
      "id": "amc-with-material-2yr",
      "name": "AMC WITH MATERIAL FOR 2 YEAR",
      "pricePerCamera": 700,
      "description": "2-year maintenance with all materials included"
    },
    {
      "id": "amc-without-material-1yr",
      "name": "AMC WITHOUT MATERIAL FOR 1 YEAR",
      "pricePerCamera": 250,
      "description": "Annual maintenance without materials"
    },
    {
      "id": "amc-without-material-2yr",
      "name": "AMC WITHOUT MATERIAL FOR 2 YEAR",
      "pricePerCamera": 200,
      "description": "2-year maintenance without materials"
    }
  ]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO installation_settings (installation_cost, amc_options)
VALUES (
  5000.00,
  '[
    {
      "id": "amc-with-material-1yr",
      "name": "AMC WITH MATERIAL FOR 1 YEAR (CALCULATION @400/CAM)",
      "pricePerCamera": 400,
      "description": "Annual maintenance with all materials included"
    },
    {
      "id": "amc-with-material-2yr",
      "name": "AMC WITH MATERIAL FOR 2 YEAR ( CALCULATION 700/CAM )",
      "pricePerCamera": 700,
      "description": "2-year maintenance with all materials included"
    },
    {
      "id": "amc-without-material-1yr",
      "name": "AMC WITHOUT MATERIAL FOR 1 YEAR @250/CAM",
      "pricePerCamera": 250,
      "description": "Annual maintenance without materials"
    },
    {
      "id": "amc-without-material-2yr",
      "name": "AMC WITHOUT MATERIAL FOR 2 YEAR@200/CAM",
      "pricePerCamera": 200,
      "description": "2-year maintenance without materials"
    }
  ]'::jsonb
)
ON CONFLICT DO NOTHING;

-- Comment on table
COMMENT ON TABLE installation_settings IS 'Stores configuration for installation costs and AMC options for the buy now flow';
