# Workflow User Selector Component - Dokumentation

## 📋 Übersicht

Diese Dokumentation beschreibt die **React-Komponente für die Mitarbeiter-/Assignee-Auswahl** im Workflow-Builder von Browo Koordinator.

**Hauptkomponente:** `/components/workflows/NodeConfigPanel.tsx`  
**Funktion:** Konfigurations-Panel für Workflow-Nodes mit Mitarbeiter-Auswahl  
**Framework:** React mit TypeScript  
**UI-Library:** Shadcn/UI Components

---

## 🎯 Komponenten-Hierarchie

```
WorkflowDetailScreen
└── NodeConfigPanel (Main Component)
    ├── SendEmailConfig
    ├── AssignBenefitsConfig
    ├── CreateTaskConfig
    ├── AssignDocumentConfig
    ├── DistributeCoinsConfig
    ├── AssignEquipmentConfig
    ├── AssignTrainingConfig
    ├── CreateNotificationConfig
    ├── AddToTeamConfig
    └── ... weitere Config-Komponenten

Jede dieser Sub-Komponenten nutzt die gleiche
Mitarbeiter-Auswahl-Logik mit dem employees[] Array
```

---

## 📦 Vollständiger Code - NodeConfigPanel (Hauptkomponente)

**Datei:** `/components/workflows/NodeConfigPanel.tsx`

### Interfaces & Types

```typescript
interface NodeConfigPanelProps {
  node: Node | null;
  onClose: () => void;
  onUpdateNode: (nodeId: string, config: any) => void;
}

interface Employee {
  id: string;
  email: string;
  full_name: string;
  position?: string;
}

interface Benefit {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

interface Document {
  id: string;
  name: string;
  category?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string;
  category: string;
}
```

---

### Main Component - NodeConfigPanel

```typescript
export default function NodeConfigPanel({ node, onClose, onUpdateNode }: NodeConfigPanelProps) {
  const [config, setConfig] = useState<any>(node?.data?.config || {});
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load data when node changes
  useEffect(() => {
    if (!node) return;
    
    setConfig(node.data?.config || {});
    setHasChanges(false);
    
    // Load data based on node type
    const actionType = node.data?.actionType || node.data?.type;
    
    // Load employees for relevant action types
    if (['SEND_EMAIL', 'CREATE_TASK', 'ASSIGN_BENEFITS', 'ASSIGN_DOCUMENT', 
         'DISTRIBUTE_COINS', 'ASSIGN_EQUIPMENT', 'ASSIGN_TRAINING', 
         'CREATE_NOTIFICATION', 'ADD_TO_TEAM'].includes(actionType)) {
      loadEmployees();
    }
    
    if (actionType === 'ASSIGN_BENEFITS') {
      loadBenefits();
    }
    
    if (actionType === 'ASSIGN_DOCUMENT') {
      loadDocuments();
    }
    
    if (actionType === 'SEND_EMAIL') {
      loadEmailTemplates();
    }
  }, [node?.id]);

  // ... (Rest der Komponente siehe unten)
}
```

---

## 🔄 Daten-Fetch: loadEmployees()

**Dies ist die zentrale Funktion für das Laden der Mitarbeiter-Liste!**

```typescript
const loadEmployees = async () => {
  setLoading(true);
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/BrowoKoordinator-Personalakte/employees`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        }
      }
    );
    
    if (response.ok) {
      const { employees: data } = await response.json();
      setEmployees(data || []);
    }
  } catch (error) {
    console.error('Failed to load employees:', error);
  } finally {
    setLoading(false);
  }
};
```

### API-Details

| Parameter | Wert |
|-----------|------|
| **Endpoint** | `https://${projectId}.supabase.co/functions/v1/BrowoKoordinator-Personalakte/employees` |
| **Method** | `GET` |
| **Auth** | Bearer Token (publicAnonKey) |
| **Response Format** | `{ employees: Employee[] }` |

### Response Struktur

