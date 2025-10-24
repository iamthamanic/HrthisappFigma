# 🧪 Phase 1 - Smoke Test Checkliste

**Version:** v4.11.0  
**Datum:** 23. Oktober 2025  
**Tester:** _________  
**Datum durchgeführt:** _________

---

## 🎯 Ziel

Manuelle Smoke-Tests für Phase 1 Adapter-Refactoring:
- ✅ Realtime funktioniert über RealtimeService
- ✅ Storage funktioniert über BFF
- ✅ Keine Memory Leaks
- ✅ Keine Regressions

**Geschätzte Zeit:** 30-45 Minuten

---

## 📋 Vorbereitung

### **Environment:**
- [ ] Development Server läuft (`npm run dev`)
- [ ] Supabase Edge Function läuft (lokal oder deployed)
- [ ] Zwei Browser-Tabs vorbereitet (für Multi-User-Tests)
- [ ] Browser Developer Console offen (F12)

### **Test-Users:**
- [ ] User 1: Email/Passwort bereit
- [ ] User 2: Email/Passwort bereit (für Presence-Tests)

### **Logs aktivieren:**
```javascript
// In Browser Console:
localStorage.setItem('DEBUG', '*');
// Dann Page refresh
```

---

## 🔴 CRITICAL TESTS (Must Pass)

### **1. Login & Dashboard** 🔒

| # | Test | Expected | Actual | Status |
|---|------|----------|--------|--------|
| 1.1 | Login mit User 1 | Erfolgreicher Login, Dashboard lädt | | [ ] Pass / [ ] Fail |
| 1.2 | Dashboard Components laden | ActivityFeed, OnlineUsers, LiveStats sichtbar | | [ ] Pass / [ ] Fail |
| 1.3 | Console Errors | Keine Errors in Console | | [ ] Pass / [ ] Fail |
| 1.4 | Realtime Subscriptions | Console log: "RealtimeService" Channel erstellt | | [ ] Pass / [ ] Fail |

**Bemerkungen:**
```
_______________________________________________________
```

---

### **2. Realtime - ActivityFeed** 📡

| # | Test | Expected | Actual | Status |
|---|------|----------|--------|--------|
| 2.1 | ActivityFeed zeigt alte Activities | Liste mit Activities sichtbar | | [ ] Pass / [ ] Fail |
| 2.2 | **Realtime Test:** Neues Activity erstellen | New Activity erscheint OHNE Page Refresh | | [ ] Pass / [ ] Fail |
| 2.3 | Activity Details | Titel, Beschreibung, Timestamp korrekt | | [ ] Pass / [ ] Fail |
| 2.4 | Realtime Log | Console: "[RealtimeService] New notification: ..." | | [ ] Pass / [ ] Fail |

**How to test 2.2:**
```
1. ActivityFeed auf Dashboard öffnen
2. In anderem Tab: Video abschließen ODER Quiz bestehen
3. Zurück zu Dashboard → Activity sollte erscheinen
```

**Bemerkungen:**
```
_______________________________________________________
```

---

### **3. Realtime - OnlineUsers (Presence)** 👥

| # | Test | Expected | Actual | Status |
|---|------|----------|--------|--------|
| 3.1 | OnlineUsers Widget | Widget zeigt "0" oder andere User | | [ ] Pass / [ ] Fail |
| 3.2 | **Multi-User Test:** Zweiter User login | User 2 erscheint in User 1's OnlineUsers | | [ ] Pass / [ ] Fail |
| 3.3 | User Details | Name, Avatar, Level korrekt | | [ ] Pass / [ ] Fail |
| 3.4 | **User leaves:** User 2 logout | User 2 verschwindet aus Liste | | [ ] Pass / [ ] Fail |
| 3.5 | Presence Log | Console: "[RealtimeService] User joined/left: ..." | | [ ] Pass / [ ] Fail |

