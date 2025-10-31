# 🚀 BrowoKoordinator - Edge Functions Deployment Guide

## 📋 **ÜBERSICHT**

Diese Anleitung führt Sie durch den **schrittweisen Deployment** der modularen Edge Functions Architektur.

### **Erstellte Edge Functions:**

✅ **Shared Utilities** (`/_shared/`)
- `cors.ts` - CORS Konfiguration
- `auth.ts` - Authentication & Authorization
- `supabase.ts` - Supabase Client Factory
- `errors.ts` - Error Handling
- `types.ts` - Shared Types
- `logger.ts` - Logging Utility

✅ **12 Edge Functions:**
1. `BrowoKoordinator-Zeiterfassung` ⭐ **KOMPLETT IMPLEMENTIERT**
2. `BrowoKoordinator-Benefits` (Basis-Template)
3. `BrowoKoordinator-Lernen` (Basis-Template)
4. `BrowoKoordinator-Dokumente` (Basis-Template)
5. `BrowoKoordinator-Notification` (Basis-Template)
6. `BrowoKoordinator-Antragmanager` (Basis-Template)
7. `BrowoKoordinator-Analytics` (Basis-Template)
8. `BrowoKoordinator-Tasks` (Basis-Template)
9. `BrowoKoordinator-Personalakte` (Basis-Template)
10. `BrowoKoordinator-Kalender` (Basis-Template)
11. `BrowoKoordinator-Organigram` (Basis-Template)
12. `BrowoKoordinator-Field` (Basis-Template)

---

## 🎯 **DEPLOYMENT STRATEGIE**

### **Phase 1: Test Deployment (Woche 1)**
Deployen Sie zuerst die **Zeiterfassung** Edge Function zum Testen:

```bash
# 1. Supabase CLI installieren (falls nicht vorhanden)
npm install -g supabase

# 2. Supabase Login
supabase login

# 3. Link zu Ihrem Projekt
supabase link --project-ref <YOUR_PROJECT_ID>

# 4. Deploy Zeiterfassung
supabase functions deploy BrowoKoordinator-Zeiterfassung
```

### **Phase 2: Basis Functions (Woche 2)**
```bash
# Deploy kritische Functions
supabase functions deploy BrowoKoordinator-Dokumente
supabase functions deploy BrowoKoordinator-Notification
supabase functions deploy BrowoKoordinator-Personalakte
```

### **Phase 3: Business Logic (Woche 3-4)**
```bash
# Deploy business functions
supabase functions deploy BrowoKoordinator-Antragmanager
supabase functions deploy BrowoKoordinator-Benefits
supabase functions deploy BrowoKoordinator-Kalender
```

### **Phase 4: Features (Woche 5-6)**
```bash
# Deploy feature functions
supabase functions deploy BrowoKoordinator-Lernen
supabase functions deploy BrowoKoordinator-Field
supabase functions deploy BrowoKoordinator-Organigram
```

### **Phase 5: System (Woche 7-8)**
```bash
# Deploy system functions
supabase functions deploy BrowoKoordinator-Analytics
supabase functions deploy BrowoKoordinator-Tasks
```

---

## ✅ **DEPLOYMENT CHECKLIST**

### **Vor dem Deployment:**

- [ ] Supabase CLI installiert (`supabase --version`)
- [ ] Mit Supabase eingeloggt (`supabase login`)
- [ ] Projekt verlinkt (`supabase link`)
- [ ] Environment Variables gesetzt (siehe unten)

### **Nach dem Deployment:**

- [ ] Health Check testen (`GET /health`)
- [ ] Authentication testen
- [ ] CORS testen
- [ ] Error Handling testen
- [ ] Logs überprüfen

---

## 🔧 **ENVIRONMENT VARIABLES**

Diese Variablen sind **bereits in Supabase gesetzt**:

```bash
SUPABASE_URL=<your-project-url>
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

**Keine zusätzlichen Secrets erforderlich!**

---

## 🧪 **TESTING GUIDE**

### **1. Health Check Test**

```bash
# Test Zeiterfassung Health
curl https://<PROJECT_ID>.supabase.co/functions/v1/BrowoKoordinator-Zeiterfassung/health

# Erwartete Response:
{
  "status": "ok",
  "function": "BrowoKoordinator-Zeiterfassung",
  "timestamp": "2025-01-10T12:00:00.000Z",
  "version": "1.0.0"
}
```

### **2. Authentication Test**

```bash
# Mit Authorization Header
curl -X POST \
  https://<PROJECT_ID>.supabase.co/functions/v1/BrowoKoordinator-Zeiterfassung/clock-in \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json"
```

### **3. CORS Test**

```bash
# OPTIONS Preflight
curl -X OPTIONS \
  https://<PROJECT_ID>.supabase.co/functions/v1/BrowoKoordinator-Zeiterfassung/health \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization" \
  -v
```

---

## 📊 **FUNCTION URLs**

Nach dem Deployment sind die Functions unter folgenden URLs erreichbar:

```
Base URL: https://<PROJECT_ID>.supabase.co/functions/v1/

