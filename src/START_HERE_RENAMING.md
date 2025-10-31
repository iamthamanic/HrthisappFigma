# 🎯 START HERE - Renaming Quick Start

## ✅ Was bisher erreicht wurde: **95% KOMPLETT!**

- ✅ 14 Services umbenannt
- ✅ 140+ Components umbenannt
- ✅ 33 Hooks umbenannt
- ✅ 19 Screens umbenannt
- ✅ 7 Stores umbenannt
- ✅ 6 Schemas umbenannt
- ✅ 3 Resilience Utils umbenannt
- ✅ Layouts aktualisiert
- **= ~226 Dateien erfolgreich umbenannt!**

## ⚠️ Was noch fehlt: **5% (11 Dateien)**

- ⚠️ 5 Security Utils
- ⚠️ 2 Icon-Dateien + ~47 Imports (**KRITISCH!**)
- 🟢 6 Scripts (optional)

---

## 🚀 **OPTION 1: Alles in 1 Command fertigstellen** (EMPFOHLEN)

```bash
chmod +x COMPLETE_RENAMING_NOW.sh
./COMPLETE_RENAMING_NOW.sh
```

**Das war's! In ~2 Sekunden ist alles fertig.** ✅

---

## 🚀 **OPTION 2: Schrittweise (manuell)**

### **Schritt 1: Security Utils** (30 Sekunden)

```bash
cd utils/security
for file in HRTHIS_*.ts; do
  newname=$(echo "$file" | sed 's/HRTHIS_/BrowoKo_/')
  cat "$file" | sed 's/HRTHIS_/BrowoKo_/g' > "$newname"
  rm "$file"
  echo "✅ $file → $newname"
done
cd ../..
```

### **Schritt 2: Icons + Imports** (1 Minute) **KRITISCH!**

```bash
# Icon-Dateien umbenennen
mv components/icons/HRTHISIcons.tsx components/icons/BrowoKoIcons.tsx
mv components/icons/HRTHISIcons_NEW.tsx components/icons/BrowoKoIcons_NEW.tsx

# Icon-Datei-Inhalte aktualisieren
sed -i '' 's/HRTHISIcons/BrowoKoIcons/g' components/icons/BrowoKoIcons.tsx
sed -i '' 's/HRTHISIcons/BrowoKoIcons/g' components/icons/BrowoKoIcons_NEW.tsx

# ALLE Icon-Imports aktualisieren (47 Dateien!)
find . -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "*/node_modules/*" -exec sed -i '' \
  -e "s|from './icons/HRTHISIcons'|from './icons/BrowoKoIcons'|g" \
  -e "s|from \"./icons/HRTHISIcons\"|from \"./icons/BrowoKoIcons\"|g" \
  -e "s|from '../icons/HRTHISIcons'|from '../icons/BrowoKoIcons'|g" \
  {} +

# Component-Funktionen korrigieren
find components -name "BrowoKo_*.tsx" -exec sed -i '' \
  -e 's/export default function HRTHIS_/export default function BrowoKo_/g' \
  -e 's/interface HRTHIS_/interface BrowoKo_/g' \
  {} +
```

### **Schritt 3: Scripts** (Optional - 20 Sekunden)

```bash
cd scripts
for file in HRTHIS_*; do
  newname=$(echo "$file" | sed 's/HRTHIS_/BrowoKo_/')
  cat "$file" | sed 's/HRTHIS_/BrowoKo_/g' > "$newname"
  rm "$file"
  echo "✅ $file → $newname"
done
cd ..
```

---

## 🧪 **Verification (nach dem Renaming)**

```bash
# 1. Check für verbleibende HRTHIS Referenzen (sollte leer sein!)
grep -r 'HRTHIS_' --include='*.ts' --include='*.tsx' --exclude-dir=node_modules .

# 2. Anzahl BrowoKo-Dateien (sollte ~235+ sein)
find . -name 'BrowoKo_*' -type f | wc -l

# 3. Build testen
npm run build
```

**Erwartetes Ergebnis:**
- ✅ Keine HRTHIS_* in Code-Dateien
- ✅ ~235+ BrowoKo_* Dateien
- ✅ Build erfolgreich

---

## 📚 **Detaillierte Dokumentation**

Falls du mehr Details brauchst:

- `/RENAMING_FINAL_REPORT.md` - Kompletter Status-Report
- `/ICON_RENAMING_COMPLETE_GUIDE.md` - Icon-spezifische Anleitung
- `/UTILS_SECURITY_RENAMING_COMPLETE.md` - Security Utils Guide

---

## 🎯 **TL;DR - Minimal Steps**

```bash
# 1. Alles auf einmal
chmod +x COMPLETE_RENAMING_NOW.sh && ./COMPLETE_RENAMING_NOW.sh

# 2. Verification
grep -r 'HRTHIS_' --include='*.ts' --include='*.tsx' --exclude-dir=node_modules .

# 3. Build
npm run build

# Fertig! 🎉
```

---

## ⏱️ **Zeit-Schätzung**

- **Option 1 (Automatisch):** ~2 Sekunden
- **Option 2 (Manuell):** ~2 Minuten
- **Verification:** ~1 Minute
- **GESAMT:** ~3 Minuten bis 100% komplett!

---

## 🎊 **Nach dem Renaming**

Das Projekt ist dann vollständig von **HRthis** zu **Browo Koordinator** migriert:

- ✅ 235+ Dateien umbenannt
- ✅ Alle Services, Components, Hooks, Stores migriert
- ✅ Resilience-Patterns umbenannt
- ✅ Icon-System aktualisiert
- ✅ Alle Imports korrigiert

**Bereit für die nächste Phase: Modulare Edge Functions!** 🚀
