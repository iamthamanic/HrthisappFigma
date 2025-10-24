# 🗺️ REFACTORING ROADMAP TEIL 2 – Phasen 3-6

[← Zurück zu Teil 1](./COMPLETE_REFACTORING_ROADMAP.md)

---

# 📅 PHASE 3: ARCHITECTURE MIGRATION (Woche 5-6) 🟡 HIGH

**Ziel:** Neue modules/features Struktur parallel aufbauen  
**Aufwand:** 80 Stunden  
**Strategie:** Parallel migration, keine Big-Bang Änderung

---

## 3.1 Neue Ordnerstruktur aufbauen (Tag 23-25, 16h)

### Step 1: Ziel-Struktur definieren

**NEUE STRUKTUR:**

```
src/
  modules/                          ← 🆕 Alle Features/Domains
    hr_leave/                       ← Leave Management Domain
      _shared/
        components/
          hr_LeaveRequestDialog.tsx
          hr_LeaveRequestsList.tsx
          hr_LeaveCalendar.tsx
        hooks/
          hr_useLeaveManagement.ts
          hr_useTeamLeaves.ts
          hr_useBusinessDays.ts
        services/
          hr_leaveService.ts
          hr_approvalService.ts
        types/
          hr_leaveTypes.ts
        core/
          hr_leaveApproverLogic.ts
          hr_vacationCarryover.ts
      
      requests/                     ← Sub-Domain
        hr_RequestsScreen.tsx
        hr_RequestForm.tsx
      
      approval/                     ← Sub-Domain
        hr_ApprovalScreen.tsx
        hr_ApprovalQueue.tsx
      
      calendar/                     ← Sub-Domain
        hr_TeamCalendarScreen.tsx
    
    hr_team/                        ← Team Management Domain
      _shared/
        components/
          hr_TeamDialog.tsx
          hr_TeamMembersList.tsx
          hr_TeamLeadsList.tsx
        hooks/
          hr_useTeamManagement.ts
          hr_useRoleManagement.ts
        services/
          hr_teamService.ts
        types/
          hr_teamTypes.ts
        core/
          hr_teamPermissions.ts
      
      management/
        hr_TeamManagementScreen.tsx
        hr_TeamMemberDetailsScreen.tsx
      
      departments/
        hr_DepartmentsScreen.tsx
        hr_EditDepartmentDialog.tsx
    
    hr_time/                        ← Time Tracking Domain
      _shared/
        components/
          hr_ClockInCard.tsx
          hr_BreakManager.tsx
        hooks/
          hr_useTimeTracking.ts
        services/
          hr_timeService.ts
        types/
          hr_timeTypes.ts
        core/
          hr_breakCalculations.ts
      
      tracking/
        hr_TimeTrackingScreen.tsx
      
      reports/
        hr_TimeReportsScreen.tsx
    
    hr_learning/                    ← Learning & Development
      _shared/
        components/
          hr_VideoPlayer.tsx
          hr_QuizPlayer.tsx
        hooks/
          hr_useLearningProgress.ts
        services/
          hr_learningService.ts
        types/
          hr_learningTypes.ts
      
      videos/
        hr_VideoDetailScreen.tsx
        hr_VideoListScreen.tsx
      
      quizzes/
        hr_QuizDetailScreen.tsx
      
      admin/
        hr_LearningAdminScreen.tsx
      
      shop/
        hr_LearningShopScreen.tsx
    
    hr_gamification/                ← XP, Achievements, Avatars
      _shared/
        components/
          hr_AchievementBadge.tsx
          hr_XPProgress.tsx
          hr_AvatarDisplay.tsx
        hooks/
          hr_useGamification.ts
        services/
          hr_gamificationService.ts
        types/
          hr_gamificationTypes.ts
        core/
          hr_xpSystem.ts
      
      achievements/
        hr_AchievementsScreen.tsx
      
      avatar/
        hr_AvatarScreen.tsx
        hr_AvatarEditor.tsx
    
    hr_organigram/                  ← Org Chart
      _shared/
        components/
          canvas/
            hr_CanvasOrgChart.tsx
            hr_CanvasControls.tsx
          hr_OrgNode.tsx
          hr_ConnectionLine.tsx
        hooks/
          hr_useOrganigramUserInfo.ts
        services/
          hr_organigramService.ts
        types/
          hr_CanvasTypes.ts
        core/
          hr_organigramTransformers.ts
          hr_CanvasHandlers.ts
          hr_CanvasUtils.ts
      
      view/
        hr_OrganigramViewScreen.tsx
      
      admin/
        hr_OrganigramCanvasScreen.tsx
        hr_CreateNodeDialog.tsx
        hr_EditNodeDialog.tsx
    
    hr_documents/                   ← Document Management
      _shared/
        components/
          hr_DocumentCard.tsx
          hr_UploadDialog.tsx
        hooks/
          hr_useDocuments.ts
        services/
          hr_documentService.ts
        types/
          hr_documentTypes.ts
      
      list/
        hr_DocumentsScreen.tsx
    
    hr_benefits/                    ← Benefits & Perks
      _shared/
        components/
          hr_BenefitCard.tsx
        hooks/
          hr_useBenefits.ts
        services/
          hr_benefitsService.ts
        types/
          hr_benefitsTypes.ts
      
      catalog/
        hr_BenefitsScreen.tsx
      
      admin/
        hr_BenefitsManagementScreen.tsx
  
  core/                             ← Domain-übergreifend
    auth/
      hr_authStore.ts
      hr_authService.ts
      hr_authTypes.ts
    
    permissions/
      hr_usePermissions.ts
      hr_permissionsLogic.ts
    
    notifications/
      hr_notificationStore.ts
      hr_NotificationCenter.tsx
    
    errors/
      hr_DomainErrors.ts
      hr_ErrorBoundary.tsx
    
    config/
      hr_projectConfig.ts
  
  infra/                            ← Infrastructure/Adapters
    supabase/
      client.ts
      connectionTest.ts
      resilience.ts                 ← 🆕 Retry, Circuit-Breaker
      types.ts
    
    storage/
      storageService.ts
      diagnostics.ts
    
    monitoring/
      logger.ts                     ← 🆕 Structured logging
      metrics.ts                    ← 🆕 Performance tracking
      tracer.ts                     ← 🆕 Distributed tracing
  
  ui/                               ← System-wide UI
    primitives/                     ← ShadCN Components
      button.tsx
      input.tsx
      dialog.tsx
      ...
    
    layouts/
      MainLayout.tsx
      AdminLayout.tsx
    
    components/                     ← Generic, wiederverwendbar
      Logo.tsx
      LoadingState.tsx
      EmptyState.tsx
      SkeletonLoader.tsx
    
    styles/
      globals.css
```

### Step 2: Migration-Script erstellen

**ERSTELLE: `/scripts/hr_migrate-to-modules.js`**

