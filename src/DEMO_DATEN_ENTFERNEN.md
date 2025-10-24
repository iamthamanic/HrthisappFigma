# 🧹 Demo-Daten aus dem Lernbereich entfernen

## Problem

Im Lernbereich werden noch Demo-Quizzes angezeigt:
- Datenschutz-Quiz
- Arbeitssicherheit-Quiz
- Teamwork & Kommunikation
- Weitere Demo-Inhalte

Diese Daten befinden sich **in deiner Datenbank**, nicht im Code!

## ✅ Lösung: SQL-Script ausführen

### Schritt-für-Schritt Anleitung

1. **Öffne Supabase Dashboard**
   - Gehe zu https://supabase.com/dashboard
   - Wähle dein HRthis-Projekt aus

2. **Öffne SQL Editor**
   - Klicke in der linken Sidebar auf "SQL Editor"
   - Klicke auf "+ New Query"

3. **Kopiere das SQL-Script**
   - Öffne die Datei `/REMOVE_ALL_LEARNING_DEMO_DATA.sql`
   - Kopiere den **kompletten Inhalt** (Strg+A, Strg+C)

4. **Füge das Script ein**
   - Füge den Code in den SQL Editor ein (Strg+V)
   - Das Script sieht so aus:
     ```sql
     DELETE FROM quiz_content;
     DELETE FROM video_content;
     -- etc.
     ```

5. **Führe das Script aus**
   - Klicke auf "Run" (oder drücke Strg+Enter / Cmd+Enter)
   - Warte bis "Success. No rows returned" angezeigt wird

6. **Refreshe die App**
   - Gehe zurück zu deiner HRthis App
   - Drücke F5 zum Neuladen
   - Gehe zu `/learning`

## 🎉 Ergebnis

Jetzt solltest du sehen:
- **Keine Pflicht-Schulungen mehr**
- **Keine Skills-Schulungen mehr**
- **Keine Videos mehr**
- **Empty State** mit "Noch keine Lerninhalte verfügbar"

Als Admin siehst du zusätzlich einen Button "Inhalte erstellen".

## 📚 Neue Inhalte erstellen

Nach dem Löschen der Demo-Daten kannst du eigene Inhalte erstellen:

1. Klicke auf "Inhalte verwalten" (oder gehe zu `/learning/admin`)
2. Erstelle dein erstes Quiz oder Video
3. Die neuen Inhalte erscheinen sofort im Lernbereich

## ⚠️ Wichtig

- **Backup:** Wenn du unsicher bist, erstelle vorher ein Datenbank-Backup
- **Fortschritt:** Das Script löscht NICHT den Lernfortschritt der User
- **Rückgängig:** Gelöschte Demo-Daten können nicht wiederhergestellt werden

## 🔍 Überprüfung

Du kannst überprüfen, ob alle Demo-Daten entfernt wurden:

```sql
-- Im Supabase SQL Editor ausführen:
SELECT COUNT(*) FROM quiz_content;   -- Sollte 0 sein
SELECT COUNT(*) FROM video_content;  -- Sollte 0 sein
```

## 📝 Alternative: Manuelles Löschen

Falls du nur einzelne Items löschen möchtest:

1. Gehe zu Supabase → Table Editor
2. Wähle `quiz_content` oder `video_content`
3. Lösche einzelne Zeilen über das Kontextmenü (⋮)

## 💡 Nächste Schritte

Nach dem Entfernen der Demo-Daten:

1. ✅ Erstelle deine ersten echten Schulungsinhalte
2. ✅ Teste das Quiz-System mit echten Fragen
3. ✅ Füge Video-URLs für Schulungsvideos hinzu
4. ✅ Konfiguriere XP und Coin Rewards

---

**Hinweis:** Das Learning System ist vollständig datenbankbasiert und enthält im Code keine Mock-Daten mehr! 🚀
