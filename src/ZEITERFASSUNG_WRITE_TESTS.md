# 🧪 ZEITERFASSUNG - WRITE TESTS (8-15)

## ✅ **READ-TESTS ERFOLGREICH (1-7)**

Alle Read-Tests sind grün! Jetzt testen wir die Write-Operations.

---

## **🧪 WRITE-TESTS (BROWSER CONSOLE)**

**WICHTIG:** 
- ✅ Öffne https://item-alike-38235473.figma.site im **echten Browser**
- ✅ Logge dich ein
- ✅ Developer Console (F12)
- ✅ Führe die Tests **nacheinander** aus (nicht alle auf einmal!)

---

## **📋 TEST-ÜBERSICHT (15 ENDPOINTS)**

### ✅ **BEREITS GETESTET (1-7):**
1. ✅ GET /health (public)
2. ✅ GET /health-auth (auth)
3. ✅ GET /sessions/active (auth)
4. ✅ GET /sessions (auth)
5. ✅ GET /stats (auth)
6. ✅ GET /stats/weekly (auth)
7. ✅ GET /stats/monthly (auth)

### 🧪 **JETZT TESTEN (8-15):**
8. ⏳ POST /sessions/clock-in (auth)
9. ⏳ POST /sessions/clock-out (auth)
10. ⏳ POST /sessions/break-start (auth)
11. ⏳ POST /sessions/break-end (auth)
12. ⏳ GET /sessions/:id (auth)
13. ⏳ GET /approval-queue (auth - TeamLead+)
14. ⏳ POST /sessions/:id/approve (auth - TeamLead+)
15. ⏳ POST /sessions/:id/reject (auth - TeamLead+)

---

## **🔧 HELPER FUNCTION (KOPIEREN & AUSFÜHREN)**

```javascript
// ✅ HELPER: Token holen
const getToken = () => {
  const authData = localStorage.getItem('sb-azmtojgikubegzusvhra-auth-token');
  if (!authData) {
    console.error('❌ Nicht eingeloggt!');
    return null;
  }
  return JSON.parse(authData).access_token;
};

const baseUrl = 'https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Zeiterfassung';

console.log('✅ Helper-Funktion geladen!');
```

---

## **🧪 TEST 8: CLOCK-IN (Start einer neuen Session)**

```javascript
const token = getToken();
if (!token) throw new Error('Kein Token!');

console.log('🧪 TEST 8: Clock-In...\n');

fetch(`${baseUrl}/sessions/clock-in`, {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
  .then(r => r.json())
  .then(d => {
    console.log('✅ TEST 8 - Clock-In:', d);
    if (d.success) {
      console.log('📝 Session ID:', d.session.id);
      console.log('⏰ Start-Zeit:', d.session.start_time);
      // Session ID für spätere Tests speichern
      window.testSessionId = d.session.id;
    }
  })
  .catch(e => console.error('❌ TEST 8 Error:', e));
```

**ERWARTETES ERGEBNIS:**
```json
{
  "success": true,
  "session": {
    "id": "uuid-hier",
    "user_id": "uuid",
    "start_time": "2025-10-29T...",
    "end_time": null,
    "breaks": []
  },
  "timestamp": "..."
}
```

**ODER (wenn bereits eingestempelt):**
```json
{
  "error": "Already clocked in",
  "session": { ... }
}
```

---

## **🧪 TEST 9: ACTIVE SESSION ERNEUT PRÜFEN**

```javascript
const token = getToken();

console.log('🧪 TEST 9: Active Session prüfen...\n');

fetch(`${baseUrl}/sessions/active`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
  .then(r => r.json())
  .then(d => {
    console.log('✅ TEST 9 - Active Session:', d);
    if (d.session) {
      console.log('📝 Session läuft seit:', d.session.start_time);
      window.testSessionId = d.session.id;
    }
  });
```

**ERWARTETES ERGEBNIS:**
```json
{
  "success": true,
  "session": {
    "id": "uuid",
    "start_time": "...",
    "end_time": null
  }
}
```

---

## **🧪 TEST 10: BREAK-START**

