# 🚀 WORKFLOW SYSTEM - QUICK START EXAMPLES

## 3 FERTIGE WORKFLOWS ZUM COPY-PASTE

---

## 📋 EXAMPLE 1: ONBOARDING WORKFLOW

### **Was passiert:**
Neuer Mitarbeiter wird angelegt → Automatisch:
1. Willkommens-Email mit Template
2. JobRad Benefit zuweisen
3. Task für IT: Laptop vorbereiten
4. 500 Willkommens-Coins

### **Setup:**

#### **1. Email-Template erstellen**
```
Name: Willkommens-Email Standard
Kategorie: ONBOARDING
Betreff: Willkommen bei {{ organizationName }}, {{ employeeName }}!

Body:
Hallo {{ employeeName }},

herzlich willkommen im Team! 🎉

Dein erster Arbeitstag ist am {{ startDate }}.

**Was dich erwartet:**
- Onboarding-Meeting mit deinem Manager {{ managerName }}
- Laptop & Equipment Setup
- Team-Vorstellung

Bei Fragen erreichst du uns unter {{ employeeEmail }}.

Viele Grüße,
Das {{ organizationName }} Team
```

#### **2. Workflow erstellen**

**Trigger:** EMPLOYEE_CREATED

**Node 1: Email senden**
```json
{
  "recipientType": "triggered_employee",
  "useTemplate": true,
  "templateId": "tmpl_welcome_standard"
}
```

**Node 2: Benefits zuweisen**
```json
{
  "benefitId": "benefit_jobrad_001",
  "benefitName": "JobRad",
  "assignTo": "triggered_employee",
  "startDate": "immediate",
  "notes": "Willkommensbonus"
}
```

**Node 3: Task erstellen**
```json
{
  "title": "Laptop für {{ employeeName }} vorbereiten",
  "description": "Bitte Laptop einrichten für {{ employeeName }} ({{ employeeEmail }}). Start-Datum: {{ startDate }}",
  "assigneeType": "hr_admin",
  "priority": "HIGH",
  "dueDate": "{{ startDate }}"
}
```

**Node 4: Coins verteilen**
```json
{
  "amount": "500",
  "reason": "Willkommensbonus",
  "recipientType": "triggered_employee"
}
```

### **Testen:**
```bash
1. Workflow speichern & validieren
2. Test Run mit Context:
   {
     "employeeId": "emp_test_001",
     "employeeName": "Max Mustermann",
     "employeeEmail": "max@test.com",
     "startDate": "2025-12-01",
     "organizationName": "Browo GmbH",
     "managerName": "Anna Schmidt"
   }

3. Expected Logs:
   ✅ 📧 Email sent to max@test.com - Willkommen bei Browo GmbH, Max Mustermann!
   ✅ 🎁 Benefit "JobRad" assigned to user emp_test_001
   ✅ ✅ Task "Laptop für Max Mustermann vorbereiten" created
   ✅ 🪙 500 coins distributed to user emp_test_001
```

---

## 📋 EXAMPLE 2: BENEFIT APPROVAL WORKFLOW

### **Was passiert:**
Mitarbeiter beantragt Benefit → Automatisch:
1. Email an HR zur Genehmigung
2. Falls genehmigt: Benefit zuweisen
3. Bestätigungs-Email an Mitarbeiter
4. Notification im Dashboard

### **Setup:**

#### **1. Email-Template: Benefit-Antrag HR**
```
Name: Benefit-Antrag Benachrichtigung HR
Kategorie: BENEFITS
Betreff: Neuer Benefit-Antrag von {{ employeeName }}

Body:
Hallo HR-Team,

{{ employeeName }} ({{ employeeEmail }}) hat einen Benefit-Antrag gestellt:

**Benefit:** {{ benefitName }}
**Kategorie:** {{ benefitCategory }}
**Startdatum:** {{ startDate }}

Bitte prüfe den Antrag im Admin-Panel.

Automatisch generiert von Browo Koordinator
```

