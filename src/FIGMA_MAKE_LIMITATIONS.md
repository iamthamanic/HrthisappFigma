# 🚧 FIGMA MAKE LIMITATIONS - WICHTIG!

**Datum:** 2025-01-08  
**Status:** 📋 DOKUMENTIERT

---

## ⚠️ Was NICHT funktioniert in Figma Make

### 1. Import-Aliasse mit `@/` ❌

**Problem:**
```typescript
import { Card } from '@/components/ui/card';  // ❌ Wird als npm-Package behandelt
```

**Fehler:**
```
ERROR: [plugin: npm] Failed to fetch https://esm.sh/@/components/ui/card
```

**Grund:**
- Figma Make verwendet esm.sh für externe Packages
- Jedes Import mit `@` wird als npm-Package interpretiert
- Keine lokale Alias-Auflösung

**Lösung:**
```typescript
import { Card } from '../../components/ui/card';  // ✅ Funktioniert
```

---

## ✅ Was FUNKTIONIERT

### 1. Relative Imports ✅
```typescript
import { Component } from './Component';
import { Component } from '../Component';
import { Component } from '../../components/Component';
```

### 2. npm-Packages ✅
```typescript
import { useState } from 'react';
import { Button } from 'lucide-react';
import { toast } from 'sonner@2.0.3';  // Mit Version
```

### 3. Lokale Komponenten ✅
```typescript
import LoadingState from './components/LoadingState';
import { useAuthStore } from './stores/authStore';
```

---

## 📋 Best Practices für Figma Make

### ✅ DO:
- Relative Imports verwenden
- Klare Ordnerstruktur beibehalten
- Komponenten logisch gruppieren
- Aussagekräftige Dateinamen

### ❌ DON'T:
- Import-Aliasse (`@/`, `@components`, `~`)
- Komplexe Build-Konfigurationen
- Nicht-unterstützte Vite-Plugins

---

## 🎯 Angepasste Refactoring-Strategie

### Ohne Import-Aliasse:

**Immer noch möglich:**
- ✅ Domain-Präfixe (`hr_` für domain-spezifische Dateien)
- ✅ Modulare Architektur
- ✅ File-Size-Limits
- ✅ Security-Baseline
- ✅ Performance-Optimierung
- ✅ Dokumentation

**Nicht möglich:**
- ❌ Import-Aliasse (`@/`)

**Impact auf Score:**
- Original Ziel: 9.0/10
- Neues Ziel: 8.5/10 (immer noch sehr gut!)

---

## 📊 Vergleich: Standard vs. Figma Make

| Feature | Next.js | Vite | Figma Make |
|---------|---------|------|------------|
| Import-Aliasse `@/` | ✅ | ✅ | ❌ |
| Relative Imports | ✅ | ✅ | ✅ |
| npm-Packages | ✅ | ✅ | ✅ (esm.sh) |
| TypeScript | ✅ | ✅ | ✅ |
| Tailwind CSS | ✅ | ✅ | ✅ |
| ShadCN UI | ✅ | ✅ | ✅ |

---

## 💡 Lessons Learned

1. **Jede Umgebung ist anders:** Was in Next.js funktioniert, funktioniert nicht überall
2. **Relative Imports sind universell:** Funktionieren IMMER
3. **Pragmatisch bleiben:** Skip features die nicht funktionieren
4. **Code-Qualität ≠ Aliasse:** Guter Code braucht keine Aliasse!

---

## 🚀 Nächste Schritte

**Phase 1 Anpassung:**
1. ~~Import-Aliasse~~ ❌ SKIPPED
2. Domain-Präfixe ✅ CONTINUE HERE
3. Projekt-Konfiguration ✅ DONE
4. Dokumentation ✅ ONGOING

**Build sollte jetzt funktionieren!**

```bash
npm run build
```

Expected: ✅ Build successful, keine esm.sh Fehler!

---

**Status:** Dokumentiert & Angepasst - Weiter mit Phase 1! 🚀
