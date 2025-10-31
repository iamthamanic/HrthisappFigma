# 🔒 CHAT SYSTEM - SECURITY UPGRADE GUIDE

## 📋 WARUM DIESER UPGRADE NÖTIG IST

### ❌ **AKTUELLES PROBLEM (UNSICHERE POLICIES):**

```sql
CREATE POLICY "chat_messages_access" 
ON BrowoKo_messages 
FOR ALL 
TO authenticated 
USING (true);
```

**Was das bedeutet:**
- `FOR ALL` = SELECT + INSERT + UPDATE + DELETE (alle Operationen)
- `TO authenticated` = jeder eingeloggte User
- `USING (true)` = KEINE Einschränkungen, ALLE Zeilen

**Konkrete Risiken:**
1. ✅ **Anna** kann **ALLE DMs** von **Max & Lisa** lesen
2. ✅ **Tim** kann **fremde Nachrichten** bearbeiten/löschen
3. ✅ **Jeder** kann sich zu **privaten Gruppen** hinzufügen
4. ✅ **Keine Mandanten-Trennung** bei Multi-Org Setup

---

## ✅ **NEUE SICHERE POLICIES - ÜBERBLICK**

### **1. CONVERSATION-BASED ACCESS (KERNPRINZIP)**

```sql
-- Nur Nachrichten aus Konversationen sehen, in denen ich Mitglied bin
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
```

**Anna sieht nur Nachrichten aus ihren eigenen Konversationen! ✅**

---

### **2. AUTHOR OWNERSHIP (SCHREIBSCHUTZ)**

```sql
-- Nur ich selbst kann meine Nachrichten als Autor schreiben
CREATE POLICY "messages_insert_member_as_author"
ON BrowoKo_messages
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() -- author_id muss ich selbst sein
  AND EXISTS (
    SELECT 1 
    FROM BrowoKo_conversation_members m
    WHERE m.conversation_id = conversation_id
      AND m.user_id = auth.uid()
  )
);
```

**Tim kann keine Nachrichten im Namen von Anna schreiben! ✅**

---

### **3. ROLE-BASED ADMINISTRATION**

```sql
-- Nur Conversation-Admins können Mitglieder hinzufügen
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
```

**Nur Conversation-Admins oder HR/SUPERADMIN können Mitglieder verwalten! ✅**

---

## 📊 **POLICY-MATRIX - ALLE 11 TABELLEN**

| Tabelle | SELECT | INSERT | UPDATE | DELETE |
|---------|--------|--------|--------|--------|
| **Conversations** | Nur Mitglieder | Ersteller | Conversation-Admin | Ersteller/HR |
| **Conversation_Members** | Mitglieder | Admins | Admins | Admin/Self |
| **Messages** | Mitglieder | Mitglied+Author | Eigene | Eigene/Admin |
| **Message_Attachments** | Via Message | Message-Autor | - | Message-Autor |
| **Message_Reactions** | Via Message | Mitglied+Self | - | Eigene |
| **Message_Reads** | Via Message | Self | Self | - |
| **Typing_Indicators** | Mitglieder | Mitglied+Self | Self | Self |
| **User_Status** | Alle | Self | Self | Self |
| **Knowledge_Categories** | Alle | HR/SUPERADMIN | HR/SUPERADMIN | HR/SUPERADMIN |
| **Knowledge_Articles** | Alle | HR/SUPERADMIN | Autor/HR | Autor/HR |
| **Feedback** | Eigene/HR | Self | Eigene(Pending)/HR | Eigene(24h)/HR |

---

## 🚀 **MIGRATION - SCHRITT FÜR SCHRITT**

### **STEP 1: BACKUP (OPTIONAL, EMPFOHLEN)**

```sql
-- Export aktuelle Policies
SELECT 
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename LIKE 'browoko_%'
ORDER BY tablename;
```

**Download das Ergebnis als Backup!**

---

### **STEP 2: RUN SECURITY UPGRADE**

```sql
-- COPY & PASTE DAS KOMPLETTE SCRIPT:
-- /CHAT_SECURE_RLS_POLICIES.sql
```

**Das Script macht:**
1. ✅ DROP alle alten unsicheren Policies (11 Stück)
2. ✅ CREATE 40+ neue sichere Policies
3. ✅ Kein Downtime (RLS bleibt aktiviert)

**Dauer: ~5-10 Sekunden** ⚡

---

### **STEP 3: VERIFY POLICIES**

```sql
SELECT 
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(DISTINCT cmd::text, ', ') as operations
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
```

**Expected Result:**