```json
{
  "employees": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "max.mustermann@firma.de",
      "full_name": "Max Mustermann",
      "position": "Software Engineer"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "email": "anna.schmidt@firma.de",
      "full_name": "Anna Schmidt",
      "position": "HR Manager"
    }
  ]
}
```

---

## 🎨 UI-Komponenten für Mitarbeiter-Auswahl

### Beispiel 1: SendEmailConfig - Empfänger-Auswahl

```typescript
function SendEmailConfig({ config, updateConfig, employees, loading, emailTemplates }: any) {
  const [useTemplate, setUseTemplate] = useState(config.useTemplate !== false);
  
  return (
    <div className="space-y-4">
      {/* SCHRITT 1: Empfänger-Typ auswählen */}
      <div>
        <Label htmlFor="recipient">Empfänger *</Label>
        <Select 
          value={config.recipientType || 'triggered_employee'} 
          onValueChange={(v) => updateConfig('recipientType', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Wähle Empfänger..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="triggered_employee">Getriggerter Mitarbeiter</SelectItem>
            <SelectItem value="specific_user">Spezifischer Benutzer</SelectItem>
            <SelectItem value="all_employees">Alle Mitarbeiter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* SCHRITT 2: Wenn "Spezifischer Benutzer" → Dropdown mit Mitarbeitern */}
      {config.recipientType === 'specific_user' && (
        <div>
          <Label htmlFor="userId">Benutzer *</Label>
          <Select 
            value={config.userId || ''} 
            onValueChange={(v) => updateConfig('userId', v)} 
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wähle Benutzer..." />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp: Employee) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ... Weitere Felder (Subject, Body, etc.) */}
    </div>
  );
}
```

---

### Beispiel 2: CreateTaskConfig - Assignee-Auswahl

```typescript
function CreateTaskConfig({ config, updateConfig, employees, loading }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Aufgaben-Titel *</Label>
        <Input 
          id="title"
          value={config.title || ''} 
          onChange={(e) => updateConfig('title', e.target.value)}
          placeholder="z.B. Laptop für {{ employeeName }} vorbereiten"
        />
      </div>

      {/* SCHRITT 1: Assignee-Typ auswählen */}
      <div>
        <Label htmlFor="assigneeType">Zuweisen zu *</Label>
        <Select 
          value={config.assigneeType || 'triggered_employee'} 
          onValueChange={(v) => updateConfig('assigneeType', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Wem zuweisen..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="triggered_employee">Getriggerter Mitarbeiter</SelectItem>
            <SelectItem value="specific_user">Spezifischer Benutzer</SelectItem>
            <SelectItem value="hr_admin">HR/Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* SCHRITT 2: Wenn "Spezifischer Benutzer" → Dropdown mit Mitarbeitern */}
      {config.assigneeType === 'specific_user' && (
        <div>
          <Label htmlFor="assigneeId">Benutzer *</Label>
          <Select 
            value={config.assigneeId || ''} 
            onValueChange={(v) => updateConfig('assigneeId', v)} 
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wähle Benutzer..." />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp: Employee) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.position || 'Kein Titel'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ... Weitere Felder (Priority, Due Date, etc.) */}
    </div>
  );
}
```

---

### Beispiel 3: AssignBenefitsConfig - Mitarbeiter-Auswahl

