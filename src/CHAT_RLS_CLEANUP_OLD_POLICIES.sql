-- ============================================================================
-- BROWO KOORDINATOR - CLEANUP OLD CHAT POLICIES
-- ============================================================================
-- Droppt alle ALTEN Policies, die noch neben den neuen existieren
-- Run this AFTER the main migration to remove duplicates
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP OLD POLICIES FROM CONVERSATIONS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their conversations" ON BrowoKo_conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON BrowoKo_conversations;
DROP POLICY IF EXISTS "Admins can update conversations" ON BrowoKo_conversations;

-- ============================================================================
-- STEP 2: DROP OLD POLICIES FROM CONVERSATION_MEMBERS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view members of their conversations" ON BrowoKo_conversation_members;
DROP POLICY IF EXISTS "Admins can add members" ON BrowoKo_conversation_members;

-- ============================================================================
-- STEP 3: DROP OLD POLICIES FROM MESSAGES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON BrowoKo_messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON BrowoKo_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON BrowoKo_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON BrowoKo_messages;

-- ============================================================================
-- STEP 4: DROP OLD POLICIES FROM MESSAGE_ATTACHMENTS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view attachments in their conversations" ON BrowoKo_message_attachments;

-- ============================================================================
-- STEP 5: DROP OLD POLICIES FROM MESSAGE_REACTIONS
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage reactions in their conversations" ON BrowoKo_message_reactions;

-- ============================================================================
-- STEP 6: DROP OLD POLICIES FROM MESSAGE_READS
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage their read receipts" ON BrowoKo_message_reads;

-- ============================================================================
-- STEP 7: DROP OLD POLICIES FROM TYPING_INDICATORS
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage their typing status" ON BrowoKo_typing_indicators;

-- ============================================================================
-- STEP 8: DROP OLD POLICIES FROM KNOWLEDGE_PAGES
-- ============================================================================

DROP POLICY IF EXISTS "Everyone can view knowledge pages" ON BrowoKo_knowledge_pages;
DROP POLICY IF EXISTS "Authenticated users can create knowledge pages" ON BrowoKo_knowledge_pages;
DROP POLICY IF EXISTS "Creators can update their knowledge pages" ON BrowoKo_knowledge_pages;
DROP POLICY IF EXISTS "Creators can delete their knowledge pages" ON BrowoKo_knowledge_pages;

-- ============================================================================
-- STEP 9: DROP OLD POLICIES FROM FEEDBACK
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own feedback" ON BrowoKo_feedback;
DROP POLICY IF EXISTS "Authenticated users can submit feedback" ON BrowoKo_feedback;
DROP POLICY IF EXISTS "Admins can update feedback" ON BrowoKo_feedback;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Run this after cleanup to verify only NEW policies remain:
/*
SELECT 
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ' ORDER BY policyname) as policy_names
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename LIKE 'browoko_%'
  AND (
    tablename LIKE '%conversation%' 
    OR tablename LIKE '%message%'
    OR tablename LIKE '%typing%'
    OR tablename = 'browoko_user_status'
    OR tablename LIKE '%knowledge%'
    OR tablename = 'browoko_feedback'
  )
GROUP BY tablename
ORDER BY tablename;
*/

-- ============================================================================
-- EXPECTED RESULT AFTER CLEANUP:
-- ============================================================================
-- browoko_conversation_members: 4 policies (all starting with "members_")
-- browoko_conversations: 4 policies (all starting with "conversations_")
-- browoko_feedback: 4 policies (all starting with "feedback_")
-- browoko_knowledge_articles: 4 policies (all starting with "knowledge_art_")
-- browoko_knowledge_categories: 4 policies (all starting with "knowledge_cat_")
-- browoko_knowledge_pages: 4 policies (all starting with "knowledge_pag_" or similar)
-- browoko_message_attachments: 3 policies (all starting with "attachments_")
-- browoko_message_reactions: 3 policies (all starting with "reactions_")
-- browoko_message_reads: 3 policies (all starting with "reads_")
-- browoko_messages: 4 policies (all starting with "messages_")
-- browoko_typing_indicators: 4 policies (all starting with "typing_")
-- browoko_user_status: 4 policies (all starting with "status_")
-- ============================================================================
