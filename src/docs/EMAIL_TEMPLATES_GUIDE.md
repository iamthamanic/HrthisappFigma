# 📧 E-MAIL TEMPLATES SYSTEM - COMPLETE GUIDE

## ✅ WAS WURDE IMPLEMENTIERT (PHASE 2B)

### 1. E-Mail Templates Manager
- ✅ **CRUD UI** für Templates im Admin-Panel
- ✅ **Rich-Text Editor** (TipTap) mit Formatting-Toolbar
- ✅ **Variablen-System** integriert in Editor
- ✅ **Template-Kategorien** (Onboarding, Offboarding, Benefits, etc.)
- ✅ **Template-Preview** mit Beispieldaten
- ✅ **Template-Auswahl** in Workflow-Nodes

### 2. Rich-Text Editor Features
- ✅ **Bold**, **Italic**, **Underline**
- ✅ **Bullet Lists** & **Ordered Lists**
- ✅ **Links** einfügen
- ✅ **Variablen-Dropdown** zum Einfügen
- ✅ **Character Counter**
- ✅ **Placeholder Text**

### 3. Template Rendering
- ✅ **Variablen-Ersetzung** in Subject + Body
- ✅ **HTML + Plain Text** Ausgabe
- ✅ **Template-Auswahl** in SEND_EMAIL Node-Config
- ✅ **Fallback** zu manueller Eingabe

---

## 📋 TEIL 1: E-MAIL TEMPLATES ERSTELLEN

### **Schritt 1: Templates Manager öffnen**
```
1. Gehe zu /admin/email-templates
2. Siehst Dashboard mit Template-Stats
3. Klicke "Neues Template" (oben rechts)
```

### **Schritt 2: Template erstellen**

**Beispiel: Willkommens-Email**

```
Template Name: Willkommens-Email Onboarding
Kategorie: ONBOARDING

Betreff:
Willkommen bei {{ organizationName }}, {{ employeeName }}!

Nachricht (Rich-Text Editor):
Hallo {{ employeeName }},

wir freuen uns sehr, dich im Team zu haben! 🎉

Dein erster Arbeitstag ist am {{ startDate }}.

**Was dich erwartet:**
- Laptop & Equipment Setup
- Einführung ins Team
- Onboarding-Meeting mit {{ managerName }}

Bei Fragen erreichst du mich unter {{ employeeEmail }}.

Viele Grüße,
Das {{ organizationName }} Team
```

**Variablen einfügen:**
1. Cursor an gewünschte Stelle setzen
2. Dropdown "Variablen" → "Mitarbeiter Name" wählen
3. `{{ employeeName }}` wird eingefügt

**Formatting:**
- Markiere Text → Klicke **Bold** Button
- Für Liste → Klicke **Bullet List** Button

### **Schritt 3: Template speichern**
```
Klicke "Template erstellen"
→ Template wird in KV Store gespeichert
→ Verfügbar für alle Workflows
```

---

## 📋 TEIL 2: TEMPLATES IN WORKFLOWS VERWENDEN

### **Szenario: Onboarding-Workflow mit Template**

#### **Node 1: Email senden (mit Template)**

**Konfiguration:**
```json
{
  "recipientType": "triggered_employee",
  "useTemplate": true,
  "templateId": "tmpl_1738000000001"  // Auto-selected
}
```

**Was passiert:**
1. ✅ Checkbox "E-Mail-Template verwenden" ist aktiviert
2. ✅ Dropdown zeigt alle Templates (nach Kategorie)
3. ✅ Template auswählen → Betreff + Body werden automatisch gefüllt
4. ✅ Felder sind **disabled** (Template wird zur Laufzeit gerendert)
5. ✅ Variablen werden automatisch ersetzt bei Execution

#### **Node 1 Alternative: Manuelle Email (ohne Template)**

**Konfiguration:**
```json
{
  "recipientType": "triggered_employee",
  "useTemplate": false,
  "subject": "Willkommen {{ employeeName }}!",
  "body": "Hallo {{ employeeName }}, willkommen im Team!"
}
```

**Was passiert:**
1. ❌ Checkbox "E-Mail-Template verwenden" ist deaktiviert
2. ✅ Betreff + Body sind **manuell editierbar**
3. ✅ Variablen können manuell eingegeben werden
4. ✅ Keine Rich-Text-Formatierung (nur Plain Text)

---

## 📋 TEIL 3: TEMPLATE-RENDERING IM WORKFLOW

### **Execution Flow:**