```javascript
const token = getToken();

console.log('🧪 TEST 10: Pause starten...\n');

fetch(`${baseUrl}/sessions/break-start`, {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
  .then(r => r.json())
  .then(d => {
    console.log('✅ TEST 10 - Break-Start:', d);
    if (d.success) {
      console.log('☕ Pause gestartet um:', d.session.breaks[d.session.breaks.length - 1].start);
    }
  })
  .catch(e => console.error('❌ TEST 10 Error:', e));
```

**ERWARTETES ERGEBNIS:**
```json
{
  "success": true,
  "session": {
    "id": "uuid",
    "breaks": [
      {
        "start": "2025-10-29T...",
        "end": null
      }
    ]
  }
}
```

---

## **🧪 TEST 11: BREAK-END**

```javascript
const token = getToken();

console.log('🧪 TEST 11: Pause beenden...\n');

fetch(`${baseUrl}/sessions/break-end`, {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
  .then(r => r.json())
  .then(d => {
    console.log('✅ TEST 11 - Break-End:', d);
    if (d.success) {
      const lastBreak = d.session.breaks[d.session.breaks.length - 1];
      console.log('☕ Pause beendet:');
      console.log('  Start:', lastBreak.start);
      console.log('  Ende:', lastBreak.end);
      const duration = (new Date(lastBreak.end) - new Date(lastBreak.start)) / 1000 / 60;
      console.log('  Dauer:', Math.round(duration), 'Minuten');
    }
  })
  .catch(e => console.error('❌ TEST 11 Error:', e));
```

**ERWARTETES ERGEBNIS:**
```json
{
  "success": true,
  "session": {
    "breaks": [
      {
        "start": "...",
        "end": "..."
      }
    ]
  }
}
```

---

## **🧪 TEST 12: CLOCK-OUT (Session beenden)**

```javascript
const token = getToken();

console.log('🧪 TEST 12: Clock-Out...\n');

fetch(`${baseUrl}/sessions/clock-out`, {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
  .then(r => r.json())
  .then(d => {
    console.log('✅ TEST 12 - Clock-Out:', d);
    if (d.success) {
      console.log('📝 Session beendet:');
      console.log('  Start:', d.session.start_time);
      console.log('  Ende:', d.session.end_time);
      
      const start = new Date(d.session.start_time);
      const end = new Date(d.session.end_time);
      const duration = (end - start) / 1000 / 60;
      console.log('  Gesamt-Dauer:', Math.round(duration), 'Minuten');
      
      // Session ID für Approval-Tests speichern
      window.testSessionId = d.session.id;
    }
  })
  .catch(e => console.error('❌ TEST 12 Error:', e));
```

**ERWARTETES ERGEBNIS:**
```json
{
  "success": true,
  "session": {
    "id": "uuid",
    "start_time": "...",
    "end_time": "...",
    "breaks": [...]
  }
}
```

---

## **🧪 TEST 13: GET SESSION BY ID**

```javascript
const token = getToken();

if (!window.testSessionId) {
  console.error('❌ Keine Session ID gespeichert! Führe erst TEST 12 (Clock-Out) aus.');
} else {
  console.log('🧪 TEST 13: Session by ID abrufen...\n');
  
  fetch(`${baseUrl}/sessions/${window.testSessionId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(d => {
      console.log('✅ TEST 13 - Session by ID:', d);
      if (d.success) {
        console.log('📝 Session Details:');
        console.log('  ID:', d.session.id);
        console.log('  Start:', d.session.start_time);
        console.log('  Ende:', d.session.end_time);
        console.log('  Pausen:', d.session.breaks?.length || 0);
      }
    })
    .catch(e => console.error('❌ TEST 13 Error:', e));
}
```

---

## **🧪 TEST 14: APPROVAL-QUEUE (NUR FÜR TEAMLEADS!)**

```javascript
const token = getToken();

console.log('🧪 TEST 14: Approval-Queue abrufen...\n');
console.log('⚠️  Dieser Test funktioniert nur für TeamLead, HR oder Superadmin!\n');

