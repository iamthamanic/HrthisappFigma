# 🚀 HRthis Quick Start Guide

## 🎯 Du hast gerade SUPERADMIN bekommen! Was jetzt?

Herzlich willkommen als **SUPERADMIN** von HRthis! Hier ist dein Schritt-für-Schritt Guide.

---

## ✅ Setup Checklist

### Phase 1: Multi-Tenancy Setup ⚙️

- [ ] **Migration 016 ausführen** (`016_multitenancy_organizations.sql`)
  - Öffne Supabase SQL Editor
  - Kopiere den kompletten Inhalt der Migration
  - Führe sie aus
  - ✅ Ergebnis: Organizations Tabelle erstellt, Demo Company angelegt

- [ ] **Migration 017 ausführen** (Optional - löscht Demo Quizzes)
  - Öffne Supabase SQL Editor
  - Führe aus: `DELETE FROM quiz_content;`
  - ✅ Ergebnis: Alle Demo-Quizzes gelöscht

- [ ] **User zu SUPERADMIN machen** ✓ (BEREITS ERLEDIGT!)
  ```sql
  UPDATE users 
  SET role = 'SUPERADMIN'
  WHERE email = 'deine-email@example.com';
  ```

- [ ] **Neu einloggen**
  - Ausloggen
  - Wieder einloggen
  - Profile sollte jetzt SUPERADMIN sein

---

### Phase 2: Erste Organisation erstellen 🏢

1. **Navigiere zu Organizations Management**
   - Gehe zu `/admin/organizations`
   - Klicke auf "Organisation erstellen"

2. **Erstelle deine erste Organisation**
   - **Name**: z.B. "Meine Firma GmbH"
   - **Slug**: wird automatisch generiert (z.B. "meine-firma-gmbh")
   - **Domain**: z.B. "meinefirma.com" (optional)
   - **Tier**: Wähle z.B. "PROFESSIONAL"
   - **Max Users**: z.B. 50

3. **Mitarbeiter zur Organisation zuordnen**
   - Gehe zu `/admin/team-management`
   - Bearbeite einen User
   - Setze `organization_id` zur neuen Organisation

---

### Phase 3: Learning Content erstellen 📚

Da wir die Demo-Quizzes entfernt haben, erstelle eigenen Content:

1. **Navigiere zu Learning Admin**
   - Gehe zu `/learning/admin`

2. **Erstelle ein Quiz**
   - Klicke auf "Neues Quiz erstellen"
   - Fülle Titel, Beschreibung, Kategorie aus
   - Füge Fragen hinzu (Multiple Choice)
   - Setze XP & Coin Belohnungen

3. **Erstelle ein Video** (Optional)
   - Füge Video-URLs hinzu
   - Kategorisiere sie
   - Setze Dauer und Belohnungen

---

### Phase 4: Team aufbauen 👥

1. **Mitarbeiter hinzufügen**
   - Gehe zu `/admin/team-management`
   - Klicke auf "Mitarbeiter hinzufügen"
   - Fülle alle Pflichtfelder aus
   - Vergib Rolle (EMPLOYEE, ADMIN)

2. **Teams erstellen**
   - Gehe zu `/admin/teams`
   - Erstelle Teams (z.B. "Entwicklung", "Marketing")
   - Weise Mitarbeiter zu Teams zu

3. **Organigram aufbauen**
   - Gehe zu `/admin/organigram`
   - Verknüpfe Manager mit Mitarbeitern
   - Visualisiere die Hierarchie

---

## 🎮 Gamification Features

### Avatar System
- **User Side**: `/avatar` - Mitarbeiter können Avatars anpassen
- **Admin Side**: `/admin/avatar-management` - Neue Avatar Items hinzufügen

### Achievements
- Gehe zu `/achievements` (User)
- Erfolge werden automatisch vergeben
- Admin kann neue Achievements in der DB anlegen

### Coins & XP
- Werden durch Quizzes, Videos und Aktivitäten verdient
- Im Learning Shop können Items gekauft werden
- XP steigert Level und schaltet Features frei

---

## 📊 Admin Dashboard Features

### Was du als SUPERADMIN kannst:

1. **🏢 Organizations** (`/admin/organizations`)
   - Alle Organisationen verwalten
   - Firmen aktivieren/deaktivieren
   - Subscription Tiers ändern
   - User-Limits setzen