```javascript
#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

/**
 * MODULE MIGRATION SCRIPT
 * =======================
 * Migriert Dateien aus flacher Struktur zu modules/features
 */

const MIGRATION_MAP = {
  // Leave Management
  'hr_leave': {
    '_shared/components': [
      'components/hr_RequestLeaveDialog.tsx',
      'components/hr_AdminRequestLeaveDialog.tsx',
      'components/hr_LeaveRequestsList.tsx',
    ],
    '_shared/hooks': [
      'hooks/hr_useLeaveManagement.ts',
      'hooks/hr_useTeamLeaves.ts',
      'hooks/hr_useBusinessDays.ts',
      'hooks/hr_useGermanHolidays.ts',
      'hooks/hr_useVacationCarryover.ts',
      'hooks/hr_useLeaveReminders.ts',
      'hooks/hr_useLeaveRequestsList.ts',
      'hooks/hr_useCoverageChain.ts',
    ],
    '_shared/core': [
      'utils/hr_leaveApproverLogic.ts',
    ],
    '_shared/types': [
      // Extract from types/database.ts
    ],
  },
  
  // Team Management
  'hr_team': {
    '_shared/components': [
      'components/hr_TeamDialog.tsx', // Wird noch erstellt
      'components/hr_TeamMembersList.tsx', // Wird noch erstellt
    ],
    '_shared/hooks': [
      'hooks/hr_useRoleManagement.ts',
    ],
    'management': [
      'screens/admin/hr_TeamManagementScreen.tsx',
      'screens/admin/hr_TeamMemberDetailsScreen.tsx',
      'screens/admin/hr_AddEmployeeScreen.tsx',
    ],
  },
  
  // Time Tracking
  'hr_time': {
    '_shared/components': [
      'components/hr_BreakManager.tsx',
      'components/hr_WorkTimeModelCard.tsx',
    ],
    'tracking': [
      'screens/hr_TimeAndLeaveScreen.tsx',
    ],
  },
  
  // Learning
  'hr_learning': {
    '_shared/components': [
      'components/hr_VideoPlayer.tsx',
      'components/hr_YouTubeVideoPlayer.tsx',
      'components/hr_QuizPlayer.tsx',
    ],
    '_shared/hooks': [
      // From learningStore.ts
    ],
    'videos': [
      'screens/hr_VideoDetailScreen.tsx',
    ],
    'quizzes': [
      'screens/hr_QuizDetailScreen.tsx',
    ],
    'admin': [
      'screens/hr_LearningAdminScreen.tsx',
    ],
    'shop': [
      'screens/hr_LearningShopScreen.tsx',
    ],
  },
  
  // Gamification
  'hr_gamification': {
    '_shared/components': [
      'components/hr_AchievementBadge.tsx',
      'components/hr_XPProgress.tsx',
      'components/hr_AvatarDisplay.tsx',
      'components/hr_AvatarEditor.tsx',
      'components/hr_ActivityFeed.tsx',
    ],
    '_shared/core': [
      'utils/hr_xpSystem.ts',
    ],
    'achievements': [
      'screens/hr_AchievementsScreen.tsx',
    ],
    'avatar': [
      'screens/hr_AvatarScreen.tsx',
      'screens/admin/hr_AvatarSystemAdminScreen.tsx',
    ],
  },
  
  // Organigram
  'hr_organigram': {
    '_shared/components/canvas': [
      'components/canvas/hr_CanvasOrgChart.tsx',
      'components/canvas/hr_CanvasControls.tsx',
    ],
    '_shared/components': [
      'components/hr_OrgNode.tsx',
      'components/hr_ConnectionLine.tsx',
      'components/hr_ConnectionPoint.tsx',
      'components/hr_SimpleOrgChart.tsx',
      'components/hr_ModernOrgChart.tsx',
      'components/hr_DraggableOrgChart.tsx',
    ],
    '_shared/hooks': [
      'hooks/hr_useOrganigramUserInfo.ts',
    ],
    '_shared/core': [
      'utils/hr_organigramTransformers.ts',
      'components/canvas/hr_CanvasHandlers.ts',
      'components/canvas/hr_CanvasUtils.ts',
    ],
    '_shared/types': [
      'components/canvas/hr_CanvasTypes.ts',
    ],
    'view': [
      'screens/hr_OrganigramViewScreen.tsx',
    ],
    'admin': [
      'screens/admin/hr_OrganigramCanvasScreenV2.tsx',
      'components/hr_CreateNodeDialog.tsx',
      'components/hr_EditNodeDialog.tsx',
      'components/hr_EditDepartmentDialog.tsx',
      'components/hr_AssignEmployeesDialog.tsx',
    ],
  },
  
  // Documents
  'hr_documents': {
    '_shared/components': [
      'components/hr_QuickUploadDocumentDialog.tsx',
    ],
    'list': [
      'screens/hr_DocumentsScreen.tsx',
    ],
  },
  
  // Benefits
  'hr_benefits': {
    'catalog': [
      'screens/hr_BenefitsScreen.tsx',
    ],
    'admin': [
      'screens/admin/hr_BenefitsManagementScreen.tsx',
    ],
  },
};

function migrateModule(moduleName, structure) {
  console.log(`\n📦 Migrating module: ${moduleName}`);
  console.log('='.repeat(60));
  
  Object.entries(structure).forEach(([subPath, files]) => {
    const targetDir = `modules/${moduleName}/${subPath}`;
    
    // Create directory
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      console.log(`  📁 Created: ${targetDir}`);
    }
    
    // Move files
    files.forEach(file => {
      if (fs.existsSync(file)) {
        const fileName = file.split('/').pop();
        const target = `${targetDir}/${fileName}`;
        
        try {
          execSync(`git mv "${file}" "${target}"`, { stdio: 'inherit' });
          console.log(`  ✅ Moved: ${file} → ${target}`);
        } catch (error) {
          console.error(`  ❌ Failed to move ${file}:`, error.message);
        }
      } else {
        console.log(`  ⚠️  Not found: ${file}`);
      }
    });
  });
}

// Main execution
console.log('🚀 Starting module migration...\n');
console.log('This will move files to the new modules/ structure.');
console.log('Make sure you have committed all changes first!\n');

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

readline.question('Continue? (yes/no): ', (answer) => {
  readline.close();
  
  if (answer.toLowerCase() !== 'yes') {
    console.log('❌ Migration cancelled.');
    process.exit(0);
  }
  
  // Migrate each module
  Object.entries(MIGRATION_MAP).forEach(([moduleName, structure]) => {
    migrateModule(moduleName, structure);
  });
  
  console.log('\n✅ Migration complete!');
  console.log('\nNext steps:');
  console.log('  1. Update all imports');
  console.log('  2. npm run build');
  console.log('  3. Test all features');
  console.log('  4. git commit -m "refactor: migrate to modules architecture"');
});
```

### Step 3: Parallel-Strategie (kein Big-Bang)

**WICHTIG:** Nicht alles auf einmal migrieren!

**Migration Reihenfolge (1 Modul pro Tag):**

1. **Tag 23: hr_documents** (klein, wenig Dependencies)
2. **Tag 24: hr_benefits** (klein)
3. **Tag 25: hr_gamification** (mittel, moderate Dependencies)
4. **Tag 26: hr_learning** (mittel)
5. **Tag 27: hr_time** (mittel)
6. **Tag 28: hr_organigram** (groß, viele Dateien)
7. **Tag 29: hr_team** (groß)
8. **Tag 30: hr_leave** (sehr groß, viele Dependencies)

