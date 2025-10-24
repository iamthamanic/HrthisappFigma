# 🚀 QUICK START: SQL AUSFÜHREN

## **PROBLEM:**
```
❌ Error: relation "document_audit_logs" does not exist
❌ Error: column d.file_path does not exist
❌ Error: column u.full_name does not exist
```

---

## **LÖSUNG IN 3 SCHRITTEN:**

### **1. Öffne Supabase SQL Editor**
- Gehe zu: https://supabase.com/dashboard
- Wähle dein Projekt
- Klicke: "SQL Editor" → "New Query"

### **2. Kopiere & Führe SQL aus**
- Öffne: `/QUICK_FIX_DOCUMENT_AUDIT_COMPLETE.sql`
- Kopiere alles (Strg+A, Strg+C)
- Paste in SQL Editor (Strg+V)
- Klicke "Run" (Strg+Enter)

### **3. Verifiziere**
```sql
SELECT COUNT(*) FROM document_audit_logs;
SELECT * FROM document_audit_report LIMIT 1;
```

---

## **DANN:**
- Hard Refresh (Strg+Shift+R)
- Öffne "Meine Daten" → Tab "Logs"
- **Erwartung:** Keine Errors! ✅

---

## **WAS WIRD ERSTELLT:**
✅ Tabelle `document_audit_logs`
✅ Performance-Indizes
✅ Trigger (automatisches Logging)
✅ View `document_audit_report`
✅ Permissions

---

**FERTIG!** 🎉