**How to test:**
```
1. Browser Tab 1: User 1 einloggen, Dashboard
2. Browser Tab 2: User 2 einloggen, Dashboard
3. Tab 1: OnlineUsers sollte User 2 zeigen
4. Tab 2 schließen
5. Tab 1: User 2 sollte verschwinden
```

**Bemerkungen:**
```
_______________________________________________________
```

---

### **4. Realtime - LiveStats** 📊

| # | Test | Expected | Actual | Status |
|---|------|----------|--------|--------|
| 4.1 | LiveStats zeigt Zahlen | Mitarbeiter, Online, Videos, Erfolge | | [ ] Pass / [ ] Fail |
| 4.2 | **Video Completed:** Video abschließen | "Videos heute" incrementet | | [ ] Pass / [ ] Fail |
| 4.3 | **Achievement Unlocked:** Achievement unlocken | "Erfolge heute" incrementet | | [ ] Pass / [ ] Fail |
| 4.4 | Stats Accuracy | Zahlen plausibel | | [ ] Pass / [ ] Fail |

**How to test:**
```
1. Dashboard: Notiere aktuelle Zahlen
2. Gehe zu Learning → Video abschließen
3. Zurück zu Dashboard → "Videos heute" sollte +1 sein
4. Achievement unlocken (z.B. "Erste Video Completed")
5. "Erfolge heute" sollte +1 sein
```

**Bemerkungen:**
```
_______________________________________________________
```

---

### **5. Realtime - Notifications** 🔔

| # | Test | Expected | Actual | Status |
|---|------|----------|--------|--------|
| 5.1 | NotificationCenter öffnen | Badge Count korrekt | | [ ] Pass / [ ] Fail |
| 5.2 | **Neue Notification:** Admin sendet Notification | Notification erscheint in Realtime | | [ ] Pass / [ ] Fail |
| 5.3 | Badge Count | Badge Count incrementet | | [ ] Pass / [ ] Fail |
| 5.4 | **Mark as Read:** Notification lesen | Badge Count decrementet | | [ ] Pass / [ ] Fail |
| 5.5 | **Delete:** Notification löschen | Verschwindet aus Liste | | [ ] Pass / [ ] Fail |

**How to test:**
```
1. User 1: NotificationCenter öffnen
2. Admin (oder User 2): Neue Notification erstellen
3. User 1: Notification sollte erscheinen (ohne Refresh)
4. Notification als gelesen markieren → Badge Count -1
5. Notification löschen → verschwindet
```

**Bemerkungen:**
```
_______________________________________________________
```

---

### **6. Storage - Document Upload** 📤

| # | Test | Expected | Actual | Status |
|---|------|----------|--------|--------|
| 6.1 | Document Upload Dialog | Dialog öffnet sich | | [ ] Pass / [ ] Fail |
| 6.2 | **Upload:** File auswählen & uploaden | Upload erfolgreich, publicUrl returned | | [ ] Pass / [ ] Fail |
| 6.3 | File erscheint in Liste | Document in Dokumenten-Liste sichtbar | | [ ] Pass / [ ] Fail |
| 6.4 | BFF Log | Console: "POST /documents/upload" → 200 OK | | [ ] Pass / [ ] Fail |

**How to test:**
```
1. Meine Daten → Tab "Meine Dokumente"
2. "Dokument hochladen" klicken
3. PDF-Datei auswählen (< 5MB)
4. Uploaden
5. Prüfe, ob Dokument in Liste erscheint
```

**Bemerkungen:**
```
_______________________________________________________
```

---

### **7. Storage - Signed URL** 🔑

| # | Test | Expected | Actual | Status |
|---|------|----------|--------|--------|
| 7.1 | **View Document:** Dokument anzeigen | Signed URL generiert, PDF öffnet | | [ ] Pass / [ ] Fail |
| 7.2 | URL Expiry | URL enthält Expiry-Timestamp | | [ ] Pass / [ ] Fail |
| 7.3 | BFF Log | Console: "GET /storage/sign" → 200 OK | | [ ] Pass / [ ] Fail |