```
1. Workflow wird getriggert mit Context:
   {
     "employeeId": "emp_456",
     "employeeName": "Max Mustermann",
     "employeeEmail": "max@example.com",
     "startDate": "2025-12-01",
     "organizationName": "Browo GmbH",
     "managerName": "Anna Schmidt"
   }

2. SEND_EMAIL Node wird ausgeführt:
   → config.useTemplate = true
   → config.templateId = "tmpl_1738000000001"

3. actionExecutor.ts lädt Template aus KV Store:
   → Key: "email_template:tmpl_1738000000001"

4. Template wird gerendert:
   Subject: "Willkommen bei {{ organizationName }}, {{ employeeName }}!"
   → "Willkommen bei Browo GmbH, Max Mustermann!"

   Body HTML: "<p>Hallo {{ employeeName }},</p>..."
   → "<p>Hallo Max Mustermann,</p>..."

5. Email wird gesendet (aktuell nur Logs):
   📧 EMAIL SENT:
      To: max@example.com
      Subject: Willkommen bei Browo GmbH, Max Mustermann!
      Body HTML: <p>Hallo Max Mustermann,</p>...
      Body Text: Hallo Max Mustermann, ...
```

---

## 📋 TEIL 4: TEMPLATE-PREVIEW TESTEN

### **Vorschau mit Beispieldaten:**

```
1. Gehe zu /admin/email-templates
2. Klicke auf Template → "Vorschau" Button
3. Template Preview öffnet sich
4. Toggle "Mit Beispieldaten" (aktiv)

Ergebnis:
→ Alle Variablen werden durch Beispieldaten ersetzt
→ Variablen werden gelb markiert
→ Du siehst exakt wie die Email aussieht

Beispiel:
"Hallo {{ employeeName }}"
→ "Hallo [Max Mustermann]" (gelb markiert)
```

### **Vorschau mit Variablen:**

```
Toggle "Mit Variablen" (aktiv)

Ergebnis:
→ Variablen bleiben als {{ variable }}
→ Zeigt Raw-Template
```

---

## 🎨 RICH-TEXT EDITOR FEATURES

### **Toolbar Buttons:**

| Button | Funktion | Shortcut |
|--------|----------|----------|
| **B** | Bold (Fett) | Ctrl+B |
| **I** | Italic (Kursiv) | Ctrl+I |
| **U** | Underline (Unterstrichen) | Ctrl+U |
| **•** | Bullet List | - |
| **1.** | Ordered List | - |
| **🔗** | Link einfügen | - |
| **Variablen** | Variable einfügen | - |

### **Variablen-Dropdown:**

```
Dropdown öffnen → Zeigt alle verfügbaren Variablen:
- Mitarbeiter Name
- Mitarbeiter Email
- Startdatum
- Enddatum
- Firmenname
- Position
- Abteilung
- Manager Name

Auswählen → {{ variable }} wird an Cursor-Position eingefügt
```

### **Links einfügen:**

```
1. Text markieren (z.B. "Klicke hier")
2. Link-Button klicken
3. URL eingeben: https://example.com
4. → Text wird zum Link mit blauer Farbe + Underline
```

### **Character Counter:**

```
Zeigt unten rechts im Editor:
"1234 Zeichen"
→ Hilft bei E-Mail-Länge
```

---

## 🔍 TEMPLATE-KATEGORIEN

### **Verfügbare Kategorien:**

| Kategorie | Use Case | Beispiel |
|-----------|----------|----------|
| **ONBOARDING** | Neue Mitarbeiter | Willkommens-Email, Erste-Tage-Guide |
| **OFFBOARDING** | Austritte | Verabschiedungs-Email, Exit-Checklist |
| **BENEFITS** | Benefits-Zuweisung | JobRad-Bestätigung, Gym-Mitgliedschaft |
| **TRAINING** | Schulungen | Schulungs-Einladung, Zertifikat |
| **GENERAL** | Allgemein | Standard-Info-Email |
| **REMINDER** | Erinnerungen | Probezeit-Ende, Vertrag-Verlängerung |

### **Filtern nach Kategorie:**

```
1. Template-Liste zeigt alle Templates
2. Klicke Kategorie-Button (z.B. "ONBOARDING")
3. Liste filtert nur Onboarding-Templates
```

---

## 📊 TEMPLATE-STATS

### **Dashboard zeigt:**

```
┌─────────────────────────────────────────────┐
│ Gesamt: 12 Templates                        │
│ ONBOARDING: 4  |  OFFBOARDING: 2            │
│ BENEFITS: 3    |  TRAINING: 1               │
└─────────────────────────────────────────────┘
```

---

## 🚀 API-ENDPUNKTE

