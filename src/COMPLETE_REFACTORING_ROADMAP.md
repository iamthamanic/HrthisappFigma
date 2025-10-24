# 🗺️ KOMPLETTE REFACTORING ROADMAP – HRthis System
**Zeitrahmen:** 12 Wochen  
**Ziel:** Vollständige Codex-Compliance (außer Testing)  
**Status:** 📋 Planning Phase

---

## 📊 Executive Summary

| Phase | Wochen | Fokus | Kritikalität | Aufwand |
|-------|--------|-------|--------------|---------|
| **Phase 1** | 1-2 | Foundation (Imports, Naming) | 🔴 CRITICAL | 40h |
| **Phase 2** | 3-4 | File Size & Structure | 🟡 HIGH | 60h |
| **Phase 3** | 5-6 | Architecture Migration | 🟡 HIGH | 80h |
| **Phase 4** | 7-8 | Security & Resilience | 🟡 HIGH | 50h |
| **Phase 5** | 9-10 | Performance & Monitoring | 🟢 MEDIUM | 40h |
| **Phase 6** | 11-12 | Documentation & Polish | 🟢 MEDIUM | 30h |

**Gesamt-Aufwand:** ~300 Stunden (ca. 2 Monate Full-Time oder 3 Monate Part-Time)

---

## 🎯 Projekt-Variablen Definition

**ERSTELLE: `/PROJECT_CONFIG.ts`**

```typescript
/**
 * PROJEKT-KONFIGURATION – HRthis System
 * =====================================
 * Zentrale Definition aller Projekt-Variablen gemäß Codex
 */

export const PROJECT_CONFIG = {
  // Domain & Naming
  DOMAIN_PREFIX: 'hr_',
  IMPORT_ALIAS: '@',
  
  // Style System
  STYLE_SYSTEM: 'Tailwind CSS v4 + CSS Variables',
  UI_PRIMITIVES: 'ShadCN UI',
  
  // Testing (deaktiviert für jetzt)
  TESTING_POLICY: 'off', // TODO: Nach Refactoring auf 'on' setzen
  
  // Review Gates
  REVIEW_GATES: {
    minReviewers: 1,
    requiredRoles: ['ADMIN', 'SUPERADMIN'],
    requiresAllChecks: true,
  },
  
  // Security Baseline
  SEC_BASELINE: {
    standard: 'OWASP ASVS Level 2',
    csp: {
      enabled: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"], // TODO: Remove unsafe-inline
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'connect-src': ["'self'", '*.supabase.co'],
      },
    },
    cors: {
      allowedOrigins: process.env.NODE_ENV === 'production' 
        ? ['https://your-production-domain.com']
        : ['http://localhost:5173', 'http://localhost:3000'],
    },
    dependencies: {
      scanFrequency: 'weekly',
      maxHighVulnerabilities: 0,
      maxCriticalVulnerabilities: 0,
    },
    secrets: {
      management: 'Supabase Secrets',
      rotationPeriod: '90 days',
    },
  },
  
  // Observability Stack
  OBS_STACK: {
    logging: {
      format: 'JSON',
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      includeTraceId: true,
    },
    metrics: {
      enabled: true,
      provider: 'built-in', // TODO: Consider Sentry/DataDog
      trackWebVitals: true,
    },
    tracing: {
      enabled: true,
      sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    },
  },
  
  // Performance Budgets
  PERF_BUDGETS: {
    web: {
      jsPerRoute: 200 * 1024, // 200 KB (gzip)
      lcp: 2000, // 2s (mobile)
      cls: 0.1,
      inp: 200, // ms
      longTaskThreshold: 200, // ms
      totalBundleSize: 512 * 1024, // 512 KB
    },
    backend: {
      p95Latency: 200, // ms
      errorRate: 0.001, // 0.1%
      startupTime: 1000, // 1s
    },
    database: {
      maxQueryTime: 100, // ms
      connectionPoolSize: 20,
      maxConnections: 100,
    },
  },
  
  // Routing Rules
  ROUTING_RULES: {
    mainTabsStrategy: 'routes', // Level 1 = eigene Routen
    subTabsStrategy: 'query-params', // Level 2+ = Query-Parameter
    deepLinkSupport: true,
    historyMode: 'browser',
  },
  
  // File Size Limits
  FILE_LIMITS: {
    soft: 300, // lines
    hard: 500, // lines
    complexity: 10, // cyclomatic complexity
    duplication: 0.03, // 3%
  },
} as const;

export type ProjectConfig = typeof PROJECT_CONFIG;
```

