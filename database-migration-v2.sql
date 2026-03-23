-- =====================================================
-- DoForYou - Complete Production Migration
-- Version: 2.0.0
-- Description: Adds escrow, wallet, real-time features
-- =====================================================

-- 1. ADD ESCROW COLUMNS TO TASKS TABLE
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5,2) DEFAULT 15.00,
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payout_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS escrow_status VARCHAR(20) DEFAULT 'none' 
    CHECK (escrow_status IN ('none', 'pending', 'held', 'released', 'refunded', 'disputed')),
ADD COLUMN IF NOT EXISTS escrow_hold_until TIMESTAMP,
ADD COLUMN IF NOT EXISTS payfast_transaction_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS payfast_signature VARCHAR(500),
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS verification_level VARCHAR(20) DEFAULT 'basic';

-- Update payment status enum
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_payment_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_payment_status_check 
    CHECK (payment_status IN ('Pending', 'Completed', 'EscrowHeld', 'EscrowReleased', 'Refunded'));

-- 2. CREATE ESCROW TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS escrow_transactions (
    id SERIAL PRIMARY KEY,
    task_id INTEGER UNIQUE NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    payfast_payment_id VARCHAR(100),
    payfast_transaction_id VARCHAR(100),
    
    -- Amount breakdown
    total_amount DECIMAL(10,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    payout_amount DECIMAL(10,2) NOT NULL,
    
    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'held', 'released', 'refunded', 'disputed')),
    
    -- Timestamps
    payment_received_at TIMESTAMP,
    escrow_held_at TIMESTAMP,
    scheduled_release_at TIMESTAMP,
    released_at TIMESTAMP,
    
    -- Security
    payfast_signature VARCHAR(500),
    ipn_validated BOOLEAN DEFAULT FALSE,
    
    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_transactions(status);
CREATE INDEX IF NOT EXISTS idx_escrow_release ON escrow_transactions(scheduled_release_at) 
    WHERE status = 'held';
CREATE INDEX IF NOT EXISTS idx_escrow_task ON escrow_transactions(task_id);

-- 3. CREATE WALLET TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
    
    -- Transaction details
    transaction_type VARCHAR(20) NOT NULL 
        CHECK (transaction_type IN ('deposit', 'withdrawal', 'commission', 'payout', 'refund', 'bonus')),
    amount DECIMAL(10,2) NOT NULL,
    balance_before DECIMAL(10,2) NOT NULL DEFAULT 0,
    balance_after DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Metadata
    description TEXT,
    reference VARCHAR(100) UNIQUE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    
    -- Payment method (for withdrawals)
    payment_method VARCHAR(50),
    payment_details JSONB,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_task ON wallet_transactions(task_id);
CREATE INDEX IF NOT EXISTS idx_wallet_status ON wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_type ON wallet_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_reference ON wallet_transactions(reference);

-- 4. CREATE CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Message content
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' 
        CHECK (message_type IN ('text', 'image', 'file', 'system')),
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_task ON chat_messages(task_id);
CREATE INDEX IF NOT EXISTS idx_chat_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_receiver ON chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_unread ON chat_messages(receiver_id, is_read) WHERE is_read = FALSE;

-- 5. CREATE NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification details
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    
    -- Priority
    priority VARCHAR(20) DEFAULT 'normal' 
        CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    
    -- Action
    action_url VARCHAR(500),
    action_text VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notif_type ON notifications(type);

-- 6. CREATE USER DEVICES TABLE (for push notifications)
CREATE TABLE IF NOT EXISTS user_devices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Device info
    device_token VARCHAR(500) NOT NULL UNIQUE,
    device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
    device_name VARCHAR(200),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_user ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_device_token ON user_devices(device_token);
CREATE INDEX IF NOT EXISTS idx_device_active ON user_devices(user_id, is_active) WHERE is_active = TRUE;

-- 7. CREATE FRAUD DETECTION TABLE
CREATE TABLE IF NOT EXISTS fraud_checks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
    
    -- Risk assessment
    risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Flags
    flags JSONB,
    
    -- Action taken
    action_taken VARCHAR(50),
    requires_manual_review BOOLEAN DEFAULT FALSE,
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_user ON fraud_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_risk ON fraud_checks(risk_level);
CREATE INDEX IF NOT EXISTS idx_fraud_review ON fraud_checks(requires_manual_review) WHERE requires_manual_review = TRUE;

-- 8. CREATE TASK ANALYTICS VIEW
CREATE MATERIALIZED VIEW IF NOT EXISTS task_analytics_daily AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN task_status = 'Completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN payment_status = 'Completed' THEN 1 END) as paid_tasks,
    SUM(CASE WHEN payment_status = 'Completed' THEN budget ELSE 0 END) as total_volume,
    SUM(CASE WHEN payment_status = 'Completed' THEN commission_amount ELSE 0 END) as total_commission,
    AVG(budget) as avg_task_value,
    COUNT(DISTINCT created_by_user_id) as unique_posters,
    COUNT(DISTINCT accepted_by_user_id) as unique_runners