**How to test:**
```
1. Meine Dokumente → Dokument auswählen
2. "Anzeigen" klicken
3. PDF sollte in neuem Tab öffnen
4. Browser DevTools: Network Tab prüfen
5. Request zu /storage/sign sollte 200 sein
```

**Bemerkungen:**
```
_______________________________________________________
```

---

### **8. Storage - Document Delete** 🗑️

| # | Test | Expected | Actual | Status |
|---|------|----------|--------|--------|
| 8.1 | **Delete:** Dokument löschen | Confirm-Dialog erscheint | | [ ] Pass / [ ] Fail |
| 8.2 | Delete Execution | Dokument verschwindet aus Liste | | [ ] Pass / [ ] Fail |
| 8.3 | File wirklich weg | File nicht mehr in Storage Bucket | | [ ] Pass / [ ] Fail |
| 8.4 | BFF Log | Console: "DELETE /documents" → 200 OK | | [ ] Pass / [ ] Fail |

**How to test:**
```
1. Meine Dokumente → Dokument auswählen
2. "Löschen" klicken → Confirm
3. Dokument sollte verschwinden
4. Supabase Storage UI: File wirklich weg
```

**Bemerkungen:**
```
_______________________________________________________
```

---

### **9. Profilbild Upload** 🖼️

| # | Test | Expected | Actual | Status |
|---|------|----------|--------|--------|
| 9.1 | **Upload:** Profilbild hochladen | Image Crop Dialog öffnet | | [ ] Pass / [ ] Fail |
| 9.2 | Crop & Save | Profilbild aktualisiert | | [ ] Pass / [ ] Fail |
| 9.3 | BFF Used | Request geht über BFF (nicht direkt zu Storage) | | [ ] Pass / [ ] Fail |
| 9.4 | Avatar aktualisiert | Neues Bild überall sichtbar | | [ ] Pass / [ ] Fail |

**How to test:**
```
1. Meine Daten → Profilbild-Bereich
2. "Bild hochladen" → Image auswählen
3. Crop → Speichern
4. Neues Bild sollte sichtbar sein
5. Network Tab: POST /profile-picture/upload (BFF)
```

**Bemerkungen:**
```
_______________________________________________________
```

---

## 🟡 Memory Leak Tests (Important)

### **10. Navigation & Cleanup** 🧹

| # | Test | Expected | Actual | Status |
|---|------|----------|--------|--------|
| 10.1 | **Navigate away:** Dashboard → Meine Daten | Kein Error in Console | | [ ] Pass / [ ] Fail |
| 10.2 | **Navigate back:** Meine Daten → Dashboard | Realtime reconnect, kein Error | | [ ] Pass / [ ] Fail |
| 10.3 | **Multiple navigations:** 5x hin und her | Keine Memory Leaks, Performance OK | | [ ] Pass / [ ] Fail |
| 10.4 | Cleanup Logs | Console: "[RealtimeService] Removed channel: ..." | | [ ] Pass / [ ] Fail |

**How to test:**
```
1. Dashboard → Meine Daten → Dashboard → Learning → Dashboard (5x)
2. Chrome DevTools: Memory Tab → Take Heap Snapshot
3. Nach 5 Navigationen: 2. Heap Snapshot
4. Prüfe: Detached DOM Nodes < 100
5. Prüfe: RealtimeChannels nicht leaked
```

**Bemerkungen:**
```
_______________________________________________________
```

---

### **11. Browser Console Logs** 📝

