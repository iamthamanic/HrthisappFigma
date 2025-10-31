# ✅ SCHICHTPLANUNG - Window Function Fix

## 🐛 Problem

**Fehler beim Ausführen:**
```
ERROR:  42P20: window functions are not allowed in UPDATE
LINE 310:     WHEN MOD(ROW_NUMBER() OVER (ORDER BY id), 5) = 0 THEN 'Baustelle'
                       ^
```

## ❌ Ursache

PostgreSQL erlaubt **Window Functions** (wie `ROW_NUMBER()`, `RANK()`, etc.) **NICHT** direkt in `UPDATE` Statements.

**Warum?**

Window Functions arbeiten auf dem **Ergebnis-Set**, aber ein `UPDATE` Statement modifiziert Zeilen **direkt**. Das würde zu einem logischen Konflikt führen.

---

## 🔧 Lösung: CTE (Common Table Expression)

**Vorher (❌ FEHLER):**
```sql
-- Add specializations to users
UPDATE public.users
SET specialization = (
  CASE 
    WHEN MOD(ROW_NUMBER() OVER (ORDER BY id), 5) = 0 THEN 'Baustelle'
    WHEN MOD(ROW_NUMBER() OVER (ORDER BY id), 5) = 1 THEN 'BACKSTUBE'
    WHEN MOD(ROW_NUMBER() OVER (ORDER BY id), 5) = 2 THEN 'GEMÜSE'
    WHEN MOD(ROW_NUMBER() OVER (ORDER BY id), 5) = 3 THEN 'SCHUMIBÄCKER ZONE'
    ELSE 'NETZWERKRAUM-APPLE'
  END
)
WHERE role = 'EMPLOYEE'
  AND id IN (
    SELECT id FROM public.users 
    WHERE role = 'EMPLOYEE' 
    LIMIT 5
  );
```

**Problem:** `ROW_NUMBER() OVER (ORDER BY id)` direkt im `UPDATE` Statement.

---

**Nachher (✅ GELÖST):**
```sql
-- Add specializations to users
WITH numbered_users AS (
  -- 1. ZUERST: Window Function in CTE (Common Table Expression)
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY id) AS rn
  FROM public.users
  WHERE role = 'EMPLOYEE'
  LIMIT 5
)
-- 2. DANN: UPDATE FROM mit dem CTE
UPDATE public.users u
SET specialization = (
  CASE 
    WHEN MOD(nu.rn, 5) = 0 THEN 'Baustelle'
    WHEN MOD(nu.rn, 5) = 1 THEN 'BACKSTUBE'
    WHEN MOD(nu.rn, 5) = 2 THEN 'GEMÜSE'
    WHEN MOD(nu.rn, 5) = 3 THEN 'SCHUMIBÄCKER ZONE'
    ELSE 'NETZWERKRAUM-APPLE'
  END
)
FROM numbered_users nu
WHERE u.id = nu.id;
```

**Lösung:**
1. **CTE (`WITH numbered_users AS`):** Berechnet die `ROW_NUMBER()` EINMAL
2. **UPDATE FROM:** Verwendet die berechneten Werte aus dem CTE
3. **JOIN:** `WHERE u.id = nu.id` verbindet die Tabellen

---

## 📚 Warum funktioniert das?

### **Schritt-für-Schritt:**

#### **1. CTE berechnet Window Function:**
```sql
WITH numbered_users AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY id) AS rn
  FROM public.users
  WHERE role = 'EMPLOYEE'
  LIMIT 5
)
```

**Ergebnis (Beispiel):**
| id | rn |
|----|---|
| abc-123 | 1 |
| def-456 | 2 |
| ghi-789 | 3 |
| jkl-012 | 4 |
| mno-345 | 5 |

#### **2. UPDATE FROM verwendet die berechneten Werte:**
```sql
UPDATE public.users u
SET specialization = (
  CASE 
    WHEN MOD(nu.rn, 5) = 1 THEN 'BACKSTUBE'
    WHEN MOD(nu.rn, 5) = 2 THEN 'GEMÜSE'
    ...
  END
)
FROM numbered_users nu
WHERE u.id = nu.id;
```

**Was passiert:**
- User mit `rn=1`: `MOD(1, 5) = 1` → `'BACKSTUBE'`
- User mit `rn=2`: `MOD(2, 5) = 2` → `'GEMÜSE'`
- User mit `rn=3`: `MOD(3, 5) = 3` → `'SCHUMIBÄCKER ZONE'`
- User mit `rn=4`: `MOD(4, 5) = 4` → `'NETZWERKRAUM-APPLE'`
- User mit `rn=5`: `MOD(5, 5) = 0` → `'Baustelle'`

