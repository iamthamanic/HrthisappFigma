-- ============================================================================
-- 💬 BROWO KOORDINATOR - CHAT TABLES CREATION
-- ============================================================================
-- ANLEITUNG:
-- 1. Öffne https://supabase.com/dashboard/project/azmtojgikubegzusvhra/editor
-- 2. Kopiere DIESEN GESAMTEN Code (Cmd+A, Cmd+C)
-- 3. Füge ihn in den SQL Editor ein
-- 4. Klicke auf "Run"
-- 5. Prüfe: Es sollte "Success. No rows returned" erscheinen
-- ============================================================================

-- ============================================================================
-- CONVERSATIONS & MEMBERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS BrowoKo_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('DM', 'GROUP')),
  name TEXT,
  avatar_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_type ON BrowoKo_conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON BrowoKo_conversations(updated_at DESC);

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

-- ============================================================================
-- TYPING INDICATORS
-- ============================================================================

CREATE TABLE IF NOT EXISTS BrowoKo_typing_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES BrowoKo_conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  typing_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation ON BrowoKo_typing_indicators(conversation_id);

-- ============================================================================
-- USER PRESENCE (WICHTIG: Heißt "BrowoKo_user_presence", NICHT "BrowoKo_user_status"!)
-- ============================================================================

CREATE TABLE IF NOT EXISTS BrowoKo_user_presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  status TEXT DEFAULT 'OFFLINE' CHECK (status IN ('ONLINE', 'AWAY', 'BUSY', 'OFFLINE')),
  custom_status TEXT,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_presence_user ON BrowoKo_user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON BrowoKo_user_presence(last_seen_at DESC);

-- ============================================================================
-- KNOWLEDGE WIKI (WICHTIG: Heißt "BrowoKo_knowledge_pages", NICHT "_articles"!)
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
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_submitted_by ON BrowoKo_feedback(submitted_by);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON BrowoKo_feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_assigned_to ON BrowoKo_feedback(assigned_to);

CREATE TABLE IF NOT EXISTS BrowoKo_feedback_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id UUID REFERENCES BrowoKo_feedback(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_comments_feedback ON BrowoKo_feedback_comments(feedback_id);

-- ============================================================================
-- ENABLE RLS (Row Level Security)
-- ============================================================================

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

-- ============================================================================
-- DROP EXISTING POLICIES (falls welche existieren)
-- ============================================================================

-- Conversations
DROP POLICY IF EXISTS "chat_conversations_access" ON BrowoKo_conversations;
DROP POLICY IF EXISTS "chat_conversation_members_access" ON BrowoKo_conversation_members;

-- Messages
DROP POLICY IF EXISTS "chat_messages_access" ON BrowoKo_messages;
DROP POLICY IF EXISTS "chat_attachments_access" ON BrowoKo_message_attachments;
DROP POLICY IF EXISTS "chat_reactions_access" ON BrowoKo_message_reactions;
DROP POLICY IF EXISTS "chat_reads_access" ON BrowoKo_message_reads;

-- Presence
DROP POLICY IF EXISTS "chat_typing_access" ON BrowoKo_typing_indicators;
DROP POLICY IF EXISTS "chat_presence_access" ON BrowoKo_user_presence;

-- Knowledge & Feedback
DROP POLICY IF EXISTS "chat_knowledge_access" ON BrowoKo_knowledge_pages;
DROP POLICY IF EXISTS "chat_feedback_access" ON BrowoKo_feedback;
DROP POLICY IF EXISTS "chat_feedback_comments_access" ON BrowoKo_feedback_comments;

-- ============================================================================
-- CREATE NEW POLICIES (Einfache Policies: Alle eingeloggten User können alles)
-- ============================================================================

CREATE POLICY "chat_conversations_access" ON BrowoKo_conversations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "chat_conversation_members_access" ON BrowoKo_conversation_members
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "chat_messages_access" ON BrowoKo_messages
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "chat_attachments_access" ON BrowoKo_message_attachments
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "chat_reactions_access" ON BrowoKo_message_reactions
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "chat_reads_access" ON BrowoKo_message_reads
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "chat_typing_access" ON BrowoKo_typing_indicators
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "chat_presence_access" ON BrowoKo_user_presence
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "chat_knowledge_access" ON BrowoKo_knowledge_pages
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "chat_feedback_access" ON BrowoKo_feedback
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "chat_feedback_comments_access" ON BrowoKo_feedback_comments
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- ✅ FERTIG! Alle Tabellen und Policies erstellt!
-- ============================================================================

SELECT 'Chat Tables erfolgreich erstellt!' AS success_message;
