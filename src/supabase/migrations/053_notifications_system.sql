-- ============================================================================
-- NOTIFICATION SYSTEM MIGRATION (v4.0.0)
-- ============================================================================
-- Real-time notification system with badge counters
-- Supports: Leave Requests, Documents, Benefits, Coins, Learning, Announcements

-- 1️⃣ CREATE NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  link TEXT,
  related_id UUID, -- For grouping notifications
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_notification_type CHECK (
    type IN (
      'LEAVE_REQUEST_PENDING',
      'LEAVE_REQUEST_APPROVED',
      'LEAVE_REQUEST_REJECTED',
      'DOCUMENT_UPLOADED',
      'BENEFIT_APPROVED',
      'BENEFIT_REJECTED',
      'COINS_AWARDED',
      'ACHIEVEMENT_UNLOCKED',
      'VIDEO_ADDED',
      'ANNOUNCEMENT_CREATED',
      'ORGANIGRAM_UPDATED'
    )
  )
);

-- 2️⃣ CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
  ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
  ON notifications(user_id, read);

CREATE INDEX IF NOT EXISTS idx_notifications_user_type 
  ON notifications(user_id, type, read);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
  ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_related_id 
  ON notifications(related_id) WHERE related_id IS NOT NULL;

-- 3️⃣ RLS POLICIES
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Only authenticated users can insert (via service)
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can delete their own old notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- 4️⃣ HELPER FUNCTION: Get Unread Count by Type
CREATE OR REPLACE FUNCTION get_unread_notification_count(
  p_user_id UUID,
  p_type TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_type IS NULL THEN
    -- Count all unread notifications
    RETURN (
      SELECT COUNT(*)
      FROM notifications
      WHERE user_id = p_user_id AND read = FALSE
    );
  ELSE
    -- Count unread notifications of specific type
    RETURN (
      SELECT COUNT(*)
      FROM notifications
      WHERE user_id = p_user_id 
        AND type = p_type 
        AND read = FALSE
    );
  END IF;
END;
$$;

-- 5️⃣ HELPER FUNCTION: Mark Notifications as Read by Type
CREATE OR REPLACE FUNCTION mark_notifications_read_by_type(
  p_user_id UUID,
  p_type TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE notifications
  SET 
    read = TRUE,
    read_at = NOW()
  WHERE 
    user_id = p_user_id 
    AND type = p_type 
    AND read = FALSE;
    
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$;

-- 6️⃣ HELPER FUNCTION: Clean Old Read Notifications (optional maintenance)
CREATE OR REPLACE FUNCTION clean_old_notifications(
  p_days_old INTEGER DEFAULT 90
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_rows INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE 
    read = TRUE 
    AND read_at < NOW() - INTERVAL '1 day' * p_days_old;
    
  GET DIAGNOSTICS deleted_rows = ROW_COUNT;
  RETURN deleted_rows;
END;
$$;

-- 7️⃣ ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 8️⃣ GRANT PERMISSIONS
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notifications_read_by_type TO authenticated;

-- ============================================================================
-- NOTIFICATION SYSTEM COMPLETE! ✅
-- ============================================================================

-- Quick Test:
-- SELECT get_unread_notification_count((SELECT id FROM users LIMIT 1));
