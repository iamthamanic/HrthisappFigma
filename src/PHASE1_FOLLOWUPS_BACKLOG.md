# 📋 Phase 1 - Follow-Ups Backlog

**Version:** v4.11.0  
**Status:** Phase 1 Complete (80%) → Phase 2 Planning  
**Datum:** 23. Oktober 2025

---

## 🎯 Phase 2 - DB-Calls Migration (3-5 Tage)

### **Priority 1: UI Card Components (CRITICAL)**

**Effort:** 2-3 Personentage  
**Impact:** Hoch (50+ DB-Calls entfernt)

#### **User Cards** (6 Dateien)

| Datei | DB-Calls | Service Method Needed | Status |
|-------|----------|----------------------|--------|
| `/components/user/HRTHIS_PersonalDataCard.tsx` | 1x `.from('users').update()` | `UserService.updatePersonalData()` | 🔲 TODO |
| `/components/user/HRTHIS_AddressCard.tsx` | 1x `.from('users').update()` | `UserService.updateAddress()` | 🔲 TODO |
| `/components/user/HRTHIS_BankInfoCard.tsx` | 1x `.from('users').update()` | `UserService.updateBankInfo()` | 🔲 TODO |
| `/components/user/HRTHIS_ClothingSizesCard.tsx` | 1x `.from('users').update()` | `UserService.updateClothingSizes()` | 🔲 TODO |
| `/components/user/HRTHIS_EmergencyContactCard.tsx` | 1x `.from('users').update()` | `UserService.updateEmergencyContact()` | 🔲 TODO |
| `/components/user/HRTHIS_LanguageSkillsCard.tsx` | 1x `.from('users').update()` | `UserService.updateLanguageSkills()` | 🔲 TODO |

**Action Items:**
1. Extend `UserService` mit 6 neuen Methoden
2. Refactor alle 6 Components
3. Test: Card-Updates funktionieren
4. Test: Error-Handling korrekt

---

#### **Admin Cards** (10 Dateien)

| Datei | DB-Calls | Service Method Needed | Status |
|-------|----------|----------------------|--------|
| `/components/admin/HRTHIS_PersonalInfoCard.tsx` | 1x `.from('users').update()` | `UserService.updatePersonalData()` (reuse) | 🔲 TODO |
| `/components/admin/HRTHIS_AddressCard.tsx` | 1x `.from('users').update()` | `UserService.updateAddress()` (reuse) | 🔲 TODO |
| `/components/admin/HRTHIS_BankInfoCard.tsx` | 1x `.from('users').update()` | `UserService.updateBankInfo()` (reuse) | 🔲 TODO |
| `/components/admin/HRTHIS_ClothingSizesCard.tsx` | 1x `.from('users').update()` | `UserService.updateClothingSizes()` (reuse) | 🔲 TODO |
| `/components/admin/HRTHIS_EmergencyContactCard.tsx` | 1x `.from('users').update()` | `UserService.updateEmergencyContact()` (reuse) | 🔲 TODO |
| `/components/admin/HRTHIS_LanguageSkillsCard.tsx` | 1x `.from('users').update()` | `UserService.updateLanguageSkills()` (reuse) | 🔲 TODO |
| `/components/admin/HRTHIS_EmploymentInfoCard.tsx` | 3x DB-Calls (users, team_members delete/insert) | `UserService.updateEmployment()` + `TeamService.*` | 🔲 TODO |
| `/components/admin/HRTHIS_EmploymentInfoCard_v2.tsx` | 4x DB-Calls (weekly_hours_history, users, team_members) | `UserService.updateEmploymentWithHistory()` | 🔲 TODO |
| `/components/admin/HRTHIS_CoinDistributionDialog.tsx` | 2x `.from()` (locations, team_members) | `LocationService.*` + `TeamService.*` | 🔲 TODO |
| `/components/admin/HRTHIS_PersonalInfoCard_v2.tsx` | 1x `.from('users').update()` | `UserService.updatePersonalData()` (reuse) | 🔲 TODO |

**Action Items:**
1. Service-Methoden aus User-Cards wiederverwenden
2. EmploymentInfoCard-Logik in Service migrieren (komplex!)
3. Weekly_Hours_History Service-Layer (evtl. neuer Service)
4. Test: Admin kann User-Daten bearbeiten

---

### **Priority 2: Screens & Hooks (HIGH)**

**Effort:** 1-2 Personentage

#### **Screens**