2. **👥 Team Management** (`/admin/team-management`)
   - Alle Mitarbeiter sehen (deiner Organisation)
   - Mitarbeiter hinzufügen/bearbeiten/deaktivieren
   - Rollen vergeben

3. **🌳 Organigram** (`/admin/organigram`)
   - Organisationsstruktur visualisieren
   - Hierarchien definieren

4. **🎨 Avatar Management** (`/admin/avatar-management`)
   - Avatar Items hinzufügen/bearbeiten
   - Preise und Seltenheit festlegen

5. **🎁 Benefits Management** (`/admin/benefits-management`)
   - Benefit-Kategorien verwalten
   - Neue Benefits anlegen

6. **💬 Dashboard Mitteilungen** (`/admin/dashboard-info`)
   - Wichtige News für alle Mitarbeiter
   - Ankündigungen posten

---

## 🔐 Sicherheit & Best Practices

### Multi-Tenancy
- ✅ Jede Organisation hat isolierte Daten
- ✅ RLS Policies sorgen für Datentrennung
- ✅ SUPERADMIN sieht alles, ADMINs nur ihre Org

### Rollen-System
- **SUPERADMIN**: Systemweite Verwaltung, alle Organisationen
- **ADMIN**: Verwaltet nur eigene Organisation
- **EMPLOYEE**: Normaler Mitarbeiter, keine Admin-Rechte

### Daten-Isolation
- Alle Queries werden automatisch nach `organization_id` gefiltert
- User können nur Daten ihrer eigenen Org sehen
- SUPERADMIN kann zwischen Orgs wechseln (optional implementierbar)

---

## 🆘 Troubleshooting

### Problem: User sieht keine Daten nach Login

**Lösung**: Prüfe ob User eine `organization_id` hat:
```sql
SELECT id, email, organization_id, role FROM users WHERE email = 'user@example.com';
```

Falls `organization_id` NULL ist:
```sql
UPDATE users 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'demo-company' LIMIT 1)
WHERE email = 'user@example.com';
```

### Problem: "Organization not found" Error

**Lösung**: Erstelle eine Organization:
```sql
INSERT INTO organizations (name, slug, subscription_tier, max_users)
VALUES ('Demo Company', 'demo-company', 'PROFESSIONAL', 100);
```

### Problem: RLS Policy blockiert Zugriff

**Lösung**: Temporär RLS deaktivieren zum Debuggen (NICHT IN PRODUCTION!):
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- Nach Debug wieder aktivieren:
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### Problem: Quiz/Video wird nicht angezeigt

**Lösung**: 
1. Prüfe ob `organization_id` gesetzt ist in `video_content`/`quiz_content`
2. Setze falls nötig:
```sql
UPDATE quiz_content 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'demo-company' LIMIT 1)
WHERE organization_id IS NULL;
```

---

## 🎯 Nächste Schritte (Empfohlen)

1. ✅ **Migrations ausführen** (016 + 017)
2. ✅ **Als SUPERADMIN einloggen**
3. 🏢 **Erste Organisation erstellen**
4. 👥 **Erste Mitarbeiter hinzufügen**
5. 📚 **Learning Content erstellen** (Quizzes & Videos)
6. 🎮 **Avatar Items hinzufügen**
7. 🎁 **Benefits konfigurieren**
8. 📊 **Dashboard Mitteilung posten**

---

## 📚 Weitere Dokumentation

- **Multi-Tenancy**: `/MULTI_TENANCY_SETUP.md`
- **Projekt Struktur**: `/PROJECT_STRUCTURE.md`
- **Migrations**: `/supabase/migrations/README.md`
- **Logo Usage**: `/components/LOGO_USAGE.md`

---

## 🎉 Du bist bereit!

Dein HRthis System ist jetzt vollständig konfiguriert mit:
- ✅ Multi-Tenancy (Organizations)
- ✅ Rollen-System (SUPERADMIN, ADMIN, EMPLOYEE)
- ✅ Gamification (Avatars, XP, Coins, Achievements)
- ✅ Learning System (Videos, Quizzes)
- ✅ HR Features (Time Tracking, Leave Management, Documents)
- ✅ Admin Tools (Team Management, Organigram, Benefits)

**Viel Erfolg mit deinem HR-System! 🚀**

Bei Fragen oder Problemen, checke die Dokumentation oder die Console Logs.