FROM tasks
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE(created_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_date ON task_analytics_daily(date);

-- 9. ADD ENHANCED BUSINESS RULES
INSERT INTO business_rules (rule_name, rule_type, entity, condition, action, error_message, is_active, priority, created_at, updated_at) VALUES
-- Commission Rules
('15% Commission on All Tasks', 'calculation', 'Task', 
 '{"always": true}', 
 'calculate_commission', 
 NULL, true, 10, NOW(), NOW()),

('Minimum Commission R5', 'validation', 'Task', 
 '{"commission": {"min": 5.00}}', 
 'validate', 
 'Minimum commission is R5', true, 11, NOW(), NOW()),

-- Escrow Rules
('48-Hour Escrow Hold Period', 'workflow', 'Task', 
 '{"taskStatus": "Completed"}', 
 'hold_escrow', 
 NULL, true, 20, NOW(), NOW()),

('Auto-Release After Hold Period', 'workflow', 'Task', 
 '{"escrowStatus": "held", "escrowHoldUntil": "<now"}', 
 'release_escrow', 
 NULL, true, 21, NOW(), NOW()),

-- Verification Rules
('High-Value Tasks Require Verification', 'permission', 'Task', 
 '{"budget": {">": 5000}, "user.isVerified": false}', 
 'deny', 
 'Tasks over R5000 require verified accounts', true, 30, NOW(), NOW()),

('Verified Users Can Post Multiple Tasks', 'permission', 'Task', 
 '{"user.isVerified": true}', 
 'allow', 
 NULL, true, 31, NOW(), NOW()),

-- Wallet Rules
('Minimum Withdrawal R100', 'validation', 'WalletTransaction', 
 '{"transactionType": "withdrawal", "amount": {"<": 100}}', 
 'deny', 
 'Minimum withdrawal amount is R100', true, 40, NOW(), NOW()),

('Sufficient Balance Required', 'validation', 'WalletTransaction', 
 '{"transactionType": "withdrawal", "amount": {">": "user.walletBalance"}}', 
 'deny', 
 'Insufficient wallet balance', true, 41, NOW(), NOW()),

-- Fraud Prevention
('Velocity Check - Max 5 Tasks Per Hour', 'validation', 'Task', 
 '{"user.tasksLastHour": {">": 5}}', 
 'deny', 
 'Too many tasks created. Please try again later', true, 50, NOW(), NOW()),

('Suspicious Activity Detection', 'validation', 'Task', 
 '{"user.riskScore": {">": 70}}', 
 'require_review', 
 'Your account requires verification', true, 51, NOW(), NOW())

ON CONFLICT (rule_name) DO NOTHING;

-- 10. UPDATE EXISTING TASKS WITH COMMISSION
UPDATE tasks 
SET 
    commission_percentage = 15.00,
    commission_amount = GREATEST(budget * 0.15, 5.00),
    payout_amount = budget - GREATEST(budget * 0.15, 5.00)
WHERE commission_amount = 0 OR commission_amount IS NULL;

-- 11. CREATE FUNCTIONS FOR AUTO-CALCULATIONS

-- Function to calculate commission
CREATE OR REPLACE FUNCTION calculate_commission(budget DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    RETURN GREATEST(budget * 0.15, 5.00);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update wallet balance
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' THEN
        IF NEW.transaction_type IN ('deposit', 'payout', 'bonus', 'refund') THEN
            UPDATE users 
            SET wallet_balance = wallet_balance + NEW.amount,
                updated_at = NOW()
            WHERE id = NEW.user_id;
        ELSIF NEW.transaction_type IN ('withdrawal', 'commission') THEN
            UPDATE users 
            SET wallet_balance = wallet_balance - NEW.amount,
                updated_at = NOW()
            WHERE id = NEW.user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update wallet balance
DROP TRIGGER IF EXISTS trigger_update_wallet_balance ON wallet_transactions;
CREATE TRIGGER trigger_update_wallet_balance
    AFTER INSERT OR UPDATE OF status ON wallet_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_balance();

-- Function to auto-update task commission
CREATE OR REPLACE FUNCTION auto_calculate_task_commission()
RETURNS TRIGGER AS $$
BEGIN
    NEW.commission_amount := calculate_commission(NEW.budget);
    NEW.payout_amount := NEW.budget - NEW.commission_amount;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate commission on task insert/update
DROP TRIGGER IF EXISTS trigger_calculate_commission ON tasks;
CREATE TRIGGER trigger_calculate_commission
    BEFORE INSERT OR UPDATE OF budget ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION auto_calculate_task_commission();

-- 12. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_tasks_escrow_status ON tasks(escrow_status);
CREATE INDEX IF NOT EXISTS idx_tasks_escrow_release ON tasks(escrow_hold_until) 
    WHERE escrow_status = 'held';
CREATE INDEX IF NOT EXISTS idx_tasks_payment_status ON tasks(payment_status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_accepted_by ON tasks(accepted_by_user_id);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_balance);
CREATE INDEX IF NOT EXISTS idx_users_verification ON users(is_verified, verification_level);

-- 13. GRANT PERMISSIONS (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO doforyou_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO doforyou_app;

-- 14. REFRESH MATERIALIZED VIEW
REFRESH MATERIALIZED VIEW task_analytics_daily;

-- =====================================================
-- Migration Complete
-- =====================================================
-- Next Steps:
-- 1. Update backend models to match new schema
-- 2. Implement escrow service
-- 3. Create wallet service
-- 4. Add SignalR for real-time features
-- 5. Build frontend components
-- =====================================================