| Datei | DB-Calls | Service Needed | Status |
|-------|----------|----------------|--------|
| `/components/MeineDaten.tsx` | 4x `.from()` (users, locations, storage) | `UserService.getProfile()` + Storage BFF | 🔲 TODO |
| `/components/ActivityFeed.tsx` | 2x `.from()` (activity_feed, user_avatars) | `ActivityService.getActivities()` (neu) | 🔲 TODO |
| `/components/LiveStats.tsx` | 3x `.from()` (users, learning_progress, user_achievements) | `DashboardService.getStats()` (neu) | 🔲 TODO |
| `/components/AssignEmployeesDialog.tsx` | 2x `.from()` (users) | `UserService.getEmployees()` + `UserService.getTeamLead()` | 🔲 TODO |

**Action Items:**
1. **ActivityService erstellen** (neu)
2. **DashboardService erstellen** (neu)
3. MeineDaten Storage-Calls → BFF migrieren
4. Test: Screens laden korrekt

---

#### **Hooks**

| Datei | DB-Calls | Service Needed | Status |
|-------|----------|----------------|--------|
| `/hooks/HRTHIS_useLeaveManagement.ts` | 4x `.from('leave_requests')` | `LeaveService.*` (exists, extend) | 🔲 TODO |
| `/hooks/HRTHIS_useTeamManagement.ts` | ~5x `.from('teams', 'team_members')` | `TeamService.*` (exists, extend) | 🔲 TODO |
| `/hooks/HRTHIS_useLearningScreen.ts` | ~3x `.from('learning_videos', 'learning_progress')` | `LearningService.*` (exists, extend) | 🔲 TODO |
| `/hooks/HRTHIS_useOrganigramData.ts` | ~4x `.from('organigram_nodes')` | `OrganigramService.*` (exists, extend) | 🔲 TODO |
| `/hooks/HRTHIS_useDocumentsScreen.ts` | ~3x `.from('documents')` | `DocumentService.*` (exists, extend) | 🔲 TODO |
| `/hooks/HRTHIS_useTeamMemberDetails.ts` | ~3x `.from('users', 'teams')` | `UserService.*` + `TeamService.*` | 🔲 TODO |
| `/hooks/HRTHIS_useDashboardStats.ts` | ~5x `.from()` (multiple tables) | `DashboardService.getStats()` (neu) | 🔲 TODO |

**Action Items:**
1. Extend existing Services (Leave, Team, Learning, Organigram, Document)
2. Create **DashboardService** (neu)
3. Refactor alle 7 Hooks
4. Test: Hooks laden Daten korrekt

---

### **Priority 3: Stores (MEDIUM)**

**Effort:** 1 Personentag

| Datei | DB-Calls | Service Needed | Status |
|-------|----------|----------------|--------|
| `/stores/gamificationStore.ts` | 10x `.from()` (user_avatars, coin_transactions, achievements, user_achievements) | `CoinAchievementsService.*` (exists, extend) + `LearningService.*` | 🔲 TODO |
| `/stores/rewardStore.ts` | 2x `.from('rewards')` | `RewardService.*` (neu erstellen) | 🔲 TODO |
| `/stores/HRTHIS_learningStore.ts` | ~3x `.from()` + 1x `.rpc()` | `LearningService.*` (exists, extend) | 🔲 TODO |
| `/stores/HRTHIS_adminStore.ts` | ~5x `.from()` (users, teams, etc.) | Multiple Services | 🔲 TODO |

**Action Items:**
1. **RewardService erstellen** (neu)
2. CoinAchievementsService erweitern
3. LearningService erweitern
4. Refactor alle 4 Stores
5. Test: State-Management funktioniert

---

### **Priority 4: Utils (LOW)**

**Effort:** 0.5 Personentage

| Datei | DB-Calls | Service Needed | Status |
|-------|----------|----------------|--------|
| `/utils/HRTHIS_leaveApproverLogic.ts` | 8x `.from()` (leave_requests, users, team_members) | `LeaveService.getApprover()` | 🔲 TODO |
| `/utils/HRTHIS_organizationHelper.ts` | 4x `.from('organizations')` | `OrganizationService.*` (neu) | 🔲 TODO |
| `/utils/HRTHIS_xpSystem.ts` | 3x `.from('user_avatars', 'xp_events')` | `LearningService.addXP()` | 🔲 TODO |

**Action Items:**
1. **OrganizationService erstellen** (neu)
2. LeaveService erweitern (Approver-Logik)
3. LearningService erweitern (XP-Logik)
4. Refactor alle 3 Utils
5. Test: Utility-Functions korrekt

