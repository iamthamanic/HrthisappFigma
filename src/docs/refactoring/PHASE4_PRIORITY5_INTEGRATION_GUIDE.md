# 🔍 PHASE 4 PRIORITY 5 - DEPENDENCY SCANNING INTEGRATION GUIDE

**Phase:** Phase 4 - Security & Resilience  
**Priority:** Priority 5 - Dependency Scanning  
**Date:** 2025-01-10  
**Status:** ✅ **IMPLEMENTATION COMPLETE**

---

## 📋 **TABLE OF CONTENTS**

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Dependency Scanner](#dependency-scanner)
4. [Security Audit](#security-audit)
5. [Automation & Scheduling](#automation--scheduling)
6. [Report Management](#report-management)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 📊 **OVERVIEW**

Das Dependency Scanning System bietet umfassende Sicherheitsprüfungen für:

✅ **npm Dependencies** - Automatische Schwachstellen-Scans  
✅ **Security Patterns** - Code-Level Security Checks  
✅ **Policy Enforcement** - Automatische Threshold-Validierung  
✅ **Automated Reports** - JSON & Markdown Reports  
✅ **Manual Review Process** - Für Figma Make Umgebung

---

## 🚀 **QUICK START**

### **1. Dependency Scan ausführen**

```bash
# Einfacher Scan
node scripts/HRTHIS_dependencyScanner.js

# Mit npm script (wenn package.json existiert)
npm run security:scan
```

### **2. Security Audit ausführen**

```bash
# Code-Level Security Check
node scripts/HRTHIS_securityAudit.js

# Mit npm script
npm run security:audit
```

### **3. Beide Checks kombiniert**

```bash
# Full Security Check
node scripts/HRTHIS_dependencyScanner.js && node scripts/HRTHIS_securityAudit.js

# Mit npm script
npm run security:full
```

---

## 🔍 **DEPENDENCY SCANNER**

### **Features:**

✅ **Automatischer npm audit**  
✅ **Severity-basierte Kategorisierung**  
✅ **Policy Threshold Validation**  
✅ **Detaillierte Reports (JSON + Markdown)**  
✅ **Exit Codes für CI/CD Integration**

### **Configuration:**

Die Konfiguration befindet sich in `/scripts/HRTHIS_dependencyScanner.js`:

```javascript
const CONFIG = {
  // Maximum allowed vulnerabilities by severity
  maxVulnerabilities: {
    critical: 0,    // ❌ No critical vulnerabilities allowed
    high: 0,        // ❌ No high vulnerabilities allowed
    moderate: 3,    // ⚠️  Max 3 moderate vulnerabilities
    low: 10,        // ⚠️  Max 10 low vulnerabilities
  },
  
  // Output directory
  outputDir: './security-reports',
  
  // Report formats
  reportFormats: ['json', 'markdown'],
};
```

### **Thresholds anpassen:**

```javascript
// Für Production - Stricter
maxVulnerabilities: {
  critical: 0,
  high: 0,
  moderate: 0,
  low: 5,
}

// Für Development - Relaxed
maxVulnerabilities: {
  critical: 0,
  high: 1,
  moderate: 5,
  low: 20,
}
```

### **Report Structure:**

#### **JSON Report:**
```json
{
  "timestamp": "2025-01-10T10-30-00-000Z",
  "summary": {
    "critical": 0,
    "high": 0,
    "moderate": 2,
    "low": 5,
    "total": 7
  },
  "violations": [],
  "details": [
    {
      "package": "package-name",
      "severity": "moderate",
      "title": "Vulnerability description",
      "range": ">=1.0.0 <2.0.0",
      "fixAvailable": true,
      "effects": ["other-package"]
    }
  ],
  "passed": true
}
```

#### **Markdown Report:**
- Summary Table mit Severity Counts
- Policy Violations (falls vorhanden)
- Detailed Vulnerability List
- Recommendations
- Fix Commands

---

## 🔒 **SECURITY AUDIT**

### **Features:**

✅ **Code Pattern Scanning**  
✅ **Dangerous Pattern Detection**  
✅ **Required Implementation Checks**  
✅ **Line-Level Issue Reporting**  
✅ **Severity-based Categorization**

### **Checked Patterns:**

#### **🔴 CRITICAL - Dangerous Patterns:**

1. **eval() usage**
   ```typescript
   // ❌ DANGEROUS
   eval(userInput);
   
   // ✅ SAFE
   JSON.parse(userInput); // With proper validation
   ```

2. **Hardcoded Credentials**
   ```typescript
   // ❌ DANGEROUS
   const password = "mypassword123";
   const apiKey = "sk_live_abc123";
   
   // ✅ SAFE
   const password = process.env.PASSWORD;
   const apiKey = import.meta.env.VITE_API_KEY;
   ```

#### **🟠 HIGH - Security Risks:**

1. **dangerouslySetInnerHTML**
   ```typescript
   // ❌ RISKY
   <div dangerouslySetInnerHTML={{ __html: userContent }} />
   
   // ✅ SAFE
   import { sanitizeHtml } from './utils/security/HRTHIS_sanitization';
   <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(userContent) }} />
   ```

2. **document.write()**
   ```typescript
   // ❌ DANGEROUS
   document.write(content);
   
   // ✅ SAFE
   element.textContent = content;
   ```

#### **🟡 MODERATE - Best Practices:**

1. **Direct innerHTML Assignment**
   ```typescript
   // ⚠️  RISKY
   element.innerHTML = userInput;
   
   // ✅ SAFE
   element.textContent = userInput;
   // OR
   element.innerHTML = sanitizeHtml(userInput);
   ```

### **Required Implementations:**

Das Audit prüft, ob diese Security-Features existieren:

✅ Input Sanitization (`utils/security/HRTHIS_sanitization.ts`)  
✅ Resilience Patterns (`services/base/ApiService.ts`)  
✅ Security Headers (`utils/security/HRTHIS_securityHeaders.ts`)  
✅ Validation Utilities (`utils/security/HRTHIS_validation.ts`)

---

## ⏰ **AUTOMATION & SCHEDULING**

### **Wöchentlicher Scan (Empfohlen):**

#### **Option 1: Cron Job (Linux/Mac)**

```bash
# Erstelle cron job
crontab -e

# Füge hinzu (jeden Montag um 9 Uhr)
0 9 * * 1 cd /path/to/hrthis && node scripts/HRTHIS_dependencyScanner.js
```

#### **Option 2: Task Scheduler (Windows)**

1. Öffne Task Scheduler
2. Erstelle neue Task
3. Trigger: Wöchentlich, Montag 09:00
4. Action: Run `node scripts/HRTHIS_dependencyScanner.js`

#### **Option 3: npm scripts**

Wenn `package.json` existiert:

```json
{
  "scripts": {
    "security:scan": "node scripts/HRTHIS_dependencyScanner.js",
    "security:audit": "node scripts/HRTHIS_securityAudit.js",
    "security:full": "npm run security:scan && npm run security:audit",
    "security:fix": "npm audit fix",
    "security:fix-force": "npm audit fix --force"
  }
}
```

### **Pre-Commit Hook:**

```bash
# .git/hooks/pre-commit
#!/bin/bash

echo "🔍 Running security scan..."
node scripts/HRTHIS_securityAudit.js

if [ $? -ne 0 ]; then
  echo "❌ Security audit failed. Commit blocked."
  exit 1
fi

echo "✅ Security audit passed"
```

---

## 📊 **REPORT MANAGEMENT**

### **Report Location:**

Alle Reports werden in `/security-reports/` gespeichert:

```
security-reports/
├── dependency-scan-2025-01-10T09-00-00-000Z.json
├── dependency-scan-2025-01-10T09-00-00-000Z.md
├── security-audit-2025-01-10T09-15-00-000Z.md
└── ...
```

### **Report Rotation:**

#### **Automatische Cleanup (Optional):**

```bash
# Erstelle cleanup script
cat > scripts/cleanup-reports.sh << 'EOF'
#!/bin/bash
# Lösche Reports älter als 30 Tage
find ./security-reports -name "*.json" -mtime +30 -delete
find ./security-reports -name "*.md" -mtime +30 -delete
echo "✅ Old reports cleaned up"
EOF

chmod +x scripts/cleanup-reports.sh
```

### **Report Sharing:**

```bash
# Reports komprimieren
tar -czf security-reports-$(date +%Y-%m-%d).tar.gz security-reports/

# Per Email versenden (mit mail command)
echo "Security Reports attached" | mail -s "Weekly Security Reports" -a security-reports-*.tar.gz security@hrthis.com
```

---

## ✅ **BEST PRACTICES**

### **1. Regelmäßige Scans**

✅ **Wöchentlich:** Dependency Scan  
✅ **Bei jedem Deploy:** Full Security Check  
✅ **Monatlich:** Manual Security Review  
✅ **Nach Dependencies Update:** Sofortiger Scan

### **2. Vulnerability Response**

| Severity | Response Time | Action |
|----------|---------------|--------|
| 🔴 Critical | **Sofort** | Fix & Deploy within 4h |
| 🟠 High | **24h** | Fix & Deploy within 1 day |
| 🟡 Moderate | **1 Woche** | Schedule fix |
| 🔵 Low | **1 Monat** | Review & fix if possible |

### **3. Dependency Updates**

```bash
# 1. Check für Updates
npm outdated

# 2. Update Dependencies
npm update

# 3. Security Scan
npm run security:scan

# 4. Test
npm test

# 5. Commit wenn alles OK
git add package-lock.json
git commit -m "chore: update dependencies"
```

### **4. Vulnerability Fixes**

```bash
# 1. Try automatic fix
npm audit fix

# 2. If breaks compatibility, try force
npm audit fix --force

# 3. If still issues, manual review
npm audit

# 4. Check npm advisory
https://www.npmjs.com/advisories/XXXX

# 5. Consider alternatives
npm search alternative-package
```

### **5. Documentation**

Dokumentiere alle Security Decisions:

```markdown
## Security Decision Log

### 2025-01-10: Accepted Moderate Vulnerability in package-x

**Vulnerability:** CVE-2025-XXXX
**Severity:** Moderate
**Reason:** No fix available, low risk in our use case
**Mitigation:** Added input validation layer
**Review Date:** 2025-02-10
```

---

## 🔧 **TROUBLESHOOTING**

### **Problem: "npm audit not found"**

**Lösung:**
```bash
# Prüfe npm Version
npm --version

# Update npm
npm install -g npm@latest

# Alternative: use npx
npx npm audit
```

### **Problem: "Too many vulnerabilities"**

**Lösung:**
```bash
# 1. Identify source packages
npm audit

# 2. Update problematic packages
npm update [package-name]

# 3. Check if fix available
npm audit fix --dry-run

# 4. Apply fixes
npm audit fix

# 5. If still issues, review manually
npm ls [vulnerable-package]
```

### **Problem: "Script permission denied"**

**Lösung:**
```bash
# Make scripts executable
chmod +x scripts/HRTHIS_dependencyScanner.js
chmod +x scripts/HRTHIS_securityAudit.js

# Or run with node explicitly
node scripts/HRTHIS_dependencyScanner.js
```

### **Problem: "False positives in security audit"**

**Lösung:**

Passe die Patterns in `/scripts/HRTHIS_securityAudit.js` an:

```javascript
// Exclude specific files
const FILE_PATTERNS = {
  exclude: [
    'node_modules',
    'dist',
    'build',
    'test',           // ✅ Add test files
    '*.test.ts',      // ✅ Add test extensions
    'legacy-code',    // ✅ Add legacy code
  ],
};
```

### **Problem: "Reports not generated"**

**Lösung:**
```bash
# 1. Check permissions
ls -la security-reports/

# 2. Create directory manually
mkdir -p security-reports
chmod 755 security-reports

# 3. Run script with verbose output
node scripts/HRTHIS_dependencyScanner.js --verbose
```

---

## 📈 **METRICS & MONITORING**

### **Track diese Metrics:**

```markdown
## Weekly Security Metrics

### Week of 2025-01-10

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Critical Vulnerabilities | 0 | 0 | ✅ |
| High Vulnerabilities | 0 | 0 | ✅ |
| Moderate Vulnerabilities | 2 | ≤3 | ✅ |
| Low Vulnerabilities | 5 | ≤10 | ✅ |
| Days to Fix High | 1 | ≤1 | ✅ |
| Security Audit Pass Rate | 100% | 100% | ✅ |
```

---

## 🎯 **SUCCESS CRITERIA**

### **Phase 4 Priority 5 ist komplett wenn:**

- [x] Dependency Scanner implementiert
- [x] Security Audit implementiert
- [x] Reports werden generiert (JSON + MD)
- [x] Thresholds sind konfiguriert
- [x] Dokumentation ist vollständig
- [x] Automation-Optionen dokumentiert
- [x] Best Practices definiert
- [x] Troubleshooting Guide erstellt

---

## 📚 **RESOURCES**

### **Internal:**
- `/scripts/HRTHIS_dependencyScanner.js` - Dependency Scanner
- `/scripts/HRTHIS_securityAudit.js` - Security Audit
- `/security-reports/` - Generated Reports
- `/utils/security/` - Security Utilities

### **External:**
- [npm audit docs](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)
- [Snyk Vulnerability Database](https://snyk.io/vuln/)
- [Node Security Platform](https://nodesecurity.io/)

---

**Created:** 2025-01-10  
**Status:** ✅ COMPLETE  
**Phase:** 4 - Security & Resilience  
**Priority:** 5 - Dependency Scanning
