# YouTube API Auto-Duration Setup 🎥

## Feature: Automatische Video-Längen-Erkennung

Ab **v3.4.0** erkennt HRthis automatisch die Länge von YouTube Videos, wenn du einen Link einfügst!

### ✨ Was ist neu?

- **Automatische Dauer-Erkennung**: Video-Länge wird automatisch vom YouTube Link geladen
- **Titel & Beschreibung**: Werden beim Erstellen automatisch vorgeschlagen
- **Kein manuelles Eingeben**: Einfach YouTube URL einfügen und alles wird geladen
- **Funktioniert beim Erstellen & Bearbeiten**: In beiden Dialogen aktiv

---

## 🔧 Setup: YouTube Data API v3

### Schritt 1: Google Cloud Console

1. Gehe zu [Google Cloud Console](https://console.cloud.google.com/)
2. Erstelle ein neues Projekt oder wähle ein bestehendes aus
3. Navigiere zu **APIs & Services** → **Library**

### Schritt 2: YouTube Data API v3 aktivieren

1. Suche nach "YouTube Data API v3"
2. Klicke auf die API
3. Klicke auf **"Aktivieren"** (Enable)

### Schritt 3: API Key erstellen

1. Gehe zu **APIs & Services** → **Credentials**
2. Klicke auf **"Create Credentials"** → **"API Key"**
3. Kopiere den erstellten API Key
4. **Wichtig**: Schränke den Key ein:
   - Klicke auf den Key
   - Unter "API restrictions": Wähle "Restrict key"
   - Wähle nur **"YouTube Data API v3"**
   - Speichern

### Schritt 4: Environment Variable setzen

#### **Lokale Entwicklung:**

Erstelle/bearbeite `.env.local` in deinem Projekt-Root:

```env
VITE_YOUTUBE_API_KEY=dein_api_key_hier
```

#### **Figma Make (Production):**

1. Füge im Figma Make Environment die Variable hinzu:
   ```
   VITE_YOUTUBE_API_KEY=dein_api_key_hier
   ```

2. Deploye die App neu

---

## 📋 Verwendung

### Video erstellen:

1. Öffne **Lernen → Admin-Bereich** (wenn du Admin/HR/Superadmin bist)
2. Klicke **"+ Neues Video"**
3. Füge eine YouTube URL ein (z.B. `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
4. **✨ Automatisch passiert:**
   - Titel wird gefüllt
   - Beschreibung wird gefüllt
   - **Video-Länge wird automatisch erkannt**
5. Passe bei Bedarf an und speichere

### Video bearbeiten:

1. Öffne ein Video im Admin-Bereich
2. Klicke **"Bearbeiten"**
3. Wenn du die URL änderst, wird die **Dauer automatisch aktualisiert**
4. Speichere

---

## 🔒 Sicherheit & Best Practices

### API Key Schutz:

- ✅ **DO**: Key nur auf YouTube Data API v3 beschränken
- ✅ **DO**: Key in Environment Variables speichern
- ❌ **DON'T**: Key direkt im Code hardcoden
- ❌ **DON'T**: Key in Git committen

### Quota Limits:

YouTube Data API v3 hat ein **Daily Quota** von 10,000 Units (kostenlos):

- **1 Video-Metadaten-Abfrage** = 1 Unit
- Das reicht für **10,000 Video-Abfragen pro Tag**

**Wenn Quota überschritten:**
- Fehler wird angezeigt
- User kann Dauer manuell eingeben
- Am nächsten Tag (Pacific Time) wird Quota zurückgesetzt

### Quota erhöhen:

Falls du mehr brauchst:
1. Gehe zu [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **YouTube Data API v3** → **Quotas**
3. Beantrage eine Quota-Erhöhung (kostenlos, dauert 1-2 Tage)

---

## 🛠️ Troubleshooting

### "YouTube API nicht konfiguriert" Fehler:

**Problem**: `VITE_YOUTUBE_API_KEY` Environment Variable fehlt

**Lösung**:
1. Überprüfe `.env.local` (lokal) oder Figma Make Environment (production)
2. Stelle sicher, dass Variable `VITE_YOUTUBE_API_KEY` heißt
3. Starte Development Server neu nach `.env.local` Änderungen

### "Video not found" Fehler:

**Problem**: Video ist privat, gelöscht oder nicht verfügbar

**Lösung**:
- Stelle sicher, dass Video öffentlich oder unlisted ist
- Überprüfe YouTube URL (muss gültiges Format sein)

### "API error: 403" Fehler:

**Problem**: API Key nicht richtig konfiguriert oder Quota überschritten

**Lösung**:
1. Überprüfe API Key Einschränkungen in Google Cloud Console
2. Stelle sicher, dass YouTube Data API v3 aktiviert ist
3. Überprüfe Quota in Google Cloud Console

### Metadata lädt nicht:

**Fallback-Modus**: Wenn API nicht verfügbar/konfiguriert ist:
- User kann **Dauer manuell eingeben** (wie vorher)
- Kein Breaking Change - alles funktioniert weiterhin
- Nur die automatische Erkennung ist deaktiviert

---

## 📊 API Response Beispiel

Wenn du `https://www.youtube.com/watch?v=dQw4w9WgXcQ` einfügst:

```json
{
  "title": "Rick Astley - Never Gonna Give You Up (Official Video)",
  "duration": 213,
  "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
  "channelTitle": "Rick Astley",
  "description": "The official video for..."
}
```

**Automatisch gefüllt:**
- **Titel**: "Rick Astley - Never Gonna Give You Up (Official Video)"
- **Beschreibung**: "The official video for..." (erste 500 Zeichen)
- **Dauer**: 4 Minuten (213 Sekunden → aufgerundet)

---

## 🎯 Technische Details

### Implementation:

**File**: `/utils/youtubeHelper.ts`

```typescript
export async function fetchYouTubeMetadata(url: string): Promise<YouTubeVideoMetadata>
```

### API Endpoint:

```
GET https://www.googleapis.com/youtube/v3/videos
  ?id={videoId}
  &part=snippet,contentDetails
  &key={apiKey}
```

### Duration Format:

YouTube gibt Dauer in **ISO 8601 Format** zurück:
- `PT4M13S` = 4 Minuten 13 Sekunden
- `PT1H2M30S` = 1 Stunde 2 Minuten 30 Sekunden
- `PT45S` = 45 Sekunden

**Unsere Funktion** konvertiert das automatisch zu Sekunden.

---

## ✅ Checklist

Bevor du die Feature nutzt:

- [ ] YouTube Data API v3 in Google Cloud Console aktiviert
- [ ] API Key erstellt
- [ ] API Key auf YouTube Data API v3 beschränkt
- [ ] `VITE_YOUTUBE_API_KEY` in Environment gesetzt
- [ ] Development Server neugestartet (lokal)
- [ ] App deployed (production)

---

## 🚀 Nächste Schritte

Optional: Du kannst weitere YouTube API Features nutzen:

1. **Video-Thumbnails**: Schon implementiert via `getYouTubeThumbnail()`
2. **Playlist Support**: Könnte hinzugefügt werden
3. **Captions/Untertitel**: YouTube API kann auch Untertitel abrufen
4. **View Count**: Anzahl der Views anzeigen

---

## 📞 Support

Bei Fragen oder Problemen:

1. Überprüfe diese Anleitung
2. Schaue in Browser Console nach Fehlermeldungen
3. Überprüfe Google Cloud Console Logs
4. Nutze den Fallback: Dauer manuell eingeben

**Happy Learning! 🎓**
