# Notification System Guide

## Übersicht

Das Notification-System wurde umgestellt. Notifications werden nun direkt bei den jeweiligen Tabs/Bereichen angezeigt, nicht mehr zentral in der Navigation Bar.

## Notification Badge Positionen

- **Zeit & Urlaub**: Zeigt Genehmigungen/Ablehnungen von Urlaubsanträgen
- **Benefits**: Zeigt neue Coins und Benefits
- **Dokumente**: Zeigt neue Dokumente

## Notification Types

Verwende die folgenden `type` Werte beim Erstellen von Notifications:

### Zeit & Urlaub
```typescript
type: 'leave'
```
Beispiel:
```typescript
await supabase.from('notifications').insert({
  user_id: userId,
  title: 'Urlaubsantrag genehmigt',
  message: 'Dein Urlaubsantrag vom 15.12. - 20.12.2025 wurde genehmigt.',
  type: 'leave',
  read: false,
  action_url: '/time-and-leave'
});
```

### Benefits & Coins
```typescript
type: 'benefit' // für allgemeine Benefits
type: 'coin'    // für Coin-Belohnungen
```
Beispiel:
```typescript
await supabase.from('notifications').insert({
  user_id: userId,
  title: 'Coins erhalten! 🪙',
  message: 'Du hast 50 Coins für das Abschließen eines Quiz erhalten!',
  type: 'coin',
  read: false,
  action_url: '/benefits'
});
```

### Dokumente
```typescript
type: 'document'
```
Beispiel:
```typescript
await supabase.from('notifications').insert({
  user_id: userId,
  title: 'Neues Dokument erhalten',
  message: 'Dein Gehaltsnachweis für Dezember 2025 ist verfügbar.',
  type: 'document',
  read: false,
  action_url: '/documents'
});
```

### Weitere Typen
```typescript
type: 'achievement' // für neue Achievements
type: 'learning'    // für Lernfortschritte
type: 'INFO'        // allgemeine Informationen
type: 'SUCCESS'     // Erfolgsmeldungen
type: 'WARNING'     // Warnungen
type: 'ERROR'       // Fehlermeldungen
```

## Notification Badge Anzeige

Die Badges werden automatisch in der Navigation angezeigt:
- Rote Badge-Zahl zeigt ungelesene Notifications pro Bereich
- Maximum "9+" wenn mehr als 9 ungelesene Notifications

## API Verwendung

```typescript
import { useNotificationStore } from '../stores/notificationStore';

// Im Component
const { getUnreadCountByCategory } = useNotificationStore();

// Anzahl der ungelesenen Notifications abrufen
const leaveCount = getUnreadCountByCategory('leave');
const coinCount = getUnreadCountByCategory('coin');
const documentCount = getUnreadCountByCategory('document');
```

## Meine Daten Button

Der "Meine Daten" Button (früher Einstellungen) ist jetzt im Dashboard rechts oben zu finden.
