# BrowoKoordinator-Server Debug - BOOT_ERROR

## Problem
```
BOOT_ERROR: Function failed to start (please check logs)
```

## Was du jetzt machen musst:

### 1. Logs im Supabase Dashboard öffnen

1. Gehe zu: https://supabase.com/dashboard
2. Wähle dein Projekt
3. Gehe zu **Edge Functions**
4. Klicke auf **"BrowoKoordinator-Server"**
5. Klicke auf den **"Logs"** Tab
6. Scrolle nach unten zu den neuesten Logs

### 2. Nach Fehlermeldungen suchen

Suche nach:
- ❌ Roten Error-Meldungen
- ⚠️ "Cannot find module" Fehler
- ⚠️ "Import" Fehler
- ⚠️ "Syntax" Fehler
- ⚠️ Stack Traces

### 3. Kopiere die komplette Fehlermeldung

**WICHTIG:** Kopiere die komplette Fehlermeldung aus den Logs und schicke sie mir!

## Häufige Ursachen für BOOT_ERROR:

### A) Import-Fehler
```
Cannot find module './core-buckets.ts'
```
→ Eine der importierten Dateien wurde nicht gefunden

### B) Syntax-Fehler
```
SyntaxError: Unexpected token
```
→ Es gibt einen Syntax-Fehler in einer der Dateien

### C) Fehlende Environment Variables
```
Error: SUPABASE_URL is not defined
```
→ Environment Variables fehlen

### D) Service-Initialisierung fehlgeschlagen
```
Error in core-buckets.ts
```
→ Einer der Services kann nicht initialisiert werden

## Was ich brauche um zu helfen:

Bitte schicke mir:
1. ✅ Die komplette Fehlermeldung aus den Logs
2. ✅ Screenshot der Logs (falls du nichts kopieren kannst)
3. ✅ Welche Dateien du genau deployed hast

## Wichtig:

Hast du ALLE 12 Dateien deployed?
```
□ index.ts
□ core-buckets.ts
□ core-kv.ts
□ core-supabaseClient.ts
□ core-workflows.ts
□ routes-entities.ts
□ routes-itEquipment.ts
□ routes-storage.ts
□ routes-tests.ts
□ routes-users.ts
□ routes-workflows.ts
□ README.md (optional)
```

Sind alle Dateien im GLEICHEN Ordner "BrowoKoordinator-Server"?

---

**NÄCHSTER SCHRITT:** Schau in die Logs und schicke mir die Fehlermeldung!
