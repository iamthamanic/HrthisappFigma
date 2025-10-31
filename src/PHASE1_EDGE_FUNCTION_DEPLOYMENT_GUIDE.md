# 🚀 PHASE 1 - EDGE FUNCTION DEPLOYMENT GUIDE

## Problem
Die Edge Function `/supabase/functions/server/index.tsx` existiert in Figma Make, ist aber NICHT auf Supabase deployed.

**Error:** `ERR_NAME_NOT_RESOLVED` beim Health Check

---

## ✅ LÖSUNG: Manuelle Deployment via Supabase CLI

### **Schritt 1: Lokales Verzeichnis vorbereiten**

```bash
# 1. Erstelle lokales Verzeichnis
mkdir -p ~/hrthis-edge-functions
cd ~/hrthis-edge-functions

# 2. Erstelle Supabase Struktur
mkdir -p supabase/functions/make-server-f659121d
```

---

### **Schritt 2: Code von Figma Make kopieren**

**Datei 1: `supabase/functions/make-server-f659121d/index.ts`**

👉 **Copy-Paste den KOMPLETTEN Code** aus `/supabase/functions/server/index.tsx` in Figma Make

**Datei 2: `supabase/functions/make-server-f659121d/kv_store.ts`**

👉 **Copy-Paste den KOMPLETTEN Code** aus `/supabase/functions/server/kv_store.tsx` in Figma Make

**WICHTIG:** 
- Der Ordner MUSS `make-server-f659121d` heißen (nicht `server`)
- Die Hauptdatei MUSS `index.ts` heißen (nicht `index.tsx`)

---

### **Schritt 3: Supabase CLI installieren & deployen**

```bash
# 1. CLI installieren
npm install -g supabase

# 2. Login
supabase login

# 3. Link zum Projekt
supabase link --project-ref eflrggxqbypwfpkmvqyo

# 4. Edge Function deployen
cd ~/hrthis-edge-functions
supabase functions deploy make-server-f659121d --no-verify-jwt

# Expected Output:
# ✅ Deployed function make-server-f659121d successfully
# 🌐 URL: https://eflrggxqbypwfpkmvqyo.supabase.co/functions/v1/make-server-f659121d
```

---

### **Schritt 4: Health Check Test**

**Nach erfolgreichem Deployment:**

```javascript
// Browser Console
fetch('https://eflrggxqbypwfpkmvqyo.supabase.co/functions/v1/make-server-f659121d/health', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmbHJnZ3hxYnlwd2Zwa212cXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1NDQ4MzksImV4cCI6MjA1MDEyMDgzOX0.S5f0zzTLwJ4Y0PtX-M-U6Vkx7oKbHs2lfCgBjOJnmMw'
  }
})
.then(r => r.json())
.then(d => console.log('✅ BFF Response:', d))
.catch(e => console.error('❌ Error:', e));

// Expected: { status: "ok", message: "HRthis BFF Server is running" }
```

---

## 🎯 ALTERNATIVE: Figma Make Auto-Deploy prüfen

**Falls Figma Make Auto-Deploy hat:**

1. Suche in Figma Make nach **"Supabase Integration"**
2. Suche nach **"Deploy Edge Functions"** oder ähnlichem
3. Falls gefunden: Click "Deploy" und warte 30-60 Sekunden
4. Dann Health Check wiederholen

---

## ❓ FRAGEN ZUM DEBUG

Wenn Deployment fehlschlägt, prüfe:

1. **Supabase CLI korrekt installiert?**
   ```bash
   supabase --version
   ```

2. **Korrekt eingeloggt?**
   ```bash
   supabase login
   ```

3. **Projekt korrekt gelinkt?**
   ```bash
   supabase link --project-ref eflrggxqbypwfpkmvqyo
   ```

4. **Code-Struktur korrekt?**
   ```
   ~/hrthis-edge-functions/
   └── supabase/
       └── functions/
           └── make-server-f659121d/
               ├── index.ts
               └── kv_store.ts
   ```

---

## ✅ SUCCESS CHECKLIST

- [ ] Lokales Verzeichnis erstellt
- [ ] Code von Figma Make kopiert
- [ ] Supabase CLI installiert
- [ ] Eingeloggt & gelinkt
- [ ] Edge Function deployed
- [ ] Health Check erfolgreich

**Dann ist Phase 1 komplett deployed!** 🎉
