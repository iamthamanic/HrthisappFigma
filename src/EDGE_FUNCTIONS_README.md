# 🚀 BrowoKoordinator - Modulare Edge Functions Architektur

## 📋 **ÜBERSICHT**

Migration von **monolithischer** zu **modularer Multi-Function Edge Function Architektur**.

**Status:** ✅ Infrastruktur komplett | ⚠️ Functions bereit zum Deployment

---

## 🎯 **ZIEL**

**Vorher (Monolith):**
```
/supabase/functions/server/
  └── index.tsx  ← ALLES in einer Function
```

**Nachher (Modular):**
```
/supabase/functions/
  ├── _shared/              ← Shared Utilities
  ├── BrowoKoordinator-Zeiterfassung/
  ├── BrowoKoordinator-Benefits/
  ├── BrowoKoordinator-Lernen/
  ├── BrowoKoordinator-Dokumente/
  ├── BrowoKoordinator-Notification/
  ├── BrowoKoordinator-Antragmanager/
  ├── BrowoKoordinator-Analytics/
  ├── BrowoKoordinator-Tasks/
  ├── BrowoKoordinator-Personalakte/
  ├── BrowoKoordinator-Kalender/
  ├── BrowoKoordinator-Organigram/
  └── BrowoKoordinator-Field/
```

---

## ✅ **WAS IST FERTIG?**

### **✅ Shared Utilities (100%)**
- `_shared/cors.ts` - CORS Konfiguration
- `_shared/auth.ts` - Authentication & Authorization
- `_shared/supabase.ts` - Supabase Client Factory
- `_shared/errors.ts` - Error Handling
- `_shared/types.ts` - Shared Types
- `_shared/logger.ts` - Logging Utility

### **✅ Edge Function Templates (100%)**
Alle 12 Functions haben:
- ✅ Health Check Endpoint
- ✅ Authentication Middleware
- ✅ CORS Support
- ✅ Error Handling
- ✅ Logging

### **⭐ Komplett Implementiert**
1. **BrowoKoordinator-Zeiterfassung** (100%)
   - Clock In/Out
   - Break Start/End
   - Today's Sessions
   - Week's Sessions
   - Time Corrections

### **⚠️ Basis-Templates (bereit für Implementierung)**
2-12. Alle anderen Functions haben Basis-Template

---

## 📚 **DOKUMENTATION**

| Dokument | Beschreibung |
|----------|-------------|
| **EDGE_FUNCTIONS_DEPLOYMENT_GUIDE.md** | Vollständige Deployment-Anleitung |
| **EDGE_FUNCTIONS_MIGRATION_STATUS.md** | Aktueller Migrations-Status |
| **EDGE_FUNCTIONS_QUICK_START.sh** | Quick-Start Script für Deployment |
| **EDGE_FUNCTIONS_README.md** | Diese Datei |

---

## 🚀 **QUICK START**

### **1. Deployment Script ausführen:**

```bash
chmod +x EDGE_FUNCTIONS_QUICK_START.sh
./EDGE_FUNCTIONS_QUICK_START.sh
```

### **2. Oder manuell deployen:**

```bash
# Einzelne Function
supabase functions deploy BrowoKoordinator-Zeiterfassung

# Mehrere Functions
supabase functions deploy BrowoKoordinator-Zeiterfassung
supabase functions deploy BrowoKoordinator-Dokumente
supabase functions deploy BrowoKoordinator-Notification
```

### **3. Health Check testen:**

```bash
curl https://<PROJECT_ID>.supabase.co/functions/v1/BrowoKoordinator-Zeiterfassung/health
```

---

## 📊 **EDGE FUNCTIONS ÜBERSICHT**

