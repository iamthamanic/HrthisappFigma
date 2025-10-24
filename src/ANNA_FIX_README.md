# 🚀 ANNA TEAMLEAD FIX - COPY & PASTE

## **Problem**
❌ Anna Admin kann Tina's Urlaubsantrag **NICHT genehmigen**

## **Lösung (< 30 Sekunden)**

### **📋 COPY SQL:**
1. Öffne: **`/ANNA_TEAMLEAD_COPY_PASTE.sql`**
2. **Cmd+A** (alles markieren)
3. **Cmd+C** (kopieren)

### **▶️ RUN SQL:**
1. **Supabase SQL Editor** öffnen
2. **Cmd+V** (einfügen)
3. **Run** klicken ▶️

### **✅ FERTIG!**
Anna kann jetzt Tina's Anträge genehmigen!

---

## **Expected Output:**
```
✅ NOTICE: Anna Admin is now TEAMLEAD (Primary) in team <uuid>
✅ NOTICE: Tina Test is MEMBER in team <uuid>
✅ NOTICE: Anna can now approve Tina's leave requests!

✅ VERIFICATION:
anna@admin.com | ADMIN | TEAMLEAD | priority_tag=1
tina@test.com  | USER  | MEMBER   | priority_tag=null

🎉 FINAL RESULT:
anna_is_teamlead: 1
tina_is_member: 1
same_team: true
```

---

## **Test:**
1. **Login** als Anna Admin
2. **Zeit & Urlaub** → **Mein Team**
3. **Tina's Antrag** sollte sichtbar sein ✅
4. **"Genehmigen"** funktioniert ✅

---

## **Dateien:**

| Datei | Zweck |
|-------|-------|
| **`/ANNA_TEAMLEAD_COPY_PASTE.sql`** | ⭐ **SQL ZUM KOPIEREN** (Cmd+A, Cmd+C) |
| `/ANNA_TEAMLEAD_QUICK_FIX.md` | Ausführliche Dokumentation |
| `/ANNA_FIX_README.md` | Diese Datei (Quick Start) |

---

**JETZT `/ANNA_TEAMLEAD_COPY_PASTE.sql` ÖFFNEN UND KOPIEREN!** 🚀