---

# 📅 PHASE 1: FOUNDATION (Woche 1-2) 🔴 CRITICAL

**Ziel:** Import-Aliasse + Domain-Präfixe + Projekt-Konfiguration  
**Aufwand:** 40 Stunden  
**Team:** 1 Developer

---

## 1.1 Import-Aliasse konfigurieren (Tag 1-2, 8h)

### Step 1: Build-Tool konfigurieren

**ERSTELLE/BEARBEITE: `/vite.config.ts`** (oder tsconfig wenn kein Vite)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@components': path.resolve(__dirname, './components'),
      '@screens': path.resolve(__dirname, './screens'),
      '@stores': path.resolve(__dirname, './stores'),
      '@hooks': path.resolve(__dirname, './hooks'),
      '@utils': path.resolve(__dirname, './utils'),
      '@types': path.resolve(__dirname, './types'),
      '@layouts': path.resolve(__dirname, './layouts'),
      '@styles': path.resolve(__dirname, './styles'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
```

**BEARBEITE: `/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@components/*": ["./components/*"],
      "@screens/*": ["./screens/*"],
      "@stores/*": ["./stores/*"],
      "@hooks/*": ["./hooks/*"],
      "@utils/*": ["./utils/*"],
      "@types/*": ["./types/*"],
      "@layouts/*": ["./layouts/*"],
      "@styles/*": ["./styles/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### Step 2: Automatisierte Migration aller Imports

**ERSTELLE: `/scripts/migrate-imports.js`**

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * IMPORT-MIGRATION SCRIPT
 * =======================
 * Ersetzt alle relativen Imports durch @/ Aliasse
 */

const ALIAS_MAP = {
  'components': '@components',
  'screens': '@screens',
  'stores': '@stores',
  'hooks': '@hooks',
  'utils': '@utils',
  'types': '@types',
  'layouts': '@layouts',
  'styles': '@styles',
};

function getAllTsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        getAllTsxFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function migrateImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Pattern: import ... from '../../something'
  const importRegex = /from ['"](\.\.\/.+?)['"]/g;
  
  content = content.replace(importRegex, (match, importPath) => {
    // Zähle ../ um Tiefe zu bestimmen
    const depth = (importPath.match(/\.\.\//g) || []).length;
    
    // Extrahiere den Pfad nach allen ../
    const cleanPath = importPath.replace(/\.\.\//g, '');
    
    // Bestimme Kategorie (components, stores, etc.)
    const category = cleanPath.split('/')[0];
    
    if (ALIAS_MAP[category]) {
      changed = true;
      const newImport = cleanPath.replace(category, ALIAS_MAP[category]);
      console.log(`  ✅ ${importPath} → ${newImport}`);
      return `from '${newImport}'`;
    }
    
    return match;
  });
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

// Main execution
console.log('🚀 Starting import migration...\n');

const files = getAllTsxFiles('.');
let migratedCount = 0;

files.forEach(file => {
  const relativePath = file.replace(process.cwd() + '/', '');
  
  if (migrateImports(file)) {
    migratedCount++;
    console.log(`✨ Migrated: ${relativePath}\n`);
  }
});

console.log(`\n✅ Migration complete! ${migratedCount}/${files.length} files updated.`);
```

### Step 3: Migration ausführen

```bash
# 1. Script ausführbar machen
chmod +x scripts/migrate-imports.js

# 2. Backup erstellen
git add -A
git commit -m "Pre-import-migration backup"

# 3. Migration durchführen
node scripts/migrate-imports.js

# 4. Prüfen ob alles kompiliert
npm run build

# 5. Wenn erfolgreich, commiten
git add -A
git commit -m "refactor: migrate all imports to @ aliases"
```

### ✅ Checklist Tag 1-2
- [ ] vite.config.ts erstellt/aktualisiert
- [ ] tsconfig.json aktualisiert
- [ ] Migration-Script erstellt
- [ ] Backup committed
- [ ] Migration ausgeführt
- [ ] Build erfolgreich
- [ ] Changes committed

---

## 1.2 Domain-Präfixe konsistent machen (Tag 3-5, 16h)

### Step 1: Dateien kategorisieren

**ERSTELLE: `/scripts/categorize-files.js`**

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * DATEI-KATEGORISIERUNG
 * =====================
 * Listet alle Dateien auf und kategorisiert sie:
 * - DOMAIN-SPEZIFISCH (braucht hr_ Präfix)
 * - GENERISCH (kein Präfix)
 */

const GENERIC_PATTERNS = [
  // UI Components (ShadCN)
  /^components\/ui\//,
  
  // Generic Components
  /^components\/(Logo|LoadingState|ErrorBoundary|PageTransition|SkeletonLoader|EnhancedButton|EmptyState|ConnectionError)\.tsx$/,
  
  // Generic Hooks
  /^hooks\/(useThrottle|usePermissions|useMonthYearPicker)\.ts$/,
  
  // Generic Utils
  /^utils\/(debugHelper|exportUtils|organizationHelper|startupDiagnostics)\.ts$/,
  
  // Layouts
  /^layouts\//,
  
  // Figma imports
  /^components\/figma\//,
  /^imports\//,
];

const DOMAIN_SPECIFIC_PATTERNS = [
  // Screens (alle domain-spezifisch)
  /^screens\//,
  
  // Stores (alle domain-spezifisch)
  /^stores\//,
  
  // Domain-spezifische Components
  /^components\/(Leave|Team|Organigram|Learning|Achievement|Avatar|XP|Activity|Benefit|Document|Break|Work|Quiz|Video|Admin|Request|Bulk|Quick|Saved|Sort|Notification).*\.tsx$/,
  
  // Domain-spezifische Hooks
  /^hooks\/(useLeave|useTeam|useOrganigram|useRole|useCoverage|useGermanHolidays|useBusinessDays|useVacation).*\.ts$/,
  
  // Domain-spezifische Utils
  /^utils\/(leaveApprover|organigramTransformers|xpSystem|videoHelper|youtubeHelper).*\.ts$/,
];

function categorizeFile(filePath) {
  // Prüfe ob generisch
  if (GENERIC_PATTERNS.some(pattern => pattern.test(filePath))) {
    return 'GENERIC';
  }
  
  // Prüfe ob domain-spezifisch
  if (DOMAIN_SPECIFIC_PATTERNS.some(pattern => pattern.test(filePath))) {
    return 'DOMAIN_SPECIFIC';
  }
  
  return 'UNKNOWN';
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== 'build') {
        getAllFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath.replace(process.cwd() + '/', ''));
    }
  });
  
  return fileList;
}

// Main
const files = getAllFiles('.');

const categorized = {
  GENERIC: [],
  DOMAIN_SPECIFIC: [],
  UNKNOWN: [],
};

files.forEach(file => {
  const category = categorizeFile(file);
  categorized[category].push(file);
});

console.log('📊 FILE CATEGORIZATION REPORT\n');
console.log('=' .repeat(60));

console.log('\n✅ GENERIC FILES (kein Präfix nötig):');
console.log('-'.repeat(60));
categorized.GENERIC.forEach(file => console.log(`  ${file}`));

console.log('\n🎯 DOMAIN-SPECIFIC FILES (brauchen hr_ Präfix):');
console.log('-'.repeat(60));
categorized.DOMAIN_SPECIFIC.forEach(file => {
  const hasPrefix = file.includes('hr_');
  const marker = hasPrefix ? '✅' : '❌';
  console.log(`  ${marker} ${file}`);
});

console.log('\n❓ UNKNOWN FILES (manuelle Prüfung):');
console.log('-'.repeat(60));
categorized.UNKNOWN.forEach(file => console.log(`  ${file}`));

console.log('\n📈 STATISTICS:');
console.log('-'.repeat(60));
console.log(`Generic:         ${categorized.GENERIC.length}`);
console.log(`Domain-Specific: ${categorized.DOMAIN_SPECIFIC.length}`);
console.log(`Unknown:         ${categorized.UNKNOWN.length}`);

const needsPrefix = categorized.DOMAIN_SPECIFIC.filter(f => !f.includes('hr_')).length;
console.log(`\n⚠️  ${needsPrefix} files need hr_ prefix`);

// Erstelle Rename-Plan
console.log('\n📝 RENAME PLAN:');
console.log('-'.repeat(60));

const renamePlan = [];
categorized.DOMAIN_SPECIFIC.forEach(file => {
  if (!file.includes('hr_')) {
    const parts = file.split('/');
    const fileName = parts[parts.length - 1];
    const dir = parts.slice(0, -1).join('/');
    const newFileName = 'hr_' + fileName;
    const newPath = dir ? `${dir}/${newFileName}` : newFileName;
    
    renamePlan.push({ old: file, new: newPath });
    console.log(`git mv ${file} ${newPath}`);
  }
});

// Save rename plan
fs.writeFileSync(
  'RENAME_PLAN.json',
  JSON.stringify(renamePlan, null, 2)
);

console.log(`\n✅ Rename plan saved to RENAME_PLAN.json`);
```

### Step 2: Umbenennung durchführen

**ERSTELLE: `/scripts/execute-rename.js`**

```javascript
#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

/**
 * RENAME EXECUTION SCRIPT
 * ========================
 * Führt die Umbenennungen aus RENAME_PLAN.json aus
 */

const plan = JSON.parse(fs.readFileSync('RENAME_PLAN.json', 'utf8'));

console.log(`🚀 Executing rename plan for ${plan.length} files...\n`);

// Phase 1: Git mv (preserve history)
console.log('📦 Phase 1: Renaming files with git mv...');
plan.forEach(({ old, new: newPath }, index) => {
  try {
    execSync(`git mv "${old}" "${newPath}"`, { stdio: 'inherit' });
    console.log(`  ✅ [${index + 1}/${plan.length}] ${old} → ${newPath}`);
  } catch (error) {
    console.error(`  ❌ Failed to rename ${old}:`, error.message);
  }
});

console.log('\n✅ Phase 1 complete!\n');

// Phase 2: Update all imports
console.log('📝 Phase 2: Updating imports in all files...');

function updateImportsInFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  plan.forEach(({ old, new: newPath }) => {
    // Extract filename without extension
    const oldName = old.split('/').pop().replace(/\.(tsx?|ts)$/, '');
    const newName = newPath.split('/').pop().replace(/\.(tsx?|ts)$/, '');
    
    // Replace imports
    const importRegex = new RegExp(`from ['"](.*)/${oldName}['"]`, 'g');
    const newContent = content.replace(importRegex, (match, path) => {
      changed = true;
      return `from '${path}/${newName}'`;
    });
    
    // Replace lazy imports
    const lazyRegex = new RegExp(`import\\(['"](.*)/${oldName}['"]\\)`, 'g');
    content = newContent.replace(lazyRegex, (match, path) => {
      changed = true;
      return `import('${path}/${newName}')`;
    });
  });
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = `${dir}/${file}`;
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        getAllFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

const allFiles = getAllFiles('.');
let updatedCount = 0;

allFiles.forEach(file => {
  if (updateImportsInFile(file)) {
    updatedCount++;
    console.log(`  ✅ Updated imports in ${file}`);
  }
});

console.log(`\n✅ Phase 2 complete! Updated ${updatedCount} files.\n`);

console.log('🎉 All done! Next steps:');
console.log('  1. npm run build (verify everything compiles)');
console.log('  2. git add -A');
console.log('  3. git commit -m "refactor: add hr_ prefix to domain-specific files"');
```

### Step 3: Ausführung

```bash
# 1. Kategorisierung
node scripts/categorize-files.js

# 2. Manuell RENAME_PLAN.json prüfen und anpassen

# 3. Backup
git add -A
git commit -m "Pre-rename backup"

# 4. Umbenennung
node scripts/execute-rename.js

# 5. Build prüfen
npm run build

# 6. Commit
git add -A
git commit -m "refactor: add hr_ prefix to domain-specific files"
```

### ✅ Checklist Tag 3-5
- [ ] Kategorisierungs-Script erstellt und ausgeführt
- [ ] RENAME_PLAN.json geprüft
- [ ] Backup committed
- [ ] Rename-Script ausgeführt
- [ ] Alle Imports aktualisiert
- [ ] Build erfolgreich
- [ ] Changes committed

---

## 1.3 Projekt-Konfiguration definieren (Tag 6-7, 8h)

### Step 1: Projekt-Konfiguration erstellen

**ERSTELLE: `/config/hr_projectConfig.ts`** (bereits oben definiert)

### Step 2: Security-Baseline dokumentieren

**ERSTELLE: `/docs/SECURITY_BASELINE.md`**

```markdown
# Security Baseline – HRthis System

## OWASP ASVS Level 2 Compliance

### ✅ Implemented

- [x] Supabase Row Level Security (RLS)
- [x] Authentication via Supabase Auth
- [x] No secrets in repository
- [x] HTTPS enforced (production)

### 🔄 In Progress

- [ ] CSP Headers (siehe PROJECT_CONFIG.ts)
- [ ] CORS Whitelist
- [ ] Input validation on all forms
- [ ] Rate limiting

### ⏳ Planned

- [ ] Dependency scanning in CI/CD
- [ ] Security headers (HSTS, X-Frame-Options, etc.)
- [ ] API key rotation (quarterly)

## Dependency Management

```bash
# Weekly scan
npm audit

# Fix vulnerabilities
npm audit fix

# Critical/High must be fixed within 7 days
```

## Secret Management

- **Storage**: Supabase Secrets Manager
- **Rotation**: Every 90 days
- **Access**: Only SUPERADMIN

## Incident Response

1. **Detection**: Error monitoring (future: Sentry)
2. **Response**: < 4h for critical, < 24h for high
3. **Postmortem**: Document in `/docs/incidents/`

## Compliance Checklist

- [ ] GDPR-compliant data handling
- [ ] User data encryption at rest
- [ ] Audit logs for sensitive operations
- [ ] Regular security reviews (quarterly)
```

### Step 3: Performance-Budgets dokumentieren

**ERSTELLE: `/docs/PERFORMANCE_BUDGETS.md`**

```markdown
# Performance Budgets – HRthis System

## Web Performance

| Metric | Budget | Current | Status |
|--------|--------|---------|--------|
| **JavaScript (per route)** | ≤ 200 KB (gzip) | TBD | 🟡 |
| **LCP (mobile)** | ≤ 2000 ms | TBD | 🟡 |
| **CLS** | ≤ 0.1 | TBD | 🟡 |
| **INP** | ≤ 200 ms | TBD | 🟡 |
| **Total Bundle** | ≤ 512 KB | TBD | 🟡 |

## Backend Performance

| Metric | Budget | Current | Status |
|--------|--------|---------|--------|
| **P95 Latency** | ≤ 200 ms | TBD | 🟡 |
| **Error Rate** | ≤ 0.1% | TBD | 🟡 |
| **Startup Time** | ≤ 1s | TBD | 🟡 |

## Measurement Plan

### Week 1: Baseline
```bash
# 1. Bundle analysis
npm run build
npx vite-bundle-visualizer

# 2. Lighthouse
npx lighthouse https://your-app.com --view

# 3. Record baselines in this document
```

### Week 2: Optimization
- Identify heavy routes
- Code-split large components
- Lazy-load non-critical resources

### Week 3: Monitoring
- Set up Web Vitals tracking
- Configure alerts for budget violations
- Add to CI/CD pipeline

## Budget Violations

**If budget exceeded:**
1. Create GitHub issue
2. Analyze root cause
3. Implement fix within 1 sprint
4. Re-measure
```

### ✅ Checklist Tag 6-7
- [ ] PROJECT_CONFIG.ts erstellt
- [ ] SECURITY_BASELINE.md dokumentiert
- [ ] PERFORMANCE_BUDGETS.md dokumentiert
- [ ] Config in App integriert
- [ ] Changes committed

---

## 1.4 MD-Dateien aufräumen (Tag 8-10, 8h)

### Step 1: Dokumentation strukturieren

```bash
# Erstelle Ordnerstruktur
mkdir -p docs/{architecture,guides,migrations,troubleshooting,decisions}

# Verschiebe Dateien
mv *_SYSTEM.md docs/architecture/
mv *_MIGRATION*.md docs/migrations/
mv *_FIX*.md docs/troubleshooting/
mv *_GUIDE*.md docs/guides/
mv *_README.md docs/guides/

# Löschen veralteter Quick-Fix Dateien (nach Review)
# Diese sollten ins Git-History, nicht im aktuellen Stand
git rm QUICK_FIX_*.md
```

### Step 2: Master-Index erstellen

**ERSTELLE: `/docs/INDEX.md`**

```markdown
# HRthis Documentation Index

## 🏗️ Architecture

- [Leave Management System](./architecture/LEAVE_MANAGEMENT_SYSTEM.md)
- [Team Management System](./architecture/TEAM_MANAGEMENT_FEATURES_COMPLETE.md)
- [Learning System](./architecture/LEARNING_SYSTEM_README.md)
- [Organigram System](./architecture/CANVA_ORGANIGRAM_SYSTEM.md)
- [Documents System](./architecture/DOCUMENTS_SYSTEM_README.md)

## 📖 Guides

- [Quick Start](./guides/QUICK_START_GUIDE.md)
- [Single Tenant Setup](./guides/SINGLE_TENANT_SETUP.md)
- [Organigram V2](./guides/QUICK_START_ORGANIGRAM_V2.md)
- [Team Calendar](./guides/QUICK_START_TEAM_CALENDAR.md)

## 🔧 Migrations

- [All Team Features](./migrations/SQL_ALL_TEAM_FEATURES_MIGRATIONS.md)
- [Departments](./migrations/SQL_DEPARTMENTS_MIGRATION.md)
- [User Notes](./migrations/SQL_USER_NOTES_MIGRATION.md)

## 🐛 Troubleshooting

- [Failed to Fetch Fix](./troubleshooting/FAILED_TO_FETCH_FIX.md)
- [Supabase Connection Fix](./troubleshooting/SUPABASE_CONNECTION_FIX.md)
- [React Hooks Error](./troubleshooting/REACT_HOOKS_ERROR_FIX.md)

## ✅ Architecture Decisions (ADRs)

- [ADR-001: Supabase Backend](./decisions/001-supabase-backend.md)
- [ADR-002: Single-Tenant Architecture](./decisions/002-single-tenant.md)
- [ADR-003: ShadCN UI Components](./decisions/003-shadcn-ui.md)
- [ADR-004: Zustand State Management](./decisions/004-zustand-state.md)

## 🚀 Current Status

- **Version**: 3.2.0
- **Last Updated**: 2025-01-08
- **Active Features**: Leave, Teams, Learning, Organigram, Documents, Benefits
```

### ✅ Checklist Tag 8-10
- [ ] Dokumentations-Ordner erstellt
- [ ] Dateien verschoben
- [ ] INDEX.md erstellt
- [ ] Veraltete Dateien gelöscht
- [ ] Changes committed

---

## ✅ Phase 1 Abschluss-Checklist

- [ ] Import-Aliasse funktionieren (npm run build erfolgreich)
- [ ] Alle domain-spezifischen Dateien haben hr_ Präfix
- [ ] PROJECT_CONFIG.ts existiert und wird verwendet
- [ ] SECURITY_BASELINE.md dokumentiert
- [ ] PERFORMANCE_BUDGETS.md dokumentiert
- [ ] Dokumentation aufgeräumt und strukturiert
- [ ] Alle Changes committed und gepusht

**Geschätzter Aufwand:** 40h  
**Tatsächlicher Aufwand:** _____h  
**Blockers/Issues:** _____________

---

# 📅 PHASE 2: FILE SIZE & STRUCTURE (Woche 3-4) 🟡 HIGH

**Ziel:** Dateigrößen-Audit + Splitting großer Dateien  
**Aufwand:** 60 Stunden

---

## 2.1 Dateigrößen-Audit (Tag 11-12, 8h)

### Step 1: Alle Dateien messen

**ERSTELLE: `/scripts/hr_filesize-audit.js`**

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * FILE SIZE AUDIT
 * ===============
 * Misst alle .tsx/.ts Dateien und identifiziert Refactoring-Kandidaten
 */

function countLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return content.split('\n').length;
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        getAllFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

const files = getAllFiles('.');

const analyzed = files.map(file => ({
  path: file.replace(process.cwd() + '/', ''),
  lines: countLines(file),
})).sort((a, b) => b.lines - a.lines);

console.log('📊 FILE SIZE AUDIT REPORT\n');
console.log('='.repeat(80));

// Critical (> 500 lines)
const critical = analyzed.filter(f => f.lines > 500);
if (critical.length > 0) {
  console.log('\n🔴 CRITICAL (> 500 lines) - MUST REFACTOR:');
  console.log('-'.repeat(80));
  critical.forEach(f => console.log(`  ${f.lines.toString().padStart(4)} | ${f.path}`));
}

// Warning (300-500 lines)
const warning = analyzed.filter(f => f.lines > 300 && f.lines <= 500);
if (warning.length > 0) {
  console.log('\n🟡 WARNING (300-500 lines) - SHOULD REFACTOR:');
  console.log('-'.repeat(80));
  warning.forEach(f => console.log(`  ${f.lines.toString().padStart(4)} | ${f.path}`));
}

// OK (< 300 lines)
const ok = analyzed.filter(f => f.lines <= 300);
console.log('\n✅ OK (< 300 lines):');
console.log(`  ${ok.length} files`);

// Statistics
console.log('\n📈 STATISTICS:');
console.log('-'.repeat(80));
console.log(`Total files:     ${analyzed.length}`);
console.log(`Critical:        ${critical.length} (${((critical.length/analyzed.length)*100).toFixed(1)}%)`);
console.log(`Warning:         ${warning.length} (${((warning.length/analyzed.length)*100).toFixed(1)}%)`);
console.log(`OK:              ${ok.length} (${((ok.length/analyzed.length)*100).toFixed(1)}%)`);
console.log(`Average size:    ${Math.round(analyzed.reduce((sum, f) => sum + f.lines, 0) / analyzed.length)} lines`);
console.log(`Largest file:    ${analyzed[0].lines} lines (${analyzed[0].path})`);

// Save report
const report = {
  date: new Date().toISOString(),
  critical,
  warning,
  ok: ok.length,
  stats: {
    total: analyzed.length,
    criticalCount: critical.length,
    warningCount: warning.length,
    okCount: ok.length,
    averageSize: Math.round(analyzed.reduce((sum, f) => sum + f.lines, 0) / analyzed.length),
  }
};

fs.writeFileSync('FILE_SIZE_AUDIT.json', JSON.stringify(report, null, 2));
console.log('\n✅ Full report saved to FILE_SIZE_AUDIT.json');
```

```bash
# Ausführen
node scripts/hr_filesize-audit.js
```

### Step 2: Refactoring-Plan erstellen

Basierend auf dem Audit, erstelle einen Plan für jede Datei > 300 Zeilen:

**ERSTELLE: `/docs/refactoring/FILE_SPLITTING_PLAN.md`**

```markdown
# File Splitting Plan

## Kritisch (> 500 Zeilen)

### screens/admin/hr_TeamManagementScreen.tsx (geschätzt ~800 Zeilen)

**Splitting-Strategie:**
1. Extrahiere `TeamDialog` → components/hr_TeamDialog.tsx
2. Extrahiere `TeamMembersList` → components/hr_TeamMembersList.tsx
3. Extrahiere `TeamLeadsList` → components/hr_TeamLeadsList.tsx
4. Erstelle hooks/hr_useTeamManagement.ts für Business-Logik

**Neue Struktur:**
- screens/admin/hr_TeamManagementScreen.tsx (~200 Zeilen)
- components/hr_TeamDialog.tsx (~150 Zeilen)
- components/hr_TeamMembersList.tsx (~150 Zeilen)
- components/hr_TeamLeadsList.tsx (~150 Zeilen)
- hooks/hr_useTeamManagement.ts (~150 Zeilen)

### screens/hr_TimeAndLeaveScreen.tsx (geschätzt ~600 Zeilen)

**Splitting-Strategie:**
1. Extrahiere `LeaveTab` → components/hr_LeaveTab.tsx
2. Extrahiere `TimeTab` → components/hr_TimeTab.tsx
3. Extrahiere hooks/hr_useTimeAndLeave.ts

...
```

### ✅ Checklist Tag 11-12
- [ ] Filesize-Audit-Script erstellt
- [ ] Audit durchgeführt
- [ ] FILE_SIZE_AUDIT.json erstellt
- [ ] FILE_SPLITTING_PLAN.md erstellt
- [ ] Priorisierung festgelegt

---

## 2.2 Top 5 größte Dateien splitten (Tag 13-20, 40h)

Für jede Datei:

### Template: Datei splitten

**Beispiel: hr_TeamManagementScreen.tsx**

#### Step 1: Business-Logik extrahieren

**ERSTELLE: `/hooks/hr_useTeamManagement.ts`**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@utils/supabase/client';
import { toast } from 'sonner@2.0.3';
import type { Team } from '@types/database';

export function hr_useTeamManagement() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const loadTeams = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      setTeams(data || []);
    } catch (error) {
      console.error('Error loading teams:', error);
      toast.error('Fehler beim Laden der Teams');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadTeams();
  }, [loadTeams]);
  
  const createTeam = useCallback(async (teamData: Partial<Team>) => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert([teamData])
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Team erstellt');
      await loadTeams();
      
      return data;
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Fehler beim Erstellen des Teams');
      throw error;
    }
  }, [loadTeams]);
  
  const updateTeam = useCallback(async (teamId: string, updates: Partial<Team>) => {
    try {
      const { error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', teamId);
      
      if (error) throw error;
      
      toast.success('Team aktualisiert');
      await loadTeams();
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Fehler beim Aktualisieren des Teams');
      throw error;
    }
  }, [loadTeams]);
  
  const deleteTeam = useCallback(async (teamId: string) => {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);
      
      if (error) throw error;
      
      toast.success('Team gelöscht');
      await loadTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Fehler beim Löschen des Teams');
      throw error;
    }
  }, [loadTeams]);
  
  return {
    teams,
    loading,
    searchQuery,
    setSearchQuery,
    loadTeams,
    createTeam,
    updateTeam,
    deleteTeam,
  };
}
```

#### Step 2: Sub-Komponenten extrahieren

**ERSTELLE: `/components/hr_TeamDialog.tsx`** (~150 Zeilen)

```typescript
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import type { Team } from '@types/database';