| # | Function | Zweck | Status | Routes |
|---|----------|-------|--------|--------|
| 1 | **Zeiterfassung** | Time Tracking | ✅ KOMPLETT | 7 Routes |
| 2 | **Benefits** | Benefits & Coin Shop | ⚠️ BASIS | TODO |
| 3 | **Lernen** | Learning System | ⚠️ BASIS | TODO |
| 4 | **Dokumente** | Document Management | ⚠️ BASIS | TODO |
| 5 | **Notification** | Notifications | ⚠️ BASIS | TODO |
| 6 | **Antragmanager** | Leave & Approvals | ⚠️ BASIS | TODO |
| 7 | **Analytics** | Analytics & Reports | ⚠️ BASIS | TODO |
| 8 | **Tasks** | Scheduled Tasks | ⚠️ BASIS | TODO |
| 9 | **Personalakte** | HR Files | ⚠️ BASIS | TODO |
| 10 | **Kalender** | Calendar & Shifts | ⚠️ BASIS | TODO |
| 11 | **Organigram** | Organigram & Company | ⚠️ BASIS | TODO |
| 12 | **Field** | Field Management | ⚠️ BASIS | TODO |

---

## 🎯 **DEPLOYMENT PRIORITÄTEN**

### **Phase 1: Kritisch (Diese Woche)**
1. ✅ Zeiterfassung (FERTIG)
2. ⏳ Dokumente
3. ⏳ Notification

### **Phase 2: Wichtig (Nächste Woche)**
4. ⏳ Antragmanager
5. ⏳ Personalakte
6. ⏳ Kalender

### **Phase 3: Features (Woche 3-4)**
7. ⏳ Benefits
8. ⏳ Lernen
9. ⏳ Field

### **Phase 4: System (Woche 5-6)**
10. ⏳ Organigram
11. ⏳ Analytics
12. ⏳ Tasks

---

## 🔧 **ARCHITEKTUR DETAILS**

### **BFF Pattern (Backend for Frontend)**

Jede Edge Function ist ein **BFF** (Backend for Frontend):
- Kennt die Frontend-Anforderungen
- Optimiert für spezifische Use Cases
- Unabhängig deploybar
- Individuell skalierbar

### **Shared Utilities**

Alle Functions nutzen gemeinsame Utilities:
```typescript
import { handleCorsPreFlight, corsHeaders } from '../_shared/cors.ts';
import { verifyAuth, unauthorizedResponse } from '../_shared/auth.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import { errorResponse, successResponse } from '../_shared/errors.ts';
import { createLogger } from '../_shared/logger.ts';
```

### **Standard Structure**

Jede Function hat:
```typescript
// 1. CORS Handling
if (req.method === 'OPTIONS') return handleCorsPreFlight();

// 2. Health Check (no auth)
if (path.endsWith('/health')) return successResponse({...});

// 3. Authentication
const user = await verifyAuth(req.headers.get('Authorization'));
if (!user) return unauthorizedResponse();

// 4. Route Handling
if (path.endsWith('/route') && req.method === 'POST') {
  return await handleRoute(supabase, user.id);
}

// 5. Error Handling
catch (error) {
  return errorResponse(error, 'FunctionName');
}
```

---

## 📝 **BEISPIEL: Zeiterfassung API**

### **Endpoints:**

```typescript
// Base URL
https://<PROJECT_ID>.supabase.co/functions/v1/BrowoKoordinator-Zeiterfassung

// Routes
GET  /health              - Health check (no auth)
POST /clock-in            - Clock in
POST /clock-out           - Clock out
POST /break/start         - Start break
POST /break/end           - End break
GET  /sessions/today      - Get today's sessions
GET  /sessions/week       - Get week's sessions
POST /corrections         - Submit time correction
```

### **Frontend Integration:**

