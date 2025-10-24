#!/usr/bin/env node

/**
 * HRTHIS DEPENDENCY SCANNER
 * =========================
 * Automated dependency vulnerability scanning
 * 
 * Part of Phase 4 - Priority 5 - Dependency Scanning
 * 
 * @description Scans npm dependencies for security vulnerabilities
 * @author HRthis Security Team
 * @version 1.0.0
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Severity levels to report
  severityLevels: ['critical', 'high', 'moderate', 'low'],
  
  // Maximum allowed vulnerabilities by severity
  maxVulnerabilities: {
    critical: 0,
    high: 0,
    moderate: 3,
    low: 10,
  },
  
  // Output directory
  outputDir: './security-reports',
  
  // Report formats
  reportFormats: ['json', 'markdown'],
};

/**
 * Color codes for console output
 */
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Log with color
 */
function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

/**
 * Create output directory if it doesn't exist
 */
function ensureOutputDir() {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    log(`✅ Created output directory: ${CONFIG.outputDir}`, 'green');
  }
}

/**
 * Run npm audit and get results
 */
function runNpmAudit() {
  log('\n🔍 Running npm audit...', 'cyan');
  
  try {
    // Run npm audit with JSON output
    const output = execSync('npm audit --json', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    
    return JSON.parse(output);
  } catch (error) {
    // npm audit exits with code 1 if vulnerabilities are found
    // We still want to parse the output
    if (error.stdout) {
      try {
        return JSON.parse(error.stdout);
      } catch (parseError) {
        log('❌ Failed to parse npm audit output', 'red');
        throw parseError;
      }
    }
    throw error;
  }
}

/**
 * Analyze audit results
 */
function analyzeResults(auditData) {
  const vulnerabilities = auditData.vulnerabilities || {};
  
  const summary = {
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
    info: 0,
    total: 0,
  };
  
  const details = [];
  
  // Count vulnerabilities by severity
  for (const [packageName, vulnData] of Object.entries(vulnerabilities)) {
    const severity = vulnData.severity?.toLowerCase() || 'info';
    
    if (summary[severity] !== undefined) {
      summary[severity]++;
      summary.total++;
    }
    
    // Store detailed information
    details.push({
      package: packageName,
      severity: severity,
      title: vulnData.via?.[0]?.title || 'Unknown vulnerability',
      range: vulnData.range || 'Unknown',
      fixAvailable: vulnData.fixAvailable || false,
      effects: vulnData.effects || [],
    });
  }
  
  return { summary, details };
}

/**
 * Check if vulnerabilities exceed thresholds
 */
function checkThresholds(summary) {
  const violations = [];
  
  for (const [severity, max] of Object.entries(CONFIG.maxVulnerabilities)) {
    const count = summary[severity] || 0;
    
    if (count > max) {
      violations.push({
        severity,
        count,
        max,
        excess: count - max,
      });
    }
  }
  
  return violations;
}

/**
 * Generate JSON report
 */
function generateJsonReport(analysis, violations, timestamp) {
  const report = {
    timestamp,
    summary: analysis.summary,
    violations,
    details: analysis.details,
    passed: violations.length === 0,
  };
  
  const filename = path.join(
    CONFIG.outputDir,
    `dependency-scan-${timestamp}.json`
  );
  
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));
  log(`✅ JSON report saved: ${filename}`, 'green');
  
  return filename;
}

/**
 * Generate Markdown report
 */