| # | Test | Expected | Actual | Status |
|---|------|----------|--------|--------|
| 11.1 | RealtimeService Logs | Channels erstellt/entfernt korrekt geloggt | | [ ] Pass / [ ] Fail |
| 11.2 | BFF Logs | Storage Requests geloggt (200 OK) | | [ ] Pass / [ ] Fail |
| 11.3 | Keine Errors | Keine unhandled Promise rejections | | [ ] Pass / [ ] Fail |
| 11.4 | Keine Warnings | Keine React Warnings | | [ ] Pass / [ ] Fail |

**Expected Logs:**
```
✅ [RealtimeService] ✅ Created new channel: table:activity_feed:all:INSERT
✅ [RealtimeService] Channel table:activity_feed:all:INSERT status: SUBSCRIBED
✅ POST /make-server-f659121d/documents/upload → 200 OK
✅ [RealtimeService] 🗑️ Removed channel: table:activity_feed:all:INSERT
```

**Bemerkungen:**
```
_______________________________________________________
```

---

## 🟢 Regression Tests (Nice to Have)

### **12. Existing Features Still Work** ✅

| # | Feature | Expected | Actual | Status |
|---|---------|----------|--------|--------|
| 12.1 | Time Tracking | Clock In/Out funktioniert | | [ ] Pass / [ ] Fail |
| 12.2 | Leave Requests | Urlaub beantragen funktioniert | | [ ] Pass / [ ] Fail |
| 12.3 | Learning Videos | Videos abspielen funktioniert | | [ ] Pass / [ ] Fail |
| 12.4 | Quiz | Quiz starten/absolvieren funktioniert | | [ ] Pass / [ ] Fail |
| 12.5 | Benefits | Benefits durchsuchen funktioniert | | [ ] Pass / [ ] Fail |
| 12.6 | Coin Wallet | Wallet anzeigen funktioniert | | [ ] Pass / [ ] Fail |
| 12.7 | Admin Features | Mitarbeiter anlegen funktioniert | | [ ] Pass / [ ] Fail |

**Bemerkungen:**
```
_______________________________________________________
```

---

## 📊 Test Summary

### **Gesamt-Ergebnis:**

| Kategorie | Tests | Passed | Failed | Pass Rate |
|-----------|-------|--------|--------|-----------|
| **CRITICAL** | 11 | __ | __ | __% |
| **Memory Leaks** | 2 | __ | __ | __% |
| **Regressions** | 7 | __ | __ | __% |
| **TOTAL** | **20** | **__** | **__** | **__%** |

### **Pass/Fail Criteria:**

- ✅ **PASS:** >= 95% der Tests bestanden (19/20)
- 🟡 **CONDITIONAL PASS:** >= 85% (17/20) - Minor Fixes nötig
- ❌ **FAIL:** < 85% - Major Issues, nicht merge-ready

### **Ergebnis:** 
- [ ] ✅ PASS (Ready to merge)
- [ ] 🟡 CONDITIONAL PASS (Minor fixes needed)
- [ ] ❌ FAIL (Not ready)

---

## 🐛 Issues Found

### **Critical Issues (Blocker):**
```
1. _________________________________________________________________

2. _________________________________________________________________

3. _________________________________________________________________
```

### **Non-Critical Issues (Can be fixed later):**
```
1. _________________________________________________________________

2. _________________________________________________________________

3. _________________________________________________________________
```

---

## 📝 Notes & Observations

**Performance:**
```
_____________________________________________________________________
_____________________________________________________________________
```

**UX:**
```
_____________________________________________________________________
_____________________________________________________________________
```

**Developer Experience:**
```
_____________________________________________________________________
_____________________________________________________________________
```

---

## ✅ Sign-Off

**Tester Name:** _______________________  
**Datum:** _______________________  
**Unterschrift:** _______________________  

**Recommendation:**
- [ ] ✅ Approved for Production
- [ ] 🟡 Approved with Minor Issues (see notes)
- [ ] ❌ Rejected (see Critical Issues)

**Next Steps:**
```
_____________________________________________________________________
_____________________________________________________________________
```

---

**Ende der Smoke-Test-Checkliste** ✅