Für jedes Modul:

```bash
# 1. Backup
git add -A
git commit -m "Pre-migration: hr_documents"

# 2. Modul migrieren (manuell oder Script)
# Erstelle Ordner
mkdir -p modules/hr_documents/_shared/{components,hooks,services,types}
mkdir -p modules/hr_documents/list

# Verschiebe Dateien
git mv screens/hr_DocumentsScreen.tsx modules/hr_documents/list/
git mv components/hr_QuickUploadDocumentDialog.tsx modules/hr_documents/_shared/components/

# 3. Imports aktualisieren
# In allen Dateien, die hr_DocumentsScreen importieren:
# VORHER: import hr_DocumentsScreen from '@screens/hr_DocumentsScreen'
# NACHHER: import hr_DocumentsScreen from '@modules/hr_documents/list/hr_DocumentsScreen'

# 4. Build testen
npm run build

# 5. Funktional testen
# Öffne App, teste Documents-Feature

# 6. Commit
git add -A
git commit -m "refactor: migrate hr_documents to modules architecture"

# 7. Nächstes Modul
```

### Step 4: Import-Pfade aktualisieren

Nach jeder Migration müssen Imports in **allen** Dateien aktualisiert werden.

**ERSTELLE: `/scripts/hr_update-module-imports.js`**

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * UPDATE MODULE IMPORTS
 * =====================
 * Aktualisiert Imports nach Module-Migration
 */

const MODULE_IMPORT_MAP = {
  // hr_documents
  'hr_DocumentsScreen': '@modules/hr_documents/list/hr_DocumentsScreen',
  'hr_QuickUploadDocumentDialog': '@modules/hr_documents/_shared/components/hr_QuickUploadDocumentDialog',
  
  // hr_benefits
  'hr_BenefitsScreen': '@modules/hr_benefits/catalog/hr_BenefitsScreen',
  'hr_BenefitsManagementScreen': '@modules/hr_benefits/admin/hr_BenefitsManagementScreen',
  
  // hr_gamification
  'hr_AchievementsScreen': '@modules/hr_gamification/achievements/hr_AchievementsScreen',
  'hr_AvatarScreen': '@modules/hr_gamification/avatar/hr_AvatarScreen',
  'hr_AchievementBadge': '@modules/hr_gamification/_shared/components/hr_AchievementBadge',
  'hr_XPProgress': '@modules/hr_gamification/_shared/components/hr_XPProgress',
  'hr_AvatarDisplay': '@modules/hr_gamification/_shared/components/hr_AvatarDisplay',
  'hr_AvatarEditor': '@modules/hr_gamification/_shared/components/hr_AvatarEditor',
  
  // ... weitere Module
};

function updateImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  Object.entries(MODULE_IMPORT_MAP).forEach(([componentName, newPath]) => {
    // Pattern: import ComponentName from '...'
    const regex = new RegExp(
      `(import\\s+(?:{[^}]+}|\\w+)\\s+from\\s+['"])([^'"]+/${componentName})(['"])`,
      'g'
    );
    
    const newContent = content.replace(regex, (match, prefix, oldPath, suffix) => {
      if (oldPath !== newPath) {
        changed = true;
        console.log(`  ${componentName}: ${oldPath} → ${newPath}`);
        return `${prefix}${newPath}${suffix}`;
      }
      return match;
    });
    
    content = newContent;
  });
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

// Usage: node scripts/hr_update-module-imports.js
// Nach jeder Modul-Migration ausführen!
```

### ✅ Checklist Tag 23-30 (pro Modul)
- [ ] Modul-Ordner erstellt
- [ ] Dateien verschoben (git mv)
- [ ] Imports aktualisiert
- [ ] Build erfolgreich
- [ ] Feature funktional getestet
- [ ] Committed

---

## 3.2 Core & Infra Layer erstellen (Tag 31-32, 16h)

### Core Layer: Domain-übergreifende Logik

**ERSTELLE: `/core/errors/hr_DomainErrors.ts`**

```typescript
/**
 * DOMAIN ERRORS
 * =============
 * Typensichere, domainnahe Fehlerklassen
 */

export class hr_DomainError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>,
    public httpStatus?: number
  ) {
    super(message);
    this.name = 'hr_DomainError';
    
    // Preserve stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      stack: this.stack,
    };
  }
}

// Leave-spezifische Fehler
export class hr_LeaveRequestError extends hr_DomainError {
  constructor(
    message: string,
    code: 'INVALID_DATES' | 'INSUFFICIENT_BALANCE' | 'OVERLAP' | 'APPROVAL_FAILED',
    context?: Record<string, any>
  ) {
    super(message, `LEAVE_${code}`, context, 400);
    this.name = 'hr_LeaveRequestError';
  }
}

// Team-spezifische Fehler
export class hr_TeamManagementError extends hr_DomainError {
  constructor(
    message: string,
    code: 'TEAM_NOT_FOUND' | 'INVALID_ROLE' | 'PERMISSION_DENIED' | 'DUPLICATE_MEMBER',
    context?: Record<string, any>
  ) {
    super(message, `TEAM_${code}`, context, 400);
    this.name = 'hr_TeamManagementError';
  }
}

// Auth-spezifische Fehler
export class hr_AuthError extends hr_DomainError {
  constructor(
    message: string,
    code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'SESSION_EXPIRED' | 'INVALID_CREDENTIALS',
    context?: Record<string, any>
  ) {
    super(message, `AUTH_${code}`, context, code === 'UNAUTHORIZED' ? 401 : 403);
    this.name = 'hr_AuthError';
  }
}

// Usage Example:
/*
if (startDate > endDate) {
  throw new hr_LeaveRequestError(
    'Start date must be before end date',
    'INVALID_DATES',
    { startDate, endDate, userId: user.id }
  );
}
*/
```

**ERSTELLE: `/core/permissions/hr_permissionsLogic.ts`**

```typescript
/**
 * PERMISSIONS LOGIC
 * =================
 * Zentrale Berechtigungsprüfung (domain-übergreifend)
 */

import type { UserRole } from '@types/database';
import { hr_AuthError } from '../errors/hr_DomainErrors';

export type Permission =
  | 'view:employees'
  | 'edit:employees'
  | 'delete:employees'
  | 'view:leave_requests'
  | 'approve:leave_requests'
  | 'edit:teams'
  | 'manage:benefits'
  | 'manage:system'
  | 'view:analytics';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  USER: [
    'view:employees',
    'view:leave_requests',
  ],
  TEAMLEAD: [
    'view:employees',
    'edit:employees',
    'view:leave_requests',
    'approve:leave_requests',
  ],
  ADMIN: [
    'view:employees',
    'edit:employees',
    'delete:employees',
    'view:leave_requests',
    'approve:leave_requests',
    'edit:teams',
    'manage:benefits',
    'view:analytics',
  ],
  HR: [
    'view:employees',
    'edit:employees',
    'delete:employees',
    'view:leave_requests',
    'approve:leave_requests',
    'edit:teams',
    'manage:benefits',
    'view:analytics',
  ],
  SUPERADMIN: [
    'view:employees',
    'edit:employees',
    'delete:employees',
    'view:leave_requests',
    'approve:leave_requests',
    'edit:teams',
    'manage:benefits',
    'manage:system',
    'view:analytics',
  ],
};

