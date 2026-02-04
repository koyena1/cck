-- Orders table for customer orders
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pin_code VARCHAR(10) NOT NULL,
    landmark VARCHAR(255),
    products JSONB NOT NULL,
    products_total DECIMAL(10, 2) NOT NULL,
    with_installation BOOLEAN DEFAULT FALSE,
    installation_cost DECIMAL(10, 2) DEFAULT 0,
    with_amc BOOLEAN DEFAULT FALSE,
    amc_details JSONB,
    amc_cost DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Create index on created_at for date filtering
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Create index on email for customer lookup
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
