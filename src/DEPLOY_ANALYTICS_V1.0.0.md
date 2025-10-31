# 🚀 ANALYTICS EDGE FUNCTION v1.0.0 - DEPLOYMENT GUIDE

## ✅ **WAS IST NEU?**

Die **BrowoKoordinator-Analytics** Edge Function wurde von einer **STUB-Implementation** zu einer **vollständig funktionierenden API** umgebaut!

### **VORHER (Stub):**
```typescript
// TODO: Implement analytics overview
// - Total users
// - Active users today/week/month
// - Leave requests stats

return c.json({
  message: 'Analytics overview - Coming soon'
});
```

### **JETZT (Vollständig):**
```typescript
// Real analytics with actual data
const { count: totalUsers } = await supabase
  .from('users')
  .select('id', { count: 'exact' })
  .eq('organization_id', user.organization_id);

return c.json({
  success: true,
  overview: {
    users: { total: totalUsers, activeThisWeek },
    leaves: { pending, approved },
    timeTracking: { totalHoursThisMonth },
    // ... und mehr
  }
});
```

---

## 📋 **6 VOLLSTÄNDIGE ENDPOINTS**

| # | Endpoint | Method | Auth | Beschreibung |
|---|----------|--------|------|--------------|
| 1 | `/health` | GET | ❌ Public | Health Check |
| 2 | `/dashboard` | GET | ✅ User | Persönliche Quick Stats |
| 3 | `/overview` | GET | 🔐 HR/Admin | Organisations-Overview |
| 4 | `/user-stats` | GET | ✅ User | User-spezifische Stats |
| 5 | `/time-tracking` | GET | ✅ User | Zeiterfassungs-Analytics |
| 6 | `/leave-stats` | GET | ✅ User | Urlaubs-Statistiken |

---

## 📊 **ANALYTICS FEATURES**

### **1. Dashboard Quick Stats** (`/dashboard`)
**Für jeden User sichtbar:**
- ✅ Arbeitsstunden diesen Monat
- ✅ Anzahl Pending Leave Requests
- ✅ Anzahl Achievements
- ✅ Coin Balance
- ✅ Urlaubssaldo

**Beispiel Response:**
```json
{
  "success": true,
  "stats": {
    "hoursThisMonth": 152.5,
    "pendingLeaves": 2,
    "achievements": 8,
    "coinBalance": 450,
    "leaveBalance": 18
  }
}
```

### **2. Analytics Overview** (`/overview`)
**Nur für HR/Admin:**
- ✅ Gesamt-Nutzer & aktive Nutzer diese Woche
- ✅ Leave Requests (pending/approved)
- ✅ Gesamt-Arbeitsstunden diesen Monat
- ✅ Dokumente-Statistiken
- ✅ Learning-Progress (Kurse/Quizzes)

**Beispiel Response:**
```json
{
  "success": true,
  "overview": {
    "users": {
      "total": 45,
      "activeThisWeek": 38
    },
    "leaves": {
      "pending": 5,
      "approved": 23
    },
    "timeTracking": {
      "totalHoursThisMonth": 6840
    },
    "documents": {
      "total": 234
    },
    "learning": {
      "totalCourses": 12,
      "totalQuizzes": 8
    }
  }
}
```

### **3. User Stats** (`/user-stats`)
**User-spezifische Statistiken:**
- ✅ Gesamt-Arbeitsstunden (all time + dieses Jahr)
- ✅ Urlaubsstatistiken (Allowance, Used, Remaining)
- ✅ Gamification (Coins, Achievements)
- ✅ Learning-Progress (Level, XP, Videos, Quizzes)

**Query Parameters:**
- `userId` (optional) - Andere User anzeigen (nur HR/Admin)

**Beispiel Response:**
```json
{
  "success": true,
  "userStats": {
    "user": {
      "name": "Max Mustermann",
      "email": "max@example.com",
      "role": "EMPLOYEE"
    },
    "workTime": {
      "totalHours": 1847.5,
      "hoursThisYear": 432.0
    },
    "leaves": {
      "yearlyAllowance": 30,
      "used": 12,
      "remaining": 18,
      "totalApproved": 12
    },
    "gamification": {
      "coinBalance": 450,
      "achievements": 8
    },
    "learning": {
      "level": 5,
      "xp": 2340,
      "completedVideos": 12,
      "passedQuizzes": 6
    }
  }
}
```

### **4. Time Tracking Stats** (`/time-tracking`)
**Arbeitszeitanalyse:**
- ✅ Gesamt-Stunden & Pausen
- ✅ Anzahl Arbeitstage
- ✅ Durchschnitt pro Tag
- ✅ Aufschlüsselung nach Tag

**Query Parameters:**
- `period` - today, week, month, year (default: month)
- `userId` (optional) - Andere User anzeigen (nur HR/Admin)

