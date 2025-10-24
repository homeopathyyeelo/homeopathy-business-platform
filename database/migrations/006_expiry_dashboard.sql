-- =====================================================
-- EXPIRY DASHBOARD & TRACKING SYSTEM
-- Automated expiry monitoring with alerts
-- =====================================================

-- Add index for expiry queries
CREATE INDEX IF NOT EXISTS idx_inventory_batches_expiry_active 
ON inventory_batches(expiry_date, status) 
WHERE status = 'active' AND expiry_date IS NOT NULL;

-- Expiry Alerts Summary (computed hourly by cron)
CREATE TABLE IF NOT EXISTS expiry_alerts_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL,
    window_label VARCHAR(20) NOT NULL, -- '7_days','1_month','2_months','3_months','6_months','1_year','60_months'
    window_days INTEGER NOT NULL, -- actual days for sorting
    
    -- Counts
    count_items INTEGER DEFAULT 0,
    count_batches INTEGER DEFAULT 0,
    total_value DECIMAL(15,2) DEFAULT 0,
    
    -- Sample Products (for quick display)
    sample_products JSONB DEFAULT '[]'::jsonb,
    
    -- Computed timestamp
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(shop_id, window_label)
);

CREATE INDEX idx_expiry_summary_shop ON expiry_alerts_summary(shop_id);
CREATE INDEX idx_expiry_summary_window ON expiry_alerts_summary(window_label);
CREATE INDEX idx_expiry_summary_computed ON expiry_alerts_summary(computed_at DESC);

-- Expiry Alerts (individual items)
CREATE TABLE IF NOT EXISTS expiry_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL,
    product_id UUID NOT NULL,
    batch_id UUID REFERENCES inventory_batches(id),
    batch_no VARCHAR(50),
    expiry_date DATE NOT NULL,
    days_to_expiry INTEGER NOT NULL,
    
    -- Alert Level
    alert_level VARCHAR(20) NOT NULL, -- critical, warning, info
    window_label VARCHAR(20) NOT NULL,
    
    -- Stock Info
    qty_available DECIMAL(10,2),
    unit_cost DECIMAL(12,2),
    total_value DECIMAL(15,2),
    
    -- Alert Status
    status VARCHAR(20) DEFAULT 'active', -- active, acknowledged, resolved, expired
    acknowledged_by UUID,
    acknowledged_at TIMESTAMP,
    resolution_action VARCHAR(50), -- sold, returned, disposed, transferred
    resolved_at TIMESTAMP,
    
    -- Notifications
    notification_sent BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_expiry_alerts_shop ON expiry_alerts(shop_id);
CREATE INDEX idx_expiry_alerts_product ON expiry_alerts(product_id);
CREATE INDEX idx_expiry_alerts_expiry ON expiry_alerts(expiry_date);
CREATE INDEX idx_expiry_alerts_status ON expiry_alerts(status);
CREATE INDEX idx_expiry_alerts_level ON expiry_alerts(alert_level);

-- Expiry Actions Log
CREATE TABLE IF NOT EXISTS expiry_actions_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID REFERENCES expiry_alerts(id),
    batch_id UUID REFERENCES inventory_batches(id),
    
    action_type VARCHAR(50) NOT NULL, -- discount_applied, return_initiated, disposed, sold, transferred
    action_details JSONB,
    
    -- Results
    qty_affected DECIMAL(10,2),
    revenue_recovered DECIMAL(15,2),
    loss_amount DECIMAL(15,2),
    
    performed_by UUID,
    performed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_expiry_actions_alert ON expiry_actions_log(alert_id);
CREATE INDEX idx_expiry_actions_batch ON expiry_actions_log(batch_id);

