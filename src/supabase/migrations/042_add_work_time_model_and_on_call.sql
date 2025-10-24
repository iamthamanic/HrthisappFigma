-- Migration 042: Add work time model and on-call fields
-- Author: HR System
-- Date: 2025-01-08
-- Description: Adds work time model (Zeitmodell) and on-call (Rufbereitschaft) fields to users table

-- Add work time model type
DO $$ BEGIN
  CREATE TYPE work_time_model_type AS ENUM ('SCHICHTMODELL', 'GLEITZEIT', 'BEREITSCHAFT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new columns to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS work_time_model work_time_model_type DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS shift_start_time TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS shift_end_time TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS flextime_start_earliest TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS flextime_start_latest TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS flextime_end_earliest TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS flextime_end_latest TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS on_call BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN users.work_time_model IS 'Work time model: SCHICHTMODELL (shift), GLEITZEIT (flextime), or BEREITSCHAFT (standby)';
COMMENT ON COLUMN users.shift_start_time IS 'Start time for shift model (e.g., 08:00)';
COMMENT ON COLUMN users.shift_end_time IS 'End time for shift model (e.g., 17:00)';
COMMENT ON COLUMN users.flextime_start_earliest IS 'Earliest start time for flextime (e.g., 07:00)';
COMMENT ON COLUMN users.flextime_start_latest IS 'Latest start time for flextime (e.g., 09:00)';
COMMENT ON COLUMN users.flextime_end_earliest IS 'Earliest end time for flextime (e.g., 16:00)';
COMMENT ON COLUMN users.flextime_end_latest IS 'Latest end time for flextime (e.g., 18:00)';
COMMENT ON COLUMN users.on_call IS 'Employee is on-call (Rufbereitschaft)';
