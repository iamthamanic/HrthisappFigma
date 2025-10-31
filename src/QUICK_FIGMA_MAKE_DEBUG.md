# 🔍 Quick Debug für Figma Make

## Problem
JSON Parse Error beim API Key erstellen in Figma Make.

## Lösung: 3-Schritt Debug

### Schritt 1: Einfacher Test (30 Sekunden)

**Kopiere das in die Browser Console (F12):**

```javascript
// Quick Check
(async () => {
  const projectId = 'hhhnumvllmzkyjsgefhd';
  const healthUrl = `https://${projectId}.supabase.co/functions/v1/BrowoKoordinator-Automation/make-server-f659121d/automation/health`;
  
  console.log('🔍 Testing:', healthUrl);
  
  const response = await fetch(healthUrl);
  const text = await response.text();
  
  console.log('📥 Status:', response.status);
  console.log('📥 Response:', text);
  
  if (response.ok && text.includes('healthy')) {
    console.log('✅ Edge Function läuft!');
  } else {
    console.log('❌ Edge Function Problem!');
    console.log('💡 Führe aus: supabase functions deploy BrowoKoordinator-Automation');
  }
})();
```

**Erwartetes Ergebnis:**
```
✅ Edge Function läuft!
```

**Falls ❌:**
```bash
# In Terminal ausführen:
cd supabase/functions
supabase functions deploy BrowoKoordinator-Automation
```

---

### Schritt 2: Vollständiger Test (2 Minuten)

**Kopiere `/DEBUG_API_KEY_FIGMA_MAKE.js` komplett in die Console**

Das Script wird:
1. ✅ Access Token aus localStorage holen
2. ✅ Health Check durchführen
3. ✅ API Key erstellen versuchen
4. ✅ Genau zeigen wo das Problem ist

---

### Schritt 3: Falls localStorage Key falsch ist

**Finde den richtigen localStorage Key:**

```javascript
// In Browser Console:
Object.keys(localStorage).filter(k => k.includes('supabase') || k.includes('auth'))
```

**Aktualisiere dann in `/DEBUG_API_KEY_FIGMA_MAKE.js` Zeile 17:**

```javascript
// Ändere zu deinem localStorage Key:
const authData = localStorage.getItem('DER_RICHTIGE_KEY_HIER');
```

---

## Häufigste Probleme & Lösungen

### Problem 1: Edge Function nicht deployed
**Symptom:** Health Check gibt HTML zurück

**Lösung:**
```bash
supabase functions deploy BrowoKoordinator-Automation
```

### Problem 2: Access Token nicht gefunden
**Symptom:** "No auth token in localStorage"

**Lösung:**
1. Checke localStorage Keys (siehe Schritt 3)
2. Oder logge dich neu ein

### Problem 3: 401 Unauthorized
**Symptom:** Response Status 401

**Lösung:**
1. Session abgelaufen - neu einloggen
2. Oder User hat keine HR/Superadmin Rolle

### Problem 4: Foreign Key Error (vom Anfang)
**Symptom:** "Could not find a relationship..."

**Lösung:** 
✅ Bereits gefixt! Migration wurde ausgeführt.

---

## Schnelltest Checkliste

- [ ] Health Check funktioniert (Schritt 1)
- [ ] Edge Function gibt JSON zurück (nicht HTML)
- [ ] Access Token wird gefunden
- [ ] API Key wird generiert
- [ ] Key beginnt mit `browoko-`

---

## Next Steps nach erfolgreichem Debug

Wenn Health Check ✅ ist, aber API Key Generation ❌:
→ Teile mir die **komplette Console Output** von `/DEBUG_API_KEY_FIGMA_MAKE.js`

Ich kann dann genau sehen:
- Welcher Status Code zurückkommt
- Was die Edge Function antwortet
- Wo genau der Fehler auftritt
