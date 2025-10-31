-- ============================================================================
-- BROWO KOORDINATOR - SICHERE CHAT RLS POLICIES
-- ============================================================================
-- Ersetzt die unsicheren "Allow-All" Policies durch granulare, sichere Policies
-- Basiert auf: Conversation Membership, Author Ownership, Role-based Access
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP ALTE UNSICHERE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "chat_conversations_access" ON BrowoKo_conversations;
DROP POLICY IF EXISTS "chat_members_access" ON BrowoKo_conversation_members;
DROP POLICY IF EXISTS "chat_messages_access" ON BrowoKo_messages;
DROP POLICY IF EXISTS "chat_attachments_access" ON BrowoKo_message_attachments;
DROP POLICY IF EXISTS "chat_reactions_access" ON BrowoKo_message_reactions;
DROP POLICY IF EXISTS "chat_reads_access" ON BrowoKo_message_reads;
DROP POLICY IF EXISTS "chat_typing_access" ON BrowoKo_typing_indicators;
DROP POLICY IF EXISTS "chat_status_access" ON BrowoKo_user_status;
DROP POLICY IF EXISTS "knowledge_categories_access" ON BrowoKo_knowledge_categories;
DROP POLICY IF EXISTS "knowledge_articles_access" ON BrowoKo_knowledge_articles;
DROP POLICY IF EXISTS "feedback_access" ON BrowoKo_feedback;

-- ============================================================================
-- STEP 2: CONVERSATIONS - NUR MITGLIEDER SEHEN IHRE KONVERSATIONEN
-- ============================================================================

-- SELECT: Nur Konversationen, in denen ich Mitglied bin
CREATE POLICY "conversations_select_member"
ON BrowoKo_conversations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM BrowoKo_conversation_members m
    WHERE m.conversation_id = id
      AND m.user_id = auth.uid()
  )
);

-- INSERT: Nur ich selbst kann Konversationen erstellen (und werde automatisch Mitglied)
CREATE POLICY "conversations_insert_creator"
ON BrowoKo_conversations
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- UPDATE: Nur Admins der Konversation (oder HR/SUPERADMIN)
CREATE POLICY "conversations_update_admin"
ON BrowoKo_conversations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM BrowoKo_conversation_members m
    WHERE m.conversation_id = id
      AND m.user_id = auth.uid()
      AND m.role = 'ADMIN'
  )
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role IN ('HR', 'SUPERADMIN')
  )
);

-- DELETE: Nur der Ersteller oder HR/SUPERADMIN
CREATE POLICY "conversations_delete_creator_or_admin"
ON BrowoKo_conversations
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role IN ('HR', 'SUPERADMIN')
  )
);

-- ============================================================================
-- STEP 3: CONVERSATION_MEMBERS - NUR ADMINS VERWALTEN MITGLIEDER
-- ============================================================================

-- SELECT: Mitglieder sehen andere Mitglieder ihrer Konversation
CREATE POLICY "members_select_same_conversation"
ON BrowoKo_conversation_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM BrowoKo_conversation_members m
    WHERE m.conversation_id = conversation_id
      AND m.user_id = auth.uid()
  )
);

-- INSERT: Nur Conversation-Admins können Mitglieder hinzufügen
CREATE POLICY "members_insert_by_admin"
ON BrowoKo_conversation_members
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM BrowoKo_conversation_members m
    WHERE m.conversation_id = conversation_id
      AND m.user_id = auth.uid()
      AND m.role = 'ADMIN'
  )
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role IN ('HR', 'SUPERADMIN')
  )
);

-- UPDATE: Nur Admins können Rollen ändern
CREATE POLICY "members_update_by_admin"
ON BrowoKo_conversation_members
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM BrowoKo_conversation_members m
    WHERE m.conversation_id = conversation_id
      AND m.user_id = auth.uid()
      AND m.role = 'ADMIN'
  )
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role IN ('HR', 'SUPERADMIN')
  )
);

-- DELETE: Admins können Mitglieder entfernen, oder User sich selbst
CREATE POLICY "members_delete_by_admin_or_self"
ON BrowoKo_conversation_members
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() -- User kann sich selbst entfernen
  OR EXISTS (
    SELECT 1 
    FROM BrowoKo_conversation_members m
    WHERE m.conversation_id = conversation_id
      AND m.user_id = auth.uid()
      AND m.role = 'ADMIN'
  )
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role IN ('HR', 'SUPERADMIN')
  )
);

-- ============================================================================
-- STEP 4: MESSAGES - NUR MITGLIEDER SEHEN/SCHREIBEN NACHRICHTEN
-- ============================================================================

-- SELECT: Nur Nachrichten aus Konversationen, in denen ich Mitglied bin
CREATE POLICY "messages_select_member"
ON BrowoKo_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM BrowoKo_conversation_members m
    WHERE m.conversation_id = conversation_id
      AND m.user_id = auth.uid()
  )
);

