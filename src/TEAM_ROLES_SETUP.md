# 🎯 Team-Rollen System - Setup & Anleitung

## ✅ Was wurde implementiert?

### **Globale Rolle vs. Team-Rolle**

**1. Globale System-Rolle (`users.role`):**
- **SUPERADMIN/ADMIN/HR** = Volle Berechtigungen, sieht alle Teams
- **TEAMLEAD** = Sieht alle Teams, wo er Teamlead ist
- **USER** = Standard-Mitarbeiter

**2. Team-spezifische Rolle (`team_members.role`):**
- **TEAMLEAD** = Leitet dieses spezifische Team
- **MEMBER** = Normales Mitglied

### **Intelligente Logik:**
- ✅ Jemand mit globaler Rolle ADMIN/HR/SUPERADMIN kann in einem Team als MEMBER sein (globale Rolle bleibt höher)
- ✅ Jemand mit globaler Rolle USER der zum Team-TEAMLEAD wird, bekommt **automatisch** die globale Rolle TEAMLEAD
- ✅ Jemand mit globaler Rolle TEAMLEAD kann mehrere Teams leiten
- ✅ Bei Admin → Team und Mitarbeiterverwaltung → Arbeitsinformationen steht das Team und die Rolle (z.B. "Büro Berlin · Teamlead")

---

## 🚀 Setup (1 Schritt)

### **SQL in Supabase ausführen:**

```bash
1. Öffne deine Supabase Console → SQL Editor
2. Öffne die Datei: QUICK_FIX_TEAM_ROLES.sql
3. Kopiere den Inhalt und füge ihn ein
4. Klicke "Run"
```

**Das war's!** ✅

---

## 📖 Verwendung

### **1. Team erstellen mit Teamlead:**

1. Gehe zu **Admin → Team und Mitarbeiterverwaltung → Teams Tab**
2. Klicke **"Team erstellen"**
3. Gib Team-Name ein (z.B. "Büro Berlin")
4. Wähle **Teamleads** aus (z.B. Ali Admin)
5. Wähle **Mitglieder** aus
6. Klicke **"Erstellen"**

**Was passiert automatisch:**
- Wenn Ali Admin die globale Rolle "USER" hatte, wird er jetzt automatisch "TEAMLEAD"
- Wenn Ali Admin bereits "ADMIN" oder "HR" ist, bleibt seine globale Rolle "ADMIN"/"HR" (höher als Teamlead)
- In der Team-Member-Tabelle wird Ali als `role: 'TEAMLEAD'` gespeichert

### **2. Team-Info ansehen:**

1. Gehe zu **Admin → Team und Mitarbeiterverwaltung → Mitarbeiter Tab**
2. Klicke auf einen Mitarbeiter
3. Scrolle zu **"Arbeitsinformationen"**
4. Bei **Team(s)** siehst du jetzt:
   - **"Büro Berlin · Teamlead"** (blauer Badge)
   - **"Marketing · Mitglied"** (grauer Badge)

### **3. Berechtigungen:**

**Bei Urlaubsanträgen:**
- ADMIN/HR/SUPERADMIN sehen **alle** Anträge
- TEAMLEAD sieht nur Anträge von **seinem Team**
- USER sieht nur **eigene** Anträge

---

## 🔧 Technische Details

### **Datenbank-Schema:**

```sql
-- team_members Tabelle
{
  team_id: uuid,
  user_id: uuid,
  role: 'TEAMLEAD' | 'MEMBER',  -- NEU!
  is_lead: boolean,              -- Backwards compatibility
  joined_at: timestamp
}
```

### **Automatische Rolle-Upgrades:**

Wenn ein User zum Teamlead gemacht wird:
```typescript
// In TeamManagementScreen.tsx
for (const userId of selectedTeamLeads) {
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (userData && userData.role === 'USER') {
    // Upgrade zu TEAMLEAD
    await supabase
      .from('users')
      .update({ role: 'TEAMLEAD' })
      .eq('id', userId);
  }
}
```

---

## ❓ FAQ

**Q: Was passiert, wenn ich jemanden mit ADMIN-Rolle zum Teamlead mache?**
A: Die globale Rolle bleibt ADMIN (höher als Teamlead). In der Team-Tabelle wird er als TEAMLEAD gespeichert, aber seine System-Berechtigungen bleiben ADMIN.

**Q: Kann ich die Rolle nachträglich ändern?**
A: Ja! Bearbeite das Team und ändere die Zuordnung von Teamleads zu Members oder umgekehrt.

**Q: Was passiert mit bestehenden Teams?**
A: Die Migration setzt automatisch `role = 'TEAMLEAD'` für alle bestehenden Einträge mit `is_lead = true`.

**Q: Kann jemand in mehreren Teams Teamlead sein?**
A: Ja! Man kann in Team A Teamlead sein und in Team B normales Mitglied.

---

## ✅ Fertig!

Das System ist jetzt vollständig einsatzbereit. Alle UI-Komponenten zeigen die Rollen korrekt an.
