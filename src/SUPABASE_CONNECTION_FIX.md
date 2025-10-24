# 🔧 Supabase Connection Fix

## Fehler: "TypeError: Failed to fetch"

Dieser Fehler tritt auf wenn die App keine Verbindung zu Supabase herstellen kann.

---

## ✅ Sofort-Checks

### 1. **Supabase Projekt Status prüfen**

**Das Projekt könnte PAUSIERT sein!**

1. Gehe zu: https://supabase.com/dashboard
2. Öffne dein Projekt: `azmtojgikubegzusvhra`
3. Schau ob oben ein Banner steht: **"Your project is paused"**
4. Falls ja: Klicke auf **"Restore project"** oder **"Resume project"**

**⚠️ WICHTIG:** Supabase pausiert Projekte nach 1 Woche Inaktivität auf dem Free Plan!

---

### 2. **Browser-Konsole checken**

1. Öffne die Browser-Konsole: **F12** oder **Rechtsklick → Untersuchen**
2. Gehe zum **Console** Tab
3. Schaue nach detaillierten Fehler-Logs:

```
🔍 Testing Supabase connection...
📍 Project ID: azmtojgikubegzusvhra
🔗 URL: https://azmtojgikubegzusvhra.supabase.co
❌ Connection test failed: ...
```

---

### 3. **Manuelle Verbindung testen**

Öffne diese URL im Browser:
```
https://azmtojgikubegzusvhra.supabase.co/auth/v1/health
```

**Erwartetes Ergebnis:**
- ✅ Status 200 → Supabase läuft
- ❌ Error/Timeout → Supabase ist pausiert oder nicht erreichbar

---

## 🛠️ Lösungen

### Lösung 1: Projekt reaktivieren (häufigster Fall)

1. **Gehe zu:** https://supabase.com/dashboard/project/azmtojgikubegzusvhra
2. **Klicke:** "Restore project" Button (falls sichtbar)
3. **Warte:** 2-3 Minuten bis Projekt wieder online ist
4. **Reload:** Die App (F5)

---

### Lösung 2: API Keys prüfen

Die Keys sind in `/utils/supabase/info.tsx` gespeichert:

```typescript
export const projectId = "azmtojgikubegzusvhra"
export const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Prüfe ob die Keys gültig sind:**

1. Gehe zu: https://supabase.com/dashboard/project/azmtojgikubegzusvhra/settings/api
2. Vergleiche die Keys:
   - **Project URL:** sollte sein `https://azmtojgikubegzusvhra.supabase.co`
   - **anon public key:** sollte mit `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` beginnen

Falls die Keys NICHT übereinstimmen → **info.tsx manuell updaten**!

---

### Lösung 3: CORS-Konfiguration

Falls das Projekt läuft aber trotzdem "Failed to fetch":

1. Gehe zu: https://supabase.com/dashboard/project/azmtojgikubegzusvhra/settings/api
2. Scrolle zu **"CORS Configuration"**
3. Füge hinzu: `http://localhost:*` und deine Production-Domain

---

### Lösung 4: Netzwerk/Firewall

Falls du hinter einem Firmen-Netzwerk oder VPN bist:

1. **Teste** ohne VPN
2. **Checke** Firewall-Regeln
3. **Versuche** mit anderem Netzwerk (z.B. Handy-Hotspot)

---

## 🔍 Debug-Logs

Die App loggt jetzt detaillierte Fehler in die Console:

```typescript
🔄 Initializing auth...
🔍 Testing Supabase connection...
📍 Project ID: azmtojgikubegzusvhra
🔗 URL: https://azmtojgikubegzusvhra.supabase.co
❌ Connection test failed: TypeError: Failed to fetch
🚨 NETWORK ERROR: Cannot reach Supabase server!
Possible causes:
1. Supabase project is paused (visit dashboard to wake it up)
2. Network/firewall blocking request
3. Invalid project ID or URL
4. CORS configuration issue
```

**Schicke mir diese Logs wenn das Problem weiterhin besteht!**

---

## 📊 Status nach dem Fix

Nach dem Fix solltest du sehen:

```
✅ Supabase connection successful
🔄 authStore.initialize() called
📡 Fetching session from Supabase...
✅ Session found / ❌ No session found
✅ Auth initialization complete
```

---

## 🆘 Wenn nichts hilft

1. **Screenshot** der Browser-Console (F12) machen
2. **Screenshot** vom Supabase Dashboard Status
3. **Mir schicken** mit Beschreibung was du probiert hast

Ich helfe dir dann weiter! 🙏
