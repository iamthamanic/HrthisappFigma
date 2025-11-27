# 🔔 Auto-Discovery Trigger System

## 🎯 Problem gelöst

**Frage:** "Wie stellen wir sicher, dass bei jedem neuen Feature automatisch die richtigen Workflow-Trigger gesetzt werden?"

**Antwort:** **Trigger Registry + Validation System**

---

## 🏗️ System-Architektur

```
┌─────────────────────────────────────────────────────────┐
│  1. Trigger Registry (Single Source of Truth)          │
│     /supabase/functions/_shared/triggerRegistry.ts      │
│     → Definiert ALLE verfügbaren Triggers               │
│     → Dokumentiert erwartete Context-Felder             │
│     → Markiert Implementation-Status                    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  2. Edge Functions verwenden Triggers                   │
│     import { triggerWorkflows, TRIGGER_TYPES }          │
│     await triggerWorkflows(TRIGGER_TYPES.XXX, ...)      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  3. Validation Script prüft Implementation              │
│     deno run scripts/validate-triggers.ts               │
│     → Zeigt unimplemented  Triggers                     │
│     → Generiert Code-Beispiele                          │
│     → Pre-Deployment Check                              │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Workflow: Neues Feature hinzufügen

### **Schritt 1: Trigger in Registry definieren**

Öffne `/supabase/functions/_shared/triggerRegistry.ts` und füge hinzu:

```typescript
{
  key: 'BENEFIT_ASSIGNED',
  label: 'Benefit zugewiesen',
  category: 'benefit',
  description: 'Wird ausgelöst, wenn einem Mitarbeiter ein Benefit zugewiesen wird',
  sourceFunction: 'BrowoKoordinator-Benefits',
  expectedContext: ['benefitId', 'benefitName', 'userId', 'userName', 'assignmentDate', 'organizationId'],
  implemented: false, // ⚠️ TODO: Implementieren!
}
```

### **Schritt 2: Validation Script ausführen**

```bash
deno run --allow-read scripts/validate-triggers.ts
```

**Output:**
```
🔍 TRIGGER VALIDATION REPORT
════════════════════════════════════════════════════════════
📊 Total Triggers: 26

⚠️  Unimplemented Triggers (TODO):
   • BENEFIT_ASSIGNED
     Label:    Benefit zugewiesen
     Function: BrowoKoordinator-Benefits
     Context:  benefitId, benefitName, userId, userName, ...

💡 IMPLEMENTATION EXAMPLES
═══════════════════════════════════════════════════════════

📌 BENEFIT_ASSIGNED
   Function: BrowoKoordinator-Benefits/index.ts

   Add this code after the operation succeeds:

   // Import at top of file
   import { triggerWorkflows, TRIGGER_TYPES } from "../_shared/triggerWorkflows.ts";

   // Add after successful operation
   await triggerWorkflows(
     TRIGGER_TYPES.BENEFIT_ASSIGNED,
     {
       benefitId: /* your value */,
       benefitName: /* your value */,
       userId: /* your value */,
       ...
     },
     authHeader
   );
```

### **Schritt 3: Trigger in Edge Function implementieren**

```typescript
// In /supabase/functions/BrowoKoordinator-Benefits/index.ts
import { triggerWorkflows, TRIGGER_TYPES } from "../_shared/triggerWorkflows.ts";

