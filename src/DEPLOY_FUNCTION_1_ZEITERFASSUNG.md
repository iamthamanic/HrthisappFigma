# 🚀 **FUNCTION #1: ZEITERFASSUNG - DEPLOYMENT**

## ✅ **STATUS**

Die Zeiterfassung Edge Function ist jetzt **vollständig eigenständig** (keine shared imports mehr).

---

## 📋 **DEPLOYMENT SCHRITTE**

### **OPTION A: Über Supabase Dashboard (EMPFOHLEN)**

1. **Gehe zu Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Wähle dein Projekt

2. **Navigiere zu Edge Functions:**
   - Linke Sidebar → "Edge Functions"

3. **Neue Function erstellen:**
   - Click: "Deploy new function"
   - Function Name: `BrowoKoordinator-Zeiterfassung`

4. **Code kopieren:**
   - Öffne die Datei: `/supabase/functions/BrowoKoordinator-Zeiterfassung/index.ts`
   - Kopiere den **kompletten Code**
   - Füge ihn im Dashboard ein

5. **Deploy:**
   - Click: "Deploy function"
   - Warte auf erfolgreichen Deploy

---

### **OPTION B: Über Supabase CLI**

```bash
# Im Root-Verzeichnis deines Projekts
supabase functions deploy BrowoKoordinator-Zeiterfassung
```

---

## 🧪 **TESTING**

### **1. Health Check (NO AUTH):**

```bash
curl https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Zeiterfassung/health
```

**Erwartete Response:**
```json
{
  "status": "ok",
  "function": "BrowoKoordinator-Zeiterfassung",
  "timestamp": "2025-01-10T...",
  "version": "1.0.0"
}
```

### **2. Clock In (MIT AUTH):**

```bash
curl -X POST \
  https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Zeiterfassung/clock-in \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Erwartete Response:**
```json
{
  "success": true,
  "session": {
    "id": "...",
    "user_id": "...",
    "clock_in": "2025-01-10T...",
    "clock_out": null
  }
}
```

---

## 📊 **VERFÜGBARE ROUTEN**

| Route | Method | Auth | Beschreibung |
|-------|--------|------|--------------|
| `/health` | GET | ❌ | Health Check |
| `/clock-in` | POST | ✅ | Einstempeln |
| `/clock-out` | POST | ✅ | Ausstempeln |
| `/break/start` | POST | ✅ | Pause starten |
| `/break/end` | POST | ✅ | Pause beenden |
| `/sessions/today` | GET | ✅ | Heutige Sessions |
| `/sessions/week` | GET | ✅ | Wochen-Sessions |
| `/corrections` | POST | ✅ | Zeitkorrektur |

---

## 🔍 **LOGS ANSEHEN**

### **Im Supabase Dashboard:**
1. Edge Functions → BrowoKoordinator-Zeiterfassung
2. Tab: "Logs"
3. Siehe Realtime Logs

### **Via CLI:**
```bash
supabase functions logs BrowoKoordinator-Zeiterfassung --tail
```

---

## ❌ **TROUBLESHOOTING**

### **Problem: "Failed to deploy"**

**Lösung:**
- Überprüfe dass der Code vollständig kopiert wurde
- Keine Syntax-Fehler
- Alle Environment Variables sind gesetzt

### **Problem: "Module not found"**

**Lösung:**
- Das sollte jetzt behoben sein!
- Alle Utilities sind inline im Code

### **Problem: "Unauthorized"**

**Lösung:**
- JWT Token korrekt?
- Authorization Header: `Bearer <TOKEN>`
- Token nicht abgelaufen?

### **Problem: "No active session"**

**Lösung:**
- User muss erst einstempeln (clock-in)
- Check ob bereits ausgestempelt

---

## ✅ **NÄCHSTE SCHRITTE**

Nach erfolgreichem Deployment:

1. ✅ Health Check testen
2. ✅ Mit JWT Token testen
3. ✅ Frontend Service erstellen
4. ✅ Integration in DashboardScreen

---

## 📝 **KOMPLETTER CODE ZUM KOPIEREN**

Der Code ist in: `/supabase/functions/BrowoKoordinator-Zeiterfassung/index.ts`

**Wichtig:** 
- Der Code ist jetzt **vollständig eigenständig**
- Keine shared imports mehr
- Alle Utilities sind inline
- Ready to deploy!

---

## 🎯 **DEPLOYMENT CHECKLIST**

- [ ] Code kopiert/deployed
- [ ] Health Check funktioniert
- [ ] Clock In getestet (mit JWT)
- [ ] Clock Out getestet
- [ ] Logs gecheckt
- [ ] Frontend Service erstellen
- [ ] Integration testen

---

**BEREIT ZUM DEPLOYEN!** 🚀

Versuch es jetzt nochmal im Supabase Dashboard!