```typescript
function AssignBenefitsConfig({ config, updateConfig, benefits, employees, loading }: any) {
  return (
    <div className="space-y-4">
      {/* Benefit auswählen */}
      <div>
        <Label htmlFor="benefitId">Benefit *</Label>
        <Select 
          value={config.benefitId || ''} 
          onValueChange={(v) => {
            const benefit = benefits.find((b: Benefit) => b.id === v);
            updateConfig('benefitId', v);
            updateConfig('benefitName', benefit?.name || '');
          }} 
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Wähle Benefit..." />
          </SelectTrigger>
          <SelectContent>
            {benefits.map((benefit: Benefit) => (
              <SelectItem key={benefit.id} value={benefit.id}>
                {benefit.name}
                {benefit.category && <Badge className="ml-2 text-xs">{benefit.category}</Badge>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* SCHRITT 1: Assignee-Typ auswählen */}
      <div>
        <Label htmlFor="assignTo">Zuweisen zu *</Label>
        <Select 
          value={config.assignTo || 'triggered_employee'} 
          onValueChange={(v) => updateConfig('assignTo', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Wem zuweisen..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="triggered_employee">Getriggerter Mitarbeiter</SelectItem>
            <SelectItem value="specific_user">Spezifischer Benutzer</SelectItem>
            <SelectItem value="all_employees">Alle Mitarbeiter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* SCHRITT 2: Wenn "Spezifischer Benutzer" → Dropdown mit Mitarbeitern */}
      {config.assignTo === 'specific_user' && (
        <div>
          <Label htmlFor="userId">Benutzer *</Label>
          <Select 
            value={config.userId || ''} 
            onValueChange={(v) => updateConfig('userId', v)} 
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wähle Benutzer..." />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp: Employee) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.position || 'Kein Titel'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
```

---

## 🔍 Filterlogik & Conditional Rendering

### Pattern: Zwei-Stufen-Auswahl

**Alle Mitarbeiter-Auswahlkomponenten folgen diesem Pattern:**

```typescript
// STUFE 1: Typ auswählen (Dropdown 1)
<Select value={config.assignTo} onValueChange={(v) => updateConfig('assignTo', v)}>
  <SelectContent>
    <SelectItem value="triggered_employee">Getriggerter Mitarbeiter</SelectItem>
    <SelectItem value="specific_user">Spezifischer Benutzer</SelectItem>
    <SelectItem value="all_employees">Alle Mitarbeiter</SelectItem>
  </SelectContent>
</Select>

// STUFE 2: Conditional Rendering - Nur anzeigen wenn "specific_user"
{config.assignTo === 'specific_user' && (
  <Select value={config.userId} onValueChange={(v) => updateConfig('userId', v)}>
    <SelectContent>
      {employees.map((emp) => (
        <SelectItem key={emp.id} value={emp.id}>
          {emp.full_name} ({emp.email})
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)}
```

---

## 🎯 Verwendete Varianten-Namen

**Verschiedene Config-Komponenten nutzen unterschiedliche Feld-Namen:**

| Config-Komponente | Typ-Feld | User-ID-Feld | Werte |
|-------------------|----------|--------------|-------|
| **SendEmailConfig** | `recipientType` | `userId` | `triggered_employee`, `specific_user`, `all_employees` |
| **CreateTaskConfig** | `assigneeType` | `assigneeId` | `triggered_employee`, `specific_user`, `hr_admin` |
| **AssignBenefitsConfig** | `assignTo` | `userId` | `triggered_employee`, `specific_user`, `all_employees` |
| **AssignDocumentConfig** | `assignTo` | `userId` | `triggered_employee`, `specific_user` |
| **DistributeCoinsConfig** | `recipientType` | `userId` | `triggered_employee`, `specific_user`, `all_employees` |

**Wichtig:** Die Logik ist identisch, nur die Feld-Namen variieren!

---

## 🔧 Utility-Funktionen

### updateConfig() - Config-State aktualisieren

```typescript
const updateConfig = (key: string, value: any) => {
  setConfig((prev: any) => ({ ...prev, [key]: value }));
  setHasChanges(true);
};

// Usage in Config-Komponenten:
updateConfig('userId', 'abc-123-def');
updateConfig('assigneeType', 'specific_user');
```

---

### handleSave() - Änderungen speichern

```typescript
const handleSave = () => {
  if (!node) return;
  onUpdateNode(node.id, config);
  setHasChanges(false);
};
```

---

## 📊 State-Management

### Local State im NodeConfigPanel

```typescript
const [config, setConfig] = useState<any>(node?.data?.config || {});
const [employees, setEmployees] = useState<Employee[]>([]);
const [benefits, setBenefits] = useState<Benefit[]>([]);
const [documents, setDocuments] = useState<Document[]>([]);
const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
const [loading, setLoading] = useState(false);
const [hasChanges, setHasChanges] = useState(false);
```

