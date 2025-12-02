# 🔔 Trigger Integration Guide

**Version:** 1.0.0  
**Letzte Aktualisierung:** 2. Dezember 2024  
**Status:** ✅ Production Ready

---

## 📋 Übersicht

Dieses Dokument erklärt, wie du die 22 Standard-Trigger-Typen in deine App-Features integrierst, damit Workflows automatisch ausgelöst werden.

---

## 🚀 Quick Start

### 1. Trigger aus deinem Code feuern

```typescript
import { projectId, publicAnonKey } from './utils/supabase/info';

async function triggerWorkflow(triggerType: string, context: Record<string, any>) {
  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/BrowoKoordinator-Workflows/trigger`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({
        trigger_type: triggerType,
        context: context
      })
    }
  );
  
  const result = await response.json();
  console.log(`✅ ${result.triggered_workflows} Workflows ausgelöst`);
}
```

---

## 📝 Trigger-Typen & Integration

### **👤 HR / MITARBEITER EVENTS**

#### `EMPLOYEE_CREATED` - Neuer Mitarbeiter angelegt
**Wo integrieren:** User Creation Flow (z.B. Admin-Wizard, Bulk-Import)

```typescript
// Nach erfolgreichem User-Create
await triggerWorkflow('EMPLOYEE_CREATED', {
  user_id: newUser.id,
  employee_id: newUser.id,
  first_name: newUser.first_name,
  last_name: newUser.last_name,
  email: newUser.email,
  department_id: newUser.department_id,
  location_id: newUser.location_id,
  role_id: newUser.role_id,
  start_date: newUser.start_date,
});
```

**Beispiel-Workflow:** Onboarding-Checklist, Welcome-Email, Equipment-Bestellung

---

#### `EMPLOYEE_UPDATED` - Mitarbeiter-Daten aktualisiert
**Wo integrieren:** User Edit Flow

```typescript
// Nach erfolgreichem Update
await triggerWorkflow('EMPLOYEE_UPDATED', {
  user_id: updatedUser.id,
  changed_fields: ['department_id', 'role_id'], // Welche Felder geändert wurden
  old_department_id: oldUser.department_id,
  new_department_id: updatedUser.department_id,
  // ... weitere changed fields
});
```

**Beispiel-Workflow:** Beförderungs-Glückwunsch, Team-Wechsel-Benachrichtigung

---

#### `EMPLOYEE_DELETED` - Mitarbeiter gelöscht
**Wo integrieren:** User Delete Flow

```typescript
// Vor oder nach User-Delete
await triggerWorkflow('EMPLOYEE_DELETED', {
  user_id: deletedUser.id,
  employee_id: deletedUser.id,
  first_name: deletedUser.first_name,
  last_name: deletedUser.last_name,
  last_day: deletedUser.termination_date,
});
```

**Beispiel-Workflow:** Offboarding-Checklist, Zugriffe entziehen, Exit-Interview

---

#### `EMPLOYEE_ADDED_TO_TEAM` - Zu Team hinzugefügt
**Wo integrieren:** Team Management

```typescript
// Nach Team-Zuweisung
await triggerWorkflow('EMPLOYEE_ADDED_TO_TEAM', {
  user_id: userId,
  team_id: teamId,
  team_name: team.name,
});
```

**Beispiel-Workflow:** Team-Welcome-Email, Team-Onboarding-Dokumente

---

#### `EMPLOYEE_REMOVED_FROM_TEAM` - Aus Team entfernt
**Wo integrieren:** Team Management

```typescript
// Nach Team-Entfernung
await triggerWorkflow('EMPLOYEE_REMOVED_FROM_TEAM', {
  user_id: userId,
  team_id: teamId,
  team_name: team.name,
});
```

---

### **🎓 LEARNING / GAMIFICATION EVENTS**

#### `LEARNING_VIDEO_STARTED` - Video gestartet
**Wo integrieren:** Video Player (onPlay Event)

```typescript
// Im Video Player Component
const handleVideoPlay = async () => {
  await triggerWorkflow('LEARNING_VIDEO_STARTED', {
    user_id: currentUser.id,
    video_id: video.id,
    video_title: video.title,
    timestamp: new Date().toISOString(),
  });
};
```

**Beispiel-Workflow:** Progress-Tracking, Reminder nach 24h wenn nicht abgeschlossen

---

#### `LEARNING_VIDEO_COMPLETED` - Video abgeschlossen
**Wo integrieren:** Video Player (onEnded Event oder bei 95%+ Progress)

```typescript
// Im Video Player Component
const handleVideoComplete = async () => {
  await triggerWorkflow('LEARNING_VIDEO_COMPLETED', {
    user_id: currentUser.id,
    video_id: video.id,
    video_title: video.title,
    completion_date: new Date().toISOString(),
    watch_time: totalWatchTime, // in Sekunden
  });
};
```

**Beispiel-Workflow:** Coins vergeben, Nächstes Video vorschlagen, Achievement unlock

---

#### `LEARNING_TEST_COMPLETED` - Test abgeschlossen
**Wo integrieren:** Test Submission Handler

```typescript
// Nach Test-Submission
await triggerWorkflow('LEARNING_TEST_COMPLETED', {
  user_id: currentUser.id,
  test_id: test.id,
  test_title: test.title,
  score: calculatedScore, // 0-100
  passed: calculatedScore >= test.passing_score,
  submission_date: new Date().toISOString(),
});
```

**Beispiel-Workflow:** 
- Bei Score >= 80%: Zertifikat versenden, Coins vergeben
- Bei Score < 80%: Wiederholungs-Erinnerung

---

#### `LEARNING_QUIZ_COMPLETED` - Lerneinheit abgeschlossen
**Wo integrieren:** Quiz/Lerneinheit Abschluss

```typescript
await triggerWorkflow('LEARNING_QUIZ_COMPLETED', {
  user_id: currentUser.id,
  quiz_id: quiz.id,
  quiz_title: quiz.title,
});
```

---

#### `XP_THRESHOLD_REACHED` - XP-Schwelle erreicht
**Wo integrieren:** XP-Vergabe Logic (überall wo XP vergeben werden)

```typescript
// Nach XP-Vergabe
const newXP = currentUser.xp + earnedXP;