export function hr_hasPermission(
  userRole: UserRole | undefined,
  permission: Permission
): boolean {
  if (!userRole) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
}

export function hr_requirePermission(
  userRole: UserRole | undefined,
  permission: Permission
): void {
  if (!hr_hasPermission(userRole, permission)) {
    throw new hr_AuthError(
      `Permission denied: ${permission}`,
      'FORBIDDEN',
      { requiredPermission: permission, userRole }
    );
  }
}

export function hr_canApproveLeaveRequest(
  userRole: UserRole | undefined,
  requestorRole: UserRole
): boolean {
  if (!userRole) return false;
  
  // SUPERADMIN kann alle Anträge genehmigen
  if (userRole === 'SUPERADMIN') return true;
  
  // HR kann alle außer SUPERADMIN genehmigen
  if (userRole === 'HR' && requestorRole !== 'SUPERADMIN') return true;
  
  // TEAMLEAD kann USER/TEAMLEAD genehmigen
  if (userRole === 'TEAMLEAD' && 
      (requestorRole === 'USER' || requestorRole === 'TEAMLEAD')) {
    return true;
  }
  
  return false;
}
```

### Infra Layer: Resilience & Monitoring

**ERSTELLE: `/infra/supabase/resilience.ts`**

```typescript
/**
 * SUPABASE RESILIENCE LAYER
 * ==========================
 * Retry-Logic, Timeouts, Circuit-Breaker
 */

