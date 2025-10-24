-- ================================================
-- ✅ FIX: React Hooks Error - BreakManager
-- ================================================

## Problem
```
Warning: React has detected a change in the order of Hooks called by BreakManager.
Error: Rendered more hooks than during the previous render.
```

## Root Cause
❌ **useEffect Hook wurde NACH einem Early Return aufgerufen!**

Das verstößt gegen die **Rules of Hooks**:
- Hooks müssen IMMER in der gleichen Reihenfolge aufgerufen werden
- Hooks dürfen NICHT nach Early Returns stehen
- Hooks dürfen NICHT in if-Statements oder Loops stehen

## Code-Problem (Vorher)

```tsx
// BreakManager.tsx (Zeile 106-139)

const isWorking = todayRecord?.time_in && !todayRecord.time_out;

if (!isWorking) {
  return <Card>...</Card>;  // ❌ EARLY RETURN
}

// ❌ useEffect NACH dem Early Return - das ist VERBOTEN!
useEffect(() => {
  if (profile) {
    console.log('Debug:', profile);
  }
}, [profile?.id]);
```

**Wenn `!isWorking` true ist:**
1. Component returned früh (Zeile 108)
2. useEffect wird NICHT aufgerufen
3. Beim nächsten Render (wenn `isWorking` true ist) wird useEffect plötzlich aufgerufen
4. React erkennt: "Hey, die Anzahl der Hooks hat sich geändert!" → ERROR!

## Lösung (Nachher)

```tsx
// BreakManager.tsx - KORRIGIERT ✅

// 1. useEffect VOR dem Early Return verschieben
useEffect(() => {
  if (profile) {
    console.log('Debug:', profile);
  }
}, [profile?.id]);

// 2. Variablen berechnen VOR dem Early Return
const isWorking = todayRecord?.time_in && !todayRecord.time_out;
const hasAutomaticBreaks = profile?.break_auto === true;
const automaticBreakMinutes = profile?.break_minutes || 30;

// 3. Early Return NACH allen Hooks
if (!isWorking) {
  return <Card>...</Card>;
}
```

## Rules of Hooks (Erinnerung)

✅ **DO:**
- Alle Hooks am Anfang der Komponente aufrufen
- Hooks in der gleichen Reihenfolge aufrufen
- Variablen/Funktionen vor Early Returns definieren

❌ **DON'T:**
- Hooks nach Early Returns aufrufen
- Hooks in if-Statements aufrufen
- Hooks in Loops aufrufen
- Hooks in nested Functions aufrufen

## File Changed
- `/components/BreakManager.tsx` (Zeile 32-140)

## Testing
1. Gehen Sie zu: Zeiterfassung & Urlaub
2. Wechseln Sie zwischen den Tabs "Zeiterfassung" und "Pausen"
3. ✅ Kein Hook Error mehr in der Console!
4. ✅ Component rendert korrekt

## Fertig! ✅
Der React Hooks Error ist behoben.
