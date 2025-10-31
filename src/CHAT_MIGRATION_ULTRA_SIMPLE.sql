-- ============================================================================
-- BROWO KOORDINATOR - CHAT SYSTEM (ULTRA SIMPLE VERSION)
-- ============================================================================
-- This version ONLY creates tables and policies
-- NO dropping of anything
-- Safe to run if tables don't exist yet
-- ============================================================================

-- CREATE TABLES (IF NOT EXISTS = safe to run multiple times)

CREATE TABLE IF NOT EXISTS BrowoKo_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('DM', 'GROUP')),
  name TEXT,
  avatar_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_type ON BrowoKo_conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON BrowoKo_conversations(updated_at DESC);

CREATE TABLE IF NOT EXISTS BrowoKo_conversation_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES BrowoKo_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'MEMBER')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  notifications_enabled BOOLEAN DEFAULT TRUE,
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON BrowoKo_conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_conversation ON BrowoKo_conversation_members(conversation_id);

CREATE TABLE IF NOT EXISTS BrowoKo_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES BrowoKo_conversations(id) ON DELETE CASCADE,
  user_id UUID,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'TEXT' CHECK (type IN ('TEXT', 'FILE', 'IMAGE', 'VIDEO', 'SYSTEM')),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  reply_to_message_id UUID REFERENCES BrowoKo_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON BrowoKo_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user ON BrowoKo_messages(user_id);

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

CREATE TABLE IF NOT EXISTS BrowoKo_message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES BrowoKo_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON BrowoKo_message_reactions(message_id);

CREATE TABLE IF NOT EXISTS BrowoKo_message_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES BrowoKo_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_reads_message ON BrowoKo_message_reads(message_id);

CREATE TABLE IF NOT EXISTS BrowoKo_typing_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES BrowoKo_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation ON BrowoKo_typing_indicators(conversation_id);

CREATE TABLE IF NOT EXISTS BrowoKo_user_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL,
  status TEXT DEFAULT 'OFFLINE' CHECK (status IN ('ONLINE', 'AWAY', 'BUSY', 'OFFLINE')),
  custom_status TEXT,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_status_user ON BrowoKo_user_status(user_id);

CREATE TABLE IF NOT EXISTS BrowoKo_knowledge_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  parent_id UUID REFERENCES BrowoKo_knowledge_categories(id) ON DELETE SET NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_categories_parent ON BrowoKo_knowledge_categories(parent_id);

CREATE TABLE IF NOT EXISTS BrowoKo_knowledge_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES BrowoKo_knowledge_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID,
  tags TEXT[],
  is_published BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_articles_category ON BrowoKo_knowledge_articles(category_id);

CREATE TABLE IF NOT EXISTS BrowoKo_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  type TEXT CHECK (type IN ('BUG', 'FEATURE', 'IMPROVEMENT', 'QUESTION', 'OTHER')),
  priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  attachments TEXT[],
  assigned_to UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_user ON BrowoKo_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON BrowoKo_feedback(status);

-- ENABLE RLS (safe to run multiple times)
ALTER TABLE BrowoKo_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE BrowoKo_conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE BrowoKo_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE BrowoKo_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE BrowoKo_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE BrowoKo_message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE BrowoKo_typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE BrowoKo_user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE BrowoKo_knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE BrowoKo_knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE BrowoKo_feedback ENABLE ROW LEVEL SECURITY;

-- CREATE POLICIES (will fail if already exist, but that's OK - we'll fix after)
DO $$
BEGIN
  -- Conversations
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'browoko_conversations' AND policyname = 'chat_conversations_access') THEN
    CREATE POLICY "chat_conversations_access" ON BrowoKo_conversations FOR ALL TO authenticated USING (true);
  END IF;

  -- Members
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'browoko_conversation_members' AND policyname = 'chat_members_access') THEN
    CREATE POLICY "chat_members_access" ON BrowoKo_conversation_members FOR ALL TO authenticated USING (true);
  END IF;

  -- Messages
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'browoko_messages' AND policyname = 'chat_messages_access') THEN
    CREATE POLICY "chat_messages_access" ON BrowoKo_messages FOR ALL TO authenticated USING (true);
  END IF;

  -- Attachments
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'browoko_message_attachments' AND policyname = 'chat_attachments_access') THEN
    CREATE POLICY "chat_attachments_access" ON BrowoKo_message_attachments FOR ALL TO authenticated USING (true);
  END IF;

  -- Reactions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'browoko_message_reactions' AND policyname = 'chat_reactions_access') THEN
    CREATE POLICY "chat_reactions_access" ON BrowoKo_message_reactions FOR ALL TO authenticated USING (true);
  END IF;

  -- Reads
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'browoko_message_reads' AND policyname = 'chat_reads_access') THEN
    CREATE POLICY "chat_reads_access" ON BrowoKo_message_reads FOR ALL TO authenticated USING (true);
  END IF;

  -- Typing
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'browoko_typing_indicators' AND policyname = 'chat_typing_access') THEN
    CREATE POLICY "chat_typing_access" ON BrowoKo_typing_indicators FOR ALL TO authenticated USING (true);
  END IF;

  -- Status
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'browoko_user_status' AND policyname = 'chat_status_access') THEN
    CREATE POLICY "chat_status_access" ON BrowoKo_user_status FOR ALL TO authenticated USING (true);
  END IF;

  -- Knowledge Categories
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'browoko_knowledge_categories' AND policyname = 'knowledge_categories_access') THEN
    CREATE POLICY "knowledge_categories_access" ON BrowoKo_knowledge_categories FOR ALL TO authenticated USING (true);
  END IF;

  -- Knowledge Articles
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'browoko_knowledge_articles' AND policyname = 'knowledge_articles_access') THEN
    CREATE POLICY "knowledge_articles_access" ON BrowoKo_knowledge_articles FOR ALL TO authenticated USING (true);
  END IF;

  -- Feedback
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'browoko_feedback' AND policyname = 'feedback_access') THEN
    CREATE POLICY "feedback_access" ON BrowoKo_feedback FOR ALL TO authenticated USING (true);
  END IF;

END $$;
