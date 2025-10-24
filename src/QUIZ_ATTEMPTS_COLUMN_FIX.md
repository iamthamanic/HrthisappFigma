-- ================================================
-- ✅ FIX: quiz_attempts.created_at does not exist
-- ================================================

## Problem
Error: "column quiz_attempts.created_at does not exist"

TeamMemberDetailsScreen.tsx versuchte eine nicht-existente Spalte
`created_at` von der `quiz_attempts` Tabelle zu laden.

## Lösung
✅ File: `/screens/admin/TeamMemberDetailsScreen.tsx` (Zeile 90-94)

**Vorher:**
```tsx
const { data: attemptsData, error: attemptsError } = await supabase
  .from('quiz_attempts')
  .select('id, user_id, quiz_id, score, passed, completed_at, created_at')  // ❌ created_at existiert nicht!
  .eq('user_id', userId)
  .order('completed_at', { ascending: false });
```

**Nachher:**
```tsx
const { data: attemptsData, error: attemptsError } = await supabase
  .from('quiz_attempts')
  .select('id, user_id, quiz_id, score, passed, completed_at')  // ✅ created_at entfernt
  .eq('user_id', userId)
  .order('completed_at', { ascending: false });
```

## Schema-Info
Die `quiz_attempts` Tabelle hat folgende Felder (laut `/types/database.ts`):

```tsx
export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  passed: boolean;
  answers: any;
  completed_at: string;  // ✅ Nur dieses Timestamp-Feld!
}
```

**Es gibt KEIN `created_at` Feld!** Stattdessen gibt es nur `completed_at`.

## Testen
1. Gehen Sie zu: Admin → Team-Verwaltung
2. Klicken Sie auf einen Mitarbeiter
3. Öffnen Sie den Tab: "Lernfortschritt"
4. ✅ Kein Error mehr in der Console!
5. ✅ Quiz Attempts werden angezeigt

## Fertig! ✅
Der Error sollte nicht mehr auftreten.
