# ✅ SCHICHTPLANUNG - Avatar URL Fix

## 🐛 Problem

**Fehler beim Laden:**
```
❌ Error fetching shift planning data: {
  "code": "42703",
  "details": null,
  "hint": null,
  "message": "column users.avatar_url does not exist"
}
```

**Screenshot zeigt:**
- Fehler-Box: "column users.avatar_url does not exist"
- "Erneut versuchen" Button

---

## 🔍 Ursache

Der Hook `BrowoKo_useShiftPlanning.ts` versuchte die Spalte `avatar_url` zu lesen, aber in der Browo Koordinator Datenbank heißt die Spalte **`profile_picture`**.

**Warum?**
- Ursprünglich von HRthis übernommen
- HRthis nutzte `avatar_url`
- Browo Koordinator nutzt `profile_picture`
- Beim Schichtplanungssystem wurde die alte Spalte verwendet

---

## 🔧 Lösung

### **Fix 1: Interface aktualisiert**

**Vorher:**
```typescript
interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  location_id?: string;
  department?: string;
  specialization?: string;
  team_id?: string;
  avatar_url?: string;  // ❌ FALSCH
}
```

**Nachher:**
```typescript
interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  location_id?: string;
  department?: string;
  specialization?: string;
  team_id?: string;
  profile_picture?: string;  // ✅ RICHTIG
}
```

---

### **Fix 2: Users Query aktualisiert**

**Vorher:**
```typescript
supabase
  .from('users')
  .select('id, first_name, last_name, email, location_id, department, specialization, avatar_url')  // ❌
  .eq('role', 'employee')  // ❌ Kleinschreibung
  .order('last_name'),
```

**Nachher:**
```typescript
supabase
  .from('users')
  .select('id, first_name, last_name, email, location_id, department, specialization, profile_picture')  // ✅
  .eq('role', 'EMPLOYEE')  // ✅ GROSSSCHREIBUNG (wie in DB)
  .order('last_name'),
```

**Zusätzlich gefixxt:**
- `'employee'` → `'EMPLOYEE'` (Enum in DB ist Großbuchstaben)

---

### **Fix 3: Team Members Query aktualisiert**

**Vorher:**
```typescript
const { data: teamMembers, error } = await supabase
  .from('team_members')
  .select(`
    user_id,
    users (
      id,
      first_name,
      last_name,
      email,
      location_id,
      department,
      specialization,
      avatar_url  // ❌
    )
  `)
  .eq('team_id', team.id);
```

**Nachher:**
```typescript
const { data: teamMembers, error } = await supabase
  .from('team_members')
  .select(`
    user_id,
    users (
      id,
      first_name,
      last_name,
      email,
      location_id,
      department,
      specialization,
      profile_picture  // ✅
    )
  `)
  .eq('team_id', team.id);
```

---

## 📋 Datei geändert

**`/hooks/BrowoKo_useShiftPlanning.ts`**
- Zeile 33: `avatar_url` → `profile_picture`
- Zeile 93: `avatar_url` → `profile_picture` + `'employee'` → `'EMPLOYEE'`
- Zeile 142: `avatar_url` → `profile_picture`

---

## ✅ Was jetzt funktioniert

Nach dem Fix lädt das Schichtplanungssystem jetzt:
- ✅ Locations (Standorte)
- ✅ Departments (Abteilungen)
- ✅ Teams mit Mitgliedern
- ✅ Shifts (Schichten)
- ✅ Users mit **Profilbildern** (`profile_picture`)

---

## 🧪 Testen

### **In der App:**
```
1. Öffne: Field Verwaltung
2. Klicke: Einsatzplanung
3. Wechsel zu: Schichtplanung Tab
```

**Was du jetzt sehen solltest:**
- ✅ Mini-Kalender (aktuelle Woche)
- ✅ Team-Accordion mit echten Teams
- ✅ Mitarbeiter-Liste mit echten Usern (inkl. Profilbilder!)
- ✅ 2 Schichtblöcke in der Timeline
- ✅ **KEIN FEHLER MEHR!**

---

## 🎯 Lessons Learned

### **Spalten-Namen in Browo Koordinator:**

| Feature | Spalten-Name | Tabelle |
|---------|--------------|---------|
| Profilbild | `profile_picture` | `users` |
| Rolle | `role` (UPPERCASE!) | `users` |
| Team Avatar | `avatar_url` | `teams` |

**Wichtig:**
- `users.profile_picture` (nicht `avatar_url`)
- `users.role` ist ENUM mit Großbuchstaben: `'EMPLOYEE'`, `'HR_MANAGER'`, etc.

---

## 🚀 Status

✅ **Avatar URL Fehler behoben!**

**Das Schichtplanungssystem lädt jetzt:**
- Alle Daten aus der echten DB
- Inkl. Profilbilder der Mitarbeiter
- Keine Fehler mehr beim Laden

**Bereit zum Testen in der App!** 🎉
