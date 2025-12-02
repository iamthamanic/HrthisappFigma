# 🚀 Dynamischer Trigger-Generator - Konzept

**Version:** 1.0.0  
**Status:** Konzept (noch nicht implementiert)  
**Abhängigkeit:** Erfordert fertige Standard-Trigger (Option A)

---

## 🎯 Ziel

Ein Self-Service System, mit dem Admins **eigene Custom Triggers** anlegen können, ohne Code schreiben zu müssen. Der Generator analysiert das bestehende System und erstellt automatisch:
- Type-Definitionen
- UI-Komponenten für die Trigger-Konfiguration
- Backend-Integration
- Webhook-Endpoints (optional)

---

## 📐 Architektur

### **3-Schicht-Architektur**

```
┌─────────────────────────────────────────────┐
│         ADMIN UI (Trigger Builder)          │
│  - Trigger Name definieren                  │
│  - Config-Felder hinzufügen                 │
│  - Event-Source auswählen                   │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│      CODE GENERATOR (Server-Side)           │
│  - TypeScript Types generieren              │
│  - React UI-Komponente generieren           │
│  - Backend Hook registrieren                │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│       RUNTIME TRIGGER SYSTEM                │
│  - Custom Triggers in KV Store speichern    │
│  - Trigger-Events zur Laufzeit prüfen       │
│  - Workflows dynamisch auslösen             │
└─────────────────────────────────────────────┘
```

---

## 🧩 Komponenten

### **1. Trigger Builder UI**
**Datei:** `/components/admin/BrowoKo_CustomTriggerBuilder.tsx`

```typescript
interface CustomTriggerDefinition {
  id: string;                    // z.B. "CUSTOM_DOCUMENT_UPLOADED"
  name: string;                  // z.B. "Dokument hochgeladen"
  category: TriggerCategory;     // "EMPLOYEE" | "LEARNING" | "SHOP" | "TIME" | "CUSTOM"
  description: string;
  
  // Event Source (woher kommt das Event?)
  event_source: {
    type: 'SUPABASE_TABLE' | 'API_WEBHOOK' | 'MANUAL' | 'SCHEDULED';
    config: {
      table_name?: string;       // z.B. "documents"
      operation?: 'INSERT' | 'UPDATE' | 'DELETE';
      webhook_url?: string;
      schedule?: string;         // Cron expression
    };
  };
  
  // Konfigurationsfelder für Workflows
  config_fields: TriggerConfigField[];
  
  // Context-Daten (welche Daten werden mitgeliefert?)
  context_schema: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'date' | 'object';
      required: boolean;
      description: string;
    };
  };
  
  created_at: string;
  created_by: string;
}

interface TriggerConfigField {
  name: string;                  // z.B. "document_type"
  label: string;                 // z.B. "Dokumenttyp"
  type: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'boolean';
  required: boolean;
  options?: { value: string; label: string }[];  // Für Select-Felder
  default_value?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}
```

**UI-Features:**
- ✅ Trigger-Name eingeben (Auto-Präfix mit `CUSTOM_`)
- ✅ Kategorie auswählen
- ✅ Event-Source definieren (Tabelle, Webhook, Manual, Scheduled)
- ✅ Config-Felder per Drag & Drop hinzufügen
- ✅ Context-Schema definieren (welche Daten bekommt der Workflow?)
- ✅ Live-Vorschau der generierten Konfiguration

---

### **2. Code Generator (Server-Side)**
**Datei:** `/supabase/functions/BrowoKoordinator-Workflows/customTriggerGenerator.ts`

**Funktionen:**

#### **2.1 Type-Generierung**
```typescript
async function generateTriggerTypes(definition: CustomTriggerDefinition): Promise<string> {
  // Generiert TypeScript Type für das neue Trigger
  return `
export type ${definition.id} = {
  trigger_type: '${definition.id}';
  config: {
    ${definition.config_fields.map(f => `${f.name}${f.required ? '' : '?'}: ${f.type};`).join('\n    ')}
  };
};
  `;
}
```

#### **2.2 UI-Komponenten-Generierung**
```typescript
async function generateTriggerConfigUI(definition: CustomTriggerDefinition): Promise<string> {
  // Generiert React-Komponente für die Trigger-Konfiguration
  return `