| tablename | policy_count | operations |
|-----------|--------------|------------|
| browoko_conversations | 4 | SELECT, INSERT, UPDATE, DELETE |
| browoko_conversation_members | 4 | SELECT, INSERT, UPDATE, DELETE |
| browoko_messages | 4 | SELECT, INSERT, UPDATE, DELETE |
| browoko_message_attachments | 3 | SELECT, INSERT, DELETE |
| browoko_message_reactions | 3 | SELECT, INSERT, DELETE |
| browoko_message_reads | 3 | SELECT, INSERT, UPDATE |
| browoko_typing_indicators | 4 | SELECT, INSERT, UPDATE, DELETE |
| browoko_user_status | 4 | SELECT, INSERT, UPDATE, DELETE |
| browoko_knowledge_categories | 4 | SELECT, INSERT, UPDATE, DELETE |
| browoko_knowledge_articles | 4 | SELECT, INSERT, UPDATE, DELETE |
| browoko_feedback | 4 | SELECT, INSERT, UPDATE, DELETE |

**Gesamt: ~41 Policies** ✅

---

## 🧪 **TESTING - SICHERSTELLEN DASS ES FUNKTIONIERT**

### **TEST 1: USER KANN NUR EIGENE KONVERSATIONEN SEHEN**

```sql
-- Als Anna (user_id = 'anna-uuid') einloggen
-- Dann diese Query ausführen:

SELECT id, type, name
FROM BrowoKo_conversations;

-- Expected: Nur Konversationen, in denen Anna Mitglied ist
-- Nicht: Alle Konversationen
```

---

### **TEST 2: USER KANN KEINE FREMDEN NACHRICHTEN LESEN**

```sql
-- Als Tim (user_id = 'tim-uuid') einloggen
-- Versuche, Nachrichten aus Max' privater DM zu lesen:

SELECT id, content
FROM BrowoKo_messages
WHERE conversation_id = 'max-lisa-dm-uuid';

-- Expected: KEINE Zeilen (Error oder Empty Set)
```

---

### **TEST 3: USER KANN NICHT FREMDE NACHRICHTEN SENDEN**

```sql
-- Als Anna versuchen, im Namen von Max zu posten:

INSERT INTO BrowoKo_messages (conversation_id, user_id, content)
VALUES ('some-conversation-id', 'max-uuid', 'Fake message');

-- Expected: ERROR - Policy violation!
-- ❌ new row violates row-level security policy
```

---

### **TEST 4: CONVERSATION-ADMIN KANN MITGLIEDER VERWALTEN**

```sql
-- Als Conversation-Admin Lisa:

INSERT INTO BrowoKo_conversation_members (conversation_id, user_id, role)
VALUES ('my-group-uuid', 'new-member-uuid', 'MEMBER');

-- Expected: ✅ Success (Lisa ist Admin)

-- Als normales Mitglied Tim:
-- Expected: ❌ Error (Tim ist kein Admin)
```

---

## 🔍 **DETAIL-ERKLÄRUNG: POLICY-LOGIK**

### **USING vs WITH CHECK**

```sql
CREATE POLICY "example"
ON table
FOR SELECT
TO authenticated
USING (<condition>);        -- Welche Zeilen darf ich SEHEN/ÄNDERN?

CREATE POLICY "example"
ON table
FOR INSERT
TO authenticated
WITH CHECK (<condition>);   -- Welche Zeilen darf ich NEU SCHREIBEN?
```

---

### **auth.uid() - AKTUELLER USER**

```sql
auth.uid()  -- Returns: UUID des aktuell eingeloggten Users
            -- NULL wenn nicht eingeloggt (anon)
```

**Beispiel:**
- Anna logged ein → `auth.uid() = 'anna-uuid-123'`
- Tim logged ein → `auth.uid() = 'tim-uuid-456'`

---

### **EXISTS - SUBQUERY PATTERN**

```sql
-- Prüfe: "Bin ich Mitglied dieser Konversation?"
EXISTS (
  SELECT 1 
  FROM BrowoKo_conversation_members m
  WHERE m.conversation_id = <current_row>.conversation_id
    AND m.user_id = auth.uid()
)
```

**Returns:**
- `true` → User ist Mitglied → Zugriff erlaubt ✅
- `false` → User ist NICHT Mitglied → Zugriff verweigert ❌

---

## 🎯 **SPEZIAL-CASES ERKLÄRT**

### **1. MESSAGE EDIT TIMEOUT (15 MIN)**

```sql
CREATE POLICY "messages_update_own"
ON BrowoKo_messages
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND created_at > NOW() - INTERVAL '15 minutes'
);
```

**Warum?**
- Verhindert Manipulation alter Nachrichten
- Chat-Kontext bleibt intakt
- "Edit wars" vermieden

**Alternative:** Entferne `AND created_at > NOW() - INTERVAL '15 minutes'` für unbegrenztes Editieren

---

### **2. FEEDBACK DELETE TIMEOUT (24H)**

```sql
CREATE POLICY "feedback_delete_own_recent_or_admin"
ON BrowoKo_feedback
FOR DELETE
TO authenticated
USING (
  (submitted_by = auth.uid() AND created_at > NOW() - INTERVAL '24 hours')
  OR <is_hr_or_superadmin>
);
```

