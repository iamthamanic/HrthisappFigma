ALTER TABLE users
ADD COLUMN IF NOT EXISTS break_auto BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS break_manual BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS break_minutes INTEGER DEFAULT 30;

COMMENT ON COLUMN users.break_auto IS 'Whether breaks are automatically deducted';
COMMENT ON COLUMN users.break_manual IS 'Whether employee manually tracks breaks';
COMMENT ON COLUMN users.break_minutes IS 'Break duration in minutes based on daily working hours';