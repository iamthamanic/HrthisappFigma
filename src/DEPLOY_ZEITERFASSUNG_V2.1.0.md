# 📦 DEPLOYMENT: ZEITERFASSUNG v2.1.0

## ✅ **VERSION UPDATE AUF 2.1.0**

**Grund:** Schema-Migration Fix (`clock_in`/`clock_out` → `start_time`/`end_time`)

---

## **🚀 DEPLOYMENT COMMAND**

```bash
npx supabase functions deploy BrowoKoordinator-Zeiterfassung --no-verify-jwt
```

**WICHTIG:** `--no-verify-jwt` ist erforderlich für public `/health` endpoint!

---

## **📝 CHANGELOG v2.1.0**

### **🐛 BUG FIX:**
- **Schema-Mismatch behoben:** Edge Function nutzte alte Spaltennamen
- **Alt:** `clock_in`, `clock_out`
- **Neu:** `start_time`, `end_time`

### **✅ BETROFFENE ENDPOINTS:**
- GET `/sessions` - Order & Filter korrigiert
- GET `/sessions/active` - Filter korrigiert
- POST `/sessions/clock-in` - Insert korrigiert
- POST `/sessions/clock-out` - Update korrigiert
- GET `/stats/weekly` - Filter korrigiert
- GET `/stats/monthly` - Filter korrigiert
- POST `/sessions/break-start` - Filter korrigiert
- POST `/sessions/break-end` - Filter korrigiert
- GET `/approval-queue` - Order & Filter korrigiert
- Helper `calculateStats()` - Feld-Referenzen korrigiert

### **✅ TESTS BESTÄTIGT:**
- ✅ TEST 1-7: Alle Read-Tests erfolgreich
- ⏳ TEST 8-15: Write-Tests ausstehend

---

## **📊 NACH DEPLOYMENT: VERSION PRÜFEN**

```bash
curl https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Zeiterfassung/health
```

**Erwartete Response:**
```json
{
  "status": "ok",
  "function": "BrowoKoordinator-Zeiterfassung",
  "timestamp": "...",
  "version": "2.1.0"  // <- SOLLTE 2.1.0 SEIN!
}
```

---

## **🎯 NÄCHSTE SCHRITTE**

1. ✅ Deploy ausführen
2. ✅ Version prüfen (sollte 2.1.0 sein)
3. 🧪 Write-Tests durchführen (TEST 8-15)
4. 📊 System Health Dashboard aktualisieren
5. 🚀 Zur nächsten Edge Function

---

**DEPLOY JETZT!** 🚀