function generateMarkdownReport(analysis, violations, timestamp) {
  let markdown = `# 🔒 Dependency Security Report\n\n`;
  markdown += `**Date:** ${new Date(timestamp).toLocaleString()}\n`;
  markdown += `**Status:** ${violations.length === 0 ? '✅ PASSED' : '❌ FAILED'}\n\n`;
  
  markdown += `---\n\n`;
  
  // Summary
  markdown += `## 📊 Summary\n\n`;
  markdown += `| Severity | Count | Max Allowed | Status |\n`;
  markdown += `|----------|-------|-------------|--------|\n`;
  
  for (const severity of CONFIG.severityLevels) {
    const count = analysis.summary[severity] || 0;
    const max = CONFIG.maxVulnerabilities[severity];
    const status = count <= max ? '✅' : '❌';
    const emoji = {
      critical: '🔴',
      high: '🟠',
      moderate: '🟡',
      low: '🔵',
    }[severity] || '⚪';
    
    markdown += `| ${emoji} ${severity.toUpperCase()} | ${count} | ${max} | ${status} |\n`;
  }
  
  markdown += `\n**Total Vulnerabilities:** ${analysis.summary.total}\n\n`;
  
  // Violations
  if (violations.length > 0) {
    markdown += `---\n\n`;
    markdown += `## ❌ Policy Violations\n\n`;
    
    for (const violation of violations) {
      markdown += `### ${violation.severity.toUpperCase()}\n`;
      markdown += `- **Found:** ${violation.count}\n`;
      markdown += `- **Allowed:** ${violation.max}\n`;
      markdown += `- **Excess:** ${violation.excess}\n\n`;
    }
  }
  
  // Detailed vulnerabilities
  if (analysis.details.length > 0) {
    markdown += `---\n\n`;
    markdown += `## 🔍 Vulnerability Details\n\n`;
    
    // Group by severity
    const grouped = {};
    for (const detail of analysis.details) {
      if (!grouped[detail.severity]) {
        grouped[detail.severity] = [];
      }
      grouped[detail.severity].push(detail);
    }
    
    for (const severity of CONFIG.severityLevels) {
      const vulns = grouped[severity] || [];
      
      if (vulns.length > 0) {
        const emoji = {
          critical: '🔴',
          high: '🟠',
          moderate: '🟡',
          low: '🔵',
        }[severity] || '⚪';
        
        markdown += `### ${emoji} ${severity.toUpperCase()} (${vulns.length})\n\n`;
        
        for (const vuln of vulns) {
          markdown += `#### ${vuln.package}\n`;
          markdown += `- **Issue:** ${vuln.title}\n`;
          markdown += `- **Range:** ${vuln.range}\n`;
          markdown += `- **Fix Available:** ${vuln.fixAvailable ? '✅ Yes' : '❌ No'}\n`;
          
          if (vuln.effects && vuln.effects.length > 0) {
            markdown += `- **Affects:** ${vuln.effects.join(', ')}\n`;
          }
          
          markdown += `\n`;
        }
      }
    }
  } else {
    markdown += `---\n\n`;
    markdown += `## ✅ No Vulnerabilities Found\n\n`;
    markdown += `All dependencies are secure! 🎉\n\n`;
  }
  
  // Recommendations
  markdown += `---\n\n`;
  markdown += `## 💡 Recommendations\n\n`;
  
  if (violations.length > 0) {
    markdown += `1. **Fix Critical & High vulnerabilities immediately**\n`;
    markdown += `   \`\`\`bash\n`;
    markdown += `   npm audit fix --force\n`;
    markdown += `   \`\`\`\n\n`;
    markdown += `2. **Review and update dependencies**\n`;
    markdown += `   \`\`\`bash\n`;
    markdown += `   npm outdated\n`;
    markdown += `   npm update\n`;
    markdown += `   \`\`\`\n\n`;
    markdown += `3. **If fixes are not available, consider alternatives**\n`;
    markdown += `   - Search for alternative packages\n`;
    markdown += `   - Wait for security patches\n`;
    markdown += `   - Implement workarounds\n\n`;
  } else {
    markdown += `1. **Continue regular security scans**\n`;
    markdown += `   Run \`npm run security:scan\` weekly\n\n`;
    markdown += `2. **Keep dependencies up to date**\n`;
    markdown += `   Run \`npm outdated\` regularly\n\n`;
    markdown += `3. **Monitor security advisories**\n`;
    markdown += `   Subscribe to security newsletters\n\n`;
  }
  
  markdown += `---\n\n`;
  markdown += `**Generated by:** HRTHIS Dependency Scanner v1.0.0\n`;
  markdown += `**Report ID:** ${timestamp}\n`;
  
  const filename = path.join(
    CONFIG.outputDir,
    `dependency-scan-${timestamp}.md`
  );
  
  fs.writeFileSync(filename, markdown);
  log(`✅ Markdown report saved: ${filename}`, 'green');
  
  return filename;
}

/**
 * Display console summary
 */
function displayConsoleSummary(analysis, violations) {
  log('\n' + '='.repeat(60), 'bright');
  log('📊 DEPENDENCY SCAN RESULTS', 'bright');
  log('='.repeat(60), 'bright');
  
  log('\n🔍 Vulnerability Summary:', 'cyan');
  log(`   🔴 Critical: ${analysis.summary.critical}`, analysis.summary.critical > 0 ? 'red' : 'green');
  log(`   🟠 High:     ${analysis.summary.high}`, analysis.summary.high > 0 ? 'red' : 'green');
  log(`   🟡 Moderate: ${analysis.summary.moderate}`, analysis.summary.moderate > CONFIG.maxVulnerabilities.moderate ? 'yellow' : 'green');
  log(`   🔵 Low:      ${analysis.summary.low}`, analysis.summary.low > CONFIG.maxVulnerabilities.low ? 'yellow' : 'green');
  log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'bright');
  log(`   📦 Total:    ${analysis.summary.total}`, analysis.summary.total > 0 ? 'yellow' : 'green');
  
  if (violations.length > 0) {
    log('\n❌ POLICY VIOLATIONS:', 'red');
    
    for (const violation of violations) {
      log(`   ${violation.severity.toUpperCase()}: ${violation.count}/${violation.max} (+${violation.excess} over limit)`, 'red');
    }
    
    log('\n⚠️  Security scan FAILED - Vulnerabilities exceed policy limits', 'red');
  } else {
    log('\n✅ SECURITY SCAN PASSED', 'green');
    log('   All dependencies meet security requirements! 🎉', 'green');
  }
  
  log('\n' + '='.repeat(60), 'bright');
}

/**
 * Main execution
 */
async function main() {
  try {
    log('🚀 Starting HRTHIS Dependency Scanner...', 'bright');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    
    // Ensure output directory exists
    ensureOutputDir();
    
    // Run npm audit
    const auditData = runNpmAudit();
    log('✅ npm audit completed', 'green');
    
    // Analyze results
    log('\n📊 Analyzing results...', 'cyan');
    const analysis = analyzeResults(auditData);
    
    // Check thresholds
    const violations = checkThresholds(analysis.summary);
    
    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Generate reports
    log('\n📝 Generating reports...', 'cyan');
    
    if (CONFIG.reportFormats.includes('json')) {
      generateJsonReport(analysis, violations, timestamp);
    }
    
    if (CONFIG.reportFormats.includes('markdown')) {
      generateMarkdownReport(analysis, violations, timestamp);
    }
    
    // Display console summary
    displayConsoleSummary(analysis, violations);
    
    // Exit with appropriate code
    if (violations.length > 0) {
      log('\n⚠️  Exiting with error code 1', 'red');
      process.exit(1);
    } else {
      log('\n✅ Scan completed successfully', 'green');
      process.exit(0);
    }
    
  } catch (error) {
    log('\n❌ Error during dependency scan:', 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the scanner
main();
