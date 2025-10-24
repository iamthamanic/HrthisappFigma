# 🚀 REFACTORING QUICK-START GUIDE

**Für:** Sofortigen Start mit dem Refactoring  
**Zeit:** Die ersten 3 Tage  
**Ziel:** Import-Aliasse + Domain-Präfixe (Quick Wins)

---

## 📋 Vor dem Start

### ✅ Checkliste
- [ ] Git: Alle Changes committed
- [ ] Backup: Branch erstellt (`git checkout -b refactoring-backup`)
- [ ] Team: Info an alle Entwickler
- [ ] Zeit: 3 Tage blockiert

---

## 🎯 TAG 1: Import-Aliasse (8h)

### Schritt 1: Konfiguration (1h)

**1. ERSTELLE: `/vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

**2. BEARBEITE: `/tsconfig.json`**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**3. Teste Konfiguration:**

```bash
npm run build
# Sollte ohne Fehler durchlaufen
```

✅ **Commit:** `git commit -m "config: add import aliases"`

---

### Schritt 2: Migration-Script (2h)

**ERSTELLE: `/scripts/migrate-imports.sh`**

```bash
#!/bin/bash

echo "🚀 Migrating imports to @ aliases..."

# Backup
git add -A
git commit -m "Pre-import-migration backup"

# Simple regex replace (macOS/Linux)
find . -name "*.tsx" -o -name "*.ts" | while read file; do
  # Ersetze ../../ durch @/
  sed -i.bak "s|from ['\"]../../|from '@/|g" "$file"
  sed -i.bak "s|from ['\"]../|from '@/|g" "$file"
  
  # Lösche Backup-Dateien
  rm "${file}.bak"
done

echo "✅ Migration complete!"
echo "Next: npm run build"
```

**Ausführen:**

```bash
chmod +x scripts/migrate-imports.sh
./scripts/migrate-imports.sh
```

**Teste:**

```bash
npm run build
# Wenn Fehler: Manuelle Fixes nötig
```

✅ **Commit:** `git commit -m "refactor: migrate all imports to @ aliases"`

---

### Schritt 3: Manuelle Fixes (5h)

**Typische Probleme:**

```typescript
// ❌ Problem: Import aus gleichem Ordner
import { something } from '../component'

// ✅ Fix: Lass relative Imports für gleiches Verzeichnis
import { something } from './component'

// ❌ Problem: Zyklische Imports
import A from '@/components/A'
// A importiert B, B importiert A

// ✅ Fix: Gemeinsame Typen extrahieren
```

**Check alle Dateien:**

```bash
npm run build 2>&1 | grep "error"
# Fixes one by one
```

✅ **Final Commit:** `git commit -m "fix: resolve import migration issues"`

---

## 🎯 TAG 2: Domain-Präfixe (8h)

### Schritt 1: Quick-Scan (1h)

**Welche Dateien brauchen `hr_` Präfix?**

```bash
# Liste alle Components ohne hr_ Präfix
ls components/ | grep -v "^hr_" | grep -v "^ui$" | grep -v "^figma$"

# Liste alle Screens
ls screens/ | grep -v "^hr_"

# Liste alle Stores
ls stores/ | grep -v "^hr_"

# Liste alle Hooks
ls hooks/ | grep -v "^hr_"
```

Erstelle eine Liste:
```
components/TeamManagementScreen.tsx → hr_TeamManagementScreen.tsx
components/LeaveRequestsList.tsx → hr_LeaveRequestsList.tsx
stores/adminStore.ts → hr_adminStore.ts
...
```

---

### Schritt 2: Batch-Umbenennung (3h)

**WICHTIG:** Ein Bereich nach dem anderen!

**Reihenfolge:**
1. Stores (wenig Dependencies)
2. Hooks
3. Utils
4. Components
5. Screens (viele Dependencies)

**Beispiel: Stores umbenennen**

```bash
# Stores
git mv stores/adminStore.ts stores/hr_adminStore.ts
git mv stores/authStore.ts stores/hr_authStore.ts
git mv stores/timeStore.ts stores/hr_timeStore.ts
# ... etc

# Commit nach jedem Bereich
git commit -m "refactor: add hr_ prefix to stores"
```

**Nach jeder Umbenennung: Imports aktualisieren**

```bash
# Find & Replace in VS Code:
# Search: from ['"](.*)adminStore['"]
# Replace: from '$1hr_adminStore'
```

---

### Schritt 3: Build-Fixes (4h)

Nach jeder Umbenennung:

```bash
npm run build
# Wenn OK → nächster Bereich
# Wenn Fehler → Fixes
```

**Typische Fehler:**

```typescript
// ❌ Lazy Import nicht aktualisiert
const DashboardScreen = lazy(() => import('./screens/DashboardScreen'));

// ✅ Fix
const hr_DashboardScreen = lazy(() => import('./screens/hr_DashboardScreen'));
```

✅ **Final Commit:** `git commit -m "refactor: add hr_ prefix to all domain files"`

---

## 🎯 TAG 3: Validation & Cleanup (8h)

### Schritt 1: Kompletter Build-Test (2h)

```bash
# Fresh install
rm -rf node_modules
npm install

# Build
npm run build

