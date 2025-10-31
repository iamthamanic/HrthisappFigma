# 🔧 ZEITERFASSUNG v2.2.0 - BREAKS INSERT FIX

## ❌ **PROBLEM:**

Clock-In schlägt fehl mit **500 Internal Server Error**:
```
"Failed to clock in"
```

**ROOT CAUSE:**
Die Edge Function setzt beim INSERT die `breaks` Spalte NICHT explizit, was zu einem Fehler führt.

**ALTER CODE (Zeile 292-295):**
```typescript
insert({
  user_id: user.id,
  start_time: new Date().toISOString(),
  // ❌ breaks fehlt!
})
```

---

## ✅ **FIX:**

**NEUER CODE:**
```typescript
insert({
  user_id: user.id,
  start_time: new Date().toISOString(),
  breaks: [],  // ✅ Explizit gesetzt!
})
```

---

## 📦 **VERSION UPDATE:**

- **Alt:** v2.1.0 (Schema migration fix)
- **Neu:** v2.2.0 (Add breaks column + explicit breaks:[] in INSERT)

---

## 🚀 **DEPLOYMENT:**

### **OPTION 1: ÜBER SUPABASE DASHBOARD**

1. Gehe zu: https://supabase.com/dashboard/project/azmtojgikubegzusvhra
2. **Edge Functions** → **BrowoKoordinator-Zeiterfassung**
3. **"Edit Function"**
4. **Suche Zeile 292-295** (INSERT Statement)
5. **Ändere von:**
   ```typescript
   insert({
     user_id: user.id,
     start_time: new Date().toISOString(),
   })
   ```
6. **Ändere zu:**
   ```typescript
   insert({
     user_id: user.id,
     start_time: new Date().toISOString(),
     breaks: [],
   })
   ```
7. **Speichern & Deploy**

---

### **OPTION 2: CLI (falls verfügbar)**

```bash
npx supabase functions deploy BrowoKoordinator-Zeiterfassung --no-verify-jwt
```

---

## 🧪 **NACH DEM DEPLOYMENT:**

### **1. VERSION PRÜFEN**

```bash
curl https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Zeiterfassung/health
```

**Sollte zurückgeben:**
```json
{
  "status": "ok",
  "version": "2.2.0"  // <- SOLLTE 2.2.0 SEIN!
}
```

---

### **2. TESTS ERNEUT DURCHFÜHREN**

```javascript
// HELPER LADEN (falls noch nicht gemacht)
const getToken = () => {
  const authData = localStorage.getItem('sb-azmtojgikubegzusvhra-auth-token');
  if (!authData) {
    console.error('❌ Nicht eingeloggt!');
    return null;
  }
  return JSON.parse(authData).access_token;
};

const baseUrl = 'https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Zeiterfassung';

console.log('✅ Helper geladen!');
```

---

### **TEST 10 - CLOCK-IN (RETRY v2.2.0)**

```javascript
const token = getToken();

console.log('🧪 TEST 10 (v2.2.0): Clock-In...\n');

fetch(`${baseUrl}/sessions/clock-in`, {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
  .then(r => r.json())
  .then(d => {
    console.log('✅ TEST 10 (v2.2.0) - Clock-In:', d);
    if (d.success) {
      console.log('📝 Session ID:', d.session.id);
      console.log('⏰ Start:', d.session.start_time);
      console.log('☕ Breaks:', d.session.breaks);  // Sollte [] sein!
      window.testSessionId = d.session.id;
    } else {
      console.error('❌ Error:', d.error, d.details);
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
    "user_id": "uuid",
    "start_time": "2025-10-29T...",
    "end_time": null,
    "breaks": []  // ✅ SOLLTE LEER ARRAY SEIN!
  }
}
```

---

### **TEST 11 - BREAK-START**

```javascript
const token = getToken();

console.log('🧪 TEST 11 (v2.2.0): Break-Start...\n');

fetch(`${baseUrl}/sessions/break-start`, {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
  .then(r => r.json())
  .then(d => {
    console.log('✅ TEST 11 (v2.2.0) - Break-Start:', d);
    if (d.success) {
      console.log('☕ Pause gestartet:', d.session.breaks[d.session.breaks.length - 1]);
    } else {
      console.error('❌ Error:', d.error);
    }
  })
  .catch(e => console.error('❌ TEST 11 Error:', e));
```

---

### **TEST 12 - BREAK-END**

```javascript
const token = getToken();

console.log('🧪 TEST 12 (v2.2.0): Break-End...\n');

fetch(`${baseUrl}/sessions/break-end`, {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
  .then(r => r.json())
  .then(d => {
    console.log('✅ TEST 12 (v2.2.0) - Break-End:', d);
    if (d.success) {
      const lastBreak = d.session.breaks[d.session.breaks.length - 1];
      console.log('☕ Pause beendet:');
      console.log('  Start:', lastBreak.start);
      console.log('  Ende:', lastBreak.end);
      const duration = (new Date(lastBreak.end) - new Date(lastBreak.start)) / 1000 / 60;
      console.log('  Dauer:', Math.round(duration), 'Minuten');
    }
  });
```

---

### **TEST 13 - CLOCK-OUT**

```javascript
const token = getToken();

console.log('🧪 TEST 13 (v2.2.0): Clock-Out...\n');

fetch(`${baseUrl}/sessions/clock-out`, {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
  .then(r => r.json())
  .then(d => {
    console.log('✅ TEST 13 (v2.2.0) - Clock-Out:', d);
    if (d.success) {
      console.log('📝 Session beendet');
      console.log('  Start:', d.session.start_time);
      console.log('  Ende:', d.session.end_time);
      console.log('  Pausen:', d.session.breaks?.length || 0);
      
      window.testSessionId = d.session.id;
    }
  });
```

---

## 📊 **CHANGELOG v2.2.0**

### **🐛 FIX:**
- Clock-In INSERT Statement fügt nun explizit `breaks: []` hinzu
- Verhindert 500 Error beim Session-Start

### **✅ BETROFFENE ENDPOINTS:**
- POST `/sessions/clock-in` - Jetzt mit explizitem breaks:[] beim INSERT

### **📝 VERSION UPDATES:**
- Health endpoints zeigen nun v2.2.0

---

## 🎯 **NACH DEM DEPLOYMENT:**

1. ✅ Version auf 2.2.0 prüfen
2. ✅ TEST 10: Clock-In (sollte jetzt funktionieren!)
3. ✅ TEST 11: Break-Start
4. ✅ TEST 12: Break-End
5. ✅ TEST 13: Clock-Out
6. ✅ TEST 14: Session by ID
7. 🚀 Zeiterfassung ist dann komplett!

---

**🔧 DEPLOY JETZT v2.2.0!**
