# 🚀 CHAT EDGE FUNCTION FIX - COPY-PASTE DEPLOYMENT

## Problem
PostgreSQL speichert Tabellennamen in Kleinbuchstaben (`browoko_conversations`), aber die Edge Function verwendet Groß-/Kleinschreibung (`BrowoKo_conversations`).

## Lösung
Im Supabase Dashboard die Edge Function bearbeiten und **Search & Replace** verwenden.

---

## 📋 ANLEITUNG (Schritt für Schritt):

### 1. Öffne die Edge Function
https://supabase.com/dashboard/project/azmtojgikubegzusvhra/functions/BrowoKoordinator-Chat

### 2. Klicke auf "Edit"

### 3. Drücke Cmd+H (Mac) oder Ctrl+H (Windows)
Das öffnet das "Search & Replace" Fenü

### 4. Führe diese Replacements aus (IN DIESER REIHENFOLGE):

**WICHTIG:** Setze "Match case" (Groß-/Kleinschreibung beachten) AUF **AN**!

```
Suche:  'BrowoKo_conversations'
Ersetze: 'browoko_conversations'
→ Klicke "Replace All"

Suche:  'BrowoKo_conversation_members'
Ersetze: 'browoko_conversation_members'
→ Klicke "Replace All"

Suche:  'BrowoKo_messages'
Ersetze: 'browoko_messages'
→ Klicke "Replace All"

Suche:  'BrowoKo_message_attachments'
Ersetze: 'browoko_message_attachments'
→ Klicke "Replace All"

Suche:  'BrowoKo_message_reactions'
Ersetze: 'browoko_message_reactions'
→ Klicke "Replace All"

Suche:  'BrowoKo_message_reads'
Ersetze: 'browoko_message_reads'
→ Klicke "Replace All"

Suche:  'BrowoKo_typing_indicators'
Ersetze: 'browoko_typing_indicators'
→ Klicke "Replace All"

Suche:  'BrowoKo_user_presence'
Ersetze: 'browoko_user_presence'
→ Klicke "Replace All"

Suche:  'BrowoKo_knowledge_pages'
Ersetze: 'browoko_knowledge_pages'
→ Klicke "Replace All"

Suche:  'BrowoKo_feedback'
Ersetze: 'browoko_feedback'
→ Klicke "Replace All"

Suche:  'BrowoKo_feedback_comments'
Ersetze: 'browoko_feedback_comments'
→ Klicke "Replace All"
```

### 5. Änderungen prüfen
Scrolle durch den Code und überprüfe, dass jetzt alle `.from('browoko_...')` in Kleinbuchstaben sind.

### 6. Version updaten
Suche nach:
```typescript
version: '1.0.0'
```

Ändere zu:
```typescript
version: '1.0.1'
```

### 7. Deploy!
Klicke auf **"Deploy"**

---

## ✅ ERWARTETES ERGEBNIS

Nach dem Deployment solltest du sehen:
```
Successfully deployed BrowoKoordinator-Chat v1.0.1
```

---

## 🧪 DANACH: TEST

Führe den Quick Test nochmal aus:

```javascript
await chatQuickTest()
```

**Erwartetes Ergebnis:**
```
📊 QUICK TEST SUMMARY
✅ Erfolgreich: 5/5
❌ Fehler: 0/5
🎉 ALLE TESTS BESTANDEN!
```

---

## 📊 ANZAHL DER ÄNDERUNGEN

- **56 Stellen** werden geändert
- **11 Tabellennamen** werden korrigiert
- **1 Version** wird erhöht (1.0.0 → 1.0.1)

---

**Los geht's! Führe die Replacements jetzt im Supabase Dashboard aus!** 🚀
