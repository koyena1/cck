INSERT INTO channel_options (channel_count, features, display_order) VALUES 
(4, '["Supports up to 4 Cameras", "1080p/5MP Lite", "1 SATA Port", "H.265+ Compression"]'::jsonb, 1),
(8, '["Supports up to 8 Cameras", "5MP Real-time", "1 SATA Port", "Smart Search"]'::jsonb, 2),
(16, '["Supports up to 16 Cameras", "4K Output", "2 SATA Ports", "Advanced Analytics"]'::jsonb, 3)
ON CONFLICT (channel_count) DO NOTHING;