export interface RetryOptions {
  maxRetries?: number;
  timeout?: number;
  backoffMs?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export class hr_TimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Operation timed out after ${timeoutMs}ms`);
    this.name = 'hr_TimeoutError';
  }
}

export class hr_RetryExhaustedError extends Error {
  constructor(
    public attempts: number,
    public lastError: Error
  ) {
    super(`Retry exhausted after ${attempts} attempts: ${lastError.message}`);
    this.name = 'hr_RetryExhaustedError';
  }
}

/**
 * Retry with exponential backoff + jitter
 */
export async function hr_retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    timeout = 5000,
    backoffMs = 1000,
    onRetry,
  } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Wrap in timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new hr_TimeoutError(timeout)), timeout)
      );
      
      const result = await Promise.race([fn(), timeoutPromise]);
      
      // Success!
      if (attempt > 0) {
        console.log(`✅ Operation succeeded after ${attempt} retries`);
      }
      
      return result as T;
      
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on final attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate backoff with jitter
      const jitter = Math.random() * 200; // 0-200ms
      const delay = backoffMs * Math.pow(2, attempt) + jitter;
      
      console.warn(
        `⚠️  Retry ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms:`,
        error
      );
      
      onRetry?.(attempt + 1, lastError);
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // All retries exhausted
  throw new hr_RetryExhaustedError(maxRetries + 1, lastError!);
}

/**
 * Circuit Breaker Pattern
 */
export class hr_CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private threshold: number = 5, // failures before opening
    private timeout: number = 60000 // ms to wait before half-open
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      // Check if we should try again
      if (Date.now() - this.lastFailureTime >= this.timeout) {
        this.state = 'HALF_OPEN';
        console.log('🔶 Circuit breaker: HALF_OPEN');
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await fn();
      
      // Success - reset
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
        console.log('✅ Circuit breaker: CLOSED');
      }
      
      return result;
      
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      
      if (this.failures >= this.threshold) {
        this.state = 'OPEN';
        console.error(`🔴 Circuit breaker: OPEN (${this.failures} failures)`);
      }
      
      throw error;
    }
  }
  
  getState() {
    return this.state;
  }
  
  reset() {
    this.state = 'CLOSED';
    this.failures = 0;
    this.lastFailureTime = 0;
  }
}

// Usage Example:
/*
import { hr_retryWithBackoff } from '@infra/supabase/resilience';

const { data, error } = await hr_retryWithBackoff(
  () => supabase.from('teams').select('*'),
  {
    maxRetries: 3,
    timeout: 5000,
    onRetry: (attempt, error) => {
      console.log(`Retry ${attempt}:`, error);
    }
  }
);
*/
```

**ERSTELLE: `/infra/monitoring/hr_logger.ts`**

```typescript
/**
 * STRUCTURED LOGGER
 * =================
 * JSON-Format, Trace-IDs, Context
 */

import { v4 as uuidv4 } from 'uuid';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  userId?: string;
  traceId?: string;
  spanId?: string;
  module?: string;
  action?: string;
  [key: string]: any;
}

class hr_Logger {
  private traceId: string;
  private context: LogContext = {};
  
  constructor() {
    this.traceId = uuidv4();
  }
  
  setContext(context: LogContext) {
    this.context = { ...this.context, ...context };
  }
  
  clearContext() {
    this.context = {};
  }
  
  private log(level: LogLevel, message: string, data?: any) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      traceId: this.traceId,
      ...this.context,
      ...(data && { data }),
    };
    
    // In production: send to external service (Sentry, DataDog, etc.)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to monitoring service
      console.log(JSON.stringify(entry));
    } else {
      // Development: pretty print
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
      }[level];
      
      console.log(`${emoji} [${level.toUpperCase()}] ${message}`, data || '');
    }
  }
  
  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }
  
  info(message: string, data?: any) {
    this.log('info', message, data);
  }
  
  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }
  
  error(message: string, error?: Error | any) {
    this.log('error', message, {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    });
  }
  
  // Create child logger with additional context
  child(context: LogContext): hr_Logger {
    const child = new hr_Logger();
    child.context = { ...this.context, ...context };
    child.traceId = this.traceId;
    return child;
  }
}

// Singleton instance
export const logger = new hr_Logger();

// Usage Example:
/*
import { logger } from '@infra/monitoring/hr_logger';

logger.setContext({ userId: user.id, module: 'leave' });
logger.info('Leave request created', { leaveId: '123' });
logger.error('Failed to approve leave', error);
*/
```

### ✅ Checklist Tag 31-32
- [ ] hr_DomainErrors.ts erstellt
- [ ] hr_permissionsLogic.ts erstellt
- [ ] resilience.ts erstellt
- [ ] hr_logger.ts erstellt
- [ ] In relevanten Dateien verwendet
- [ ] Build erfolgreich
- [ ] Committed

---

## ✅ Phase 3 Abschluss-Checklist

- [ ] Alle Module in modules/ Struktur migriert
- [ ] Core-Layer (errors, permissions) implementiert
- [ ] Infra-Layer (resilience, logging) implementiert
- [ ] Alle Imports aktualisiert
- [ ] Build erfolgreich
- [ ] Alle Features funktional getestet

**Geschätzter Aufwand:** 80h  
**Tatsächlicher Aufwand:** _____h

---

# 📅 PHASE 4: SECURITY & RESILIENCE (Woche 7-8) 🟡 HIGH

**Ziel:** Security-Baseline umsetzen, Resilience patterns anwenden  
**Aufwand:** 50 Stunden

---

## 4.1 Security-Headers konfigurieren (Tag 33-34, 8h)

### CSP Headers (Content Security Policy)

**OPTION A: Vite Plugin (Development)**

**ERSTELLE: `/vite-plugin-csp.ts`**

```typescript
import type { Plugin } from 'vite';

export function cspPlugin(): Plugin {
  return {
    name: 'vite-plugin-csp',
    transformIndexHtml(html) {
      // Add CSP meta tag for development
      return html.replace(
        '<head>',
        `<head>
          <meta http-equiv="Content-Security-Policy" content="
            default-src 'self';
            script-src 'self' 'unsafe-inline';
            style-src 'self' 'unsafe-inline';
            img-src 'self' data: https:;
            connect-src 'self' *.supabase.co;
            font-src 'self' data:;
          ">
        `
      );
    },
  };
}
```

**OPTION B: Supabase Edge Function (Production)**

Wenn deployed, CSP Headers via Edge Function setzen:

**BEARBEITE: `/supabase/functions/server/index.tsx`**

```typescript
import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';

const app = new Hono();

// Security Headers Middleware
app.use('*', async (c, next) => {
  await next();
  
  // CSP
  c.header(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // TODO: Remove unsafe-inline
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' *.supabase.co",
      "font-src 'self' data:",
    ].join('; ')
  );
  
  // Other security headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HSTS (only in production)
  if (Deno.env.get('ENVIRONMENT') === 'production') {
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
});

// ... rest of server code
```

### ✅ Checklist Tag 33-34
- [ ] CSP Plugin/Headers konfiguriert
- [ ] Weitere Security-Headers gesetzt
- [ ] Getestet (keine Console-Errors)
- [ ] Committed

---

## 4.2 Input-Validierung standardisieren (Tag 35-37, 16h)

### Zod für Runtime-Validierung

**INSTALLIERE:**
```bash
npm install zod
```

**ERSTELLE: `/modules/hr_leave/_shared/validation/hr_leaveValidation.ts`**

```typescript
import { z } from 'zod';

/**
 * LEAVE REQUEST VALIDATION
 * ========================
 * Runtime-Validierung mit Zod
 */

export const hr_LeaveRequestSchema = z.object({
  user_id: z.string().uuid(),
  leave_type: z.enum(['VACATION', 'SICK', 'UNPAID', 'PARENTAL', 'SPECIAL']),
  start_date: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    { message: 'Invalid start date' }
  ),
  end_date: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    { message: 'Invalid end date' }
  ),
  is_half_day: z.boolean().optional(),
  half_day_period: z.enum(['MORNING', 'AFTERNOON']).optional(),
  reason: z.string().min(1).max(500),
  sick_note_url: z.string().url().optional(),
}).refine(
  (data) => {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    return start <= end;
  },
  {
    message: 'Start date must be before or equal to end date',
    path: ['end_date'],
  }
);

export type hr_LeaveRequest = z.infer<typeof hr_LeaveRequestSchema>;

// Usage:
/*
import { hr_LeaveRequestSchema } from './validation';

try {
  const validated = hr_LeaveRequestSchema.parse(formData);
  // ✅ validated ist typsicher
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Validation errors:', error.errors);
  }
}
*/
```

**ERSTELLE: `/modules/hr_team/_shared/validation/hr_teamValidation.ts`**

```typescript
import { z } from 'zod';

export const hr_TeamSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  department_id: z.string().uuid().optional(),
});

export const hr_TeamMemberSchema = z.object({
  user_id: z.string().uuid(),
  team_id: z.string().uuid(),
  role: z.enum(['MEMBER', 'TEAMLEAD']),
  priority_tag: z.enum(['PRIMARY', 'BACKUP', 'BACKUP_BACKUP']).optional(),
});

export type hr_Team = z.infer<typeof hr_TeamSchema>;
export type hr_TeamMember = z.infer<typeof hr_TeamMemberSchema>;
```

### Verwende Validierung in Services

**BEISPIEL: Leave Service**

```typescript
import { supabase } from '@infra/supabase/client';
import { hr_retryWithBackoff } from '@infra/supabase/resilience';
import { hr_LeaveRequestSchema } from './validation/hr_leaveValidation';
import { hr_LeaveRequestError } from '@core/errors/hr_DomainErrors';
import { logger } from '@infra/monitoring/hr_logger';

export async function hr_createLeaveRequest(data: unknown) {
  // 1. Validate input
  const validated = hr_LeaveRequestSchema.parse(data);
  
  // 2. Business logic checks
  if (/* check overlap */) {
    throw new hr_LeaveRequestError(
      'Leave request overlaps with existing request',
      'OVERLAP',
      { userId: validated.user_id }
    );
  }
  
  // 3. Save with retry
  try {
    const { data: result, error } = await hr_retryWithBackoff(
      () => supabase.from('leave_requests').insert([validated]).select().single(),
      { maxRetries: 3 }
    );
    
    if (error) throw error;
    
    logger.info('Leave request created', { leaveId: result.id });
    
    return result;
    
  } catch (error) {
    logger.error('Failed to create leave request', error);
    throw new hr_LeaveRequestError(
      'Failed to create leave request',
      'APPROVAL_FAILED',
      { error }
    );
  }
}
```

### ✅ Checklist Tag 35-37
- [ ] Zod installiert
- [ ] Validierungs-Schemas für alle wichtigen Entities erstellt
- [ ] In Services verwendet
- [ ] Error-Handling angepasst
- [ ] Committed

---

## 4.3 Dependency-Scanning einrichten (Tag 38-39, 8h)

### NPM Audit automatisieren

**ERSTELLE: `/scripts/hr_security-audit.sh`**

```bash
#!/bin/bash

echo "🔒 Security Audit - HRthis System"
echo "=================================="
echo ""

# 1. NPM Audit
echo "📦 Running npm audit..."
npm audit --json > security-audit-npm.json

CRITICAL=$(cat security-audit-npm.json | jq '.metadata.vulnerabilities.critical')
HIGH=$(cat security-audit-npm.json | jq '.metadata.vulnerabilities.high')

echo "   Critical: $CRITICAL"
echo "   High:     $HIGH"
echo ""

# 2. Fail if critical or high vulnerabilities
if [ "$CRITICAL" -gt 0 ] || [ "$HIGH" -gt 0 ]; then
  echo "❌ FAILED: Found $CRITICAL critical and $HIGH high vulnerabilities"
  echo "   Run: npm audit fix"
  exit 1
else
  echo "✅ PASSED: No critical or high vulnerabilities"
fi

# 3. Check for outdated dependencies
echo ""
echo "📦 Checking for outdated dependencies..."
npm outdated || true

echo ""
echo "✅ Security audit complete!"
```

```bash
chmod +x scripts/hr_security-audit.sh
```

### GitHub Actions (Optional, wenn verwendet)

**ERSTELLE: `/.github/workflows/security.yml`**

```yaml
name: Security Audit

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    # Weekly scan every Monday at 9 AM
    - cron: '0 9 * * 1'

jobs:
  security:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run security audit
        run: ./scripts/hr_security-audit.sh
      
      - name: Upload audit results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: security-audit
          path: security-audit-npm.json
```

### ✅ Checklist Tag 38-39
- [ ] Security-Audit-Script erstellt
- [ ] Lokal getestet
- [ ] CI/CD Integration (optional)
- [ ] Dokumentiert in SECURITY_BASELINE.md
- [ ] Committed

---

## 4.4 Resilience patterns anwenden (Tag 40-42, 18h)

### Alle Supabase-Calls mit Resilience wrappen

**MIGRATION-PLAN:**

Ersetze alle direkten Supabase-Calls durch resiliente Versionen.

**VORHER:**
```typescript
const { data, error } = await supabase.from('teams').select('*');
```

**NACHHER:**
```typescript
import { hr_retryWithBackoff } from '@infra/supabase/resilience';

const { data, error } = await hr_retryWithBackoff(
  () => supabase.from('teams').select('*'),
  { maxRetries: 3, timeout: 5000 }
);
```

### Automatisierte Migration

**ERSTELLE: `/scripts/hr_add-resilience.js`**

```javascript
#!/usr/bin/env node

const fs = require('fs');

/**
 * ADD RESILIENCE WRAPPER
 * ======================
 * Findet alle Supabase-Calls und schlägt Resilience-Wrapping vor
 */

function findSupabaseCalls(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const calls = [];
  
  lines.forEach((line, index) => {
    // Pattern: await supabase.from(...
    if (line.includes('await supabase.from(')) {
      calls.push({
        file: filePath,
        line: index + 1,
        code: line.trim(),
      });
    }
  });
  
  return calls;
}

function getAllTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = `${dir}/${file}`;
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        getAllTsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Main
const files = getAllTsFiles('.');
const allCalls = [];

files.forEach(file => {
  const calls = findSupabaseCalls(file);
  allCalls.push(...calls);
});

console.log(`Found ${allCalls.length} Supabase calls\n`);

allCalls.forEach(call => {
  console.log(`${call.file}:${call.line}`);
  console.log(`  ${call.code}`);
  console.log('');
});

console.log('\nRecommendation:');
console.log('Wrap these calls with hr_retryWithBackoff() for better resilience.');
console.log('\nExample:');
console.log('  const { data, error } = await hr_retryWithBackoff(');
console.log('    () => supabase.from("teams").select("*"),');
console.log('    { maxRetries: 3, timeout: 5000 }');
console.log('  );');
```

**Manuell durchgehen und kritische Calls wrappen:**

Priorisierung:
1. **CRITICAL**: Leave-Requests, Team-Management, Auth
2. **HIGH**: Organigram, Time-Tracking
3. **MEDIUM**: Learning, Documents, Benefits

### ✅ Checklist Tag 40-42
- [ ] Resilience-Script ausgeführt
- [ ] Kritische Calls identifiziert
- [ ] Top 20 Calls wrapped
- [ ] Error-Handling angepasst
- [ ] Funktional getestet
- [ ] Committed

---

## ✅ Phase 4 Abschluss-Checklist

- [ ] Security-Headers konfiguriert
- [ ] Input-Validierung mit Zod
- [ ] Dependency-Scanning eingerichtet
- [ ] Resilience patterns angewendet
- [ ] SECURITY_BASELINE.md aktualisiert
- [ ] Alles committed

**Geschätzter Aufwand:** 50h  
**Tatsächlicher Aufwand:** _____h

---

# 📅 PHASE 5: PERFORMANCE & MONITORING (Woche 9-10) 🟢 MEDIUM

**Ziel:** Performance-Budgets messen, Monitoring einrichten  
**Aufwand:** 40 Stunden

---

## 5.1 Performance-Baseline messen (Tag 43-44, 8h)

### Bundle-Analyse

```bash
# Build production
npm run build

# Analyze bundle
npx vite-bundle-visualizer
```

**ERGEBNIS dokumentieren in `/docs/PERFORMANCE_BUDGETS.md`:**

```markdown
## Baseline Measurement (2025-01-08)

### Bundle Sizes
- Total: XXX KB (target: ≤ 512 KB)
- Main chunk: XXX KB
- Vendor chunk: XXX KB
- Largest route: XXX KB (target: ≤ 200 KB per route)

### Routes
| Route | Size (gzip) | Status |
|-------|-------------|--------|
| /login | XX KB | ✅ |
| /dashboard | XX KB | ⚠️ |
| /time-and-leave | XX KB | ❌ Over budget |
```

### Lighthouse-Audit

```bash
# Local build
npm run build
npm run preview

# Lighthouse (in separate terminal)
npx lighthouse http://localhost:4173 --view --output html --output-path ./lighthouse-report.html
```

**Dokumentiere Ergebnisse:**

```markdown
### Lighthouse Scores
- Performance: XX/100 (target: ≥ 90)
- Accessibility: XX/100 (target: ≥ 95)
- Best Practices: XX/100 (target: ≥ 90)
- SEO: XX/100 (target: ≥ 90)

### Core Web Vitals
- LCP: XXX ms (target: ≤ 2000 ms)
- CLS: X.XX (target: ≤ 0.1)
- INP: XXX ms (target: ≤ 200 ms)
```

### ✅ Checklist Tag 43-44
- [ ] Bundle-Analyse durchgeführt
- [ ] Lighthouse-Audit durchgeführt
- [ ] Baseline dokumentiert
- [ ] Problem-Bereiche identifiziert

---

## 5.2 Performance-Optimierungen (Tag 45-48, 20h)

### 1. Code-Splitting verbessern

**BEARBEITE: `/App.tsx`**

```typescript
// Gruppiere related routes
const LeaveRoutes = lazy(() => import('@modules/hr_leave/routes'));
const TeamRoutes = lazy(() => import('@modules/hr_team/routes'));
const LearningRoutes = lazy(() => import('@modules/hr_learning/routes'));

// Preload critical routes
import('@modules/hr_leave/routes');
```

### 2. Heavy Dependencies isolieren

**Beispiel: Chart-Library nur wo benötigt**

```typescript
// ❌ VORHER: Im main bundle
import { LineChart } from 'recharts';

// ✅ NACHHER: Lazy-loaded
const ChartComponent = lazy(() => import('./ChartComponent'));
```

### 3. Image-Optimierung

**ERSTELLE: `/components/hr_OptimizedImage.tsx`**

```typescript
import { useState } from 'react';
import { ImageWithFallback } from '@components/figma/ImageWithFallback';

interface hr_OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export function hr_OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  loading = 'lazy',
}: hr_OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  return (
    <div className={`relative ${className}`}>
      {/* Blur placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      <ImageWithFallback
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        onLoad={() => setIsLoaded(true)}
        className={`transition-opacity ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
```

### 4. Memoization für teure Berechnungen

```typescript
import { useMemo } from 'react';

// ❌ VORHER: Berechnung bei jedem Render
const sortedTeams = teams.sort(...);

// ✅ NACHHER: Memoized
const sortedTeams = useMemo(
  () => teams.sort((a, b) => a.name.localeCompare(b.name)),
  [teams]
);
```

### ✅ Checklist Tag 45-48
- [ ] Code-Splitting optimiert
- [ ] Heavy Dependencies isoliert
- [ ] Images optimiert
- [ ] Teure Berechnungen memoized
- [ ] Neue Bundle-Analyse
- [ ] Verbesserungen dokumentiert

---

## 5.3 Web Vitals Tracking (Tag 49-50, 8h)

**INSTALLIERE:**
```bash
npm install web-vitals
```

**ERSTELLE: `/infra/monitoring/hr_webVitals.ts`**

```typescript
import { onCLS, onFID, onLCP, onINP } from 'web-vitals';

export function hr_trackWebVitals() {
  const sendToAnalytics = (metric: any) => {
    // Log to console (development)
    console.log(metric);
    
    // In production: send to analytics service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to Google Analytics, Sentry, etc.
      // navigator.sendBeacon('/analytics', JSON.stringify(metric));
    }
  };
  
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onLCP(sendToAnalytics);
  onINP(sendToAnalytics);
}
```

**BEARBEITE: `/App.tsx`**

```typescript
import { useEffect } from 'react';
import { hr_trackWebVitals } from '@infra/monitoring/hr_webVitals';

