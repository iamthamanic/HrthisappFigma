# 🔄 Workflow-Integration: Trigger-System

## Übersicht

Jede Aktion in BrowoKoordinator kann automatisch Workflows triggern. Das System ist **event-driven** - wenn etwas passiert (z.B. neuer Mitarbeiter angelegt), werden alle zugehörigen Workflows automatisch ausgeführt.

---

## 📋 Verfügbare Trigger-Types

### **Employee Events**
- `EMPLOYEE_CREATED` - Neuer Mitarbeiter angelegt
- `EMPLOYEE_UPDATED` - Mitarbeiter-Daten aktualisiert
- `EMPLOYEE_DELETED` - Mitarbeiter gelöscht

### **Onboarding/Offboarding**
- `ONBOARDING_START` - Onboarding gestartet
- `OFFBOARDING_START` - Offboarding gestartet

### **Vehicle Events**
- `VEHICLE_ASSIGNED` - Fahrzeug zugewiesen
- `VEHICLE_RETURNED` - Fahrzeug zurückgegeben
- `VEHICLE_DAMAGE_REPORTED` - Schaden gemeldet

### **Equipment Events**
- `EQUIPMENT_ASSIGNED` - IT-Equipment zugewiesen
- `EQUIPMENT_RETURNED` - IT-Equipment zurückgegeben

### **Document Events**
- `DOCUMENT_UPLOADED` - Dokument hochgeladen
- `DOCUMENT_SIGNED` - Dokument unterschrieben
- `DOCUMENT_EXPIRED` - Dokument abgelaufen

### **Benefit Events**
- `BENEFIT_ASSIGNED` - Benefit zugewiesen
- `BENEFIT_REMOVED` - Benefit entfernt

### **Task Events**
- `TASK_CREATED` - Aufgabe erstellt
- `TASK_COMPLETED` - Aufgabe abgeschlossen

### **Training Events**
- `TRAINING_ASSIGNED` - Schulung zugewiesen
- `TRAINING_COMPLETED` - Schulung abgeschlossen

### **Contract Events**
- `CONTRACT_SIGNED` - Vertrag unterschrieben
- `CONTRACT_UPDATED` - Vertrag aktualisiert
- `PROBATION_END` - Probezeit endet

---

## 🔌 Integration in Edge Functions

### **Beispiel 1: Personalakte - Neuer Mitarbeiter**

```typescript
// In /supabase/functions/BrowoKoordinator-Personalakte/index.ts
import { triggerWorkflows, TRIGGER_TYPES } from "../_shared/triggerWorkflows.ts";

// Nach erfolgreicher Mitarbeiter-Erstellung
app.post("/employees", async (c) => {
  // ... Mitarbeiter erstellen ...
  
  const { data: newEmployee } = await supabase
    .from('users')
    .insert({ ... })
    .select()
    .single();
  
  // 🔔 Workflows triggern
  await triggerWorkflows(
    TRIGGER_TYPES.EMPLOYEE_CREATED,
    {
      userId: newEmployee.id,
      employeeId: newEmployee.id,
      employeeName: newEmployee.full_name,
      employeeEmail: newEmployee.email,
      department: newEmployee.department,
      organizationId: newEmployee.organization_id,
    },
    c.req.header('Authorization') ?? ''
  );
  
  return c.json({ success: true, employee: newEmployee });
});
```

---

### **Beispiel 2: Flotte - Fahrzeug zuweisen**

```typescript
// In /supabase/functions/BrowoKoordinator-Flotte/index.ts
import { triggerWorkflows, TRIGGER_TYPES } from "../_shared/triggerWorkflows.ts";

app.post("/vehicles/:vehicleId/assign", async (c) => {
  // ... Fahrzeug zuweisen ...
  
  const assignment = await supabase
    .from('vehicle_assignments')
    .insert({ vehicle_id, user_id, ... })
    .select()
    .single();
  
  // 🔔 Workflows triggern
  await triggerWorkflows(
    TRIGGER_TYPES.VEHICLE_ASSIGNED,
    {
      vehicleId: vehicle_id,
      vehicleName: vehicle.name,
      userId: user_id,
      userName: user.full_name,
      assignmentDate: new Date().toISOString(),
    },
    authHeader
  );
  
  return c.json({ success: true });
});
```

---

### **Beispiel 3: Equipment - IT-Gerät zuweisen**

```typescript
// In /supabase/functions/BrowoKoordinator-Equipment/index.ts
import { triggerWorkflows, TRIGGER_TYPES } from "../_shared/triggerWorkflows.ts";

app.post("/equipment/:equipmentId/assign", async (c) => {
  // ... Equipment zuweisen ...
  
  // 🔔 Workflows triggern
  await triggerWorkflows(
    TRIGGER_TYPES.EQUIPMENT_ASSIGNED,
    {
      equipmentId: equipment.id,
      equipmentType: equipment.type,
      equipmentName: equipment.name,
      userId: user_id,
      userName: user.full_name,
    },
    authHeader
  );
  
  return c.json({ success: true });
});
```

---

### **Beispiel 4: Dokumente - Upload**

```typescript
// In einer zukünftigen Dokumenten-Function
import { triggerWorkflows, TRIGGER_TYPES } from "../_shared/triggerWorkflows.ts";

app.post("/documents/upload", async (c) => {
  // ... Dokument hochladen ...
  
  // 🔔 Workflows triggern
  await triggerWorkflows(
    TRIGGER_TYPES.DOCUMENT_UPLOADED,
    {
      documentId: document.id,
      documentName: document.name,
      documentType: document.type,
      uploadedBy: user.id,
      uploadedByName: user.full_name,
    },
    authHeader
  );
  
  return c.json({ success: true });
});
```