### Data Flow

```
1. User klickt auf Node im Workflow-Builder
   ↓
2. WorkflowDetailScreen zeigt NodeConfigPanel
   ↓
3. NodeConfigPanel lädt Daten via loadEmployees()
   ↓
4. employees[] State wird befüllt
   ↓
5. Config-Komponenten rendern Dropdowns mit employees[]
   ↓
6. User wählt Mitarbeiter aus
   ↓
7. updateConfig() aktualisiert config State
   ↓
8. User klickt "Speichern"
   ↓
9. handleSave() ruft onUpdateNode() auf
   ↓
10. WorkflowDetailScreen aktualisiert Node-Daten
```

---

## 🎨 UI-Components (Shadcn/UI)

### Verwendete Shadcn-Komponenten

```typescript
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
```

---

### Select-Component Struktur

```typescript
<Select 
  value={config.userId || ''} 
  onValueChange={(v) => updateConfig('userId', v)} 
  disabled={loading}
>
  <SelectTrigger>
    <SelectValue placeholder="Wähle Benutzer..." />
  </SelectTrigger>
  <SelectContent>
    {employees.map((emp: Employee) => (
      <SelectItem key={emp.id} value={emp.id}>
        {emp.full_name} ({emp.email})
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Props:**
- `value`: Aktuell ausgewählter Wert
- `onValueChange`: Callback wenn Wert sich ändert
- `disabled`: Boolean für Loading-State

---

## 🔄 Lifecycle & Side Effects

### useEffect für Daten-Laden

```typescript
useEffect(() => {
  if (!node) return;
  
  setConfig(node.data?.config || {});
  setHasChanges(false);
  
  // Load data based on node type
  const actionType = node.data?.actionType || node.data?.type;
  
  if (['SEND_EMAIL', 'CREATE_TASK', ...].includes(actionType)) {
    loadEmployees();
  }
}, [node?.id]);
```

**Trigger:** Wenn `node.id` sich ändert (neuer Node ausgewählt)

**Actions:**
1. Reset config State
2. Reset hasChanges Flag
3. Bedingtes Laden von Daten basierend auf actionType

---

## 📝 Code-Beispiel: Komplette Integration

### Minimal-Beispiel für neue Config-Komponente

```typescript
function MyNewActionConfig({ config, updateConfig, employees, loading }: any) {
  return (
    <div className="space-y-4">
      {/* 1. Titel-Feld */}
      <div>
        <Label htmlFor="title">Titel *</Label>
        <Input 
          id="title"
          value={config.title || ''} 
          onChange={(e) => updateConfig('title', e.target.value)}
          placeholder="Titel eingeben..."
        />
      </div>

      {/* 2. Assignee-Typ Dropdown */}
      <div>
        <Label htmlFor="assignTo">Zuweisen zu *</Label>
        <Select 
          value={config.assignTo || 'triggered_employee'} 
          onValueChange={(v) => updateConfig('assignTo', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Wem zuweisen..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="triggered_employee">Getriggerter Mitarbeiter</SelectItem>
            <SelectItem value="specific_user">Spezifischer Benutzer</SelectItem>
            <SelectItem value="all_employees">Alle Mitarbeiter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 3. Mitarbeiter-Auswahl (conditional) */}
      {config.assignTo === 'specific_user' && (
        <div>
          <Label htmlFor="userId">Mitarbeiter *</Label>
          <Select 
            value={config.userId || ''} 
            onValueChange={(v) => updateConfig('userId', v)} 
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wähle Mitarbeiter..." />
            </SelectTrigger>
            <SelectContent>
              {employees.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  Keine Mitarbeiter gefunden
                </div>
              ) : (
                employees.map((emp: Employee) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.email})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
```

---

## 🐛 Error Handling & Edge Cases

### 1. Leere Mitarbeiter-Liste

```typescript
{employees.length === 0 ? (
  <div className="px-3 py-2 text-sm text-gray-500">
    Keine Mitarbeiter gefunden
  </div>
) : (
  employees.map((emp) => (
    <SelectItem key={emp.id} value={emp.id}>
      {emp.full_name}
    </SelectItem>
  ))
)}
```

---

### 2. Loading State

```typescript
<Select 
  value={config.userId || ''} 
  onValueChange={(v) => updateConfig('userId', v)} 
  disabled={loading}  // ← Dropdown disabled während Laden
>
  {/* ... */}
</Select>
```

---

### 3. API Fehler-Handling

```typescript
const loadEmployees = async () => {
  setLoading(true);
  try {
    const response = await fetch(/* ... */);
    
    if (response.ok) {
      const { employees: data } = await response.json();
      setEmployees(data || []);  // ← Fallback zu leerem Array
    } else {
      console.error('Failed to fetch employees:', response.statusText);
      setEmployees([]);  // ← Set empty array on error
    }
  } catch (error) {
    console.error('Failed to load employees:', error);
    setEmployees([]);  // ← Set empty array on exception
  } finally {
    setLoading(false);
  }
};
```

---

### 4. Fehlende Position

```typescript
<SelectItem key={emp.id} value={emp.id}>
  {emp.full_name} ({emp.position || 'Kein Titel'})
  {/* ↑ Fallback wenn position undefined */}
</SelectItem>
```

---

## 📦 Alle Config-Komponenten mit Mitarbeiter-Auswahl

**Hier sind ALLE Komponenten, die die `employees[]` Liste nutzen:**

1. ✉️ **SendEmailConfig** - `recipientType`, `userId`
2. 🎁 **AssignBenefitsConfig** - `assignTo`, `userId`
3. ✅ **CreateTaskConfig** - `assigneeType`, `assigneeId`
4. 📄 **AssignDocumentConfig** - `assignTo`, `userId`
5. 🪙 **DistributeCoinsConfig** - `recipientType`, `userId`
6. 🚗 **AssignEquipmentConfig** - `assignTo`, `userId`
7. 🎓 **AssignTrainingConfig** - `assignTo`, `userId`
8. 🔔 **CreateNotificationConfig** - `recipientType`, `userId`
9. 👥 **AddToTeamConfig** - `userId`
10. 📝 **AssignTestConfig** - `assignTo`, `userId`
11. 🎬 **AssignVideoConfig** - `assignTo`, `userId`

**Alle nutzen die gleiche Logik und das gleiche `employees[]` Array!**

---

## 🎯 Zusammenfassung

### Zentrale Komponente
- **Datei:** `/components/workflows/NodeConfigPanel.tsx`
- **Funktion:** n8n-style Konfigurations-Panel für Workflow-Nodes

### Daten-Fetch
- **API:** `BrowoKoordinator-Personalakte/employees`
- **Methode:** `loadEmployees()` async Funktion
- **State:** `employees[]` Array vom Typ `Employee[]`

### UI-Pattern
- **Zwei-Stufen-Auswahl:**
  1. Typ auswählen (`triggered_employee`, `specific_user`, `all_employees`)
  2. Bei `specific_user` → Mitarbeiter-Dropdown anzeigen

### Filterlogik
- **Conditional Rendering:** `{config.assignTo === 'specific_user' && (...)}`
- **Keine echte Filterung**, nur conditional visibility

### Integration
- **Props:** `employees`, `loading`, `config`, `updateConfig`
- **Shadcn-Components:** `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`

---

## 📚 Verwandte Dateien

- `/components/workflows/NodeConfigPanel.tsx` - Hauptkomponente
- `/screens/admin/WorkflowDetailScreen.tsx` - Parent-Komponente
- `/components/workflows/TriggerConfigForm.tsx` - Trigger-Config
- `/components/ui/select.tsx` - Shadcn Select Component
- `/utils/supabase/info.tsx` - Supabase Config (projectId, publicAnonKey)

---

**🎉 Ende der Dokumentation**

Du hast jetzt den vollständigen Code inklusive Daten-Fetch und Filterlogik! 🚀
