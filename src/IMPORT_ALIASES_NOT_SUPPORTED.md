# ❌ IMPORT-ALIASSE NICHT UNTERSTÜTZT IN FIGMA MAKE

**Datum:** 2025-01-08  
**Status:** 🔴 DOKUMENTIERT - Import-Aliasse funktionieren NICHT  
**Grund:** Figma Make Umgebung behandelt `@/` als esm.sh npm-Package

---

## 🚫 Das Problem

In der **Figma Make-Umgebung** werden ALLE Imports mit `@/` Präfix als **externe npm-Packages** von `esm.sh` interpretiert:

### Fehler-Beispiel:
```
ERROR: [plugin: npm] Failed to fetch https://esm.sh/@/components/ui/alert
ERROR: [plugin: npm] Failed to fetch https://esm.sh/@/hooks/useThrottle
```

**Was passiert:**
1. Wir schreiben: `import { Card } from '@/components/ui/card'`
2. Vite sieht: `@/components/ui/card`
3. Vite denkt: "Das ist ein npm-Package!"
4. Vite versucht: `https://esm.sh/@/components/ui/card` zu laden
5. **FEHLER:** Package existiert nicht auf esm.sh

---

## ✅ Die Lösung: Relative Imports

**KORREKT für Figma Make:**
```typescript
// ✅ Funktioniert
import { Card } from '../../components/ui/card';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../utils/supabase/client';
```

**FALSCH in Figma Make:**
```typescript
// ❌ Wird als npm-Package behandelt
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
```

---

## 🔧 Was wurde rückgängig gemacht

### 1. vite.config.ts - Aliasse entfernt
```typescript
// VORHER (funktionierte nicht):
resolve: {
  alias: {
    '@': path.resolve(__dirname, './'),
  },
}

// NACHHER (korrekt):
// Keine Aliasse!
```

### 2. tsconfig.json - Path-Mapping entfernt
```json
// VORHER (funktionierte nicht):
"baseUrl": ".",
"paths": {
  "@/*": ["./*"]
}

// NACHHER (korrekt):
// Keine paths!
```

### 3. Alle migrierten Dateien zurückgesetzt
- ✅ `/screens/admin/TeamManagementScreen.tsx` - zurück zu `../../`
- ✅ `/screens/admin/OrganigramCanvasScreenV2.tsx` - zurück zu `../../`
- ✅ `/components/canvas/hr_CanvasOrgChart.tsx` - zurück zu `../../`

---

## 📋 Import-Richtlinien für Figma Make

### ✅ IMMER verwenden:
```typescript
// Relative Imports
import { Component } from './Component';           // Gleiches Verzeichnis
import { Component } from '../Component';          // Ein Level hoch
import { Component } from '../../components/Component';  // Zwei Level hoch
```

### ❌ NIEMALS verwenden:
```typescript
// Import-Aliasse (nicht unterstützt!)
import { Component } from '@/components/Component';
import { Component } from '@components/Component';
import { Component } from '~/components/Component';
```

---

## 🎯 Phase 1 Anpassung

### Original Plan (NICHT MÖGLICH):
- ❌ Import-Aliasse konfigurieren
- ❌ Alle Imports zu `@/` migrieren

### Angepasster Plan (SKIP):
- ✅ **SKIP** Import-Aliasse Migration
- ✅ Relative Imports beibehalten (funktioniert perfekt!)
- ✅ Weiter mit Phase 1, Tag 2: Domain-Präfixe

---

## 📚 Warum ist das so?

**Figma Make Umgebung:**
- Verwendet esm.sh für externe npm-Packages
- Jedes Import mit `@` wird als npm-Package interpretiert
- Keine lokale Alias-Auflösung möglich

**In anderen Umgebungen:**
- Next.js: `@/` funktioniert ✅
- Vite (normal): `@/` funktioniert ✅
- Figma Make: `@/` funktioniert NICHT ❌

---

## ✅ Build sollte jetzt funktionieren!

**Mit relativen Imports:**
```bash
npm run build
```

**Expected:** ✅ Build successful, keine esm.sh Fehler!

---

## 📝 Lessons Learned

1. **Umgebungs-spezifisch:** Nicht jede Vite-Konfiguration funktioniert überall
2. **Relative Imports sind universal:** Funktionieren IMMER
3. **Aliasse sind Nice-to-Have:** Nicht essentiell für Code-Qualität
4. **Pragmatisch bleiben:** Wenn etwas nicht funktioniert, skip it und mach weiter!

---

## 🚀 Nächste Schritte

Phase 1 wird angepasst:

**ORIGINAL Phase 1:**
1. ~~Import-Aliasse~~ ❌ SKIP
2. Domain-Präfixe ✅ WEITER HIER
3. Projekt-Konfiguration ✅
4. Dokumentation ✅

**Phase 1 Score ohne Import-Aliasse:**
- Immer noch 6.0/10 möglich!
- Domain-Präfixe sind wichtiger als Aliasse

---

**Status:** ✅ Relative Imports beibehalten, Phase 1 fortsetzen! 🚀
