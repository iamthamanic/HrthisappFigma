# BrowoKoordinator-Server Deployment Fix

## Problem erkannt:
```
The requested module './routes-entities.ts' does not provide an export named 'registerEntityRoutes'
```

## Ursache:
Die Datei `routes-entities.ts` wurde entweder:
1. ❌ Nicht mit hochgeladen
2. ❌ In einem falschen Pfad hochgeladen
3. ❌ Mit falschem Inhalt hochgeladen

## Lösung: Manuelles Deployment im Supabase Dashboard

### Schritt 1: Überprüfe die Dateistruktur

Im Supabase Dashboard muss es SO aussehen:

```
Edge Functions
└── BrowoKoordinator-Server/
    ├── index.ts
    ├── core-buckets.ts
    ├── core-kv.ts
    ├── core-supabaseClient.ts
    ├── core-workflows.ts
    ├── routes-entities.ts      ← Diese Datei fehlt oder ist falsch!
    ├── routes-itEquipment.ts
    ├── routes-storage.ts
    ├── routes-tests.ts
    ├── routes-users.ts
    └── routes-workflows.ts
```

### Schritt 2: Wie deployed man richtig im Supabase Dashboard?

**WICHTIG:** Supabase Edge Functions unterstützen KEINE Unterordner im Dashboard!

#### Option A: CLI Deployment (Empfohlen)

1. Installiere Supabase CLI:
```bash
npm install -g supabase
```

2. Login:
```bash
supabase login
```

3. Link dein Projekt:
```bash
supabase link --project-ref <dein-project-ref>
```

4. Deploy die Function:
```bash
supabase functions deploy BrowoKoordinator-Server
```

#### Option B: Dashboard (nur für single-file Functions)

Das Supabase Dashboard unterstützt **NICHT** mehrere Dateien pro Function! 😱

Du hast 2 Möglichkeiten:

**Möglichkeit 1:** Bundle alle Dateien in EINE index.ts
→ Nicht praktikabel, weil der Code zu groß wird

**Möglichkeit 2:** Nutze die CLI (siehe Option A)

### Schritt 3: Was du JETZT machen solltest

#### Hast du Supabase CLI installiert?

**JA** → Dann nutze die CLI zum Deployment:
```bash
cd /pfad/zu/deinem/projekt
supabase functions deploy BrowoKoordinator-Server
```

**NEIN** → Dann müssen wir die Dateien in EINE große index.ts zusammenführen

---

## Alternative: Alle Dateien in eine index.ts zusammenführen

Wenn du die CLI nicht nutzen kannst, muss ich dir eine MEGA-index.ts erstellen die ALLES enthält.

**Soll ich das machen?**

Dann kannst du diese eine Datei im Dashboard deployen.

**ABER:** Das ist nicht wartbar für die Zukunft! CLI ist besser!

---

## Was bevorzugst du?

1. ✅ **CLI Deployment** (empfohlen, professionell, wartbar)
2. ⚠️ **Merged Single File** (funktioniert, aber nicht wartbar)

**Sag mir was du bevorzugst und ich helfe dir weiter!** 🚀