**Beispiel Response:**
```json
{
  "success": true,
  "timeTracking": {
    "period": "month",
    "summary": {
      "totalHours": 152.5,
      "totalBreakMinutes": 420,
      "workDays": 20,
      "averageHoursPerDay": 7.6,
      "averageBreakMinutesPerDay": 21
    },
    "byDay": [
      { "date": "2025-10-01", "hours": 8.0, "sessions": 1 },
      { "date": "2025-10-02", "hours": 7.5, "sessions": 1 },
      // ... mehr Tage
    ]
  }
}
```

### **5. Leave Stats** (`/leave-stats`)
**Urlaubsstatistiken:**
- ✅ Jahres-Allowance & Verbrauch
- ✅ Aufschlüsselung nach Status (pending/approved/rejected)
- ✅ Aufschlüsselung nach Typ (vacation/sick/unpaid/etc.)
- ✅ Alle Requests des Jahres

**Query Parameters:**
- `year` (optional) - Jahr (default: aktuelles Jahr)
- `userId` (optional) - Andere User anzeigen (nur HR/Admin)

**Beispiel Response:**
```json
{
  "success": true,
  "leaveStats": {
    "year": 2025,
    "allowance": {
      "total": 30,
      "used": 12,
      "remaining": 18
    },
    "byStatus": {
      "pending": 2,
      "approved": 12,
      "rejected": 1
    },
    "byType": {
      "vacation": 10,
      "sick": 2
    },
    "requests": [
      {
        "id": "uuid...",
        "startDate": "2025-07-15",
        "endDate": "2025-07-26",
        "days": 10,
        "type": "vacation",
        "status": "approved"
      },
      // ... mehr Requests
    ]
  }
}
```

---

## 🎯 **DEPLOYMENT SCHRITTE**

### **SCHRITT 1: CODE KOPIEREN**

1. Öffne Datei: `/supabase/functions/BrowoKoordinator-Analytics/index.ts`
2. **Cmd/Ctrl + A** (Alles markieren)
3. **Cmd/Ctrl + C** (Kopieren)

### **SCHRITT 2: SUPABASE DASHBOARD**

1. Öffne: https://supabase.com/dashboard/project/azmtojgikubegzusvhra/functions
2. Klicke auf **"BrowoKoordinator-Analytics"**
3. Scrolle zum Code-Editor

### **SCHRITT 3: CODE EINFÜGEN**

1. **Cmd/Ctrl + A** im Editor (Alten Code markieren)
2. **Cmd/Ctrl + V** (Neuen Code einfügen)
3. Scrolle nach unten zum **"Deploy"** Button
4. Klicke **"Deploy"**

### **SCHRITT 4: DEPLOYMENT FLAGS**

⚠️ **WICHTIG!** Verwende diese Flags:

```bash
--no-verify-jwt
```

**Warum?**
- `/health` Endpoint muss public bleiben (für Monitoring)
- Alle anderen Endpoints haben eigene JWT-Verification im Code

### **SCHRITT 5: WARTEN**

- Status: `Deploying...`
- Warten bis: `Successfully deployed`
- Dauer: ~30-60 Sekunden

### **SCHRITT 6: TESTEN**

1. Öffne Browser-Konsole (F12)
2. Kopiere Code aus: `ANALYTICS_EDGE_FUNCTION_CONSOLE_TEST.js`
3. Füge in Konsole ein
4. Führe aus: `analyticsTests.quickTest()`

---

## 🧪 **CONSOLE TESTS**

### **QUICK TEST (Empfohlen):**

```javascript
analyticsTests.quickTest()
```

**Testet:**
- ✅ Health Check
- ✅ Dashboard Stats
- ✅ User Stats

### **VOLLSTÄNDIGER TEST:**

```javascript
analyticsTests.runAll()
```

**Testet alle 6 Endpoints:**
- ✅ Health Check
- ✅ Dashboard Stats
- ✅ Overview (HR/Admin only)
- ✅ User Stats
- ✅ Time Tracking (today/week/month)
- ✅ Leave Stats

### **EINZELNE TESTS:**

```javascript
// Health Check
await analyticsTests.health()

// Dashboard Stats
await analyticsTests.getDashboard()

// Overview (nur HR/Admin)
await analyticsTests.getOverview()

// User Stats
await analyticsTests.getUserStats()

// User Stats für anderen User (nur HR/Admin)
await analyticsTests.getUserStats('USER_ID')

// Time Tracking Stats (verschiedene Perioden)
await analyticsTests.getTimeTracking('today')
await analyticsTests.getTimeTracking('week')
await analyticsTests.getTimeTracking('month')

// Leave Stats
await analyticsTests.getLeaveStats()

// Leave Stats für anderes Jahr
await analyticsTests.getLeaveStats(2024)
```

---

## ✅ **ERWARTETE ERGEBNISSE**

### **1. Health Check**
```json
{
  "status": "ok",
  "function": "BrowoKoordinator-Analytics",
  "version": "1.0.0",
  "timestamp": "2025-10-30T..."
}
```

