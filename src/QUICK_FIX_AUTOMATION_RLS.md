# ⚡ **QUICK FIX: AUTOMATION "FAILED TO FETCH" ERROR**

**Problem:** API Keys laden nicht, "Failed to fetch" Error
**Lösung:** RLS Policies fehlt `admin` Rolle
**Zeit:** 2 Minuten

---

## 🚀 **SCHNELLE LÖSUNG (COPY & PASTE)**

### **SCHRITT 1: SQL IN SUPABASE AUSFÜHREN**

```bash
1. Öffne: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
2. Kopiere GESAMTEN Inhalt von: /v4.11.8_AUTOMATION_RLS_FIX.sql
3. Klicke "RUN"
4. Warte auf "✅ AUTOMATION RLS FIX COMPLETE!"
```

---

### **SCHRITT 2: BROWSER REFRESH**

```bash
# WICHTIG: Hard Refresh!
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

---

### **SCHRITT 3: TESTEN**

```bash
1. Navigate zu: Automationenverwaltung
2. Sollte jetzt funktionieren! ✅
```

---

## 🔍 **WENN ES IMMER NOCH NICHT FUNKTIONIERT**

### **Check 1: User Role**

```sql
-- In Supabase SQL Editor:
SELECT role FROM users WHERE id = auth.uid();
```

**Erwartete Ausgabe:** `admin`, `hr`, oder `superadmin`

**Wenn NULL oder andere Rolle:**
```sql
UPDATE users SET role = 'admin' WHERE id = auth.uid();
```

---

### **Check 2: Organization ID**

```sql
SELECT organization_id FROM users WHERE id = auth.uid();
```

**Erwartete Ausgabe:** Eine UUID (z.B. `abc-123-...`)

**Wenn NULL:**
```sql
UPDATE users 
SET organization_id = (SELECT id FROM organizations LIMIT 1)
WHERE id = auth.uid();
```

---

## 📖 **VOLLSTÄNDIGE DOKUMENTATION**

Siehe: `/v4.11.8_AUTOMATION_RLS_FIX.md`

---

## ✅ **FERTIG!**

Nach diesen Schritten sollte der "Failed to fetch" Error behoben sein!

**Falls nicht:** Debug-Info sammeln und mir schicken:
1. Screenshot vom Error
2. Output von: `SELECT id, role, organization_id FROM users WHERE id = auth.uid();`
3. Browser Console Errors (F12 → Console)