export default function App() {
  useEffect(() => {
    hr_trackWebVitals();
  }, []);
  
  // ... rest of app
}
```

### ✅ Checklist Tag 49-50
- [ ] Web Vitals tracking implementiert
- [ ] Lokal getestet
- [ ] Dokumentiert
- [ ] Committed

---

## 5.4 Performance-Budget CI/CD (Tag 51-52, 4h)

**ERSTELLE: `/scripts/hr_check-bundle-size.js`**

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const BUDGETS = {
  total: 512 * 1024, // 512 KB
  perRoute: 200 * 1024, // 200 KB
};

function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

function checkBundleSize() {
  const distDir = path.join(process.cwd(), 'dist/assets');
  
  if (!fs.existsSync(distDir)) {
    console.error('❌ Dist directory not found. Run npm run build first.');
    process.exit(1);
  }
  
  const files = fs.readdirSync(distDir);
  const jsFiles = files.filter(f => f.endsWith('.js'));
  
  let totalSize = 0;
  const violations = [];
  
  jsFiles.forEach(file => {
    const size = getFileSize(path.join(distDir, file));
    totalSize += size;
    
    if (size > BUDGETS.perRoute) {
      violations.push({
        file,
        size,
        budget: BUDGETS.perRoute,
        overflow: size - BUDGETS.perRoute,
      });
    }
  });
  
  console.log('📦 Bundle Size Check\n');
  console.log(`Total: ${(totalSize / 1024).toFixed(2)} KB (budget: ${(BUDGETS.total / 1024).toFixed(0)} KB)`);
  
  if (totalSize > BUDGETS.total) {
    console.log(`❌ FAILED: Total bundle size exceeds budget by ${((totalSize - BUDGETS.total) / 1024).toFixed(2)} KB`);
  } else {
    console.log(`✅ PASSED: Within budget`);
  }
  
  if (violations.length > 0) {
    console.log(`\n⚠️  ${violations.length} files exceed per-route budget:`);
    violations.forEach(v => {
      console.log(`  - ${v.file}: ${(v.size / 1024).toFixed(2)} KB (over by ${(v.overflow / 1024).toFixed(2)} KB)`);
    });
  }
  
  // Exit with error if budget violated
  if (totalSize > BUDGETS.total || violations.length > 0) {
    process.exit(1);
  }
}

checkBundleSize();
```

