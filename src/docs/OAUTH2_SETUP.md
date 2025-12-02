# OAuth2 Setup Guide für Browo Koordinator

## 🔐 OAuth2 in HTTP Request Nodes

Der Browo Koordinator unterstützt OAuth2 Authentication für HTTP Request Nodes mit automatischem Token-Caching und Auto-Refresh.

---

## ✨ Features

- ✅ **Client Credentials Flow** (Machine-to-Machine)
- ✅ **Refresh Token Flow** (User-specific APIs)
- ✅ **Automatic Token Caching** im KV Store
- ✅ **Auto-Refresh** mit 5-Minuten Buffer
- ✅ **Organization-Scoped** Token Storage
- ✅ **Environment Variables** Support

---

## 📋 Setup-Schritte

### 1. Environment Variables anlegen

Navigiere zu **Admin → Workflows → Environment Variables** und erstelle folgende Variablen:

```
OAUTH_CLIENT_ID         = your-client-id-here
OAUTH_CLIENT_SECRET     = your-client-secret-here
OAUTH_TOKEN_URL         = https://oauth.example.com/token
```

**Wichtig:** Nutze Environment Variables für sensible Daten! Niemals Client Secrets direkt in die Config eintragen.

---

### 2. HTTP Request Node konfigurieren

1. **Füge einen HTTP Request Node hinzu** im Workflow-Editor
2. **Wähle OAuth2 Authentication**:
   - Auth Type: `OAuth2`
   - Grant Type: `Client Credentials` (für Server-to-Server) oder `Refresh Token`
   - Client ID: `{{ env.OAUTH_CLIENT_ID }}`
   - Client Secret: `{{ env.OAUTH_CLIENT_SECRET }}`
   - Token URL: `{{ env.OAUTH_TOKEN_URL }}`

3. **Konfiguriere die API-Anfrage**:
   - URL: `https://api.example.com/v1/users`
   - Methode: `GET`
   - Headers: (optional)
   - Body: (für POST/PUT/PATCH)

---

## 📚 Beispiel-Integrationen

### Spotify API (Client Credentials)

**Environment Variables:**
```
SPOTIFY_CLIENT_ID       = abc123...
SPOTIFY_CLIENT_SECRET   = xyz789...
SPOTIFY_TOKEN_URL       = https://accounts.spotify.com/api/token
```

**HTTP Request Node Config:**
```json
{
  "method": "GET",
  "url": "https://api.spotify.com/v1/me",
  "authType": "OAUTH2",
  "oauth2GrantType": "client_credentials",
  "oauth2ClientId": "{{ env.SPOTIFY_CLIENT_ID }}",
  "oauth2ClientSecret": "{{ env.SPOTIFY_CLIENT_SECRET }}",
  "oauth2TokenUrl": "{{ env.SPOTIFY_TOKEN_URL }}",
  "oauth2Scopes": "user-read-private user-read-email"
}
```

---

### GitHub API (Client Credentials)

**Environment Variables:**
```
GITHUB_CLIENT_ID        = Iv1.abc123...
GITHUB_CLIENT_SECRET    = secret789...
GITHUB_TOKEN_URL        = https://github.com/login/oauth/access_token
```

**HTTP Request Node Config:**
```json
{
  "method": "GET",
  "url": "https://api.github.com/user",
  "authType": "OAUTH2",
  "oauth2GrantType": "client_credentials",
  "oauth2ClientId": "{{ env.GITHUB_CLIENT_ID }}",
  "oauth2ClientSecret": "{{ env.GITHUB_CLIENT_SECRET }}",
  "oauth2TokenUrl": "{{ env.GITHUB_TOKEN_URL }}"
}
```

---

### Google API (Refresh Token Flow)

**Environment Variables:**
```
GOOGLE_CLIENT_ID        = 123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET    = GOCSPX-abc123...
GOOGLE_TOKEN_URL        = https://oauth2.googleapis.com/token
GOOGLE_REFRESH_TOKEN    = 1//abc123...
```

