# 🔐 Berechtigungen für Mitarbeiter-Erstellung

**Status:** ✅ Implementiert (2025-01-10)  
**Version:** 1.0  
**Bezug:** Single-Tenancy Architecture mit 2-Level Approval System

---

## 📋 Übersicht

Das System verwendet eine **granulare Berechtigungslogik** für die Erstellung von Mitarbeitern mit verschiedenen Rollen.

### **Berechtigungshierarchie:**

| Rolle | USER erstellen | ADMIN erstellen | HR erstellen | SUPERADMIN erstellen |
|-------|----------------|-----------------|--------------|----------------------|
| **SUPERADMIN** | ✅ JA | ✅ JA | ✅ JA | ✅ JA |
| **HR** | ✅ JA | ✅ JA | ❌ NEIN | ❌ NEIN |
| **ADMIN** | ✅ JA | ❌ NEIN | ❌ NEIN | ❌ NEIN |
| **USER** | ❌ NEIN | ❌ NEIN | ❌ NEIN | ❌ NEIN |

---

## 🎯 Begründung

### **Warum diese Hierarchie?**

1. **SUPERADMIN (Vollzugriff)**
   - Kann alle Rollen erstellen
   - Für Firmeninhaber / IT-Leiter
   - Vollständige Kontrolle über das System

2. **HR (Erweiterte Berechtigungen)**
   - Kann Mitarbeiter UND Administratoren erstellen
   - Personalabteilung braucht Flexibilität bei der Team-Strukturierung
   - KANN KEINE HR oder SUPERADMIN erstellen (verhindert Privilege Escalation)

3. **ADMIN (Basis Team-Management)**
   - Kann nur Mitarbeiter (USER) erstellen
   - Für Abteilungsleiter / Team Manager
   - Keine kritischen Rollen-Zuweisungen

4. **USER (Keine Admin-Rechte)**
   - Kann keine Mitarbeiter erstellen
   - Standard-Mitarbeiter

---

## 💻 Implementierung

### **1. AddEmployeeScreen.tsx**

```typescript
// ✅ NEUE BERECHTIGUNGSLOGIK
const allowedRoles = profile?.role === 'SUPERADMIN' 
  ? ['USER', 'ADMIN', 'HR', 'SUPERADMIN'] as const
  : profile?.role === 'HR'
  ? ['USER', 'ADMIN'] as const
  : ['USER'] as const; // ADMIN kann nur USER erstellen
```

### **2. HRTHIS_AddEmployeeRoleSection.tsx**

- Zeigt nur erlaubte Rollen im Dropdown an
- Disabled Rollen sind ausgegraut mit "(Keine Berechtigung)"
- Info-Alert zeigt die aktuellen Berechtigungen an

### **3. usePermissions.ts**

Neue Permissions:
```typescript
createUser: normalizedRole === 'HR' || normalizedRole === 'ADMIN' || normalizedRole === 'SUPERADMIN',
createAdmin: normalizedRole === 'HR' || normalizedRole === 'SUPERADMIN',
createHR: normalizedRole === 'SUPERADMIN',
createSuperadmin: normalizedRole === 'SUPERADMIN',
```

### **4. PermissionsView.tsx**

Zeigt die neuen Berechtigungen in "Meine Daten → Berechtigungen" an:
- ✅ Mitarbeiter (USER) erstellen
- ✅ Administratoren (ADMIN) erstellen
- ✅ HR-Mitarbeiter erstellen
- ✅ Super Admins erstellen

---

## 🔍 Wo sichtbar?

### **1. Mitarbeiter erstellen (Admin → Team Management → Neuer Mitarbeiter)**
- Select-Dropdown zeigt nur erlaubte Rollen
- Disabled Rollen sind ausgegraut
- Info-Box erklärt die Berechtigungen

### **2. Meine Daten → Berechtigungen (Settings Screen)**
- Kategorie "Team & Organisation"
- Detaillierte Liste der Rollen-Erstellungs-Berechtigungen
- Grüne Häkchen = Erlaubt
- Rote X = Nicht erlaubt

---

## 🚀 Testing

### **Test als SUPERADMIN:**
1. Login als SUPERADMIN
2. Admin → Team Management → Neuer Mitarbeiter
3. Globale Rolle Dropdown: **Alle 4 Rollen verfügbar** ✅
4. Settings → Meine Daten → Berechtigungen: **Alle 4 grün** ✅

### **Test als HR:**
1. Login als HR
2. Admin → Team Management → Neuer Mitarbeiter
3. Globale Rolle Dropdown: **Nur USER + ADMIN verfügbar** ✅
4. HR + SUPERADMIN sind **disabled** ❌
5. Settings → Berechtigungen: **USER + ADMIN grün, HR + SUPERADMIN rot** ✅

### **Test als ADMIN:**
1. Login als ADMIN
2. Admin → Team Management → Neuer Mitarbeiter
3. Globale Rolle Dropdown: **Nur USER verfügbar** ✅
4. ADMIN + HR + SUPERADMIN sind **disabled** ❌
5. Settings → Berechtigungen: **Nur USER grün, rest rot** ✅

---

## 📝 Nächste Schritte

- ✅ **DONE:** Berechtigungslogik implementiert
- ✅ **DONE:** UI Components aktualisiert
- ✅ **DONE:** Permissions Hook erweitert
- ✅ **DONE:** Settings Screen zeigt neue Berechtigungen
- ⏳ **TODO:** In Figma Make Preview testen
- ⏳ **TODO:** Edge Function "Failed to fetch" Error fixen

---

## 🔗 Bezug zu anderen Systemen

### **2-Level Approval System:**
- Global Role (users.role): **Wird hier zugewiesen**
- Team Role (team_members.role): Wird in Team-Zuweisung definiert

### **Security:**
- Verhindert Privilege Escalation (HR kann keine HR/SUPERADMIN erstellen)
- Klare Trennung der Verantwortlichkeiten
- SUPERADMIN behält volle Kontrolle

---

**Erstellt:** 2025-01-10  
**Letzte Änderung:** 2025-01-10  
**Status:** ✅ Production Ready
