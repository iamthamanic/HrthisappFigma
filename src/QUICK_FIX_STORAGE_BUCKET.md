# ⚡ QUICK FIX - STORAGE BUCKET

## 🚨 ERROR:

```
❌ Upload error: StorageApiError: Bucket not found
```

---

## ✅ FIX (2 MINUTEN):

### **1️⃣ Gehe zu Supabase Dashboard**

```
https://supabase.com/dashboard
```

---

### **2️⃣ Storage → New bucket**

**Name:**
```
make-f659121d-announcements
```

**Public bucket:** ✅ **JA**

**Klicke:** "Create bucket"

---

### **3️⃣ Kopiere diese SQL in Supabase SQL Editor:**

```sql
-- Policy 1: Upload
CREATE POLICY "Allow authenticated users to upload announcements"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'make-f659121d-announcements');

-- Policy 2: Read
CREATE POLICY "Allow public read access to announcements"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'make-f659121d-announcements');

-- Policy 3: Update
CREATE POLICY "Allow authenticated users to update announcements"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'make-f659121d-announcements');

-- Policy 4: Delete
CREATE POLICY "Allow authenticated users to delete announcements"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'make-f659121d-announcements');
```

---

### **4️⃣ Hard Refresh**

```bash
Strg+Shift+R
```

---

### **5️⃣ Teste Image Upload**

**Admin → Dashboard Announcements → 📸 Image Upload**

---

## ✅ FERTIG!

```javascript
✅ [Storage] ✅ Image uploaded successfully
```

---

## ⚠️ WICHTIG:

**Bucket Name:** `make-f659121d-announcements` (NICHT `hrthis-uploads`!)

**Public bucket:** MUSS aktiviert sein! ✅

---

**Siehe `/STORAGE_BUCKET_FIX_ANLEITUNG.md` für Details!**