### **2. Dashboard Stats**
```json
{
  "success": true,
  "stats": {
    "hoursThisMonth": 152.5,
    "pendingLeaves": 2,
    "achievements": 8,
    "coinBalance": 450,
    "leaveBalance": 18
  }
}
```

### **3. Overview (HR/Admin)**
```json
{
  "success": true,
  "overview": {
    "users": { "total": 45, "activeThisWeek": 38 },
    "leaves": { "pending": 5, "approved": 23 },
    "timeTracking": { "totalHoursThisMonth": 6840 },
    "documents": { "total": 234 },
    "learning": { "totalCourses": 12, "totalQuizzes": 8 }
  }
}
```

### **4. User Stats**
```json
{
  "success": true,
  "userStats": {
    "user": { "name": "Max Mustermann", ... },
    "workTime": { "totalHours": 1847.5, "hoursThisYear": 432.0 },
    "leaves": { ... },
    "gamification": { ... },
    "learning": { ... }
  }
}
```

---

## 🔍 **TROUBLESHOOTING**

### **Problem: "Unauthorized"**

**Lösung:**
```javascript
// 1. Prüfe ob eingeloggt
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)

// 2. Falls nicht eingeloggt, anmelden
await supabase.auth.signInWithPassword({
  email: 'your-email@example.com',
  password: 'your-password'
})

// 3. Test erneut ausführen
await analyticsTests.quickTest()
```

### **Problem: "No organization found"**

**Lösung:**
```sql
-- Prüfe organization_id
SELECT id, email, organization_id FROM users WHERE id = auth.uid();

-- Falls NULL, setze default organization
UPDATE users 
SET organization_id = (SELECT id FROM organizations WHERE is_default = true LIMIT 1)
WHERE id = auth.uid();
```

### **Problem: "Insufficient permissions"**

**Nur bei `/overview` Endpoint!**

**Lösung:**
```sql
-- Prüfe Rolle
SELECT id, email, role FROM users WHERE id = auth.uid();

-- Setze HR-Rolle (falls berechtigt)
UPDATE users SET role = 'HR' WHERE id = auth.uid();
```

### **Problem: Keine Daten zurückgegeben**

**Normal für neue Installationen!**

Die Analytics zeigen echte Daten aus den Tabellen:
- Wenn keine `work_sessions` existieren → `totalHours: 0`
- Wenn keine `leave_requests` existieren → `pendingLeaves: 0`
- Wenn keine Achievements existieren → `achievements: 0`

**Das ist korrekt!** Die Function funktioniert, es gibt nur noch keine Daten.

---

## 📊 **VERWENDETE TABELLEN**

Die Analytics Function greift auf folgende Tabellen zu:

1. **users** - User-Daten, Coin Balance, Leave Days
2. **work_sessions** - Zeiterfassung
3. **leave_requests** - Urlaubsanträge
4. **documents** - Dokumente
5. **user_achievements** - Achievements
6. **learning_videos** - Lern-Kurse
7. **learning_quizzes** - Quizzes
8. **video_progress** - Video-Fortschritt
9. **quiz_attempts** - Quiz-Versuche

**Alle Tabellen existieren bereits!** Keine Migration notwendig.

---

## 🎉 **DEPLOYMENT CHECKLIST**

- [ ] Code aus `/supabase/functions/BrowoKoordinator-Analytics/index.ts` kopiert
- [ ] In Supabase Dashboard eingefügt
- [ ] Mit `--no-verify-jwt` deployed
- [ ] Health Check erfolgreich (200 OK)
- [ ] Quick Test ausgeführt
- [ ] Dashboard Stats funktionieren
- [ ] User Stats funktionieren

---

## 📝 **VERSION HISTORY**

### **v1.0.0** (30. Okt 2025)
- ✅ Vollständige Implementation aller 6 Endpoints
- ✅ Dashboard Quick Stats
- ✅ Analytics Overview (HR/Admin)
- ✅ User Statistics
- ✅ Time Tracking Analytics
- ✅ Leave Statistics
- ✅ Organization-based isolation
- ✅ Proper error handling
- ✅ Query parameters support
- ✅ Console test suite

---

## 🚀 **NEXT STEPS**

Nach erfolgreichem Deployment:

1. **Frontend Integration**
   - Dashboard Widget für Quick Stats erstellen
   - Analytics-Screen für HR/Admin
   - User-Profile Stats anzeigen

2. **Weitere Edge Functions deployen**
   - BrowoKoordinator-Personalakte (8 Endpoints)
   - BrowoKoordinator-Tasks (9 Endpoints)

3. **Analytics erweitern**
   - Export-Funktionen
   - Custom Reports
   - Trend-Analysen

---

**🎯 Bei Problemen:**
- Prüfe Supabase Function Logs
- Teste einzelne Endpoints via Console
- Verifiziere organization_id beim User
- Checke ob genug Daten in den Tabellen existieren

**Happy Deploying! 🚀**
