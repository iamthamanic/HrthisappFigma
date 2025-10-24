# 📚 Learning System - HRthis

## Übersicht

Das Learning System ist vollständig datenbankbasiert und enthält **keine Mock-Daten** im Code. Alle Inhalte werden aus der Supabase-Datenbank geladen.

## 🗄️ Datenbankstruktur

### Tabellen

1. **`quiz_content`** - Quiz-Inhalte
   - `id`, `title`, `description`, `category`, `questions` (JSONB)
   - `is_mandatory`, `duration`, `passing_score`
   - `xp_reward`, `coin_reward`, `order_index`

2. **`video_content`** - Video-Inhalte
   - `id`, `title`, `description`, `category`, `video_url`
   - `duration_minutes`, `thumbnail_url`
   - `xp_reward`, `coin_reward`, `order_index`

3. **`shop_items`** - Shop-Artikel
   - `id`, `name`, `description`, `price`, `category`
   - `icon`, `rarity`, `is_active`

4. **`learning_progress`** - Lernfortschritt der User
   - `user_id`, `video_id`, `content_id`, `content_type`
   - `completed`, `score`, `watched_seconds`

## 🧹 Demo-Daten entfernen

Falls noch Demo-Daten in deiner Datenbank vorhanden sind:

1. Öffne Supabase SQL Editor
2. Kopiere den Inhalt von `/REMOVE_ALL_LEARNING_DEMO_DATA.sql`
3. Führe das Script aus
4. Refreshe die App (F5)

## ✨ Neue Inhalte erstellen

### Als Admin

1. Gehe zu `/learning/admin` (oder klicke auf "Inhalte verwalten")
2. **Videos Tab:**
   - Klicke auf "Neues Video"
   - Fülle die Felder aus (Titel, Beschreibung, Video-URL, etc.)
   - Wähle eine Kategorie: MANDATORY, COMPLIANCE, SKILLS, ONBOARDING, BONUS
   - Setze XP und Coin Rewards
   - Speichern

3. **Tests Tab:**
   - Klicke auf "Ersten Test erstellen"
   - Erstelle Fragen im JSON Format:
     ```json
     [
       {
         "id": "1",
         "question": "Deine Frage?",
         "options": ["Antwort 1", "Antwort 2", "Antwort 3", "Antwort 4"],
         "correct_answer": 0,
         "explanation": "Erklärung (optional)"
       }
     ]
     ```
   - Wähle Kategorie und setze als Pflicht (is_mandatory)
   - Setze Passing Score (z.B. 80%)
   - Speichern

## 📋 Kategorien

### Quiz & Video Kategorien:
- **MANDATORY** - Pflicht-Schulungen (rot)
- **COMPLIANCE** - Compliance-Schulungen (gelb)
- **SKILLS** - Skills & Entwicklung (blau)
- **ONBOARDING** - Onboarding-Inhalte (grün)
- **BONUS** - Bonus-Inhalte (lila)

### Shop Kategorien:
- **avatar** - Avatar-Items
- **powerup** - Power-Ups
- **theme** - Themes

### Shop Seltenheit:
- **common** - Häufig (grau)
- **rare** - Selten (blau)
- **epic** - Episch (lila)
- **legendary** - Legendär (gold)

## 🎯 Empty States

Das System zeigt automatisch Empty States an, wenn:
- Keine Inhalte vorhanden sind
- Kategorie leer ist (z.B. keine Pflicht-Schulungen)
- Benutzer hat noch keine Lerninhalte

Admins sehen einen Button "Inhalte erstellen", Mitarbeiter eine Info-Nachricht.

## 🔄 Datenfluss

```
1. User öffnet /learning
   ↓
2. learningStore lädt Videos & Quizzes aus DB
   ↓
3. Filtert nach Kategorie (Pflicht, Skills, etc.)
   ↓
4. Zeigt Inhalte oder Empty State an
   ↓
5. User klickt auf Video/Quiz
   ↓
6. VideoPlayer/QuizPlayer lädt spezifischen Inhalt
   ↓
7. Bei Abschluss: Progress speichern + Rewards vergeben
```

## 🛠️ Technische Details

### Frontend
- **Screens:** `LearningScreen.tsx`, `VideoDetailScreen.tsx`, `QuizDetailScreen.tsx`
- **Store:** `learningStore.ts` - Alle Datenbank-Operationen
- **Components:** `VideoPlayer.tsx`, `QuizPlayer.tsx`

### API Calls
```typescript
// Alle Methoden in learningStore.ts:
loadVideos()        // GET video_content
loadQuizzes()       // GET quiz_content
loadProgress()      // GET learning_progress
completeVideo()     // UPDATE learning_progress
completeQuiz()      // UPDATE learning_progress + Rewards
```

### Rewards System
- Videos: XP + Coins beim ersten Abschluss (>95% angesehen)
- Quizzes: XP + Coins bei Bestehen (score >= passing_score)
- Achievements: Automatisch freigeschaltet bei Meilensteinen

## 🚀 Best Practices

1. **Keine Mock-Daten im Code** - Nur aus DB laden
2. **Empty States** - Immer anzeigen wenn keine Daten
3. **Admin-Funktionen** - Nur für ADMIN/SUPERADMIN sichtbar
4. **Loading States** - Während Daten geladen werden
5. **Error Handling** - Bei DB-Fehlern graceful fallback

## 📝 Beispiel: Quiz erstellen

```sql
INSERT INTO quiz_content (
  title,
  description,
  category,
  is_mandatory,
  duration,
  passing_score,
  questions,
  xp_reward,
  coin_reward
) VALUES (
  'Datenschutz-Quiz',
  'Teste dein Wissen über DSGVO',
  'MANDATORY',
  true,
  15,
  80,
  '[{"id":"1","question":"Was bedeutet DSGVO?","options":["Datenschutz-Grundverordnung","..."],"correct_answer":0}]'::jsonb,
  100,
  50
);
```

## 🎓 Migration-Verlauf

- `009_quiz_content.sql` - Quiz-Tabelle erstellt (KEINE Demo-Daten)
- `017_remove_demo_quizzes.sql` - Demo-Daten entfernt
- `999_COMPLETE_SETUP_V4.sql` - Komplettes Setup (KEINE Demo-Daten)

## 📞 Support

Bei Fragen zum Learning System:
1. Prüfe diese README
2. Prüfe `/REMOVE_ALL_LEARNING_DEMO_DATA.sql`
3. Prüfe die Migrationen in `/supabase/migrations/`

---

**Wichtig:** Das Learning System ist production-ready und enthält keine Platzhalter-Daten! 🎉