#### **2. Email-Template: Benefit-Bestätigung Mitarbeiter**
```
Name: Benefit-Bestätigung Mitarbeiter
Kategorie: BENEFITS
Betreff: Dein Benefit "{{ benefitName }}" wurde bestätigt!

Body:
Hallo {{ employeeName }},

tolle Neuigkeiten! 🎉

Dein Benefit-Antrag für **{{ benefitName }}** wurde genehmigt!

**Details:**
- Start: {{ startDate }}
- Kategorie: {{ benefitCategory }}

Bei Fragen wende dich an deine HR-Ansprechperson.

Viel Freude damit!
{{ organizationName }} Team
```

#### **3. Workflow erstellen**

**Trigger:** BENEFIT_REQUESTED (Custom Event)

**Node 1: Email an HR**
```json
{
  "recipientType": "hr_admin",
  "useTemplate": true,
  "templateId": "tmpl_benefit_request_hr"
}
```

**Node 2: Benefit zuweisen** (manuell triggered nach Approval)
```json
{
  "benefitId": "{{ benefitId }}",
  "benefitName": "{{ benefitName }}",
  "assignTo": "triggered_employee",
  "startDate": "{{ startDate }}"
}
```

**Node 3: Bestätigungs-Email an Mitarbeiter**
```json
{
  "recipientType": "triggered_employee",
  "useTemplate": true,
  "templateId": "tmpl_benefit_confirmation_employee"
}
```

**Node 4: Dashboard-Notification**
```json
{
  "title": "Benefit bestätigt",
  "message": "Dein Benefit {{ benefitName }} wurde genehmigt!",
  "recipientType": "triggered_employee",
  "priority": "NORMAL"
}
```

---

## 📋 EXAMPLE 3: PROBEZEIT-ENDE REMINDER

### **Was passiert:**
2 Wochen vor Probezeit-Ende → Automatisch:
1. Email an Manager: Feedback-Gespräch planen
2. Email an HR: Vertrag vorbereiten
3. Task für Manager: Feedback-Gespräch
4. Email an Mitarbeiter: Info über anstehendes Gespräch

### **Setup:**

#### **1. Email-Template: Manager Reminder**
```
Name: Probezeit-Ende Manager Reminder
Kategorie: REMINDER
Betreff: Probezeit endet bald: {{ employeeName }}

Body:
Hallo {{ managerName }},

die Probezeit von **{{ employeeName }}** endet am {{ probationEndDate }}.

**Bitte bis {{ reminderDate }}:**
- Feedback-Gespräch durchführen
- Beurteilung dokumentieren
- Mit HR besprechen

Bei Fragen wende dich an das HR-Team.

{{ organizationName }}
```

#### **2. Email-Template: HR Reminder**
```
Name: Probezeit-Ende HR Reminder
Kategorie: REMINDER
Betreff: Vertrag vorbereiten: {{ employeeName }}

Body:
Hallo HR-Team,

die Probezeit von **{{ employeeName }}** ({{ position }}, {{ department }}) endet am {{ probationEndDate }}.

**To-Do:**
- Festanstellungsvertrag vorbereiten
- Manager-Feedback einholen
- Vertrag bis {{ contractDeadline }} versenden

{{ organizationName }}
```

#### **3. Email-Template: Mitarbeiter Info**
```
Name: Probezeit-Ende Mitarbeiter Info
Kategorie: REMINDER
Betreff: Deine Probezeit endet bald

Body:
Hallo {{ employeeName }},

deine Probezeit bei {{ organizationName }} endet am {{ probationEndDate }}.

In den nächsten Tagen wird dein Manager {{ managerName }} ein Feedback-Gespräch mit dir führen.

**Themen:**
- Deine Erfahrungen der letzten Monate
- Feedback zum Onboarding
- Ausblick auf die Festanstellung

Wir freuen uns auf das Gespräch!

{{ organizationName }}
```

#### **4. Workflow erstellen**

**Trigger:** PROBATION_END_REMINDER (Cron-Job, 2 Wochen vorher)

**Node 1: Email an Manager**
```json
{
  "recipientType": "specific_user",
  "userId": "{{ managerId }}",
  "useTemplate": true,
  "templateId": "tmpl_probation_manager_reminder"
}
```

**Node 2: Email an HR**
```json
{
  "recipientType": "hr_admin",
  "useTemplate": true,
  "templateId": "tmpl_probation_hr_reminder"
}
```