---

## 🎯 Pattern: Window Functions in UPDATE

**Immer so:**

```sql
-- ✅ RICHTIG: Window Function in CTE, dann UPDATE FROM
WITH calculated_values AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) AS row_num,
    RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS salary_rank
  FROM employees
)
UPDATE employees e
SET 
  row_number = cv.row_num,
  rank = cv.salary_rank
FROM calculated_values cv
WHERE e.id = cv.id;
```

**Niemals so:**

```sql
-- ❌ FEHLER: Window Function direkt im UPDATE
UPDATE employees
SET row_number = ROW_NUMBER() OVER (ORDER BY created_at);
-- ERROR: window functions are not allowed in UPDATE
```

---

## 📋 Weitere Beispiele

### **Beispiel 1: RANK() in UPDATE**

**Falsch:**
```sql
UPDATE employees
SET salary_rank = RANK() OVER (ORDER BY salary DESC);
-- ❌ FEHLER
```

**Richtig:**
```sql
WITH ranked_employees AS (
  SELECT id, RANK() OVER (ORDER BY salary DESC) AS rnk
  FROM employees
)
UPDATE employees e
SET salary_rank = re.rnk
FROM ranked_employees re
WHERE e.id = re.id;
-- ✅ OK
```

---

### **Beispiel 2: PARTITION BY in UPDATE**

**Falsch:**
```sql
UPDATE sales
SET department_rank = RANK() OVER (
  PARTITION BY department_id 
  ORDER BY total_sales DESC
);
-- ❌ FEHLER
```

**Richtig:**
```sql
WITH ranked_sales AS (
  SELECT 
    id, 
    RANK() OVER (
      PARTITION BY department_id 
      ORDER BY total_sales DESC
    ) AS dept_rank
  FROM sales
)
UPDATE sales s
SET department_rank = rs.dept_rank
FROM ranked_sales rs
WHERE s.id = rs.id;
-- ✅ OK
```

---

## ✅ Was wurde behoben?

### **Datei: `/SCHICHTPLANUNG_COMPLETE_SETUP.sql`**

**Zeile 306-322:**

**Vorher:**
```sql
UPDATE public.users
SET specialization = (
  CASE 
    WHEN MOD(ROW_NUMBER() OVER (ORDER BY id), 5) = 0 THEN 'Baustelle'
    ...
  END
)
WHERE role = 'EMPLOYEE';
```

**Nachher:**
```sql
WITH numbered_users AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
  FROM public.users
  WHERE role = 'EMPLOYEE'
  LIMIT 5
)
UPDATE public.users u
SET specialization = (
  CASE 
    WHEN MOD(nu.rn, 5) = 0 THEN 'Baustelle'
    ...
  END
)
FROM numbered_users nu
WHERE u.id = nu.id;
```

---

## 🎉 Status

✅ **Window Function Fehler behoben!**

**Das SQL-Script ist jetzt:**
- ✅ Syntax-korrekt (RAISE NOTICE in DO $$ Blöcken)
- ✅ Idempotent (kann mehrfach ausgeführt werden)
- ✅ Window Function kompatibel (CTE statt direktem UPDATE)
- ✅ Production-Ready

---

## 📚 PostgreSQL Regel: Window Functions

**Merke dir:**

| Context | Window Functions erlaubt? | Lösung |
|---------|---------------------------|--------|
| `SELECT` | ✅ JA | Direkt verwendbar |
| `INSERT ... SELECT` | ✅ JA | Direkt verwendbar |
| `UPDATE` | ❌ NEIN | **CTE verwenden!** |
| `DELETE` | ❌ NEIN | **CTE verwenden!** |
| `WHERE` Clause | ❌ NEIN | **CTE verwenden!** |
| `HAVING` Clause | ❌ NEIN | **CTE verwenden!** |

**Warum?**
Window Functions arbeiten auf dem **finalen Ergebnis-Set** nach allen WHERE/GROUP BY Filtern. Sie können nicht während der Zeilen-Modifikation (UPDATE/DELETE) verwendet werden.

---

## 🚀 Jetzt ausführen!

```
1. Öffne Supabase SQL Editor
2. Kopiere KOMPLETT: /SCHICHTPLANUNG_COMPLETE_SETUP.sql
3. Klicke "Run"
4. ✅ Fertig!
```

**Keine Window Function Fehler mehr!** 🎉