interface hr_TeamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (team: Partial<Team>) => Promise<void>;
  team?: Team | null;
}

export function hr_TeamDialog({
  isOpen,
  onClose,
  onSave,
  team,
}: hr_TeamDialogProps) {
  const [name, setName] = useState(team?.name || '');
  const [description, setDescription] = useState(team?.description || '');
  const [loading, setLoading] = useState(false);
  
  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave({ name, description });
      onClose();
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {team ? 'Team bearbeiten' : 'Neues Team erstellen'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Team-Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Entwicklung"
            />
          </div>
          
          <div>
            <Label>Beschreibung</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optionale Beschreibung"
            />
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={loading || !name}>
              {loading ? 'Speichern...' : 'Speichern'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

#### Step 3: Haupt-Screen vereinfachen

**BEARBEITE: `/screens/admin/hr_TeamManagementScreen.tsx`**

```typescript
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { hr_useTeamManagement } from '@hooks/hr_useTeamManagement';
import { hr_TeamDialog } from '@components/hr_TeamDialog';
import { hr_TeamMembersList } from '@components/hr_TeamMembersList';
import { Plus } from 'lucide-react';

export default function hr_TeamManagementScreen() {
  const {
    teams,
    loading,
    createTeam,
    updateTeam,
    deleteTeam,
  } = hr_useTeamManagement();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Team-Verwaltung</CardTitle>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Neues Team
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div>Laden...</div>
          ) : (
            <hr_TeamMembersList
              teams={teams}
              onEdit={(team) => {
                setSelectedTeam(team);
                setDialogOpen(true);
              }}
              onDelete={deleteTeam}
            />
          )}
        </CardContent>
      </Card>
      
      <hr_TeamDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedTeam(null);
        }}
        onSave={selectedTeam ? updateTeam : createTeam}
        team={selectedTeam}
      />
    </div>
  );
}
```

**Resultat:**
- Screen: ~100 Zeilen (war vorher ~800)
- Hook: ~150 Zeilen
- Dialog: ~150 Zeilen
- List: ~150 Zeilen

### Wiederhole für Top 5 Dateien

1. hr_TeamManagementScreen.tsx
2. hr_TimeAndLeaveScreen.tsx
3. hr_OrganigramCanvasScreenV2.tsx
4. hr_DashboardScreen.tsx
5. hr_LearningScreen.tsx

### ✅ Checklist Tag 13-20 (für jede Datei)
- [ ] Business-Logik in Hook extrahiert
- [ ] Sub-Komponenten extrahiert
- [ ] Haupt-Datei vereinfacht
- [ ] Imports aktualisiert
- [ ] Build erfolgreich
- [ ] Functionality getestet
- [ ] Committed

---

## 2.3 Complexity-Audit (Tag 21-22, 12h)

### ESLint Complexity-Check konfigurieren

**ERSTELLE/BEARBEITE: `/.eslintrc.cjs`**

```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    
    // Complexity Rules (Codex)
    'complexity': ['warn', 10], // Max cyclomatic complexity = 10
    'max-depth': ['warn', 4], // Max nesting depth = 4
    'max-lines-per-function': ['warn', { max: 100, skipBlankLines: true, skipComments: true }],
    'max-params': ['warn', 4], // Max function parameters = 4
  },
}
```

```bash
# Audit durchführen
npm run lint > COMPLEXITY_AUDIT.txt
```

### ✅ Checklist Tag 21-22
- [ ] ESLint konfiguriert
- [ ] Complexity-Audit durchgeführt
- [ ] Violations identifiziert
- [ ] Refactoring-Tickets erstellt

---

## ✅ Phase 2 Abschluss-Checklist

- [ ] Alle Dateien < 500 Zeilen (hart)
- [ ] 80%+ Dateien < 300 Zeilen (soft)
- [ ] Complexity ≤ 10 in kritischen Funktionen
- [ ] FILE_SIZE_AUDIT.json aktualisiert
- [ ] Alle Changes committed

**Geschätzter Aufwand:** 60h  
**Tatsächlicher Aufwand:** _____h

---

# 📅 PHASE 3: ARCHITECTURE MIGRATION (Woche 5-6) 🟡 HIGH

**Ziel:** Neue modules/features Struktur aufbauen  
**Aufwand:** 80 Stunden

---

*[Fortsetzung folgt in Teil 2 wegen Länge...]*