-- Function to calculate days to expiry
CREATE OR REPLACE FUNCTION calculate_days_to_expiry(expiry_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN (expiry_date - CURRENT_DATE);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to determine alert level
CREATE OR REPLACE FUNCTION get_alert_level(days_to_expiry INTEGER)
RETURNS VARCHAR AS $$
BEGIN
    IF days_to_expiry <= 7 THEN
        RETURN 'critical';
    ELSIF days_to_expiry <= 30 THEN
        RETURN 'warning';
    ELSE
        RETURN 'info';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get window label
CREATE OR REPLACE FUNCTION get_window_label(days_to_expiry INTEGER)
RETURNS VARCHAR AS $$
BEGIN
    IF days_to_expiry <= 7 THEN
        RETURN '7_days';
    ELSIF days_to_expiry <= 30 THEN
        RETURN '1_month';
    ELSIF days_to_expiry <= 60 THEN
        RETURN '2_months';
    ELSIF days_to_expiry <= 90 THEN
        RETURN '3_months';
    ELSIF days_to_expiry <= 180 THEN
        RETURN '6_months';
    ELSIF days_to_expiry <= 365 THEN
        RETURN '1_year';
    ELSE
        RETURN '60_months';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- View for expiry dashboard
CREATE OR REPLACE VIEW v_expiry_dashboard AS
SELECT 
    ib.shop_id,
    ib.product_id,
    p.name as product_name,
    p.sku,
    ib.batch_no,
    ib.expiry_date,
    calculate_days_to_expiry(ib.expiry_date) as days_to_expiry,
    get_alert_level(calculate_days_to_expiry(ib.expiry_date)) as alert_level,
    get_window_label(calculate_days_to_expiry(ib.expiry_date)) as window_label,
    ib.qty_available,
    ib.unit_cost,
    (ib.qty_available * ib.unit_cost) as total_value,
    ib.status
FROM inventory_batches ib
LEFT JOIN products p ON p.id = ib.product_id
WHERE ib.status = 'active'
  AND ib.expiry_date IS NOT NULL
  AND ib.expiry_date >= CURRENT_DATE
  AND ib.qty_available > 0
ORDER BY ib.expiry_date ASC;

-- Stored procedure to refresh expiry summary
CREATE OR REPLACE FUNCTION refresh_expiry_summary(p_shop_id UUID DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    v_shop_id UUID;
    v_window RECORD;
BEGIN
    -- If shop_id provided, refresh only that shop, otherwise all shops
    FOR v_shop_id IN 
        SELECT DISTINCT shop_id 
        FROM inventory_batches 
        WHERE (p_shop_id IS NULL OR shop_id = p_shop_id)
          AND status = 'active'
          AND expiry_date IS NOT NULL
    LOOP
        -- Delete old summary for this shop
        DELETE FROM expiry_alerts_summary WHERE shop_id = v_shop_id;
        
        -- Insert new summaries for each window
        FOR v_window IN 
            SELECT 
                '7_days' as label, 7 as days, 0 as min_days, 7 as max_days
            UNION ALL SELECT '1_month', 30, 8, 30
            UNION ALL SELECT '2_months', 60, 31, 60
            UNION ALL SELECT '3_months', 90, 61, 90
            UNION ALL SELECT '6_months', 180, 91, 180
            UNION ALL SELECT '1_year', 365, 181, 365
            UNION ALL SELECT '60_months', 1800, 366, 1800
        LOOP
            INSERT INTO expiry_alerts_summary (
                shop_id, 
                window_label, 
                window_days,
                count_items, 
                count_batches,
                total_value,
                sample_products,
                computed_at
            )
            SELECT 
                v_shop_id,
                v_window.label,
                v_window.days,
                COUNT(DISTINCT ib.product_id),
                COUNT(*),
                SUM(ib.qty_available * ib.unit_cost),
                jsonb_agg(
                    jsonb_build_object(
                        'product_id', ib.product_id,
                        'product_name', p.name,
                        'sku', p.sku,
                        'batch_no', ib.batch_no,
                        'expiry_date', ib.expiry_date,
                        'days_to_expiry', (ib.expiry_date - CURRENT_DATE),
                        'qty_available', ib.qty_available,
                        'total_value', (ib.qty_available * ib.unit_cost)
                    ) ORDER BY ib.expiry_date LIMIT 10
                ),
                NOW()
            FROM inventory_batches ib
            LEFT JOIN products p ON p.id = ib.product_id
            WHERE ib.shop_id = v_shop_id
              AND ib.status = 'active'
              AND ib.expiry_date IS NOT NULL
              AND ib.qty_available > 0
              AND (ib.expiry_date - CURRENT_DATE) BETWEEN v_window.min_days AND v_window.max_days
            HAVING COUNT(*) > 0;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update expiry alerts
CREATE OR REPLACE FUNCTION auto_create_expiry_alerts()
RETURNS TRIGGER AS $$
DECLARE
    v_days_to_expiry INTEGER;
    v_alert_level VARCHAR;
    v_window_label VARCHAR;
BEGIN
    IF NEW.expiry_date IS NOT NULL AND NEW.status = 'active' AND NEW.qty_available > 0 THEN
        v_days_to_expiry := calculate_days_to_expiry(NEW.expiry_date);
        
        -- Only create alerts for items expiring within 1 year
        IF v_days_to_expiry <= 365 AND v_days_to_expiry >= 0 THEN
            v_alert_level := get_alert_level(v_days_to_expiry);
            v_window_label := get_window_label(v_days_to_expiry);
            
            INSERT INTO expiry_alerts (
                shop_id, product_id, batch_id, batch_no, expiry_date,
                days_to_expiry, alert_level, window_label,
                qty_available, unit_cost, total_value, status
            ) VALUES (
                NEW.shop_id, NEW.product_id, NEW.id, NEW.batch_no, NEW.expiry_date,
                v_days_to_expiry, v_alert_level, v_window_label,
                NEW.qty_available, NEW.unit_cost, (NEW.qty_available * NEW.unit_cost), 'active'
            )
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_create_expiry_alerts
AFTER INSERT OR UPDATE ON inventory_batches
FOR EACH ROW
EXECUTE FUNCTION auto_create_expiry_alerts();

-- Initial refresh of expiry summary
SELECT refresh_expiry_summary();

-- Sample expiry alerts for testing
INSERT INTO expiry_alerts (
    shop_id, product_id, batch_no, expiry_date, days_to_expiry,
    alert_level, window_label, qty_available, unit_cost, total_value
) VALUES
    ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'B20251001', CURRENT_DATE + 5, 5, 'critical', '7_days', 50, 125.00, 6250.00),
    ('11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 'B20251015', CURRENT_DATE + 25, 25, 'warning', '1_month', 30, 130.00, 3900.00)
ON CONFLICT DO NOTHING;

SELECT 'Expiry dashboard system created successfully!' as result;
