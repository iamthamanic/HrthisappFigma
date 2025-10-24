-- Migration: Add break management fields to users table
-- Date: 2025-10-05
-- Description: Adds fields for automatic and manual break management

-- Add break_auto, break_manual, and break_minutes columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS break_auto BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS break_manual BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS break_minutes INTEGER DEFAULT 30;

-- Add comment to columns
COMMENT ON COLUMN users.break_auto IS 'Whether breaks are automatically deducted';
COMMENT ON COLUMN users.break_manual IS 'Whether employee manually tracks breaks';
COMMENT ON COLUMN users.break_minutes IS 'Break duration in minutes based on daily working hours';