fetch(`${baseUrl}/approval-queue`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
  .then(r => r.json())
  .then(d => {
    console.log('✅ TEST 14 - Approval-Queue:', d);
    if (d.success) {
      console.log('📝 Zu genehmigende Sessions:', d.count);
      if (d.sessions.length > 0) {
        console.log('Erste Session:', d.sessions[0]);
        window.testApprovalSessionId = d.sessions[0].id;
      }
    } else if (d.error === 'Insufficient permissions') {
      console.warn('⚠️  Keine Berechtigung - benötigt TeamLead/HR/Superadmin Role');
    }
  })
  .catch(e => console.error('❌ TEST 14 Error:', e));
```

**ERWARTETES ERGEBNIS (als TeamLead):**
```json
{
  "success": true,
  "sessions": [...],
  "count": X
}
```

**ODER (als Employee):**
```json
{
  "error": "Insufficient permissions"
}
```

---

## **🧪 TEST 15: SESSION APPROVE (NUR FÜR TEAMLEADS!)**

```javascript
const token = getToken();

if (!window.testSessionId && !window.testApprovalSessionId) {
  console.error('❌ Keine Session ID! Führe erst TEST 12 oder TEST 14 aus.');
} else {
  const sessionId = window.testApprovalSessionId || window.testSessionId;
  
  console.log('🧪 TEST 15: Session genehmigen...\n');
  console.log('Session ID:', sessionId);
  
  fetch(`${baseUrl}/sessions/${sessionId}/approve`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
    .then(r => r.json())
    .then(d => {
      console.log('✅ TEST 15 - Session Approve:', d);
      if (d.success) {
        console.log('✅ Session genehmigt!');
        console.log('  Approved at:', d.session.approved_at);
        console.log('  Approved by:', d.session.approved_by);
      } else if (d.error === 'Insufficient permissions') {
        console.warn('⚠️  Keine Berechtigung - benötigt TeamLead/HR/Superadmin Role');
      }
    })
    .catch(e => console.error('❌ TEST 15 Error:', e));
}
```

---

## **🧪 TEST 16 (BONUS): SESSION REJECT**

```javascript
const token = getToken();

if (!window.testSessionId) {
  console.error('❌ Keine Session ID!');
} else {
  console.log('🧪 TEST 16: Session ablehnen...\n');
  
  fetch(`${baseUrl}/sessions/${window.testSessionId}/reject`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      reason: 'Test-Ablehnung via Console'
    })
  })
    .then(r => r.json())
    .then(d => {
      console.log('✅ TEST 16 - Session Reject:', d);
      if (d.success) {
        console.log('❌ Session abgelehnt!');
        console.log('  Rejected at:', d.session.rejected_at);
        console.log('  Reason:', d.session.rejection_reason);
      }
    })
    .catch(e => console.error('❌ TEST 16 Error:', e));
}
```

---

## **📊 TEST-DURCHFÜHRUNG PLAN**

### **SCHRITT 1: HELPER LADEN**
```javascript
// Helper-Funktion kopieren & ausführen
```

### **SCHRITT 2: WRITE-TESTS (NACHEINANDER!)**
1. ✅ TEST 8: Clock-In
2. ✅ TEST 9: Active Session prüfen
3. ✅ TEST 10: Break-Start
4. ✅ TEST 11: Break-End
5. ✅ TEST 12: Clock-Out
6. ✅ TEST 13: Session by ID

### **SCHRITT 3: APPROVAL-TESTS (falls TeamLead)**
7. ✅ TEST 14: Approval-Queue
8. ✅ TEST 15: Session Approve

---

## **⏸️ PAUSE HIER!**

**FÜHRE JETZT DIE TESTS 8-13 AUS UND POSTE DIE ERGEBNISSE!**

**Reihenfolge:**
1. Helper laden
2. TEST 8 (Clock-In)
3. TEST 9 (Active Session)
4. TEST 10 (Break-Start)
5. TEST 11 (Break-End)
6. TEST 12 (Clock-Out)
7. TEST 13 (Session by ID)

**Warte mit TEST 14-16 (Approval), bis wir die Write-Tests bestätigt haben!** 🚦

---

**🚀 STARTE MIT DEM HELPER UND DANN TEST 8!**
