# 🎓 **BrowoKoordinator-Lernen v1.0.0 - Deployment Guide**

## 📋 **Übersicht**

Die **BrowoKoordinator-Lernen** Edge Function verwaltet das komplette Learning Management System inkl. XP & Leveling.

### **Version:** 1.0.0
### **Status:** ✅ Vollständig implementiert, bereit für Deployment
### **Endpoints:** 14 (1 public, 13 authenticated)

---

## 🎯 **Features**

### **✅ Vollständig Implementiert:**

**Video Management:**
1. **GET /videos** - Videos mit User Progress
2. **POST /videos** - Video erstellen (Admin)
3. **PUT /videos/:id** - Video updaten (Admin)
4. **DELETE /videos/:id** - Video löschen (Admin)
5. **POST /video/complete** - Video abschließen + XP Award

**Quiz Management:**
6. **GET /quizzes** - Quizzes mit User Attempts
7. **POST /quizzes** - Quiz erstellen (Admin)
8. **PUT /quizzes/:id** - Quiz updaten (Admin)
9. **DELETE /quizzes/:id** - Quiz löschen (Admin)
10. **POST /quiz/submit** - Quiz einreichen + XP/Coins Award

**Progress & Stats:**
11. **GET /progress** - User Learning Progress & Statistics
12. **GET /avatar** - User Avatar Stats (Level, XP, Progress)
13. **GET /recommendations** - Personalisierte Video-Empfehlungen

**System:**
14. **GET /health** - Health Check (NO AUTH)

---

## 🗄️ **Datenbank-Integration**

### **Tabellen (bereits vorhanden):**

```sql
- video_content           -- Videos
- learning_progress       -- User Video Progress
- quizzes                 -- Quizzes
- quiz_questions          -- Quiz Questions
- quiz_attempts           -- Quiz Attempts
- user_avatars            -- User Avatar (level, total_xp)
- xp_events               -- XP History
- coin_transactions       -- Coin History
```

**Keine Migration erforderlich** - Alle Tabellen existieren bereits in `001_initial_schema.sql`

---

## 🎮 **XP & Leveling System**

### **XP Awards:**
- ✅ **Video Completion:** +10 XP (nur beim ersten Abschluss)
- ✅ **Quiz Pass:** +50 XP (nur beim ersten Bestehen)

### **Coin Awards:**
- ✅ **Quiz Pass:** +10 Coins (nur beim ersten Bestehen)

### **Level Berechnung:**
```javascript
Level = floor(sqrt(total_xp / 100)) + 1

Beispiele:
- 0 XP = Level 1
- 100 XP = Level 2
- 400 XP = Level 3
- 900 XP = Level 4
```

### **Notifications:**
- ✅ **Level Up:** ACHIEVEMENT_UNLOCKED
- ✅ **Coins Award:** COINS_AWARDED

---

## 🚀 **Deployment**

### **Via Supabase CLI (EMPFOHLEN):**

```bash
cd /Users/konstantinbuchele/Documents/Projekte/BrowoKoordinator
supabase functions deploy BrowoKoordinator-Lernen --no-verify-jwt
```

### **Via Supabase Dashboard:**
1. Öffne **Supabase Dashboard** → **Edge Functions**
2. Wähle **BrowoKoordinator-Lernen**
3. Kopiere Code aus `/supabase/functions/BrowoKoordinator-Lernen/index.ts`
4. Deploy

---

## 🧪 **Testing**

### **Browser Console Test:**

**Datei:** `/LERNEN_EDGE_FUNCTION_CONSOLE_TEST.js`

**Schritte:**
1. Öffne Browo Koordinator im Browser
2. Öffne Browser Console (F12)
3. Kopiere den kompletten Code aus `LERNEN_EDGE_FUNCTION_CONSOLE_TEST.js`
4. Füge ihn in die Console ein
5. Führe aus:

```javascript
// Quick Test
await lernenQuickTest()

// Einzelne Tests
await lernenHealth()
await lernenGetVideos()
await lernenGetQuizzes()
await lernenGetProgress()
await lernenGetAvatar()
```

---

## 📊 **API Endpoints im Detail**

### **1. GET /videos**
**Auth:** ✅ Erforderlich  
**Query Params:**
- `category` (string, optional) - Filter: MANDATORY, COMPLIANCE, SKILLS, ONBOARDING, BONUS
- `search` (string, optional) - Suche in title/description

**Response:**
```json
{
  "success": true,
  "videos": [
    {
      "id": "uuid",
      "title": "Einführung",
      "description": "...",
      "video_url": "https://youtube.com/...",
      "thumbnail_url": "...",
      "duration_seconds": 300,
      "category": "ONBOARDING",
      "is_mandatory": true,
      "user_progress": {
        "watched_seconds": 150,
        "completed": false,
        "progress_percentage": 50,
        "last_watched_at": "2025-10-30T10:00:00.000Z"
      }
    }
  ],
  "count": 1
}
```

---

### **2. POST /video/complete**
**Auth:** ✅ Erforderlich  
**Body:**
```json
{
  "video_id": "uuid",
  "watch_time_seconds": 300
}
```