---

## ✅ Best Practices

### **1. Immer nach erfolgreicher Operation triggern**
```typescript
// ✅ RICHTIG
const result = await supabase.from('...').insert(...);
if (result.error) {
  return c.json({ error: ... }, 500);
}
await triggerWorkflows(...); // Nur wenn erfolgreich!

// ❌ FALSCH
await triggerWorkflows(...); // Vor der Operation!
const result = await supabase.from('...').insert(...);
```

### **2. Alle relevanten Context-Daten mitschicken**
```typescript
// ✅ RICHTIG - Detaillierte Daten
await triggerWorkflows('EMPLOYEE_CREATED', {
  userId: newEmployee.id,
  employeeName: newEmployee.full_name,
  employeeEmail: newEmployee.email,
  department: newEmployee.department,
  startDate: newEmployee.start_date,
  organizationId: newEmployee.organization_id,
}, authHeader);

// ❌ FALSCH - Zu wenig Daten
await triggerWorkflows('EMPLOYEE_CREATED', {
  userId: newEmployee.id,
}, authHeader);
```

### **3. Authorization-Header weitergeben**
```typescript
// ✅ RICHTIG
const authHeader = c.req.header('Authorization') ?? '';
await triggerWorkflows(..., authHeader);

// ❌ FALSCH - Ohne Auth
await triggerWorkflows(..., ''); // Workflows können nicht ausgeführt werden!
```

### **4. Fehler nicht werfen (Workflows sind optional)**
```typescript
// Die triggerWorkflows()-Funktion wirft KEINE Fehler
// Sie loggt nur Warnungen, wenn etwas schiefgeht
// → Hauptoperation läuft weiter, auch wenn Workflows fehlschlagen
await triggerWorkflows(...); // Kein try/catch nötig!
```

---

## 🧪 Testing

### **1. Workflow im Admin erstellen**
1. Admin Panel → Workflows
2. Neuen Workflow erstellen
3. Trigger Type wählen (z.B. `EMPLOYEE_CREATED`)
4. Aktionen hinzufügen (Email, Dokumente, etc.)
5. Speichern & Aktivieren

### **2. Action durchführen**
1. Neuen Mitarbeiter anlegen
2. → Workflows werden automatisch getriggert
3. → Check Execution Logs im Admin Panel

### **3. Logs überprüfen**
```bash
# Supabase Edge Function Logs
supabase functions logs BrowoKoordinator-Workflows

# Erwartete Ausgabe:
# 🔔 Triggering workflows for event: EMPLOYEE_CREATED
# 🚀 Executing workflow: onboarding-workflow-1 for user abc123
# ✅ Workflows triggered successfully
```

---

## 📊 Workflow-Architektur

```
┌─────────────────┐
│  Personalakte   │
│  Edge Function  │
└────────┬────────┘
         │ POST /trigger
         │ { type: 'EMPLOYEE_CREATED', context: {...} }
         ▼
┌─────────────────┐
│   Workflows     │
│  Edge Function  │ ← Findet alle Workflows mit diesem Trigger
└────────┬────────┘
         │ Führt automatisch aus
         ▼
┌─────────────────┐
│ Workflow Engine │
│  - Email        │
│  - Tasks        │
│  - Documents    │
│  - Benefits     │
└─────────────────┘
```

---

## 🎯 Nächste Schritte

### **TODO: Integration in bestehende Edge Functions**

- [ ] **BrowoKoordinator-Personalakte**
  - `EMPLOYEE_CREATED` beim Anlegen
  - `EMPLOYEE_UPDATED` beim Aktualisieren
  - `EMPLOYEE_DELETED` beim Löschen

- [ ] **BrowoKoordinator-Flotte**
  - `VEHICLE_ASSIGNED` bei Zuweisung
  - `VEHICLE_RETURNED` bei Rückgabe
  - `VEHICLE_DAMAGE_REPORTED` bei Schadenmeldung

- [ ] **BrowoKoordinator-Equipment** (noch zu erstellen)
  - `EQUIPMENT_ASSIGNED` bei Zuweisung
  - `EQUIPMENT_RETURNED` bei Rückgabe

- [ ] **Zukünftige Functions**
  - Benefits, Tasks, Training, etc.

---

## 💡 Beispiel: Vollständiger Onboarding-Flow

**Szenario:** Neuer Mitarbeiter wird angelegt

### **1. Admin legt Mitarbeiter an**
```typescript
POST /BrowoKoordinator-Personalakte/employees
{
  "full_name": "Max Mustermann",
  "email": "max@firma.de",
  "department": "Engineering"
}
```

### **2. Personalakte triggert Workflows**
```typescript
await triggerWorkflows('EMPLOYEE_CREATED', {
  userId: 'abc123',
  employeeName: 'Max Mustermann',
  employeeEmail: 'max@firma.de',
  department: 'Engineering',
});
```

### **3. Workflows werden ausgeführt**
```
Workflow: "Onboarding Engineering"
├── 📧 Welcome Email an max@firma.de
├── 📄 Arbeitsvertrag zuweisen
├── 💻 IT-Equipment-Request erstellen
├── 🎁 Engineering Benefits zuweisen
└── 🪙 100 Welcome Coins verteilen
```

### **4. Execution Log wird gespeichert**
```json
{
  "id": "exec_onboarding-eng_1732449234",
  "status": "COMPLETED",
  "logs": [
    "🚀 Starting Workflow Execution",
    "🟢 Trigger fired: Employee Created",
    "✅ Action executed: Send Welcome Email",
    "✅ Action executed: Assign Contract",
    "🏁 Workflow Execution Completed"
  ]
}
```

---

**Happy Automating! 🚀**