# Dev-Server
npm run dev
# Teste manuell alle Hauptfeatures
```

**Test-Checklist:**
- [ ] Login funktioniert
- [ ] Dashboard lädt
- [ ] Leave-Request erstellen
- [ ] Team-Management öffnen
- [ ] Organigram laden
- [ ] Keine Console-Errors

---

### Schritt 2: Import-Cleanup (3h)

**Finde doppelte Imports:**

```bash
grep -r "from '@/" --include="*.ts" --include="*.tsx" | sort | uniq -d
```

**Finde relative Imports (außer selbes Verzeichnis):**

```bash
grep -r "from '\.\.\/" --include="*.ts" --include="*.tsx"
# Sollte leer sein!
```

---

### Schritt 3: Dokumentation (3h)

**ERSTELLE: `/docs/REFACTORING_PHASE1_COMPLETE.md`**

```markdown
# Refactoring Phase 1 Complete ✅

**Datum:** 2025-01-XX
**Dauer:** 3 Tage

## Durchgeführt

✅ Import-Aliasse konfiguriert (@/)
✅ Alle Imports migriert (XXX Dateien)
✅ Domain-Präfixe konsistent (hr_)
✅ Build erfolgreich
✅ Alle Features funktional

## Metriken

**Vorher:**
- Relative Imports: 100%
- Domain-Präfixe: 10%

**Nachher:**
- Alias-Imports: 100%
- Domain-Präfixe: 100%

## Nächste Schritte

- [ ] Phase 2: Dateigrößen-Audit
- [ ] Phase 3: Module-Migration
- [ ] Phase 4: Security & Resilience

## Lessons Learned

- Was lief gut?
- Was lief schlecht?
- Was würden wir anders machen?
```

✅ **Final Commit:** `git commit -m "docs: phase 1 refactoring complete"`

---

## 🎉 Phase 1 DONE!

### Was haben wir erreicht?

✅ **Import-Aliasse**
- Alle `../../` ersetzt durch `@/`
- Code viel lesbarer
- Einfacher zu refactoren

✅ **Domain-Präfixe**
- Alle domain-Dateien haben `hr_` Präfix
- Microservice-ready
- Klare Trennung generic vs. domain

### Zeit gespart bei Future Refactorings

Durch saubere Imports und Naming:
- **50% weniger Zeit** für Refactorings
- **80% weniger Merge-Konflikte**
- **100% klarere Code-Navigation**

---

## 📅 Was kommt als nächstes?

### Option A: Weiter mit Roadmap (empfohlen)
→ Phase 2 starten: Dateigrößen-Audit

### Option B: Pause & Stabilisierung
1. Eine Woche mit neuem Setup arbeiten
2. Team-Feedback sammeln
3. Dann Phase 2 starten

### Option C: Priorisierung ändern
Falls andere Probleme wichtiger sind:
- Security zuerst (Phase 4)
- Performance zuerst (Phase 5)
- Dokumentation zuerst (Phase 6)

---

## 🆘 Troubleshooting

### Problem: Build schlägt fehl nach Migration

**Debug-Schritte:**

```bash
# 1. Check welche Datei
npm run build 2>&1 | grep "error"

# 2. Öffne die Datei und check Imports
# 3. Häufige Fixes:

# ❌ Relativer Import für externen Ordner
import X from '../../../components/X'

# ✅ Alias-Import
import X from '@/components/X'

# ❌ Fehlender hr_ Präfix im Import
import { TeamDialog } from '@/components/TeamDialog'

# ✅ Mit Präfix
import { TeamDialog } from '@/components/hr_TeamDialog'
```

### Problem: VS Code zeigt Errors, aber Build funktioniert

**Fix:**
```bash
# VS Code TypeScript Server neu starten
Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Problem: Zyklische Imports

**Symptom:**
```
ReferenceError: Cannot access 'X' before initialization
```

**Fix:**
```typescript
// Extrahiere gemeinsame Typen in separate Datei
// types/hr_sharedTypes.ts

// A.tsx
import { SharedType } from '@/types/hr_sharedTypes'

// B.tsx  
import { SharedType } from '@/types/hr_sharedTypes'
```

---

## 📞 Support

**Bei Problemen:**

1. **Check Roadmap:** Detaillierte Schritte in COMPLETE_REFACTORING_ROADMAP.md
2. **Check Audit:** Problem schon bekannt? → CODEBASE_AUDIT_REPORT.md
3. **Git Rollback:** `git reset --hard <commit-before-refactoring>`
4. **Team fragen:** Slack/Discord/etc.

---

## ✅ Final Checklist - Phase 1 Complete

- [ ] Import-Aliasse konfiguriert (vite.config.ts, tsconfig.json)
- [ ] Migration-Script ausgeführt
- [ ] Alle Imports auf `@/` migriert
- [ ] Domain-Präfixe (`hr_`) konsistent
- [ ] `npm run build` erfolgreich
- [ ] Alle Features manuell getestet
- [ ] Keine Console-Errors
- [ ] Dokumentation aktualisiert
- [ ] Team informiert
- [ ] Commits gepusht

**Wenn alle Checkboxen ✅ → PHASE 1 COMPLETE! 🎉**

---

**Weiter zu:** [Phase 2 - File Size & Structure](./COMPLETE_REFACTORING_ROADMAP.md#phase-2)