-- INSERT: Nur Mitglieder können Nachrichten schreiben, author_id muss ich selbst sein
CREATE POLICY "messages_insert_member_as_author"
ON BrowoKo_messages
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() -- author_id = meine User-ID
  AND EXISTS (
    SELECT 1 
    FROM BrowoKo_conversation_members m
    WHERE m.conversation_id = conversation_id
      AND m.user_id = auth.uid()
  )
);

-- UPDATE: Nur eigene Nachrichten bearbeiten (innerhalb 15 Min z.B.)
CREATE POLICY "messages_update_own"
ON BrowoKo_messages
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND created_at > NOW() - INTERVAL '15 minutes' -- Optional: Edit-Timeout
);

-- DELETE: Nur eigene Nachrichten oder Conversation-Admins/HR
CREATE POLICY "messages_delete_own_or_admin"
ON BrowoKo_messages
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 
    FROM BrowoKo_conversation_members m
    WHERE m.conversation_id = conversation_id
      AND m.user_id = auth.uid()
      AND m.role = 'ADMIN'
  )
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role IN ('HR', 'SUPERADMIN')
  )
);

-- ============================================================================
-- STEP 5: MESSAGE_ATTACHMENTS - AN MESSAGE GEKOPPELT
-- ============================================================================

-- SELECT: Attachments sichtbar, wenn ich die Message sehen darf
CREATE POLICY "attachments_select_via_message"
ON BrowoKo_message_attachments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM BrowoKo_messages msg
    JOIN BrowoKo_conversation_members m ON m.conversation_id = msg.conversation_id
    WHERE msg.id = message_id
      AND m.user_id = auth.uid()
  )
);

-- INSERT: Nur wenn ich die Message erstellt habe
CREATE POLICY "attachments_insert_by_message_author"
ON BrowoKo_message_attachments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM BrowoKo_messages msg
    WHERE msg.id = message_id
      AND msg.user_id = auth.uid()
  )
);

-- DELETE: Nur eigene Attachments oder Message-Autor
CREATE POLICY "attachments_delete_by_message_author"
ON BrowoKo_message_attachments
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM BrowoKo_messages msg
    WHERE msg.id = message_id
      AND msg.user_id = auth.uid()
  )
);

-- ============================================================================
-- STEP 6: MESSAGE_REACTIONS - MITGLIEDER KÖNNEN REAGIEREN
-- ============================================================================

-- SELECT: Reactions sichtbar, wenn ich die Message sehen darf
CREATE POLICY "reactions_select_via_message"
ON BrowoKo_message_reactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM BrowoKo_messages msg
    JOIN BrowoKo_conversation_members m ON m.conversation_id = msg.conversation_id
    WHERE msg.id = message_id
      AND m.user_id = auth.uid()
  )
);

-- INSERT: Nur Mitglieder können reagieren, user_id muss ich selbst sein
CREATE POLICY "reactions_insert_member"
ON BrowoKo_message_reactions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 
    FROM BrowoKo_messages msg
    JOIN BrowoKo_conversation_members m ON m.conversation_id = msg.conversation_id
    WHERE msg.id = message_id
      AND m.user_id = auth.uid()
  )
);

-- DELETE: Nur eigene Reactions
CREATE POLICY "reactions_delete_own"
ON BrowoKo_message_reactions
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- STEP 7: MESSAGE_READS - TRACKING FÜR MITGLIEDER
-- ============================================================================

-- SELECT: Reads sichtbar, wenn ich Mitglied bin
CREATE POLICY "reads_select_via_message"
ON BrowoKo_message_reads
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM BrowoKo_messages msg
    JOIN BrowoKo_conversation_members m ON m.conversation_id = msg.conversation_id
    WHERE msg.id = message_id
      AND m.user_id = auth.uid()
  )
);

-- INSERT: Nur ich selbst kann meinen Read-Status setzen
CREATE POLICY "reads_insert_own"
ON BrowoKo_message_reads
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 
    FROM BrowoKo_messages msg
    JOIN BrowoKo_conversation_members m ON m.conversation_id = msg.conversation_id
    WHERE msg.id = message_id
      AND m.user_id = auth.uid()
  )
);

-- UPDATE: Nur eigener Read-Status
CREATE POLICY "reads_update_own"
ON BrowoKo_message_reads
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- STEP 8: TYPING_INDICATORS - EPHEMERAL STATE
-- ============================================================================

-- SELECT: Typing indicators nur für Konversations-Mitglieder
CREATE POLICY "typing_select_member"
ON BrowoKo_typing_indicators
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM BrowoKo_conversation_members m
    WHERE m.conversation_id = conversation_id
      AND m.user_id = auth.uid()
  )
);

-- INSERT: Nur Mitglieder können Typing setzen, user_id = ich selbst
CREATE POLICY "typing_insert_member"
ON BrowoKo_typing_indicators
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 
    FROM BrowoKo_conversation_members m
    WHERE m.conversation_id = conversation_id
      AND m.user_id = auth.uid()
  )
);

-- UPDATE: Nur eigener Typing-Status
CREATE POLICY "typing_update_own"
ON BrowoKo_typing_indicators
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- DELETE: Nur eigener Typing-Status
CREATE POLICY "typing_delete_own"
ON BrowoKo_typing_indicators
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- STEP 9: USER_STATUS - ONLINE/OFFLINE STATUS
-- ============================================================================