**Node 3: Task für Manager**
```json
{
  "title": "Feedback-Gespräch: {{ employeeName }}",
  "description": "Probezeit-Feedback-Gespräch mit {{ employeeName }} durchführen. Probezeit endet am {{ probationEndDate }}.",
  "assigneeType": "specific_user",
  "assigneeId": "{{ managerId }}",
  "priority": "HIGH",
  "dueDate": "{{ reminderDate }}"
}
```

**Node 4: Info-Email an Mitarbeiter**
```json
{
  "recipientType": "triggered_employee",
  "useTemplate": true,
  "templateId": "tmpl_probation_employee_info"
}
```

**Node 5: 3 Tage später: Follow-up Reminder**
```json
{
  "duration": "3",
  "unit": "days"
}
```

**Node 6: Follow-up Email (falls nicht erledigt)**
```json
{
  "recipientType": "specific_user",
  "userId": "{{ managerId }}",
  "subject": "Erinnerung: Feedback-Gespräch {{ employeeName }}",
  "body": "Noch nicht erledigt? Bitte Gespräch bis {{ probationEndDate }} durchführen."
}
```

---

## 🎯 REAL-WORLD USE CASES

### **Use Case Matrix:**

| Trigger Event | Actions | Template |
|--------------|---------|----------|
| **EMPLOYEE_CREATED** | Email, Benefits, Task, Coins | Willkommens-Email |
| **BENEFIT_REQUESTED** | Email HR, Assign Benefit, Notification | Benefit-Antrag |
| **DOCUMENT_SIGNED** | Email Confirmation, Archive Document | Vertragsbestätigung |
| **TRAINING_COMPLETED** | Email Certificate, Distribute Coins | Zertifikat-Email |
| **VEHICLE_ASSIGNED** | Email Instructions, Create Checklist | Fahrzeug-Übergabe |
| **EQUIPMENT_RETURNED** | Email Confirmation, Update Inventory | Return-Bestätigung |
| **PROBATION_END** | Email Manager/HR, Create Task | Probezeit-Reminder |
| **CONTRACT_UPDATED** | Email Employee, Notification | Vertragsänderung |

---

## 💡 PRO TIPS

### **1. Template Reuse**
```
❌ Template pro Workflow
✅ Ein Template für mehrere Workflows

Beispiel:
"Benefit-Bestätigung" Template
→ Verwendet in: JobRad, Gym, Urban Sports Club Workflows
```

### **2. Variable Naming**
```
✅ Konsistente Namen:
   - employeeName (nicht employee_name oder name)
   - startDate (nicht start oder datum)
   - organizationName (nicht company oder firma)

→ Macht Templates wiederverwendbar
```

### **3. Error Handling**
```
Füge Fallback-Values hinzu:

Betreff: Willkommen {{ employeeName | "neues Teammitglied" }}!

Falls employeeName fehlt → "neues Teammitglied"
```

### **4. Testing**
```
1. Template erstellen → Vorschau prüfen
2. Workflow erstellen → Validieren
3. Test Run mit Mock-Daten
4. Logs prüfen → Variablen ersetzt?
5. Production → Mit echten Events
```

---

## 🚨 COMMON MISTAKES

### **❌ Fehler 1: Hard-Coded Values**
```javascript
// WRONG
"body": "Willkommen Max Mustermann!"

// CORRECT
"body": "Willkommen {{ employeeName }}!"
```

### **❌ Fehler 2: Falscher Recipient-Type**
```javascript
// WRONG (wenn getriggert durch neuen Mitarbeiter)
"recipientType": "all_employees"

// CORRECT
"recipientType": "triggered_employee"
```

### **❌ Fehler 3: Missing Template-ID**
```javascript
// WRONG
{
  "useTemplate": true,
  "templateId": ""  // ← FEHLT!
}

// CORRECT
{
  "useTemplate": true,
  "templateId": "tmpl_welcome_standard"
}
```

### **❌ Fehler 4: Unkonfigurierte Nodes**
```
Node ist orange → Workflow schlägt fehl
→ Alle Nodes müssen konfiguriert sein (grün)
```

---

## 📞 NEXT STEPS

1. **Templates erstellen** → `/admin/email-templates`
2. **Workflows erstellen** → `/admin/workflows`
3. **Nodes konfigurieren** → Mit Templates verknüpfen
4. **Testen** → Test Run mit Mock-Daten
5. **Production** → Trigger mit echten Events

**Happy Automating! 🚀**