1.  BrowoKoordinator-Zeiterfassung/
2.  BrowoKoordinator-Benefits/
3.  BrowoKoordinator-Lernen/
4.  BrowoKoordinator-Dokumente/
5.  BrowoKoordinator-Notification/
6.  BrowoKoordinator-Antragmanager/
7.  BrowoKoordinator-Analytics/
8.  BrowoKoordinator-Tasks/
9.  BrowoKoordinator-Personalakte/
10. BrowoKoordinator-Kalender/
11. BrowoKoordinator-Organigram/
12. BrowoKoordinator-Field/
```

---

## 🔄 **FRONTEND INTEGRATION**

### **Beispiel: Zeiterfassung aufrufen**

```typescript
// Frontend Code
import { projectId, publicAnonKey } from './utils/supabase/info';

async function clockIn() {
  const token = 'YOUR_USER_JWT_TOKEN'; // Von Supabase Auth

  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/BrowoKoordinator-Zeiterfassung/clock-in`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();
  console.log('Clock in:', data);
}
```

---

## 📝 **LOGGING & MONITORING**

### **Logs ansehen:**

```bash
# Supabase Dashboard → Edge Functions → Logs

# Oder via CLI:
supabase functions logs BrowoKoordinator-Zeiterfassung --tail
```

### **Log Format:**

Alle Functions nutzen den **Logger** aus `_shared/logger.ts`:

```
[Zeiterfassung] INFO: Clock in { userId: "123" }
[Zeiterfassung] ERROR: Clock in failed { error: "..." }
[Zeiterfassung] WARN: Unauthorized request { path: "/clock-in" }
```

---

## 🚨 **TROUBLESHOOTING**

### **Problem: "Function not found"**
```bash
# Solution: Re-deploy
supabase functions deploy BrowoKoordinator-Zeiterfassung
```

### **Problem: "CORS error"**
```bash
# Check: CORS headers sind in _shared/cors.ts
# Solution: Verify OPTIONS handler
```

### **Problem: "Unauthorized"**
```bash
# Check: Authorization header format
# Should be: "Bearer <JWT_TOKEN>"
```

### **Problem: "Internal Server Error"**
```bash
# Check logs:
supabase functions logs BrowoKoordinator-Zeiterfassung

# Common causes:
# - Missing environment variables
# - Database connection issues
# - Import errors (_shared files)
```

---

## 🎯 **NÄCHSTE SCHRITTE**

### **1. Deploy Zeiterfassung:**
```bash
supabase functions deploy BrowoKoordinator-Zeiterfassung
```

### **2. Test Health Check:**
```bash
curl https://<PROJECT_ID>.supabase.co/functions/v1/BrowoKoordinator-Zeiterfassung/health
```

### **3. Frontend Integration:**
- Erstellen Sie einen Service für Zeiterfassung
- Nutzen Sie die neuen Endpoints
- Testen Sie Clock In/Out

### **4. Weitere Functions implementieren:**
- Wählen Sie die nächste Priority Function
- Implementieren Sie die Handler
- Deployen & Testen

---

## 📚 **BEISPIEL: Zeiterfassung komplett**

Die **Zeiterfassung** Function ist komplett implementiert mit:

✅ **Routen:**
- `POST /clock-in` - Einstempeln
- `POST /clock-out` - Ausstempeln
- `POST /break/start` - Pause starten
- `POST /break/end` - Pause beenden
- `GET /sessions/today` - Heute's Sessions
- `GET /sessions/week` - Woche's Sessions
- `POST /corrections` - Zeitkorrektur

✅ **Features:**
- Authentication required
- Error handling
- Logging
- CORS support
- Health check

**Nutzen Sie diese als Template für weitere Functions!**

---

## 🔥 **DEPLOYMENT BEFEHLE - QUICK REFERENCE**

```bash
# Single Function
supabase functions deploy BrowoKoordinator-Zeiterfassung

# Alle Functions
supabase functions deploy BrowoKoordinator-Zeiterfassung
supabase functions deploy BrowoKoordinator-Benefits
supabase functions deploy BrowoKoordinator-Lernen
supabase functions deploy BrowoKoordinator-Dokumente
supabase functions deploy BrowoKoordinator-Notification
supabase functions deploy BrowoKoordinator-Antragmanager
supabase functions deploy BrowoKoordinator-Analytics
supabase functions deploy BrowoKoordinator-Tasks
supabase functions deploy BrowoKoordinator-Personalakte
supabase functions deploy BrowoKoordinator-Kalender
supabase functions deploy BrowoKoordinator-Organigram
supabase functions deploy BrowoKoordinator-Field

# Logs anschauen
supabase functions logs BrowoKoordinator-Zeiterfassung --tail

# Function löschen (VORSICHT!)
supabase functions delete BrowoKoordinator-Zeiterfassung
```

---

## ✅ **READY TO DEPLOY!**

Alle 12 Edge Functions sind angelegt und bereit zum Deployment.

**Wollen Sie jetzt mit dem Deployment der ersten Function beginnen?**

1. ✅ Test Zeiterfassung deployen
2. ✅ Health Check testen
3. ✅ Frontend Integration planen
4. ✅ Weitere Functions nach Priority implementieren

**Nächster Schritt:** Deployment von `BrowoKoordinator-Zeiterfassung` 🚀