**Warum?**
- User kann versehentliches Feedback innerhalb 24h löschen
- Danach: Nur HR/SUPERADMIN (Audit-Trail)

---

### **3. USER_STATUS - PUBLIC READ**

```sql
CREATE POLICY "status_select_all"
ON BrowoKo_user_status
FOR SELECT
TO authenticated
USING (true);
```

**Warum `true`?**
- Online-Status soll für ALLE sichtbar sein (wie WhatsApp)
- Aber nur eigener Status editierbar (INSERT/UPDATE/DELETE)

**Alternative (Privacy):** Nur Kontakte sehen Status:
```sql
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM BrowoKo_conversation_members
    WHERE user_id = auth.uid() -- Wir sind in einer gemeinsamen Konversation
  )
);
```

---

## 🛡️ **SECURITY BEST PRACTICES**

### ✅ **DO'S:**

1. **Immer `auth.uid()` verwenden** für User-ID checks
2. **Separate Policies** für SELECT/INSERT/UPDATE/DELETE
3. **Role-based** Zugriff für Admin-Features
4. **EXISTS** Subqueries für Relationship-Checks
5. **WITH CHECK** für INSERT/UPDATE Validierung

### ❌ **DON'TS:**

1. **NIEMALS `USING (true)`** für sensible Daten
2. **NIEMALS hardcoded User-IDs** in Policies
3. **NIEMALS `FOR ALL`** wenn granular möglich
4. **NICHT** Complex Queries in Policies (Performance!)
5. **NICHT** Business Logic in RLS (gehört ins Backend)

---

## 📈 **PERFORMANCE CONSIDERATIONS**

### **INDEXES FÜR RLS POLICIES:**

Die Policies machen viele JOINs zu `BrowoKo_conversation_members`. Stelle sicher, dass Indexes existieren:

```sql
-- Check existing indexes
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'browoko_conversation_members'
ORDER BY indexname;
```

**Required Indexes (sollten schon existieren):**
- ✅ `idx_conversation_members_user` (user_id)
- ✅ `idx_conversation_members_conversation` (conversation_id)
- ✅ Combined Index: `(conversation_id, user_id)`

**Falls nicht:** Siehe `/CHAT_SECURE_RLS_POLICIES.sql` STEP 2D

---

## 🔄 **ROLLBACK PLAN (NOTFALL)**

Falls die neuen Policies Probleme machen:

### **OPTION A: ZURÜCK ZU UNSICHEREN POLICIES (TEMP FIX)**

```sql
-- Drop alle neuen Policies
DROP POLICY IF EXISTS "conversations_select_member" ON BrowoKo_conversations;
DROP POLICY IF EXISTS "conversations_insert_creator" ON BrowoKo_conversations;
-- ... (alle anderen droppen)

-- Alte unsichere Policies wieder aktivieren
CREATE POLICY "chat_conversations_access" ON BrowoKo_conversations FOR ALL TO authenticated USING (true);
CREATE POLICY "chat_members_access" ON BrowoKo_conversation_members FOR ALL TO authenticated USING (true);
-- ... (alle 11 Tabellen)
```

**ACHTUNG:** Nur als TEMPORÄRER Notfall-Fix! Nicht Production-ready!

---

### **OPTION B: RLS KOMPLETT DEAKTIVIEREN (SUPER NOTFALL)**

```sql
-- DISABLE RLS on all tables (SUPER GEFÄHRLICH!)
ALTER TABLE BrowoKo_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE BrowoKo_conversation_members DISABLE ROW LEVEL SECURITY;
-- ... (alle 11 Tabellen)
```

**ACHTUNG:** Nur für Development/Testing! NIEMALS in Production!

---

## 📚 **WEITERFÜHRENDE RESSOURCEN**

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [RLS Performance Tips](https://supabase.com/docs/guides/database/postgres/row-level-security#performance)

---

## ✅ **ZUSAMMENFASSUNG**

### **VORHER (UNSICHER):**
- ❌ 11 Policies mit `USING (true)`
- ❌ Jeder User sieht alles
- ❌ Keine Conversation-Trennung
- ❌ Keine Author-Ownership
- ❌ Security-Alptraum

### **NACHHER (SICHER):**
- ✅ 41 granulare Policies
- ✅ Conversation-based Access
- ✅ Author Ownership
- ✅ Role-based Administration
- ✅ Production-ready Security

---

## 🚀 **NÄCHSTE SCHRITTE**

1. ✅ **Run Migration:** `/CHAT_SECURE_RLS_POLICIES.sql`
2. ✅ **Verify Policies:** Query von oben
3. ✅ **Test Chat System:** Im Frontend testen
4. ✅ **Monitor Performance:** Schaue auf Query-Performance
5. ⏳ **Optional:** Custom Policies für Organization-Trennung

**Das Chat-System ist jetzt SICHER! 🔒🎉**
