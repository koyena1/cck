-- Add Product Identification Code (PIC) to dealer_products
-- Format: PIC001, PIC002, ...

ALTER TABLE dealer_products
ADD COLUMN IF NOT EXISTS product_code VARCHAR(32);

CREATE SEQUENCE IF NOT EXISTS dealer_products_pic_seq;

-- Ensure sequence is aligned with any existing PIC values.
-- If no PIC exists yet, initialize so first nextval() returns 1 (PIC001).
SELECT setval(
	'dealer_products_pic_seq',
	COALESCE(
		(
			SELECT MAX(CAST(SUBSTRING(product_code FROM 4) AS INTEGER))
			FROM dealer_products
			WHERE product_code ~ '^PIC[0-9]+$'
		),
		0
	),
	COALESCE(
		(
			SELECT MAX(CAST(SUBSTRING(product_code FROM 4) AS INTEGER))
			FROM dealer_products
			WHERE product_code ~ '^PIC[0-9]+$'
		),
		0
	) > 0
);

-- Backfill missing product codes for existing products.
UPDATE dealer_products
SET product_code = 'PIC' || LPAD(nextval('dealer_products_pic_seq')::TEXT, 3, '0')
WHERE product_code IS NULL OR BTRIM(product_code) = '';

CREATE OR REPLACE FUNCTION set_dealer_product_pic_code()
RETURNS TRIGGER AS $$
BEGIN
	IF NEW.product_code IS NULL OR BTRIM(NEW.product_code) = '' THEN
		NEW.product_code := 'PIC' || LPAD(nextval('dealer_products_pic_seq')::TEXT, 3, '0');
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_dealer_product_pic_code ON dealer_products;
CREATE TRIGGER trigger_set_dealer_product_pic_code
BEFORE INSERT ON dealer_products
FOR EACH ROW
EXECUTE FUNCTION set_dealer_product_pic_code();

CREATE UNIQUE INDEX IF NOT EXISTS idx_dealer_products_product_code_unique
ON dealer_products(product_code);