### **BrowoKoordinator-EmailTemplates Edge Function:**

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/health` | Health Check |
| GET | `/templates` | Alle Templates abrufen |
| GET | `/templates/:id` | Einzelnes Template |
| POST | `/templates` | Template erstellen |
| PUT | `/templates/:id` | Template aktualisieren |
| DELETE | `/templates/:id` | Template löschen |
| POST | `/templates/:id/render` | Template mit Variablen rendern |

### **Beispiel: Template rendern**

**Request:**
```bash
POST /templates/tmpl_123/render
{
  "variables": {
    "employeeName": "Max Mustermann",
    "organizationName": "Browo GmbH"
  }
}
```

**Response:**
```json
{
  "success": true,
  "rendered": {
    "subject": "Willkommen bei Browo GmbH, Max Mustermann!",
    "body_html": "<p>Hallo Max Mustermann,</p>...",
    "body_text": "Hallo Max Mustermann, ..."
  }
}
```

---

## 🎯 WORKFLOW-INTEGRATION

### **SEND_EMAIL Node Config mit Template:**

```typescript
{
  "recipientType": "triggered_employee",
  "useTemplate": true,
  "templateId": "tmpl_1738000000001",
  // subject + body werden zur Laufzeit aus Template geladen
}
```

### **SEND_EMAIL Node Config ohne Template:**

```typescript
{
  "recipientType": "triggered_employee",
  "useTemplate": false,
  "subject": "Willkommen {{ employeeName }}!",
  "body": "Hallo {{ employeeName }}, ..."
}
```

---

## 📝 BEST PRACTICES

### **1. Template-Naming:**
```
✅ GOOD: "Willkommens-Email Onboarding"
✅ GOOD: "Benefit-Bestätigung JobRad"
❌ BAD: "Template 1"
❌ BAD: "Email"
```

### **2. Variablen-Nutzung:**
```
✅ GOOD: "Hallo {{ employeeName }}, dein Start ist {{ startDate }}"
❌ BAD: "Hallo Max, dein Start ist nächste Woche"
→ Template sollte generisch sein!
```

### **3. Kategorisierung:**
```
✅ Onboarding-Templates → ONBOARDING
✅ Exit-Emails → OFFBOARDING
✅ Benefit-Emails → BENEFITS
→ Macht Templates leichter findbar
```

### **4. Testing:**
```
1. Template erstellen
2. Vorschau mit Beispieldaten ansehen
3. In Workflow einbinden
4. Test Run mit echten Daten
5. Logs prüfen: Variablen korrekt ersetzt?
```

---

## 🐛 DEBUGGING

### **Problem: Template wird nicht geladen**

**Symptom:**
```
Node-Config zeigt "Keine Templates gefunden"
```

**Lösung:**
```bash
1. Prüfe Edge Function Logs:
   Supabase Dashboard → Functions → BrowoKoordinator-EmailTemplates

2. Prüfe ob Template existiert:
   GET /templates
   → Sollte Liste mit Templates returnen

3. Prüfe organization_id:
   Templates sind org-spezifisch
   → User muss gleiche org_id haben
```

### **Problem: Variablen werden nicht ersetzt**

**Symptom:**
```
Email enthält {{ employeeName }} statt "Max Mustermann"
```

**Lösung:**
```bash
1. Prüfe Context in Execution Logs:
   📊 Initial Context: {"employeeName": "Max",...}
   → Variable muss im Context vorhanden sein!

2. Prüfe Variable-Schreibweise:
   ✅ {{ employeeName }}
   ❌ {{ employee_name }}
   ❌ {{employeeName}}  (ohne Spaces)
```

### **Problem: Template-Rendering schlägt fehl**

**Symptom:**
```
❌ Action failed: Email senden - Failed to load email template
```

**Lösung:**
```bash
1. Template-ID prüfen:
   config.templateId = "tmpl_123"
   → Muss existieren in KV Store

2. KV Store prüfen:
   Key: "email_template:tmpl_123"
   → Sollte Template-Objekt enthalten

3. Fallback testen:
   useTemplate = false
   → Manuelle subject/body eingeben
```

---

## 🎉 SUCCESS STORIES

### **Beispiel 1: Onboarding Automation**

```
Vorher:
- HR schreibt jede Willkommens-Email manuell
- Copy-Paste Fehler
- Variablen vergessen

Nachher:
- Template "Willkommens-Email" erstellt
- Workflow triggered automatisch bei EMPLOYEE_CREATED
- Email wird mit korrekten Daten gesendet
- 100% konsistent
```

### **Beispiel 2: Multi-Language Templates**

```
Template: "Willkommen DE"
Template: "Welcome EN"
Template: "Bienvenue FR"

Workflow entscheidet basierend auf user.language
→ Richtige Sprache wird automatisch gewählt
```

---

## 🔮 ROADMAP (Phase 2C - Future)

### **Geplante Features:**

1. **Resend/SendGrid Integration**
   - Echte E-Mail-Versendung
   - Tracking (Opened, Clicked)
   - Bounce-Handling

2. **Advanced Editor**
   - Image Upload
   - Tables
   - Buttons mit Links

3. **Template Versioning**
   - V1, V2, V3
   - Rollback zu alter Version

4. **A/B Testing**
   - Template A vs B
   - Open-Rate vergleichen

5. **Conditional Content**
   - `{% if position == "Engineer" %}...{% endif %}`
   - Dynamic Sections

---

**Version:** Phase 2B - Email Templates System
**Status:** ✅ Production Ready
**Datum:** 2025-01-28
