================================================================
HRTHIS - PHASE 1 EDGE FUNCTION DEPLOYMENT PACKAGE
================================================================

Diese Anleitung zeigt dir wie du die Edge Function deployen kannst.

WICHTIG: Du musst 2 Dateien aus Figma Make kopieren!

================================================================
SCHRITT-FÜR-SCHRITT ANLEITUNG
================================================================

1. LOKALE STRUKTUR ERSTELLEN
   ---------------------------
   Öffne Terminal und führe aus:
   
   mkdir -p ~/hrthis-deploy/supabase/functions/make-server-f659121d
   cd ~/hrthis-deploy

2. DATEIEN KOPIEREN
   -----------------
   A) In Figma Make: Öffne /supabase/functions/server/index.tsx
      - Kopiere den KOMPLETTEN Inhalt (Ctrl+A, Ctrl+C)
      - Erstelle lokal: ~/hrthis-deploy/supabase/functions/make-server-f659121d/index.ts
      - Paste den Code rein
      - WICHTIG: Umbenennen von .tsx zu .ts
   
   B) In Figma Make: Öffne /supabase/functions/server/kv_store.tsx
      - Kopiere den KOMPLETTEN Inhalt (Ctrl+A, Ctrl+C)
      - Erstelle lokal: ~/hrthis-deploy/supabase/functions/make-server-f659121d/kv_store.ts
      - Paste den Code rein
      - WICHTIG: Umbenennen von .tsx zu .ts

3. IMPORT FIX
   ----------
   Öffne index.ts und ändere Zeile 5:
   
   VON:  import * as kv from "./kv_store.tsx";
   ZU:   import * as kv from "./kv_store.ts";

4. SUPABASE CLI SETUP
   -------------------
   npm install -g supabase
   supabase login
   supabase link --project-ref eflrggxqbypwfpkmvqyo

5. DEPLOYMENT
   -----------
   cd ~/hrthis-deploy
   supabase functions deploy make-server-f659121d --no-verify-jwt

   Expected Output:
   ✅ Deployed function make-server-f659121d successfully
   🌐 URL: https://eflrggxqbypwfpkmvqyo.supabase.co/functions/v1/make-server-f659121d

6. TESTEN
   -------
   Öffne Browser Console und führe aus:
   
   fetch('https://eflrggxqbypwfpkmvqyo.supabase.co/functions/v1/make-server-f659121d/health', {
     headers: {
       'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmbHJnZ3hxYnlwd2Zwa212cXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1NDQ4MzksImV4cCI6MjA1MDEyMDgzOX0.S5f0zzTLwJ4Y0PtX-M-U6Vkx7oKbHs2lfCgBjOJnmMw'
     }
   })
   .then(r => r.json())
   .then(d => console.log('✅ BFF Response:', d))
   .catch(e => console.error('❌ Error:', e));
   
   Expected: { status: "ok", message: "HRthis BFF Server is running" }

================================================================
TROUBLESHOOTING
================================================================

Problem: "Function not found"
Lösung: Warte 30 Sekunden nach Deployment, dann nochmal testen

Problem: "Permission denied"
Lösung: Stelle sicher dass du eingeloggt bist: supabase login

Problem: "Project not linked"
Lösung: supabase link --project-ref eflrggxqbypwfpkmvqyo

================================================================
DONE! 🎉
================================================================

Wenn der Health Check erfolgreich ist, ist Phase 1 komplett deployed!
