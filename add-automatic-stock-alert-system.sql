-- ========================================
-- AUTOMATIC STOCK ALERT SYSTEM
-- Tracks and manages automatic stock alerts for inactive dealers
-- ========================================

-- Table to track automatic alert history for dealers
CREATE TABLE IF NOT EXISTS dealer_auto_alert_history (
    id SERIAL PRIMARY KEY,
    dealer_id INTEGER REFERENCES dealers(dealer_id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'initial_10day', 'followup_5day'
    days_since_update INTEGER NOT NULL, -- Days since last stock update when alert was sent
    low_stock_count INTEGER DEFAULT 0, -- Number of low stock items
    out_of_stock_count INTEGER DEFAULT 0, -- Number of out of stock items
    alert_sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notification_id INTEGER REFERENCES dealer_notifications(id),
    email_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auto_alert_dealer ON dealer_auto_alert_history(dealer_id);
CREATE INDEX IF NOT EXISTS idx_auto_alert_date ON dealer_auto_alert_history(alert_sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_auto_alert_dealer_date ON dealer_auto_alert_history(dealer_id, alert_sent_at DESC);

-- View to check dealers needing automatic alerts
CREATE OR REPLACE VIEW dealers_needing_auto_alert AS
WITH dealer_stock_status AS (
    SELECT 
        d.dealer_id,
        d.full_name,
        d.email,
        d.business_name,
        d.status,
        get_dealer_last_stock_update(d.dealer_id) as last_stock_update,
        get_days_since_stock_update(d.dealer_id) as days_since_update,
        COUNT(CASE WHEN di.quantity_available = 0 THEN 1 END) as out_of_stock_count,
        COUNT(CASE WHEN di.quantity_available > 0 AND di.quantity_available < 5 THEN 1 END) as low_stock_count,
        COUNT(di.id) as total_products
    FROM dealers d
    LEFT JOIN dealer_inventory di ON d.dealer_id = di.dealer_id
    WHERE d.status = 'Active'
    GROUP BY d.dealer_id, d.full_name, d.email, d.business_name, d.status
),
last_alert_info AS (
    SELECT 
        dealer_id,
        MAX(alert_sent_at) as last_alert_sent,
        EXTRACT(DAY FROM (CURRENT_TIMESTAMP - MAX(alert_sent_at))) as days_since_last_alert
    FROM dealer_auto_alert_history
    GROUP BY dealer_id
)
SELECT 
    dss.*,
    lai.last_alert_sent,
    lai.days_since_last_alert,
    CASE 
        -- Initial alert: 10+ days since last update, no alert sent yet OR stock was updated after last alert
        WHEN dss.days_since_update >= 10 
             AND (lai.last_alert_sent IS NULL OR dss.last_stock_update > lai.last_alert_sent)
             AND (dss.out_of_stock_count > 0 OR dss.low_stock_count > 0)
        THEN 'initial_10day'
        -- Follow-up alert: 5+ days since last alert, still haven't updated stock, still have low/out stock
        WHEN dss.days_since_update >= 10 
             AND lai.days_since_last_alert >= 5
             AND (dss.out_of_stock_count > 0 OR dss.low_stock_count > 0)
        THEN 'followup_5day'
        ELSE NULL
    END as alert_needed
FROM dealer_stock_status dss
LEFT JOIN last_alert_info lai ON dss.dealer_id = lai.dealer_id
WHERE dss.status = 'Active'
  AND dss.days_since_update >= 10
  AND (dss.out_of_stock_count > 0 OR dss.low_stock_count > 0)
  AND (
    -- Need initial alert
    (lai.last_alert_sent IS NULL OR dss.last_stock_update > lai.last_alert_sent)
    OR 
    -- Need follow-up alert
    (lai.days_since_last_alert >= 5)
  )
ORDER BY dss.days_since_update DESC;

COMMENT ON TABLE dealer_auto_alert_history IS 'Tracks history of automatic stock alerts sent to dealers';
COMMENT ON VIEW dealers_needing_auto_alert IS 'Dealers who need automatic stock alerts (initial 10-day or 5-day follow-ups)';