**HTTP Request Node Config:**
```json
{
  "method": "GET",
  "url": "https://www.googleapis.com/drive/v3/files",
  "authType": "OAUTH2",
  "oauth2GrantType": "refresh_token",
  "oauth2ClientId": "{{ env.GOOGLE_CLIENT_ID }}",
  "oauth2ClientSecret": "{{ env.GOOGLE_CLIENT_SECRET }}",
  "oauth2TokenUrl": "{{ env.GOOGLE_TOKEN_URL }}",
  "oauth2RefreshToken": "{{ env.GOOGLE_REFRESH_TOKEN }}"
}
```

---

## 🔄 Token-Caching & Refresh-Logik

### Wie funktioniert das Caching?

1. **Erster Request:** Token wird vom OAuth2 Provider abgerufen
2. **Caching:** Token wird im KV Store gespeichert mit Expiration Timestamp
3. **Folge-Requests:** Cached Token wird verwendet (solange noch gültig)
4. **Auto-Refresh:** Token wird automatisch 5 Minuten vor Ablauf refreshed

### Cache-Key Format

```
oauth_token:{organizationId}:{connectionId}
```

Der `connectionId` ist eine Kombination aus:
- Client ID
- Token URL (Base64-encoded, first 16 chars)

So werden Tokens pro Organization und API-Connection isoliert.

---

## ⚙️ Grant Types

### Client Credentials Flow

**Wann nutzen?**
- Server-to-Server Communication
- Machine-to-Machine APIs
- Keine User-spezifischen Daten

**Vorteil:** Einfach, keine User-Interaktion nötig

**Request Format:**
```
POST /token
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&scope=read:user
```

---

### Refresh Token Flow

**Wann nutzen?**
- User-spezifische APIs
- Langlebige Zugriffe auf User-Daten
- OAuth2 Apps die bereits authorized sind

**Vorteil:** Keine Re-Authorization nötig

**Request Format:**
```
POST /token
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&refresh_token={YOUR_REFRESH_TOKEN}
```

---

## 🛠️ Troubleshooting

### ❌ "OAuth2 authentication failed: HTTP 401"

**Lösung:**
- Prüfe ob Client ID & Secret korrekt sind
- Verifiziere Token URL (muss exakt stimmen)
- Checke ob Environment Variables gesetzt sind

### ❌ "Failed to obtain OAuth2 token: Invalid scope"

**Lösung:**
- Prüfe ob die angeforderten Scopes vom Provider unterstützt werden
- Verifiziere Schreibweise (meist space-separated)

### ❌ "Refresh token not available"

**Lösung:**
- Bei Refresh Token Flow: Refresh Token muss gesetzt sein
- Prüfe Environment Variable `OAUTH_REFRESH_TOKEN`

---

## 🔒 Security Best Practices

1. ✅ **Nutze immer Environment Variables** für Client Secrets
2. ✅ **Niemals Secrets in Workflows hardcoden**
3. ✅ **Beschränke Scopes** auf das notwendige Minimum
4. ✅ **Rotiere Secrets regelmäßig**
5. ✅ **Checke Token Expiration** in Production-Umgebungen

---

## 📊 Backend-Implementation

Die OAuth2-Logik ist in `/supabase/functions/BrowoKoordinator-Workflows/actionExecutor.ts` implementiert:

```typescript
// Token wird automatisch gecacht und refreshed
const accessToken = await getOAuth2Token(
  organizationId,
  connectionId,
  {
    clientId: config.oauth2ClientId,
    clientSecret: config.oauth2ClientSecret,
    tokenUrl: config.oauth2TokenUrl,
    scopes: config.oauth2Scopes,
    grantType: config.oauth2GrantType,
  }
);

// Token wird in Authorization Header gesetzt
headers['Authorization'] = `Bearer ${accessToken}`;
```

---

## 📖 Weiterführende Ressourcen

- [OAuth2 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [Client Credentials Grant](https://oauth.net/2/grant-types/client-credentials/)
- [Refresh Token Grant](https://oauth.net/2/grant-types/refresh-token/)
- [Spotify OAuth2 Docs](https://developer.spotify.com/documentation/general/guides/authorization/)
- [GitHub OAuth2 Docs](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps)
- [Google OAuth2 Docs](https://developers.google.com/identity/protocols/oauth2)

---

**Support:** Bei Fragen zu OAuth2 Setup, schau in die Backend-Logs oder kontaktiere das Dev-Team! 🚀