// Check Thresholds
const thresholds = [100, 250, 500, 1000, 2500, 5000, 10000];
for (const threshold of thresholds) {
  if (currentUser.xp < threshold && newXP >= threshold) {
    await triggerWorkflow('XP_THRESHOLD_REACHED', {
      user_id: currentUser.id,
      xp: newXP,
      threshold: threshold,
      previous_xp: currentUser.xp,
    });
  }
}
```

**Beispiel-Workflow:** Glückwunsch-Email, Bonus-Coins, Team-Benachrichtigung

---

#### `LEVEL_UP` - Level aufgestiegen
**Wo integrieren:** Level-Berechnung (nach XP-Update)

```typescript
// Nach Level-Berechnung
const newLevel = calculateLevel(newXP);

if (newLevel > currentUser.level) {
  await triggerWorkflow('LEVEL_UP', {
    user_id: currentUser.id,
    level: newLevel,
    previous_level: currentUser.level,
    xp: newXP,
  });
}
```

**Beispiel-Workflow:** Glückwunsch-Benachrichtigung, Avatar-Item freischalten

---

#### `COINS_THRESHOLD_REACHED` - Coin-Stand erreicht
**Wo integrieren:** Coin-Vergabe Logic

```typescript
// Nach Coin-Vergabe
const newCoins = currentUser.coins + earnedCoins;

