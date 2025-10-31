# 🔧 CHAT EDGE FUNCTION - TABLE NAMES FIX

## Problem
PostgreSQL hat die Tabellen in **Kleinbuchstaben** erstellt (`browoko_conversations`), aber die Edge Function verwendet **Groß-/Kleinschreibung** (`BrowoKo_conversations`).

## Lösung
Alle `.from('BrowoKo_*')` Aufrufe müssen zu `.from('browoko_*')` geändert werden.

## Anzahl der Änderungen
**56 Stellen** in der Datei `/supabase/functions/BrowoKoordinator-Chat/index.ts`

## Mapping (Search & Replace)
```
BrowoKo_conversations          → browoko_conversations
BrowoKo_conversation_members   → browoko_conversation_members
BrowoKo_messages              → browoko_messages
BrowoKo_message_attachments   → browoko_message_attachments
BrowoKo_message_reactions     → browoko_message_reactions
BrowoKo_message_reads         → browoko_message_reads
BrowoKo_typing_indicators     → browoko_typing_indicators
BrowoKo_user_presence         → browoko_user_presence
BrowoKo_knowledge_pages       → browoko_knowledge_pages
BrowoKo_feedback              → browoko_feedback
BrowoKo_feedback_comments     → browoko_feedback_comments
```

## Anleitung für Supabase Dashboard
1. Öffne: https://supabase.com/dashboard/project/azmtojgikubegzusvhra/functions/BrowoKoordinator-Chat
2. Klicke auf "Edit"
3. Verwende **Search & Replace (Cmd+H)** für jede Zeile oben
4. Klicke auf "Deploy"

## Alternative: Neue Version
Ich erstelle eine neue Version der Datei mit allen Änderungen.
