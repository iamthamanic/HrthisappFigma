-- ============================================================================
-- BROWO KOORDINATOR - CHAT SYSTEM COMPLETE
-- ============================================================================
-- Includes: Conversations, Messages, Files, Knowledge, Feedback
-- Version: 1.0.0
-- ============================================================================

-- ============================================================================
-- CONVERSATIONS & MEMBERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS BrowoKo_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('DM', 'GROUP')),
  name TEXT, -- For groups
  avatar_url TEXT, -- For groups
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_type ON BrowoKo_conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON BrowoKo_conversations(updated_at DESC);

-- Conversation Members
CREATE TABLE IF NOT EXISTS BrowoKo_conversation_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES BrowoKo_conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'MEMBER')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  notifications_enabled BOOLEAN DEFAULT TRUE,
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON BrowoKo_conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_conversation ON BrowoKo_conversation_members(conversation_id);

-- ============================================================================
-- MESSAGES & ATTACHMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS BrowoKo_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES BrowoKo_conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'TEXT' CHECK (type IN ('TEXT', 'FILE', 'IMAGE', 'VIDEO', 'SYSTEM')),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  reply_to_message_id UUID REFERENCES BrowoKo_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON BrowoKo_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user ON BrowoKo_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_deleted ON BrowoKo_messages(deleted_at) WHERE deleted_at IS NULL;

-- Message Attachments
CREATE TABLE IF NOT EXISTS BrowoKo_message_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES BrowoKo_messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON BrowoKo_message_attachments(message_id);

-- ============================================================================
-- MESSAGE REACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS BrowoKo_message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES BrowoKo_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON BrowoKo_message_reactions(message_id);

-- ============================================================================
-- READ RECEIPTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS BrowoKo_message_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES BrowoKo_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_reads_message ON BrowoKo_message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user ON BrowoKo_message_reads(user_id);

-- ============================================================================
-- TYPING INDICATORS
-- ============================================================================

CREATE TABLE IF NOT EXISTS BrowoKo_typing_indicators (
  conversation_id UUID REFERENCES BrowoKo_conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  typing_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation ON BrowoKo_typing_indicators(conversation_id);

-- ============================================================================
-- USER PRESENCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS BrowoKo_user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'OFFLINE' CHECK (status IN ('ONLINE', 'AWAY', 'BUSY', 'OFFLINE')),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_presence_status ON BrowoKo_user_presence(status, last_seen_at DESC);

-- ============================================================================
-- KNOWLEDGE WIKI
-- ============================================================================

CREATE TABLE IF NOT EXISTS BrowoKo_knowledge_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  view_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_pages_category ON BrowoKo_knowledge_pages(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_pages_created_by ON BrowoKo_knowledge_pages(created_by);
CREATE INDEX IF NOT EXISTS idx_knowledge_pages_updated_at ON BrowoKo_knowledge_pages(updated_at DESC);

-- Full text search index for knowledge pages
CREATE INDEX IF NOT EXISTS idx_knowledge_pages_title_search ON BrowoKo_knowledge_pages USING gin(to_tsvector('german', title));
CREATE INDEX IF NOT EXISTS idx_knowledge_pages_content_search ON BrowoKo_knowledge_pages USING gin(to_tsvector('german', content));

-- ============================================================================
-- FEEDBACK SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS BrowoKo_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
  submitted_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_submitted_by ON BrowoKo_feedback(submitted_by);
CREATE INDEX IF NOT EXISTS idx_feedback_assigned_to ON BrowoKo_feedback(assigned_to);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON BrowoKo_feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON BrowoKo_feedback(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON BrowoKo_feedback(created_at DESC);

-- Feedback Comments
CREATE TABLE IF NOT EXISTS BrowoKo_feedback_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id UUID REFERENCES BrowoKo_feedback(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_comments_feedback ON BrowoKo_feedback_comments(feedback_id, created_at);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE BrowoKo_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE BrowoKo_conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE BrowoKo_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE BrowoKo_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE BrowoKo_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE BrowoKo_message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE BrowoKo_typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE BrowoKo_user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE BrowoKo_knowledge_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE BrowoKo_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE BrowoKo_feedback_comments ENABLE ROW LEVEL SECURITY;

-- Conversations: Only members can see
CREATE POLICY "Users can view their conversations" ON BrowoKo_conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM BrowoKo_conversation_members
      WHERE conversation_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations" ON BrowoKo_conversations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update conversations" ON BrowoKo_conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM BrowoKo_conversation_members
      WHERE conversation_id = id AND user_id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Conversation Members
CREATE POLICY "Users can view members of their conversations" ON BrowoKo_conversation_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM BrowoKo_conversation_members cm
      WHERE cm.conversation_id = conversation_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can add members" ON BrowoKo_conversation_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM BrowoKo_conversation_members
      WHERE conversation_id = conversation_id AND user_id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Messages: Only members can see
CREATE POLICY "Users can view messages in their conversations" ON BrowoKo_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM BrowoKo_conversation_members
      WHERE conversation_id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their conversations" ON BrowoKo_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM BrowoKo_conversation_members
      WHERE conversation_id = conversation_id AND user_id = auth.uid()
    ) AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own messages" ON BrowoKo_messages
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON BrowoKo_messages
  FOR DELETE USING (user_id = auth.uid());

-- Message Attachments: Follow message permissions
CREATE POLICY "Users can view attachments in their conversations" ON BrowoKo_message_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM BrowoKo_messages m
      JOIN BrowoKo_conversation_members cm ON m.conversation_id = cm.conversation_id
      WHERE m.id = message_id AND cm.user_id = auth.uid()
    )
  );

-- Reactions: Anyone in conversation can add
CREATE POLICY "Users can manage reactions in their conversations" ON BrowoKo_message_reactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM BrowoKo_messages m
      JOIN BrowoKo_conversation_members cm ON m.conversation_id = cm.conversation_id
      WHERE m.id = message_id AND cm.user_id = auth.uid()
    )
  );