const thresholds = [100, 500, 1000, 2500, 5000];
for (const threshold of thresholds) {
  if (currentUser.coins < threshold && newCoins >= threshold) {
    await triggerWorkflow('COINS_THRESHOLD_REACHED', {
      user_id: currentUser.id,
      coins: newCoins,
      threshold: threshold,
    });
  }
}
```

---

#### `ACHIEVEMENT_UNLOCKED` - Achievement freigeschaltet
**Wo integrieren:** Achievement Unlock Logic

```typescript
await triggerWorkflow('ACHIEVEMENT_UNLOCKED', {
  user_id: currentUser.id,
  achievement_id: achievement.id,
  achievement_name: achievement.name,
  unlock_date: new Date().toISOString(),
});
```

**Beispiel-Workflow:** Glückwunsch-Notification, Social Share, Bonus-Coins

---

### **🛒 SHOP / BENEFITS EVENTS**

#### `BENEFIT_PURCHASED` - Benefit gekauft
**Wo integrieren:** Shop Purchase Handler

```typescript
// Nach erfolgreichem Kauf
await triggerWorkflow('BENEFIT_PURCHASED', {
  user_id: currentUser.id,
  benefit_id: benefit.id,
  benefit_name: benefit.name,
  coins_spent: benefit.price,
  purchase_date: new Date().toISOString(),
});
```

**Beispiel-Workflow:** 
- Automatische Freigabe/Versand
- Benachrichtigung an HR/Admin
- Rechnung erstellen

---

#### `BENEFIT_REDEEMED` - Benefit eingelöst
**Wo integrieren:** Benefit Redemption Handler

```typescript
await triggerWorkflow('BENEFIT_REDEEMED', {
  user_id: currentUser.id,
  benefit_id: benefit.id,
  redemption_date: new Date().toISOString(),
});
```

---

### **✅ TASKS / AUFGABEN EVENTS**

#### `TASK_COMPLETED` - Aufgabe abgeschlossen
**Wo integrieren:** Task Completion Handler

```typescript
// Nach Task-Completion
await triggerWorkflow('TASK_COMPLETED', {
  user_id: currentUser.id,
  task_id: task.id,
  task_title: task.title,
  completion_date: new Date().toISOString(),
  completed_on_time: new Date() <= task.due_date,
});
```

**Beispiel-Workflow:** Coins vergeben, Nächste Task zuweisen, Manager benachrichtigen

---

#### `TASK_OVERDUE` - Aufgabe überfällig
**Wo integrieren:** Cron Job / Scheduled Check

```typescript
// Täglich um 9 Uhr prüfen
const overdueTasks = await getOverdueTasks();