---

## 🛡️ Phase 2.5 - ESLint Guardrail (1 Tag)

**Effort:** 1 Personentag  
**Impact:** Hoch (verhindert neue direkte Supabase-Calls)

### **Custom ESLint Rule erstellen**

**Datei:** `/.eslintrc.js` (oder `.eslintrc.json`)

```javascript
module.exports = {
  rules: {
    // Verbiete direkte @supabase/supabase-js Imports in UI
    'no-restricted-imports': ['error', {
      paths: [
        {
          name: '@supabase/supabase-js',
          importNames: ['createClient', 'SupabaseClient'],
          message: '❌ Direct Supabase imports forbidden in UI. Use getServices() from ../services instead.'
        }
      ],
      patterns: [
        {
          group: ['**/utils/supabase/client*'],
          message: '❌ Direct supabase client import forbidden in components/hooks/stores. Use getServices() instead.'
        }
      ]
    }],
    
    // Custom Rule: no-direct-supabase-calls (TODO: implement)
    // Verbiete .from(), .rpc(), .storage., .channel() außerhalb services/
    'no-direct-supabase-calls': 'error'
  },
  
  overrides: [
    {
      // Erlaube Supabase in Services, BFF, Utils (Whitelist)
      files: [
        'services/**/*.ts',
        'services/**/*.tsx',
        'supabase/functions/**/*.tsx',
        'utils/supabase/**/*.ts'
      ],
      rules: {
        'no-restricted-imports': 'off',
        'no-direct-supabase-calls': 'off'
      }
    }
  ]
};
```

### **Custom Rule Implementation**

**Datei:** `/eslint-rules/no-direct-supabase-calls.js`

```javascript
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow direct Supabase API calls outside services/',
      category: 'Best Practices',
      recommended: true
    },
    messages: {
      directSupabaseCall: 'Direct Supabase call ({{ method }}) forbidden. Use Service Layer instead.'
    }
  },
  create(context) {
    const filename = context.getFilename();
    
    // Whitelist: Allow in services/, supabase/functions/, utils/supabase/
    if (
      filename.includes('/services/') ||
      filename.includes('/supabase/functions/') ||
      filename.includes('/utils/supabase/')
    ) {
      return {};
    }
    
    return {
      // Check for .from() calls
      MemberExpression(node) {
        if (node.property.name === 'from' && node.object.name === 'supabase') {
          context.report({
            node,
            messageId: 'directSupabaseCall',
            data: { method: '.from()' }
          });
        }
        
        // Check for .rpc() calls
        if (node.property.name === 'rpc' && node.object.name === 'supabase') {
          context.report({
            node,
            messageId: 'directSupabaseCall',
            data: { method: '.rpc()' }
          });
        }
        
        // Check for .storage calls
        if (node.property.name === 'storage' && node.object.name === 'supabase') {
          context.report({
            node,
            messageId: 'directSupabaseCall',
            data: { method: '.storage' }
          });
        }
        
        // Check for .channel() calls
        if (node.property.name === 'channel' && node.object.name === 'supabase') {
          context.report({
            node,
            messageId: 'directSupabaseCall',
            data: { method: '.channel()' }
          });
        }
      }
    };
  }
};
```

**Action Items:**
1. Custom ESLint Rule implementieren
2. `.eslintrc.js` konfigurieren
3. Pre-Commit Hook einrichten (Husky)
4. CI/CD: ESLint Check im Build
5. Test: Neue direkte Calls werden blockiert

---

## 🔮 Phase 3 - Optional: Multi-Provider (5-7 Tage)

**Effort:** 5-7 Personentage  
**Impact:** Sehr Hoch (Multi-Provider Support)

### **DbClient Interface**

**Datei:** `/services/base/DbClient.ts`

```typescript
export interface DbClient {
  from(table: string): QueryBuilder;
  rpc(fnName: string, params: any): Promise<any>;
}

export interface QueryBuilder {
  select(columns?: string): this;
  insert(data: any): this;
  update(data: any): this;
  delete(): this;
  eq(column: string, value: any): this;
  in(column: string, values: any[]): this;
  order(column: string, options?: any): this;
  limit(count: number): this;
  single(): Promise<{ data: any; error: any }>;
}
```

### **Adapter Implementations**

**Dateien:**
- `/services/adapters/SupabaseDbAdapter.ts`
- `/services/adapters/ConvexDbAdapter.ts`
- `/services/adapters/PrismaDbAdapter.ts`