**PACKAGE.JSON:**
```json
{
  "scripts": {
    "build": "vite build",
    "build:check": "npm run build && node scripts/hr_check-bundle-size.js"
  }
}
```

### ✅ Checklist Tag 51-52
- [ ] Bundle-Size-Check-Script erstellt
- [ ] In package.json integriert
- [ ] Lokal getestet
- [ ] Committed

---

## ✅ Phase 5 Abschluss-Checklist

- [ ] Performance-Baseline gemessen
- [ ] Optimierungen implementiert
- [ ] Web Vitals tracking aktiv
- [ ] Bundle-Size-Check in CI/CD
- [ ] PERFORMANCE_BUDGETS.md aktualisiert

**Geschätzter Aufwand:** 40h  
**Tatsächlicher Aufwand:** _____h

---

# 📅 PHASE 6: DOCUMENTATION & POLISH (Woche 11-12) 🟢 MEDIUM

**Ziel:** Finale Dokumentation, ADRs, Code-Cleanup  
**Aufwand:** 30 Stunden

---

## 6.1 Architecture Decision Records (Tag 53-55, 12h)

### ADR-Template

**ERSTELLE: `/docs/decisions/TEMPLATE.md`**

```markdown
# ADR-XXX: [Title]

**Status:** [Proposed | Accepted | Deprecated | Superseded]  
**Date:** YYYY-MM-DD  
**Deciders:** [Names]  
**Tags:** [architecture, backend, frontend, etc.]

## Context
Was ist der Kontext dieser Entscheidung? Welches Problem lösen wir?

## Decision
Welche Entscheidung haben wir getroffen?

## Consequences
### Positive
- Was sind die Vorteile?

### Negative
- Was sind die Nachteile/Trade-offs?

### Neutral
- Was ändert sich sonst?

## Alternatives Considered
Welche Alternativen haben wir geprüft und warum abgelehnt?

## References
- Links zu Diskussionen, Dokumenten, etc.
```

### Wichtige ADRs erstellen

**ERSTELLE: `/docs/decisions/001-supabase-backend.md`**

```markdown
# ADR-001: Supabase as Backend

**Status:** Accepted  
**Date:** 2024-XX-XX  
**Deciders:** Development Team  
**Tags:** architecture, backend, database

## Context
Wir benötigen ein Backend für HRthis mit:
- Authentication
- PostgreSQL Database
- Row Level Security
- File Storage
- Real-time capabilities

## Decision
Wir verwenden Supabase als Backend-as-a-Service.

## Consequences
### Positive
- Schnelle Entwicklung (managed service)
- Integrierte Auth & RLS
- PostgreSQL mit vollem SQL-Support
- Echtzeitfähigkeiten out-of-the-box
- Kosteneffizient für MVP

### Negative
- Vendor Lock-in
- Weniger Kontrolle über Infrastruktur
- Begrenzte Customization der Auth

### Neutral
- Wir müssen uns an Supabase-Architektur anpassen
- Migration auf Self-Hosted möglich (PostgreSQL standard)

## Alternatives Considered
1. **Firebase**: Abgelehnt wegen NoSQL (wir brauchen Relationen)
2. **Custom Backend (Node.js)**: Zu viel Aufwand für MVP
3. **Hasura + PostgreSQL**: Ähnlich, aber Supabase besser dokumentiert

## References
- https://supabase.com/docs
```

**ERSTELLE: `/docs/decisions/002-single-tenant-architecture.md`**  
**ERSTELLE: `/docs/decisions/003-shadcn-ui-components.md`**  
**ERSTELLE: `/docs/decisions/004-zustand-state-management.md`**  
**ERSTELLE: `/docs/decisions/005-modules-architecture.md`** (neu nach Refactoring)