for (const task of overdueTasks) {
  await triggerWorkflow('TASK_OVERDUE', {
    user_id: task.user_id,
    task_id: task.id,
    task_title: task.title,
    due_date: task.due_date,
    days_overdue: calculateDaysOverdue(task.due_date),
  });
}
```

**Beispiel-Workflow:** Erinnerung senden, Manager benachrichtigen

---

### **📄 ANTRAGS-WORKFLOW EVENTS**

#### `REQUEST_APPROVED` - Antrag genehmigt
**Wo integrieren:** Request Approval Handler

```typescript
// Nach Genehmigung
await triggerWorkflow('REQUEST_APPROVED', {
  user_id: request.user_id,
  request_id: request.id,
  request_type: request.type, // 'leave', 'document', 'expense'
  approved_by: approverId,
  approval_date: new Date().toISOString(),
});
```

**Beispiel-Workflow:** Benachrichtigung an User, Kalender-Eintrag erstellen

---

#### `REQUEST_REJECTED` - Antrag abgelehnt
**Wo integrieren:** Request Rejection Handler

```typescript
await triggerWorkflow('REQUEST_REJECTED', {
  user_id: request.user_id,
  request_id: request.id,
  request_type: request.type,
  rejected_by: rejecterId,
  rejection_reason: rejectionReason,
  rejection_date: new Date().toISOString(),
});
```

---

### **⏰ ZEITBASIERTE TRIGGER**

#### `SCHEDULED_DATE` - Bestimmtes Datum
**Automatisch:** Wird vom Workflow-System selbst ausgelöst  
**Konfiguration:** Über Workflow-Editor

#### `SCHEDULED_CRON` - Zeitplan (Cron)
**Automatisch:** Wird vom Workflow-System selbst ausgelöst  
**Konfiguration:** Über Workflow-Editor

#### `REMINDER_CHECK` - Periodischer Check
**Automatisch:** Wird vom Workflow-System selbst ausgelöst  
**Konfiguration:** Über Workflow-Editor

---

## 🔧 Implementierungs-Checkliste

Für jedes neue Feature:

- [ ] **1. Trigger-Punkt identifizieren**  
  Wo genau im Code soll der Trigger gefeuert werden?

- [ ] **2. Context-Daten sammeln**  
  Welche Daten sind wichtig für den Workflow? (user_id, entity_id, etc.)

- [ ] **3. Trigger-Call implementieren**  
  `await triggerWorkflow(triggerType, context)`

- [ ] **4. Error Handling**  
  Trigger-Fehler sollten die normale Funktionalität nicht blockieren

- [ ] **5. Logging**  
  Console.log für Debugging

- [ ] **6. Testen**  
  Workflow anlegen und testen ob er korrekt ausgelöst wird

---

## 🐛 Debugging

### Trigger wird nicht ausgelöst?

1. **Console-Log prüfen:**
   ```typescript
   console.log('🔔 Triggering workflow:', triggerType, context);
   ```

2. **Backend-Logs prüfen:**
   - Öffne Supabase Dashboard → Edge Functions → Logs
   - Suche nach `🔔 Trigger received`

3. **Workflow-Konfiguration prüfen:**
   - Ist der Workflow `is_active = true`?
   - Passt der `trigger_type`?
   - Passen die Filter (department_id, location_id, etc.)?

4. **Context-Daten prüfen:**
   - Werden alle erforderlichen Felder mitgeschickt?
   - Passen die IDs mit der Workflow-Config?

---

## 📚 Best Practices

### ✅ DO

- **Context immer vollständig befüllen** - Auch wenn nicht alle Felder für Filter genutzt werden
- **user_id immer mitschicken** - Standard-Feld für alle Trigger
- **Timestamps in ISO 8601** - `new Date().toISOString()`
- **Error Handling** - Trigger sollten nie die User-Experience blockieren
- **Logging** - Console.log für jeden Trigger-Call

### ❌ DON'T

- **Nicht mehrfach triggern** - Prüfe ob Event bereits gefeuert wurde
- **Nicht synchron warten** - Trigger-Call kann asynchron laufen (fire & forget)
- **Nicht bei jedem Update** - Nur bei relevanten Änderungen triggern
- **Nicht ohne Context** - Mindestens `user_id` sollte immer dabei sein

---

## 🎨 Beispiel: Komplette Integration

```typescript
// components/learning/VideoPlayer.tsx
import { triggerWorkflow } from '../../utils/workflowTriggers';

export function VideoPlayer({ video, user }) {
  const [hasStarted, setHasStarted] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  
  const handlePlay = async () => {
    if (!hasStarted) {
      setHasStarted(true);
      
      // Trigger: Video gestartet
      try {
        await triggerWorkflow('LEARNING_VIDEO_STARTED', {
          user_id: user.id,
          video_id: video.id,
          video_title: video.title,
          timestamp: new Date().toISOString(),
        });
        console.log('✅ Video-Start getriggert');
      } catch (error) {
        console.error('❌ Trigger-Fehler:', error);
        // Weiter abspielen, nicht blockieren!
      }
    }
  };
  
  const handleProgress = async (progress: number) => {
    // Bei 95% als "completed" markieren
    if (progress >= 0.95 && !hasCompleted) {
      setHasCompleted(true);
      
      // Trigger: Video abgeschlossen
      try {
        await triggerWorkflow('LEARNING_VIDEO_COMPLETED', {
          user_id: user.id,
          video_id: video.id,
          video_title: video.title,
          completion_date: new Date().toISOString(),
          final_progress: progress,
        });
        console.log('✅ Video-Abschluss getriggert');
      } catch (error) {
        console.error('❌ Trigger-Fehler:', error);
      }
    }
  };
  
  return (
    <YouTubePlayer
      onPlay={handlePlay}
      onProgress={handleProgress}
      // ...
    />
  );
}
```

---

## 🔗 Weiterführende Dokumentation

- **Trigger Generator Konzept:** `/docs/TRIGGER_GENERATOR_KONZEPT.md`
- **Workflow Types:** `/types/workflow.ts`
- **Workflow Helpers:** `/utils/workflowHelpers.tsx`

---

**Happy Triggering! 🚀**