```typescript
// services/BrowoKo_zeiterfassungService.ts
import { projectId } from '../utils/supabase/info';

export class ZeiterfassungService {
  private baseUrl = `https://${projectId}.supabase.co/functions/v1/BrowoKoordinator-Zeiterfassung`;

  async clockIn(token: string) {
    const response = await fetch(`${this.baseUrl}/clock-in`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  }

  async clockOut(token: string) {
    const response = await fetch(`${this.baseUrl}/clock-out`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  }

  // ... weitere Methoden
}
```

---

## 🧪 **TESTING**

### **Health Check:**
```bash
curl https://<PROJECT_ID>.supabase.co/functions/v1/BrowoKoordinator-Zeiterfassung/health
```

### **With Auth:**
```bash
curl -X POST \
  https://<PROJECT_ID>.supabase.co/functions/v1/BrowoKoordinator-Zeiterfassung/clock-in \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json"
```

### **CORS Check:**
```bash
curl -X OPTIONS \
  https://<PROJECT_ID>.supabase.co/functions/v1/BrowoKoordinator-Zeiterfassung/clock-in \
  -H "Access-Control-Request-Method: POST" \
  -v
```

---

## 📋 **LOGS**

### **Via Supabase Dashboard:**
1. Gehe zu: Edge Functions → Logs
2. Wähle Function
3. Siehe Logs in Echtzeit

### **Via CLI:**
```bash
# Live Logs
supabase functions logs BrowoKoordinator-Zeiterfassung --tail

# Letzte 100 Logs
supabase functions logs BrowoKoordinator-Zeiterfassung --limit 100
```

### **Log Format:**
```
[Zeiterfassung] INFO: Clock in { userId: "123" }
[Zeiterfassung] ERROR: Clock in failed { error: "..." }
```

---

## 🔥 **VORTEILE DER NEUEN ARCHITEKTUR**

| Aspekt | Monolith | Modular |
|--------|----------|---------|
| **Deployment** | Alles oder nichts | Einzelne Functions |
| **Skalierung** | Gesamte Function | Pro Function individuell |
| **Fehler** | Betrifft alles | Isoliert |
| **Entwicklung** | Merge Conflicts | Parallel möglich |
| **Logs** | Vermischt | Pro Function |
| **Kosten** | Pauschal | Pay-per-use |
| **Performance** | Langsam bei Last | Schnell & skalierbar |

---

## 🚨 **WICHTIGE HINWEISE**

### **Legacy Server behalten:**
- `/supabase/functions/server/` **NICHT löschen** bis Migration komplett
- Schrittweise Frontend-Calls auf neue Functions umstellen
- Am Ende Legacy Server deprecaten

### **KV Store geschützt:**
- `/supabase/functions/server/kv_store.tsx` ist **GESCHÜTZT**
- Nicht ändern oder löschen
- Wird von allen Functions genutzt

### **Environment Variables:**
- Bereits in Supabase gesetzt
- Keine zusätzlichen Secrets erforderlich
- Automatisch verfügbar in allen Functions

---

## 📚 **NÄCHSTE SCHRITTE**

### **1. Deploy erste Function:**
```bash
supabase functions deploy BrowoKoordinator-Zeiterfassung
```

### **2. Test Health Check:**
```bash
curl https://<PROJECT_ID>.supabase.co/functions/v1/BrowoKoordinator-Zeiterfassung/health
```

### **3. Frontend Service erstellen:**
```typescript
// services/BrowoKo_zeiterfassungService.ts
export class ZeiterfassungService {
  // Implementiere API Calls
}
```

### **4. Alte Calls ersetzen:**
```typescript
// Alt (Monolith):
await fetch(`${projectId}.supabase.co/functions/v1/make-server-f659121d/clock-in`)

// Neu (Modular):
await fetch(`${projectId}.supabase.co/functions/v1/BrowoKoordinator-Zeiterfassung/clock-in`)
```

### **5. Weitere Functions implementieren:**
- Wähle nächste Priority Function
- Implementiere Handler (nutze Zeiterfassung als Template)
- Deployen & Testen
- Frontend integrieren

---

## ✅ **CHECKLIST**

- [x] Shared Utilities erstellt
- [x] 12 Edge Functions Templates angelegt
- [x] Zeiterfassung komplett implementiert
- [x] Deployment Guide geschrieben
- [x] Migration Status dokumentiert
- [x] Quick Start Script erstellt
- [ ] **TODO:** Erste Function deployen
- [ ] **TODO:** Health Check testen
- [ ] **TODO:** Frontend integrieren
- [ ] **TODO:** Weitere Functions implementieren
- [ ] **TODO:** Legacy Server deprecaten

---

## 🎉 **READY TO DEPLOY!**

Alle 12 Edge Functions sind angelegt und bereit.

**Starte jetzt mit:**
```bash
./EDGE_FUNCTIONS_QUICK_START.sh
```

Oder folge dem detaillierten Guide:
```bash
cat EDGE_FUNCTIONS_DEPLOYMENT_GUIDE.md
```

---

**Stand:** 2025-01-10  
**Version:** 1.0.0  
**Status:** ✅ Bereit für Deployment