### ✅ Checklist Tag 53-55
- [ ] ADR-Template erstellt
- [ ] Mindestens 5 ADRs dokumentiert
- [ ] In INDEX.md verlinkt

---

## 6.2 API-Dokumentation (JSDoc/TSDoc) (Tag 56-58, 12h)

### Wichtigste öffentliche APIs dokumentieren

**BEISPIEL: Leave Service**

```typescript
/**
 * Creates a new leave request
 * 
 * @param data - Leave request data (will be validated)
 * @returns Created leave request
 * @throws {hr_LeaveRequestError} If validation fails or dates overlap
 * @throws {hr_RetryExhaustedError} If database operation fails after retries
 * 
 * @example
 * ```typescript
 * const request = await hr_createLeaveRequest({
 *   user_id: 'uuid',
 *   leave_type: 'VACATION',
 *   start_date: '2025-01-10',
 *   end_date: '2025-01-15',
 *   reason: 'Family vacation',
 * });
 * ```
 */
export async function hr_createLeaveRequest(data: unknown) {
  // ...
}
```

**Generiere Dokumentation:**

```bash
npm install -D typedoc

# In package.json
{
  "scripts": {
    "docs": "typedoc --out docs/api src"
  }
}

npm run docs
```

### ✅ Checklist Tag 56-58
- [ ] Wichtigste 20 Funktionen dokumentiert
- [ ] TypeDoc konfiguriert
- [ ] API-Docs generiert
- [ ] In INDEX.md verlinkt

---

## 6.3 Final Code-Cleanup (Tag 59-60, 6h)

### 1. Linter-Warnings beheben

```bash
npm run lint -- --fix
```

### 2. Unused Code entfernen

**INSTALLIERE:**
```bash
npm install -D ts-prune
```

```bash
# Finde unused exports
npx ts-prune > unused-exports.txt
```

### 3. TODO/FIXME audit

```bash
grep -r "TODO\|FIXME" --include="*.ts" --include="*.tsx" > todos.txt
```

### 4. Console.log cleanup

```bash
# Find all console.logs
grep -r "console\.log" --include="*.ts" --include="*.tsx" > console-logs.txt

# Replace mit logger
```

### ✅ Checklist Tag 59-60
- [ ] Alle Linter-Warnings behoben
- [ ] Unused Exports entfernt
- [ ] TODOs dokumentiert/gefixt
- [ ] Console.logs durch logger ersetzt

---

## ✅ Phase 6 Abschluss-Checklist

- [ ] ADRs dokumentiert
- [ ] API-Dokumentation erstellt
- [ ] Code-Cleanup durchgeführt
- [ ] Alle Warnings behoben
- [ ] INDEX.md vollständig

**Geschätzter Aufwand:** 30h  
**Tatsächlicher Aufwand:** _____h

---

# 🎉 FINAL CHECKLIST – Codex Compliance

## Regel-by-Regel Compliance Check

### ✅ Regel 0: Projekt-Variablen
- [x] {DOMAIN_PREFIX} = "hr_" (konsistent)
- [x] {IMPORT_ALIAS} = "@" (konfiguriert)
- [x] {STYLE_SYSTEM} = "Tailwind CSS v4"
- [x] {UI_PRIMITIVES} = "ShadCN UI"
- [x] {TESTING_POLICY} = "off" (dokumentiert)
- [x] {SEC_BASELINE} = OWASP ASVS Level 2
- [x] {PERF_BUDGETS} = definiert und gemessen
- [x] {OBS_STACK} = Logger, Metrics, Tracing

### ✅ Regel 1: Architektur
- [x] Hexagonal/Ports-&-Adapters
- [x] Klare Layer-Trennung (modules, core, infra, ui)
- [x] Kein Zyklus in Dependencies
- [x] Modular & komposabel

### ✅ Regel 2: Struktur
- [x] modules/features Ordnerstruktur
- [x] _shared für geteilten Code
- [x] core/ für Domänen-übergreifend
- [x] infra/ für Gateways

### ✅ Regel 3: Namenskonventionen
- [x] Alle domain-spezifischen Dateien haben hr_ Präfix
- [x] Generische UI-Components ohne Präfix

### ✅ Regel 4: Imports
- [x] Import-Alias @ verwendet
- [x] Keine unaufgelösten Imports

### ✅ Regel 6: Dateigrößen
- [x] Alle Dateien ≤ 500 Zeilen (hart)
- [x] 80%+ Dateien ≤ 300 Zeilen (soft)
- [x] Complexity ≤ 10

### ✅ Regel 7: UI
- [x] ShadCN als UI-Primitives
- [x] Tailwind als Style-System
- [x] Keine problematischen Inline-Styles
- [x] Lazy Loading implementiert

### ✅ Regel 8: Backend
- [x] Ports-&-Adapters Pattern
- [x] Timeouts konfiguriert
- [x] Retry-Logic implementiert
- [x] Circuit-Breaker für kritische Calls

### ✅ Regel 11: Security
- [x] Secrets nicht im Repo
- [x] Input-Validierung mit Zod
- [x] Dependency-Scanning
- [x] Security-Baseline definiert
- [x] CSP Headers

### ✅ Regel 12: Performance
- [x] Lazy Loading
- [x] Budgets definiert und gemessen
- [x] Bundle-Size-Checks
- [x] Web Vitals tracking

### ✅ Regel 13: Observability
- [x] Structured Logging (JSON)
- [x] Error-Tracking mit Context
- [x] Performance-Monitoring

### ✅ Regel 16: Dokumentation
- [x] README vorhanden
- [x] ADRs vorhanden
- [x] API-Docs (JSDoc)
- [x] Architektur dokumentiert

---

# 📈 Erfolgs-Metriken

## Vor Refactoring
- Import-Aliasse: 0%
- Domain-Präfixe: 10%
- Dateigrößen < 300 Zeilen: ~40%
- Modulare Architektur: 0%
- Security-Baseline: 20%
- Performance-Budgets: 0%
- Dokumentation: 50%

## Nach Refactoring (Ziel)
- Import-Aliasse: 100% ✅
- Domain-Präfixe: 100% ✅
- Dateigrößen < 300 Zeilen: 85% ✅
- Modulare Architektur: 100% ✅
- Security-Baseline: 90% ✅
- Performance-Budgets: 100% ✅
- Dokumentation: 95% ✅

---

# 🚀 Nächste Schritte nach Refactoring

## Sofort (Post-Refactoring)
1. Testing einführen (TESTING_POLICY = "on")
2. E2E-Tests für kritische Flows
3. CI/CD Pipeline mit Quality-Gates

## Mittel-/Langfristig
1. Sentry/Error-Tracking Integration
2. Performance-Monitoring (DataDog/NewRelic)
3. A11y-Audit mit echten Nutzern
4. Graduelle Migration zu React Server Components (falls relevant)

---

**ROADMAP ENDE**

Geschätzter Gesamt-Aufwand: **300 Stunden** (12 Wochen)

Bei Fragen zu einzelnen Schritten: Frag nach spezifischen Details! 🚀