**Response:**
```json
{
  "success": true,
  "progress": { ... },
  "rewards": {
    "xp_awarded": 10,
    "new_total_xp": 110,
    "new_level": 2,
    "leveled_up": false
  },
  "message": "Video abgeschlossen! +10 XP"
}
```

---

### **3. POST /quiz/submit**
**Auth:** ✅ Erforderlich  
**Body:**
```json
{
  "quiz_id": "uuid",
  "answers": {
    "question1-uuid": "answer1",
    "question2-uuid": "answer2"
  }
}
```

**Response:**
```json
{
  "success": true,
  "attempt": {
    "id": "uuid",
    "score": 100,
    "passed": true,
    "correct_answers": 3,
    "total_questions": 3,
    "passing_score": 80
  },
  "rewards": {
    "xp_awarded": 50,
    "coins_awarded": 10,
    "new_total_xp": 160,
    "new_level": 2,
    "leveled_up": true
  },
  "message": "Glückwunsch! Quiz bestanden!"
}
```

---

### **4. GET /progress**
**Auth:** ✅ Erforderlich  

**Response:**
```json
{
  "success": true,
  "progress": {
    "videos": {
      "completed": 5,
      "in_progress": 2,
      "total_watched_seconds": 1500
    },
    "quizzes": {
      "passed": 3,
      "attempted": 4,
      "average_score": 85
    },
    "avatar": {
      "level": 2,
      "total_xp": 160,
      "xp_in_current_level": 60,
      "xp_needed_for_next_level": 300,
      "progress_to_next_level": 20
    }
  }
}
```

---

### **5. GET /avatar**
**Auth:** ✅ Erforderlich  

**Response:**
```json
{
  "success": true,
  "avatar": {
    "id": "uuid",
    "user_id": "uuid",
    "level": 2,
    "total_xp": 160,
    "skin_color": "#FDBCB4",
    "hair_color": "#000000",
    "background_color": "#E3F2FD",
    "accessories": [],
    "xp_in_current_level": 60,
    "xp_needed_for_next_level": 300,
    "progress_to_next_level": 20
  }
}
```

---

## 🔗 **Integration mit Notification Function**

Die Lernen-Function sendet automatisch Notifications:

### **Bei Level-Up:**
```javascript
{
  "type": "ACHIEVEMENT_UNLOCKED",
  "title": "Level 2 erreicht!",
  "message": "Glückwunsch! Du bist jetzt Level 2!",
  "link": "/learning",
  "data": {
    "level": 2,
    "xp": 160
  }
}
```

### **Bei Coins Award:**
```javascript
{
  "type": "COINS_AWARDED",
  "title": "Coins erhalten!",
  "message": "Du hast 10 Coins erhalten: Quiz bestanden: ...",
  "link": "/benefits",
  "data": {
    "coins": 10,
    "reason": "..."
  }
}
```

---

## ✅ **Post-Deployment Checklist**

- [ ] Function deployed mit `--no-verify-jwt`
- [ ] Health Check funktioniert (200 OK)
- [ ] `/videos` gibt Videos mit Progress zurück
- [ ] `/video/complete` gibt XP
- [ ] `/quizzes` gibt Quizzes mit Attempts zurück
- [ ] `/quiz/submit` gibt XP & Coins
- [ ] `/progress` gibt korrekte Statistics
- [ ] `/avatar` gibt Avatar mit Level/XP
- [ ] Frontend-Integration getestet
- [ ] Notifications werden gesendet

---

## 📈 **Edge Functions Progress: 6/14 (42.9%)**

### ✅ **Vollständig implementiert:**
1. ✅ BrowoKoordinator-Dokumente (v2.1.0)
2. ✅ BrowoKoordinator-Zeiterfassung (v3.0.0)
3. ✅ BrowoKoordinator-Kalender (v2.0.0)
4. ✅ BrowoKoordinator-Antragmanager (v1.0.0)
5. ✅ BrowoKoordinator-Notification (v1.0.0)
6. ✅ **BrowoKoordinator-Lernen (v1.0.0)** ← **GERADE IMPLEMENTIERT**

### ⏳ **Noch zu implementieren (8 Functions):**
7. ⏳ BrowoKoordinator-Analytics
8. ⏳ BrowoKoordinator-Automation
9. ⏳ BrowoKoordinator-Benefits
10. ⏳ BrowoKoordinator-Chat
11. ⏳ BrowoKoordinator-Field
12. ⏳ BrowoKoordinator-Organigram
13. ⏳ BrowoKoordinator-Personalakte
14. ⏳ BrowoKoordinator-Tasks

---

## 🎉 **READY TO DEPLOY!**

Die **BrowoKoordinator-Lernen v1.0.0** ist **vollständig implementiert** und **production-ready**!

**Deploy-Befehl:**
```bash
supabase functions deploy BrowoKoordinator-Lernen --no-verify-jwt
```

**Nach Deployment testen mit:**
```javascript
await lernenQuickTest()
```

---

**Erstellt:** 30. Oktober 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