### **AuthClient Interface**

**Datei:** `/services/base/AuthClient.ts`

```typescript
export interface AuthClient {
  signIn(email: string, password: string): Promise<AuthSession>;
  signUp(email: string, password: string, metadata?: any): Promise<AuthSession>;
  signOut(): Promise<void>;
  getSession(): Promise<AuthSession | null>;
  getUser(): Promise<AuthUser | null>;
  onAuthStateChange(callback: (event: string, session: AuthSession | null) => void): () => void;
}
```

### **StorageClient Interface**

**Datei:** `/services/base/StorageClient.ts`

```typescript
export interface StorageClient {
  upload(bucket: string, path: string, file: File): Promise<{ publicUrl: string }>;
  delete(bucket: string, paths: string[]): Promise<void>;
  getSignedUrl(bucket: string, path: string, expiresIn: number): Promise<string>;
}
```

### **Factory Pattern**

**Datei:** `/services/adapters/factory.ts`

```typescript
const BACKEND_PROVIDER = process.env.VITE_BACKEND_PROVIDER || 'supabase';

export function makeAdapters() {
  switch (BACKEND_PROVIDER) {
    case 'supabase':
      return {
        db: new SupabaseDbAdapter(supabase),
        auth: new SupabaseAuthAdapter(supabase),
        storage: new SupabaseStorageAdapter(supabase),
        realtime: new SupabaseRealtimeAdapter(supabase),
      };
    case 'convex':
      return {
        db: new ConvexDbAdapter(),
        auth: new Auth0Adapter(),
        storage: new CloudinaryStorageAdapter(),
        realtime: new PusherAdapter(),
      };
    default:
      throw new Error(`Unknown backend provider: ${BACKEND_PROVIDER}`);
  }
}
```

**Action Items:**
1. Interfaces definieren
2. Supabase-Adapter implementieren (Baseline)
3. Factory Pattern implementieren
4. Services refactoren (verwenden Interfaces statt Supabase direkt)
5. Test: Provider-Switch funktioniert

---

## 📊 Backlog Summary

| Phase | Tasks | Effort | Impact | Status |
|-------|-------|--------|--------|--------|
| **Phase 2 - DB Migration** | 50+ Dateien | 3-5 PT | Hoch | 🔲 TODO |
| **Phase 2.5 - ESLint** | 2 Dateien | 1 PT | Hoch | 🔲 TODO |
| **Phase 3 - Multi-Provider** | 10+ Dateien | 5-7 PT | Sehr Hoch | 🔲 Optional |
| **TOTAL** | **60+ Dateien** | **9-13 PT** | **Kritisch** | **🟡 Planning** |

---

## 🎯 Recommended Sprint Plan

### **Sprint 1 (Week 1): Priority 1 Cards**
- [ ] Extend UserService (6 Methoden)
- [ ] Refactor User Cards (6 Dateien)
- [ ] Refactor Admin Cards (10 Dateien)
- [ ] Testing

**Deliverables:** 16 Dateien refactored, 0 direkte DB-Calls in Cards

---

### **Sprint 2 (Week 2): Screens & Hooks**
- [ ] Create ActivityService
- [ ] Create DashboardService
- [ ] Refactor Screens (4 Dateien)
- [ ] Refactor Hooks (7 Dateien)
- [ ] Testing

**Deliverables:** 11 Dateien refactored, Services erweitert

---

### **Sprint 3 (Week 3): Stores & Utils + ESLint**
- [ ] Create RewardService
- [ ] Refactor Stores (4 Dateien)
- [ ] Refactor Utils (3 Dateien)
- [ ] ESLint Guardrail implementieren
- [ ] Testing

**Deliverables:** 7 Dateien refactored, ESLint aktiv

---

### **Sprint 4 (Optional): Multi-Provider**
- [ ] Interfaces definieren
- [ ] Adapter implementieren
- [ ] Factory Pattern
- [ ] Testing

**Deliverables:** Multi-Provider Support

---

## 📝 Tracking

| Woche | Geplant | Completed | % |
|-------|---------|-----------|---|
| Week 1 | 16 Dateien | __ | __% |
| Week 2 | 11 Dateien | __ | __% |
| Week 3 | 7 Dateien | __ | __% |
| Week 4 | 10 Dateien | __ | __% |
| **TOTAL** | **44 Dateien** | **__** | **__%** |

---

**Ende des Backlog** ✅