-- Read Receipts
CREATE POLICY "Users can manage their read receipts" ON BrowoKo_message_reads
  FOR ALL USING (user_id = auth.uid());

-- Typing Indicators
CREATE POLICY "Users can manage their typing status" ON BrowoKo_typing_indicators
  FOR ALL USING (user_id = auth.uid());

-- User Presence
CREATE POLICY "Everyone can view presence" ON BrowoKo_user_presence
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their presence" ON BrowoKo_user_presence
  FOR ALL USING (user_id = auth.uid());

-- Knowledge Pages
CREATE POLICY "Everyone can view knowledge pages" ON BrowoKo_knowledge_pages
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create knowledge pages" ON BrowoKo_knowledge_pages
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their knowledge pages" ON BrowoKo_knowledge_pages
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Creators can delete their knowledge pages" ON BrowoKo_knowledge_pages
  FOR DELETE USING (created_by = auth.uid());

-- Feedback
CREATE POLICY "Users can view their own feedback" ON BrowoKo_feedback
  FOR SELECT USING (submitted_by = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'HR', 'SUPERADMIN')
  ));

CREATE POLICY "Authenticated users can submit feedback" ON BrowoKo_feedback
  FOR INSERT WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Admins can update feedback" ON BrowoKo_feedback
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'HR', 'SUPERADMIN')
    )
  );

-- Feedback Comments
CREATE POLICY "Users can view comments on their feedback" ON BrowoKo_feedback_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM BrowoKo_feedback f
      WHERE f.id = feedback_id AND (f.submitted_by = auth.uid() OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'HR', 'SUPERADMIN')
      ))
    )
  );

CREATE POLICY "Users can add comments to their feedback" ON BrowoKo_feedback_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM BrowoKo_feedback f
      WHERE f.id = feedback_id AND (f.submitted_by = auth.uid() OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'HR', 'SUPERADMIN')
      ))
    ) AND user_id = auth.uid()
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to relevant tables
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON BrowoKo_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_pages_updated_at BEFORE UPDATE ON BrowoKo_knowledge_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON BrowoKo_feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_presence_updated_at BEFORE UPDATE ON BrowoKo_user_presence
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Chat System Migration Complete!';
  RAISE NOTICE '   - Conversations & Members';
  RAISE NOTICE '   - Messages & Attachments';
  RAISE NOTICE '   - Reactions & Read Receipts';
  RAISE NOTICE '   - Typing & Presence';
  RAISE NOTICE '   - Knowledge Wiki';
  RAISE NOTICE '   - Feedback System';
END $$;