-- SELECT: Alle können User-Status sehen (für Online-Anzeige)
CREATE POLICY "status_select_all"
ON BrowoKo_user_status
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Nur eigener Status
CREATE POLICY "status_insert_own"
ON BrowoKo_user_status
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: Nur eigener Status
CREATE POLICY "status_update_own"
ON BrowoKo_user_status
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- DELETE: Nur eigener Status
CREATE POLICY "status_delete_own"
ON BrowoKo_user_status
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- STEP 10: KNOWLEDGE_CATEGORIES - PUBLIC READ, ADMIN WRITE
-- ============================================================================

-- SELECT: Alle können Kategorien sehen
CREATE POLICY "knowledge_cat_select_all"
ON BrowoKo_knowledge_categories
FOR SELECT
TO authenticated
USING (true);

-- INSERT/UPDATE/DELETE: Nur HR/SUPERADMIN
CREATE POLICY "knowledge_cat_insert_admin"
ON BrowoKo_knowledge_categories
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role IN ('HR', 'SUPERADMIN')
  )
);

CREATE POLICY "knowledge_cat_update_admin"
ON BrowoKo_knowledge_categories
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role IN ('HR', 'SUPERADMIN')
  )
);

CREATE POLICY "knowledge_cat_delete_admin"
ON BrowoKo_knowledge_categories
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role IN ('HR', 'SUPERADMIN')
  )
);

-- ============================================================================
-- STEP 11: KNOWLEDGE_ARTICLES - PUBLIC READ, RESTRICTED WRITE
-- ============================================================================

-- SELECT: Alle können Artikel sehen
CREATE POLICY "knowledge_art_select_all"
ON BrowoKo_knowledge_articles
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Nur HR/SUPERADMIN
CREATE POLICY "knowledge_art_insert_admin"
ON BrowoKo_knowledge_articles
FOR INSERT
TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role IN ('HR', 'SUPERADMIN')
  )
);

-- UPDATE: Nur Author oder HR/SUPERADMIN
CREATE POLICY "knowledge_art_update_author_or_admin"
ON BrowoKo_knowledge_articles
FOR UPDATE
TO authenticated
USING (
  author_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role IN ('HR', 'SUPERADMIN')
  )
);

-- DELETE: Nur Author oder HR/SUPERADMIN
CREATE POLICY "knowledge_art_delete_author_or_admin"
ON BrowoKo_knowledge_articles
FOR DELETE
TO authenticated
USING (
  author_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role IN ('HR', 'SUPERADMIN')
  )
);

-- ============================================================================
-- STEP 12: FEEDBACK - USER OWNS THEIR FEEDBACK
-- ============================================================================

-- SELECT: Alle sehen alle Feedback (für Transparency)
-- Alternative: Nur eigenes Feedback + HR/SUPERADMIN
CREATE POLICY "feedback_select_all"
ON BrowoKo_feedback
FOR SELECT
TO authenticated
USING (
  submitted_by = auth.uid() -- Nur eigenes Feedback
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role IN ('HR', 'SUPERADMIN')
  )
);

-- INSERT: Jeder kann Feedback erstellen, submitted_by = ich selbst
CREATE POLICY "feedback_insert_own"
ON BrowoKo_feedback
FOR INSERT
TO authenticated
WITH CHECK (submitted_by = auth.uid());

-- UPDATE: Nur eigenes ungelöstes Feedback oder HR/SUPERADMIN
CREATE POLICY "feedback_update_own_or_admin"
ON BrowoKo_feedback
FOR UPDATE
TO authenticated
USING (
  (submitted_by = auth.uid() AND status = 'PENDING') -- Nur eigenes pending Feedback
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role IN ('HR', 'SUPERADMIN')
  )
);

-- DELETE: Nur eigenes Feedback (innerhalb 24h) oder HR/SUPERADMIN
CREATE POLICY "feedback_delete_own_recent_or_admin"
ON BrowoKo_feedback
FOR DELETE
TO authenticated
USING (
  (submitted_by = auth.uid() AND created_at > NOW() - INTERVAL '24 hours')
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role IN ('HR', 'SUPERADMIN')
  )
);

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Run this to verify all policies are created:
/*
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  qual as using_clause,
  with_check
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
ORDER BY tablename, cmd, policyname;
*/

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- ✅ Conversations: Nur Mitglieder sehen/bearbeiten ihre Konversationen
-- ✅ Members: Nur Admins verwalten Mitgliedschaften
-- ✅ Messages: Nur Mitglieder senden/lesen Nachrichten, nur Autor bearbeitet
-- ✅ Attachments: Gekoppelt an Message-Autor
-- ✅ Reactions: Mitglieder können reagieren, nur eigene löschen
-- ✅ Reads: Nur eigener Read-Status
-- ✅ Typing: Nur eigener Typing-Status
-- ✅ User Status: Alle sehen, nur eigener bearbeitbar
-- ✅ Knowledge: Public read, Admin write
-- ✅ Feedback: User owns their feedback, HR manages all
-- ============================================================================