export function ${definition.id}_Config({ config, onChange }: TriggerConfigProps) {
  return (
    <div className="space-y-4">
      <h3>{definition.name}</h3>
      <p className="text-sm text-gray-500">{definition.description}</p>
      
      ${definition.config_fields.map(field => generateFieldComponent(field)).join('\n      ')}
    </div>
  );
}
  `;
}

function generateFieldComponent(field: TriggerConfigField): string {
  switch(field.type) {
    case 'text':
      return `
      <div>
        <Label>${field.label}</Label>
        <Input
          value={config.${field.name} || ''}
          onChange={(e) => onChange({ ...config, ${field.name}: e.target.value })}
          ${field.required ? 'required' : ''}
        />
      </div>`;
    case 'select':
      return `
      <div>
        <Label>${field.label}</Label>
        <Select value={config.${field.name}} onValueChange={(v) => onChange({ ...config, ${field.name}: v })}>
          ${field.options?.map(opt => `<SelectItem value="${opt.value}">${opt.label}</SelectItem>`).join('\n          ')}
        </Select>
      </div>`;
    // ... weitere Feld-Typen
  }
}
```

#### **2.3 Backend Hook-Registrierung**
```typescript
async function registerTriggerHook(definition: CustomTriggerDefinition) {
  if (definition.event_source.type === 'SUPABASE_TABLE') {
    // Erstelle Supabase Trigger/Webhook
    const tableName = definition.event_source.config.table_name;
    const operation = definition.event_source.config.operation;
    
    // SQL für Database Trigger
    const triggerSQL = `
      CREATE OR REPLACE FUNCTION trigger_workflow_${definition.id.toLowerCase()}()
      RETURNS TRIGGER AS $$
      BEGIN
        PERFORM net.http_post(
          url := 'https://[PROJECT_ID].supabase.co/functions/v1/BrowoKoordinator-Workflows/trigger',
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer [ANON_KEY]"}'::jsonb,
          body := json_build_object(
            'trigger_type', '${definition.id}',
            'context', row_to_json(NEW)
          )::jsonb
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER ${definition.id.toLowerCase()}_trigger
      AFTER ${operation} ON ${tableName}
      FOR EACH ROW
      EXECUTE FUNCTION trigger_workflow_${definition.id.toLowerCase()}();
    `;
    
    // Führe SQL aus (über Supabase Admin API)
    await executeSQLViaSuperbase(triggerSQL);
  }
  
  if (definition.event_source.type === 'API_WEBHOOK') {
    // Registriere Webhook-Endpoint
    // GET /BrowoKoordinator-Workflows/webhooks/{definition.id}
    // → Triggert Workflows mit diesem Trigger-Typ
  }
  
  if (definition.event_source.type === 'SCHEDULED') {
    // Registriere Cron-Job im KV Store
    await kv.set(`cron_trigger:${definition.id}`, {
      schedule: definition.event_source.config.schedule,
      trigger_type: definition.id,
      is_active: true
    });
  }
}
```

---

### **3. Runtime Trigger System**

**Storage:**
Custom Triggers werden im KV Store gespeichert:
```typescript
// Key: custom_trigger:{trigger_id}
// Value: CustomTriggerDefinition

await kv.set('custom_trigger:CUSTOM_DOCUMENT_UPLOADED', {
  id: 'CUSTOM_DOCUMENT_UPLOADED',
  name: 'Dokument hochgeladen',
  category: 'CUSTOM',
  event_source: { ... },
  config_fields: [ ... ],
  context_schema: { ... }
});
```

**Trigger Execution:**
```typescript
async function executeCustomTrigger(
  trigger_type: string,
  context: Record<string, any>,
  config: Record<string, any>
) {
  // 1. Lade Custom Trigger Definition
  const definition = await kv.get(`custom_trigger:${trigger_type}`);
  if (!definition) {
    throw new Error(`Unknown custom trigger: ${trigger_type}`);
  }
  
  // 2. Validiere Context gegen Schema
  validateContextAgainstSchema(context, definition.context_schema);
  
  // 3. Validiere Config gegen Config Fields
  validateConfigAgainstFields(config, definition.config_fields);
  
  // 4. Finde passende Workflows
  const workflows = await findWorkflowsByTrigger(trigger_type, config);
  
  // 5. Führe Workflows aus
  for (const workflow of workflows) {
    await executeWorkflow(workflow, context);
  }
}
```

---

## 🔄 Workflow (User Journey)

### **Schritt 1: Trigger erstellen**
```
Admin öffnet Workflows → "Custom Trigger erstellen"
  ↓
Gibt ein:
  - Name: "Großes Dokument hochgeladen"
  - Event Source: Supabase Table "documents" (INSERT)
  - Config-Feld 1: "min_size_mb" (Number, min: 10)
  - Config-Feld 2: "document_types" (Multiselect: PDF, DOCX, XLSX)
  - Context-Schema: { document_id, file_name, file_size, uploader_id }
  ↓
Klickt "Generieren & Speichern"
```

### **Schritt 2: Code-Generierung**
```
Server generiert:
  ✅ Type: CUSTOM_DOCUMENT_UPLOADED
  ✅ UI-Komponente: CUSTOM_DOCUMENT_UPLOADED_Config.tsx
  ✅ Database Trigger: trigger_workflow_custom_document_uploaded()
  ✅ Speichert Definition im KV Store
  ↓
Response: "Trigger erfolgreich erstellt!"
```

### **Schritt 3: Trigger in Workflow nutzen**
```
Admin erstellt neuen Workflow:
  - Trigger auswählen → "Großes Dokument hochgeladen" (Custom)
  - Konfiguriert:
    • min_size_mb: 50
    • document_types: [PDF, DOCX]
  ↓
Workflow wird aktiviert
```

### **Schritt 4: Runtime Execution**
```
User lädt 60 MB PDF hoch
  ↓
Database Trigger feuert
  ↓
POST /BrowoKoordinator-Workflows/trigger
  Body: {
    trigger_type: "CUSTOM_DOCUMENT_UPLOADED",
    context: {
      document_id: "doc_123",
      file_name: "proposal.pdf",
      file_size: 62914560,
      uploader_id: "user_456"
    }
  }
  ↓
System findet passende Workflows (min_size >= 50 MB, type = PDF)
  ↓
Workflow wird ausgeführt (z.B. Email an Manager senden)
```

---

## 🛡️ Sicherheit & Validierung

### **1. Input Validation**
```typescript
// Verhindere SQL Injection in Trigger-Namen
function sanitizeTriggerName(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '_')
    .replace(/^CUSTOM_/, '') // Remove if already prefixed
    .substring(0, 50); // Max length
}

// Prefix automatisch hinzufügen
const safeName = 'CUSTOM_' + sanitizeTriggerName(userInput);
```

### **2. Permissions**
```typescript
// Nur Admins dürfen Custom Triggers erstellen
async function canCreateCustomTrigger(userId: string): Promise<boolean> {
  const profile = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  
  return profile.data?.role === 'admin';
}
```

### **3. Rate Limiting**
```typescript
// Max 10 Custom Triggers pro Organisation
const existingTriggers = await kv.getByPrefix('custom_trigger:');
if (existingTriggers.length >= 10) {
  throw new Error('Maximum custom triggers reached (10)');
}
```

---

## 📊 UI-Design (Wireframe)

```
┌────────────────────────────────────────────────────────────┐
│  Custom Trigger Builder                              [X]   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Trigger-Name *                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Großes Dokument hochgeladen                          │ │
│  └──────────────────────────────────────────────────────┘ │
│  ID: CUSTOM_GROSSES_DOKUMENT_HOCHGELADEN                   │
│                                                            │
│  Kategorie                                                 │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ [CUSTOM ▼]                                           │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Event Source                                              │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ ○ Supabase Table  ● API Webhook  ○ Manual  ○ Cron   │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Webhook URL                                               │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ https://api.example.com/webhook/document-upload      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Config-Felder                           [+ Feld hinzufügen] │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 1. min_size_mb (Number) - Required                   │ │
│  │    Min: 1, Max: 1000                          [Edit] │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ 2. document_types (Multiselect)                      │ │
│  │    Options: PDF, DOCX, XLSX                   [Edit] │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Context-Schema (Welche Daten werden mitgeliefert?)        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ {                                                    │ │
│  │   "document_id": "string" (required),                │ │
│  │   "file_name": "string" (required),                  │ │
│  │   "file_size": "number" (required),                  │ │
│  │   "uploader_id": "string" (required)                 │ │
│  │ }                                              [Edit] │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌────────────────────┐  ┌────────────────────┐           │
│  │  Abbrechen         │  │  Erstellen         │           │
│  └────────────────────┘  └────────────────────┘           │
└────────────────────────────────────────────────────────────┘
```

---

## 🚀 API-Endpoints

### **1. Custom Trigger erstellen**
```typescript
POST /BrowoKoordinator-Workflows/custom-triggers

Body: {
  name: "Großes Dokument hochgeladen",
  category: "CUSTOM",
  event_source: {
    type: "API_WEBHOOK",
    config: {
      webhook_url: "https://..."
    }
  },
  config_fields: [...],
  context_schema: {...}
}

Response: {
  success: true,
  trigger: {
    id: "CUSTOM_GROSSES_DOKUMENT_HOCHGELADEN",
    ...
  }
}
```

### **2. Custom Triggers auflisten**
```typescript
GET /BrowoKoordinator-Workflows/custom-triggers

Response: {
  triggers: [
    { id: "CUSTOM_DOCUMENT_UPLOADED", ... },
    { id: "CUSTOM_USER_MILESTONE", ... }
  ]
}
```

### **3. Custom Trigger löschen**
```typescript
DELETE /BrowoKoordinator-Workflows/custom-triggers/{trigger_id}

Response: {
  success: true
}
```

### **4. Custom Trigger ausführen (Webhook)**
```typescript
POST /BrowoKoordinator-Workflows/webhooks/{trigger_id}

Body: {
  // Context-Daten
  document_id: "doc_123",
  file_name: "proposal.pdf",
  file_size: 62914560,
  uploader_id: "user_456"
}

Response: {
  success: true,
  workflows_triggered: 2
}
```

---

## 📝 Beispiel-Use-Cases

### **Use-Case 1: Dokument-Upload Trigger**
```
Name: "Vertrag hochgeladen"
Event Source: Supabase Table "documents" (INSERT)
Config Fields:
  - document_type: Select (Arbeitsvertrag, NDA, Vollmacht)
  - auto_assign_to_hr: Boolean
Context:
  { document_id, file_name, uploader_id, upload_date }
  
Workflow:
  → Send Email to HR Manager
  → Create Task "Vertrag prüfen"
  → Add to Employee File
```

### **Use-Case 2: User Milestone Trigger**
```
Name: "500 Coins erreicht"
Event Source: API Webhook
Config Fields:
  - coin_threshold: Number (100, 250, 500, 1000)
  - send_notification: Boolean
Context:
  { user_id, current_coins, previous_coins }
  
Workflow:
  → Send Congratulations Email
  → Unlock Special Badge
  → Notify Team Channel
```

### **Use-Case 3: Scheduled Report Trigger**
```
Name: "Wöchentlicher Learning-Report"
Event Source: Cron (0 9 * * 1) // Montags 9 Uhr
Config Fields:
  - department_ids: Multiselect
  - include_inactive_users: Boolean
Context:
  { report_date, week_number }
  
Workflow:
  → Generate Report (HTTP Request)
  → Send via Email
  → Store in Documents
```

---

## ✅ Vorteile

1. **Kein Code nötig** - Admins können selbst Trigger erstellen
2. **Type-Safe** - Generierte Types sind korrekt typisiert
3. **Wiederverwendbar** - Custom Triggers können in mehreren Workflows genutzt werden
4. **Skalierbar** - Unbegrenzt viele Custom Triggers möglich
5. **Flexibel** - Unterstützt verschiedene Event-Sources (DB, Webhooks, Cron)
6. **Self-Service** - Keine Developer-Abhängigkeit

---

## ⚠️ Einschränkungen

1. **Performance** - Zu viele Custom Triggers können System verlangsamen
2. **Komplexität** - UI muss sehr intuitiv sein
3. **Debugging** - Generierter Code ist schwerer zu debuggen
4. **Validierung** - Context-Schema muss zur Laufzeit validiert werden
5. **Breaking Changes** - Änderungen an Custom Triggers können Workflows brechen

---

## 🗺️ Implementierungs-Roadmap

### **Phase 1: Core System** (2-3 Tage)
- [ ] CustomTriggerDefinition Types
- [ ] KV Store Schema
- [ ] Backend API (CRUD für Custom Triggers)
- [ ] Basis-Validierung

### **Phase 2: Code-Generator** (3-4 Tage)
- [ ] Type-Generierung
- [ ] UI-Komponenten-Generierung
- [ ] Hook-Registrierung (Supabase Triggers)
- [ ] Webhook-System

### **Phase 3: Admin UI** (2-3 Tage)
- [ ] Custom Trigger Builder Komponente
- [ ] Config-Field Editor
- [ ] Context-Schema Editor
- [ ] Live-Vorschau

### **Phase 4: Runtime Integration** (1-2 Tage)
- [ ] Custom Trigger Loader
- [ ] Dynamic Trigger Execution
- [ ] Workflow-Trigger Matching
- [ ] Error Handling

### **Phase 5: Testing & Polish** (1-2 Tage)
- [ ] E2E Tests
- [ ] Permissions & Security
- [ ] Performance-Optimierung
- [ ] Dokumentation

**Gesamt:** 9-14 Tage

---

## 🎓 Technologie-Stack

- **Frontend:** React + TypeScript + Tailwind
- **Backend:** Supabase Edge Functions (Deno)
- **Storage:** KV Store (für Custom Trigger Definitions)
- **Database:** PostgreSQL (für generated Triggers/Webhooks)
- **Code-Gen:** Template Strings + AST-Manipulation (optional)
- **Validation:** Zod (für Runtime Schema Validation)

---

**Ende des Konzepts - Ready für Implementierung nach Option A** ✅