app.post("/benefits/:id/assign", async (c) => {
  // ... Benefit zuweisen ...
  
  const { data: assignment } = await supabase
    .from('benefit_assignments')
    .insert({ benefit_id, user_id, ... })
    .select()
    .single();
  
  // 🔔 Workflows triggern
  await triggerWorkflows(
    TRIGGER_TYPES.BENEFIT_ASSIGNED,
    {
      benefitId: benefit.id,
      benefitName: benefit.name,
      userId: user.id,
      userName: user.full_name,
      assignmentDate: new Date().toISOString(),
      organizationId: user.organization_id,
    },
    c.req.header('Authorization') ?? ''
  );
  
  return c.json({ success: true });
});
```

### **Schritt 4: Als implementiert markieren**

In `triggerRegistry.ts`:

```typescript
{
  key: 'BENEFIT_ASSIGNED',
  // ...
  implemented: true, // ✅ DONE!
}
```

### **Schritt 5: Validieren**

```bash
deno run --allow-read scripts/validate-triggers.ts
```

**Output:**
```
✅ ALL TRIGGERS IMPLEMENTED! 🎉
```

---

## ✅ Vorteile

### **1. Single Source of Truth**
- Alle Triggers an **einem Ort** definiert
- Keine Duplikate, keine Inkonsistenzen

### **2. Auto-Validation**
- Script zeigt **automatisch fehlende Implementierungen**
- Generiert **Code-Beispiele** für schnelle Integration

### **3. Type-Safe**
- TypeScript-Typen werden automatisch generiert
- Autocomplete in IDE funktioniert

### **4. Context Validation**
- Prüft automatisch, ob alle erwarteten Felder vorhanden sind
- Warnt bei fehlenden Daten (loggt Warning, wirft keinen Fehler)

### **5. Pre-Deployment Check**
- Kann in CI/CD Pipeline integriert werden
- Verhindert vergessene Triggers

---

## 🔍 API Endpoints

### **GET /trigger-types**

Gibt alle verfügbaren Triggers mit Details zurück:

```bash
curl https://azmtojgikubegzusvhra.supabase.co/functions/v1/BrowoKoordinator-Workflows/trigger-types \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "trigger_types": [
    {
      "key": "EMPLOYEE_CREATED",
      "label": "Mitarbeiter erstellt",
      "category": "employee",
      "description": "Wird ausgelöst, wenn ein neuer Mitarbeiter angelegt wird",
      "implemented": false,
      "expectedContext": ["userId", "employeeId", "employeeName", ...]
    },
    ...
  ]
}
```

---

## 📊 Status überwachen

### **Implementierungs-Fortschritt checken:**

```bash
deno run --allow-read scripts/validate-triggers.ts
```

### **Triggers für bestimmte Edge Function anzeigen:**

```typescript
import { getTriggersByFunction } from '../supabase/functions/_shared/triggerRegistry.ts';

const triggers = getTriggersByFunction('BrowoKoordinator-Personalakte');
console.log(triggers);
```

### **Unimplemented Triggers finden:**

```typescript
import { getUnimplementedTriggers } from '../supabase/functions/_shared/triggerRegistry.ts';

const todos = getUnimplementedTriggers();
console.log(`${todos.length} triggers noch zu implementieren`);
```

---

## 🚀 CI/CD Integration (Optional)

### **Pre-Deployment Check:**

```yaml
# .github/workflows/deploy.yml
name: Deploy Edge Functions

on:
  push:
    branches: [main]

jobs:
  validate-triggers:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: denoland/setup-deno@v1
      - name: Validate Triggers
        run: deno run --allow-read scripts/validate-triggers.ts
      # Falls Triggers fehlen, Warning ausgeben (aber nicht blockieren)
```

---

## 💡 Best Practices

### **1. Neue Features immer mit Trigger definieren**
Auch wenn du es noch nicht implementierst - füge den Trigger zur Registry hinzu mit `implemented: false`.

### **2. Detaillierte expectedContext definieren**
Je mehr Context-Felder, desto flexibler die Workflows.

### **3. Validation Script regelmäßig laufen lassen**
Vor jedem Deployment checken!

### **4. Category sinnvoll wählen**
Hilft beim Gruppieren und Filtern im Frontend.

---

## 🎯 Zusammenfassung

Mit diesem System:
- ✅ **Vergisst du keine Trigger** mehr (Validation Script zeigt TODOs)
- ✅ **Code-Duplikation vermieden** (Single Source of Truth)
- ✅ **Schnelle Integration** (Code-Beispiele werden generiert)
- ✅ **Type-Safe** (TypeScript Autocomplete funktioniert)
- ✅ **Skalierbar** (Neue Features einfach hinzufügen)

**Workflow bei neuem Feature:**
1. Trigger in Registry definieren (`implemented: false`)
2. Validation Script zeigt dir, was zu tun ist
3. Code-Beispiel kopieren & anpassen
4. Als `implemented: true` markieren
5. ✅ Fertig!

---

**Happy Automating! 🚀**
