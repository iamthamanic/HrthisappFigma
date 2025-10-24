#!/usr/bin/env node

/**
 * HRTHIS SECURITY AUDIT
 * =====================
 * Comprehensive security audit for the codebase
 * 
 * Part of Phase 4 - Priority 5 - Dependency Scanning
 * 
 * @description Performs security checks beyond dependencies
 * @author HRthis Security Team
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

// Security patterns to check
const SECURITY_PATTERNS = {
  // Dangerous patterns (should not exist)
  dangerous: [
    {
      pattern: /eval\s*\(/g,
      severity: 'critical',
      message: 'Use of eval() detected - potential code injection risk',
      recommendation: 'Remove eval() and use safer alternatives',
    },
    {
      pattern: /dangerouslySetInnerHTML/g,
      severity: 'high',
      message: 'Use of dangerouslySetInnerHTML - potential XSS risk',
      recommendation: 'Use sanitization (DOMPurify) or safer alternatives',
    },
    {
      pattern: /document\.write\s*\(/g,
      severity: 'high',
      message: 'Use of document.write() - security and performance risk',
      recommendation: 'Use modern DOM manipulation methods',
    },
    {
      pattern: /\.innerHTML\s*=/g,
      severity: 'moderate',
      message: 'Direct innerHTML assignment - potential XSS risk',
      recommendation: 'Use textContent or sanitize input with DOMPurify',
    },
    {
      pattern: /password.*=.*['"]\w+['"]/gi,
      severity: 'critical',
      message: 'Hardcoded password detected',
      recommendation: 'Remove hardcoded credentials immediately',
    },
    {
      pattern: /api[_-]?key.*=.*['"]\w+['"]/gi,
      severity: 'critical',
      message: 'Hardcoded API key detected',
      recommendation: 'Move to environment variables',
    },
  ],
  
  // Required patterns (should exist)
  required: [
    {
      pattern: /sanitize(Html|Text|Url)/g,
      file: 'utils/security/HRTHIS_sanitization.ts',
      message: 'Input sanitization utilities',
    },
    {
      pattern: /withResilience|executeWithResilience/g,
      file: 'services/base/ApiService.ts',
      message: 'Resilience patterns',
    },
  ],
};

// Files to scan
const FILE_PATTERNS = {
  include: ['.tsx', '.ts', '.jsx', '.js'],
  exclude: [
    'node_modules',
    'dist',
    'build',
    '.git',
    'security-reports',
  ],
};

/**
 * Get all files to scan
 */
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip excluded directories
      if (!FILE_PATTERNS.exclude.includes(file)) {
        getAllFiles(filePath, fileList);
      }
    } else {
      // Check if file should be included
      const ext = path.extname(file);
      if (FILE_PATTERNS.include.includes(ext)) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

/**
 * Scan file for security issues
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // Check for dangerous patterns
  for (const check of SECURITY_PATTERNS.dangerous) {
    const matches = content.match(check.pattern);
    
    if (matches) {
      // Get line numbers
      const lines = content.split('\n');
      const lineNumbers = [];
      
      lines.forEach((line, index) => {
        if (check.pattern.test(line)) {
          lineNumbers.push(index + 1);
        }
      });
      
      issues.push({
        file: filePath,
        severity: check.severity,
        message: check.message,
        recommendation: check.recommendation,
        occurrences: matches.length,
        lines: lineNumbers,
      });
    }
  }
  
  return issues;
}

/**
 * Check for required security implementations
 */
function checkRequiredPatterns() {
  const missing = [];
  
  for (const check of SECURITY_PATTERNS.required) {
    const filePath = check.file;
    
    if (!fs.existsSync(filePath)) {
      missing.push({
        file: filePath,
        message: `Missing required file: ${check.message}`,
        severity: 'high',
      });
      continue;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (!check.pattern.test(content)) {
      missing.push({
        file: filePath,
        message: `Missing required implementation: ${check.message}`,
        severity: 'moderate',
      });
    }
  }
  
  return missing;
}

/**
 * Generate security audit report
 */
function generateReport(issues, missing) {
  const timestamp = new Date().toISOString();
  
  // Count by severity
  const summary = {
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
  };
  
  issues.forEach(issue => {
    if (summary[issue.severity] !== undefined) {
      summary[issue.severity]++;
    }
  });
  
  missing.forEach(item => {
    if (summary[item.severity] !== undefined) {
      summary[item.severity]++;
    }
  });
  
  // Generate markdown report
  let markdown = `# 🔒 Security Audit Report\n\n`;
  markdown += `**Date:** ${new Date(timestamp).toLocaleString()}\n`;
  markdown += `**Status:** ${summary.critical === 0 && summary.high === 0 ? '✅ PASSED' : '❌ FAILED'}\n\n`;
  markdown += `---\n\n`;
  
  // Summary
  markdown += `## 📊 Summary\n\n`;
  markdown += `| Severity | Count |\n`;
  markdown += `|----------|-------|\n`;
  markdown += `| 🔴 Critical | ${summary.critical} |\n`;
  markdown += `| 🟠 High | ${summary.high} |\n`;
  markdown += `| 🟡 Moderate | ${summary.moderate} |\n`;
  markdown += `| 🔵 Low | ${summary.low} |\n`;
  markdown += `\n**Total Issues:** ${issues.length + missing.length}\n\n`;
  
  // Security Issues
  if (issues.length > 0) {
    markdown += `---\n\n## ⚠️ Security Issues Detected\n\n`;
    
    // Group by severity
    const grouped = {
      critical: [],
      high: [],
      moderate: [],
      low: [],
    };
    
    issues.forEach(issue => {
      if (grouped[issue.severity]) {
        grouped[issue.severity].push(issue);
      }
    });
    
    for (const [severity, severityIssues] of Object.entries(grouped)) {
      if (severityIssues.length > 0) {
        const emoji = {
          critical: '🔴',
          high: '🟠',
          moderate: '🟡',
          low: '🔵',
        }[severity];
        
        markdown += `### ${emoji} ${severity.toUpperCase()} (${severityIssues.length})\n\n`;
        
        severityIssues.forEach((issue, index) => {
          markdown += `#### ${index + 1}. ${issue.message}\n\n`;
          markdown += `**File:** \`${issue.file}\`\n\n`;
          markdown += `**Lines:** ${issue.lines.join(', ')}\n\n`;
          markdown += `**Occurrences:** ${issue.occurrences}\n\n`;
          markdown += `**Recommendation:** ${issue.recommendation}\n\n`;
          markdown += `---\n\n`;
        });
      }
    }
  }
  
  // Missing implementations
  if (missing.length > 0) {
    markdown += `## ❌ Missing Security Implementations\n\n`;
    
    missing.forEach((item, index) => {
      markdown += `${index + 1}. **${item.message}**\n`;
      markdown += `   - File: \`${item.file}\`\n`;
      markdown += `   - Severity: ${item.severity}\n\n`;
    });
  }
  
  // Recommendations
  markdown += `---\n\n## 💡 Recommendations\n\n`;
  
  if (summary.critical > 0) {
    markdown += `### 🔴 URGENT - Critical Issues\n\n`;
    markdown += `1. Fix all critical security issues immediately\n`;
    markdown += `2. Remove any hardcoded credentials or API keys\n`;
    markdown += `3. Review code for dangerous patterns (eval, innerHTML)\n\n`;
  }
  
  if (summary.high > 0) {
    markdown += `### 🟠 High Priority\n\n`;
    markdown += `1. Address high-severity issues within 48 hours\n`;
    markdown += `2. Implement proper input sanitization\n`;
    markdown += `3. Use security utilities from \`/utils/security/\`\n\n`;
  }
  
  if (summary.moderate > 0 || summary.low > 0) {
    markdown += `### 🟡 Medium Priority\n\n`;
    markdown += `1. Review and fix moderate/low severity issues\n`;
    markdown += `2. Follow security best practices\n`;
    markdown += `3. Regular security audits\n\n`;
  }
  
  if (issues.length === 0 && missing.length === 0) {
    markdown += `✅ **No security issues detected!**\n\n`;
    markdown += `Continue following security best practices:\n`;
    markdown += `- Regular dependency scans\n`;
    markdown += `- Input validation and sanitization\n`;
    markdown += `- Security headers configured\n`;
    markdown += `- Authentication hardening\n\n`;
  }
  
  markdown += `---\n\n`;
  markdown += `**Generated by:** HRTHIS Security Audit v1.0.0\n`;
  markdown += `**Report ID:** ${timestamp}\n`;
  
  return markdown;
}

/**
 * Main execution
 */
function main() {
  console.log('🔒 Starting HRTHIS Security Audit...\n');
  
  // Get all files to scan
  console.log('📁 Scanning files...');
  const files = getAllFiles('.');
  console.log(`   Found ${files.length} files to scan\n`);
  
  // Scan for issues
  console.log('🔍 Checking for security issues...');
  const allIssues = [];
  
  files.forEach(file => {
    const issues = scanFile(file);
    if (issues.length > 0) {
      allIssues.push(...issues);
    }
  });
  
  console.log(`   Found ${allIssues.length} security issues\n`);
  
  // Check for required patterns
  console.log('✅ Checking required security implementations...');
  const missing = checkRequiredPatterns();
  console.log(`   Found ${missing.length} missing implementations\n`);
  
  // Generate report
  console.log('📝 Generating security audit report...');
  const report = generateReport(allIssues, missing);
  
  // Ensure output directory
  const outputDir = './security-reports';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Save report
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = path.join(outputDir, `security-audit-${timestamp}.md`);
  fs.writeFileSync(filename, report);
  
  console.log(`✅ Report saved: ${filename}\n`);
  
  // Display summary
  console.log('='.repeat(60));
  console.log('📊 SECURITY AUDIT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Issues: ${allIssues.length + missing.length}`);
  console.log(`Security Violations: ${allIssues.length}`);
  console.log(`Missing Implementations: ${missing.length}`);
  console.log('='.repeat(60));
  
  // Exit with appropriate code
  const criticalCount = allIssues.filter(i => i.severity === 'critical').length;
  const highCount = allIssues.filter(i => i.severity === 'high').length;
  
  if (criticalCount > 0 || highCount > 0) {
    console.log('\n❌ Security audit FAILED - Critical or High severity issues found');
    process.exit(1);
  } else {
    console.log('\n✅ Security audit PASSED');
    process.exit(0);
  }
}

// Run the audit
main();
