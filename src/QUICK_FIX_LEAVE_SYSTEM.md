-- ============================================
-- QUICK FIX: Leave System Migration
-- ============================================
-- WICHTIG: Der Code funktioniert auch OHNE diese Migration (backwards-compatible)
-- Aber für volle Funktionalität solltest du die Migration ausführen!
--
-- Erweiterte Features nach Migration:
-- - User kann PENDING Anträge zurückziehen
-- - Admin kann APPROVED Anträge mit User-Bestätigung stornieren
-- - Halbtagsurlaub möglich
-- - Krankschreibung hochladen
-- - Übertrag ins nächste Jahr bis März
-- - Reminder-System für bevorstehenden Urlaub
-- ============================================


-- ============================================
-- MIGRATION 036: Extend Leave Requests Table
-- ============================================
-- Extends leave_requests table with additional fields for
-- half-day leaves, sick notes, withdrawals, and cancellations

-- Add new columns to leave_requests
ALTER TABLE public.leave_requests
  ADD COLUMN IF NOT EXISTS is_half_day BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS file_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS cancellation_confirmed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS federal_state TEXT NULL,
  ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.leave_requests.is_half_day IS 'True if request is for 0.5 days';
COMMENT ON COLUMN public.leave_requests.file_url IS 'URL to uploaded sick note document (stored in Supabase Storage)';
COMMENT ON COLUMN public.leave_requests.withdrawn_at IS 'Timestamp when user withdrew their PENDING request';
COMMENT ON COLUMN public.leave_requests.cancelled_by IS 'Admin/HR/TeamLead who cancelled an APPROVED request';
COMMENT ON COLUMN public.leave_requests.cancelled_at IS 'Timestamp when APPROVED request was cancelled';
COMMENT ON COLUMN public.leave_requests.cancellation_confirmed IS 'User confirmed the cancellation of their APPROVED request';
COMMENT ON COLUMN public.leave_requests.federal_state IS 'German federal state (Bundesland) for holiday calculation';
COMMENT ON COLUMN public.leave_requests.reminder_sent IS 'Track if pre-leave reminder notification was sent';
COMMENT ON COLUMN public.leave_requests.created_by IS 'User who created the request (different from user_id if admin created it)';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_leave_requests_withdrawn ON public.leave_requests(withdrawn_at) WHERE withdrawn_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leave_requests_cancelled ON public.leave_requests(cancelled_by, cancelled_at) WHERE cancelled_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leave_requests_reminder ON public.leave_requests(reminder_sent, start_date) WHERE reminder_sent = false AND status = 'APPROVED';

-- Create helper function to calculate business days (excluding weekends)
CREATE OR REPLACE FUNCTION calculate_business_days(
  start_date DATE,
  end_date DATE
) RETURNS DECIMAL AS $$
DECLARE
  iter_date DATE;
  business_days DECIMAL := 0;
  day_of_week INT;
BEGIN
  iter_date := start_date;
  
  WHILE iter_date <= end_date LOOP
    day_of_week := EXTRACT(DOW FROM iter_date);
    
    IF day_of_week >= 1 AND day_of_week <= 5 THEN
      business_days := business_days + 1;
    END IF;
    
    iter_date := iter_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN business_days;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comment
COMMENT ON FUNCTION calculate_business_days IS 'Calculate number of business days (Mon-Fri) between two dates, excluding weekends';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 036 completed: leave_requests table extended with half-day, sick notes, withdrawals, and cancellations';
END $$;
