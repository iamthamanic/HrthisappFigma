# 🐛 DEBUG: Time Tracking 401 Unauthorized

## Problem

Die Edge Function `BrowoKoordinator-Zeiterfassung` gibt 401 Unauthorized zurück, obwohl der User eingeloggt ist.

## Schnell-Fix: Hard Refresh

1. **Strg+Shift+R** (Windows/Linux) oder **Cmd+Shift+R** (Mac)
2. **Cache leeren**: Browser DevTools → Application → Clear Storage → Clear site data

---

## Debug-Script: Session & Token prüfen

Öffne **Browser Console** (F12) und führe aus:

```javascript
// 1. Session prüfen
import('./utils/supabase/client.js').then(async ({ supabase }) => {
  console.log('=== SESSION DEBUG ===');
  
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('❌ Session Error:', error);
    return;
  }
  
  if (!session) {
    console.error('❌ Keine Session! User ist nicht eingeloggt.');
    return;
  }
  
  console.log('✅ Session gefunden:');
  console.log('  User ID:', session.user.id);
  console.log('  Email:', session.user.email);
  console.log('  Token (first 30 chars):', session.access_token.substring(0, 30) + '...');
  console.log('  Token Länge:', session.access_token.length, 'Zeichen');
  
  // 2. Token testen mit Edge Function
  console.log('\n=== EDGE FUNCTION TEST ===');
  
  const response = await fetch(
    'https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Zeiterfassung/time-records/current-status',
    {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      }
    }
  );
  
  console.log('Response Status:', response.status, response.statusText);
  
  if (response.ok) {
    const data = await response.json();
    console.log('✅ SUCCESS! Response:', data);
  } else {
    const errorText = await response.text();
    console.error('❌ FAILED! Error:', errorText);
  }
});
```

---

## Erwartete Ergebnisse

### ✅ **Erfolgreich (Status 200):**
```
✅ Session gefunden:
  User ID: da5df6c2-0ba4-430d-8384-5a6c7acf138a
  Email: zaefield@gmail.com
  Token (first 30 chars): eyJhbGciOiJIUzI1NiIsInR5cCI6...
  Token Länge: 350 Zeichen

Response Status: 200 OK
✅ SUCCESS! Response: { is_clocked_in: false, current_record: null }
```

### ❌ **401 Unauthorized:**
```
Response Status: 401 Unauthorized
❌ FAILED! Error: {"error":"Unauthorized - valid JWT required"}
```

**Mögliche Ursachen:**
1. **Token ist abgelaufen** → Neu einloggen
2. **Edge Function verwendet falschen Supabase Client** → Backend-Bug
3. **Token-Format ist falsch** → Session-Bug

---

## Lösungsansätze

### **1. Session ist abgelaufen → Neu einloggen**

```javascript
import('./utils/supabase/client.js').then(async ({ supabase }) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'zaefield@gmail.com',
    password: 'DEIN_PASSWORT'
  });
  
  if (error) {
    console.error('Login failed:', error);
  } else {
    console.log('✅ Login successful!');
    location.reload();
  }
});
```

### **2. Edge Function Backend-Bug**

Prüfe in **Supabase Dashboard** → **Edge Functions** → **BrowoKoordinator-Zeiterfassung** → **Logs**:

**Suche nach:**
```
[Zeiterfassung] Auth error: ...
```

**Häufige Fehler:**
- `JWTExpired` → Token ist abgelaufen
- `Invalid JWT` → Token-Format falsch
- `User not found` → User existiert nicht in der DB

---

## Manuelle Curl-Tests

### **Test 1: Health Check (NO AUTH)**
```bash
curl https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Zeiterfassung/health
```

**Erwartetes Ergebnis:**
```json
{
  "status": "ok",
  "function": "BrowoKoordinator-Zeiterfassung",
  "version": "3.0.0"
}
```

### **Test 2: Current Status (WITH AUTH)**

Ersetze `YOUR_TOKEN` mit dem Token aus dem Debug-Script:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Zeiterfassung/time-records/current-status
```

**Erwartetes Ergebnis (200 OK):**
```json
{
  "is_clocked_in": false,
  "current_record": null
}
```

**Falls 401:**
```json
{
  "error": "Unauthorized - valid JWT required"
}
```

---

## Nächste Schritte

1. **Hard Refresh** durchführen
2. **Debug-Script** in Console ausführen
3. **Ergebnis posten** (Status Code + Fehlermeldung)
4. **Supabase Logs** prüfen (falls 401 bleibt)

---

## Quick Fix: Cache leeren

Falls der Build Error bleibt (`No matching export for "createClient"`):

1. Browser **DevTools** öffnen (F12)
2. **Application** Tab
3. **Clear Storage** → **Clear site data**
4. **Seite neu laden** (F5)

Die Datei sollte jetzt das korrekte Import haben:
```typescript
import { supabase } from '../utils/supabase/client';  // ✅ RICHTIG
```

Nicht:
```typescript
import { createClient } from '../utils/supabase/client';  // ❌ FALSCH
```
