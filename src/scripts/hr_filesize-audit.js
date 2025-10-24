#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * FILE SIZE AUDIT
 * ===============
 * Misst alle .tsx/.ts Dateien und identifiziert Refactoring-Kandidaten
 */

function countLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return content.split('\n').length;
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== 'build') {
        getAllFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

const files = getAllFiles('.');

const analyzed = files.map(file => ({
  path: file.replace(process.cwd() + '/', ''),
  lines: countLines(file),
})).sort((a, b) => b.lines - a.lines);

console.log('📊 FILE SIZE AUDIT REPORT\n');
console.log('='.repeat(80));

// Critical (> 500 lines)
const critical = analyzed.filter(f => f.lines > 500);
if (critical.length > 0) {
  console.log('\n🔴 CRITICAL (> 500 lines) - MUST REFACTOR:');
  console.log('-'.repeat(80));
  critical.forEach(f => console.log(`  ${f.lines.toString().padStart(4)} | ${f.path}`));
}

// Warning (300-500 lines)
const warning = analyzed.filter(f => f.lines > 300 && f.lines <= 500);
if (warning.length > 0) {
  console.log('\n🟡 WARNING (300-500 lines) - SHOULD REFACTOR:');
  console.log('-'.repeat(80));
  warning.forEach(f => console.log(`  ${f.lines.toString().padStart(4)} | ${f.path}`));
}

// OK (< 300 lines)
const ok = analyzed.filter(f => f.lines <= 300);
console.log('\n✅ OK (< 300 lines):');
console.log(`  ${ok.length} files`);

// Statistics
console.log('\n📈 STATISTICS:');
console.log('-'.repeat(80));
console.log(`Total files:     ${analyzed.length}`);
console.log(`Critical:        ${critical.length} (${((critical.length/analyzed.length)*100).toFixed(1)}%)`);
console.log(`Warning:         ${warning.length} (${((warning.length/analyzed.length)*100).toFixed(1)}%)`);
console.log(`OK:              ${ok.length} (${((ok.length/analyzed.length)*100).toFixed(1)}%)`);
console.log(`Average size:    ${Math.round(analyzed.reduce((sum, f) => sum + f.lines, 0) / analyzed.length)} lines`);
console.log(`Largest file:    ${analyzed[0].lines} lines (${analyzed[0].path})`);

// Save report
const report = {
  date: new Date().toISOString(),
  critical,
  warning,
  ok: ok.length,
  stats: {
    total: analyzed.length,
    criticalCount: critical.length,
    warningCount: warning.length,
    okCount: ok.length,
    averageSize: Math.round(analyzed.reduce((sum, f) => sum + f.lines, 0) / analyzed.length),
  }
};

fs.writeFileSync('FILE_SIZE_AUDIT.json', JSON.stringify(report, null, 2));
console.log('\n✅ Full report saved to FILE_SIZE_AUDIT.json');

// Detailed breakdown by category
console.log('\n📂 BREAKDOWN BY CATEGORY:');
console.log('-'.repeat(80));

const categories = {
  screens: analyzed.filter(f => f.path.startsWith('screens/')),
  components: analyzed.filter(f => f.path.startsWith('components/')),
  stores: analyzed.filter(f => f.path.startsWith('stores/')),
  hooks: analyzed.filter(f => f.path.startsWith('hooks/')),
  utils: analyzed.filter(f => f.path.startsWith('utils/')),
  layouts: analyzed.filter(f => f.path.startsWith('layouts/')),
  other: analyzed.filter(f => !f.path.match(/^(screens|components|stores|hooks|utils|layouts)\//)),
};

Object.entries(categories).forEach(([name, files]) => {
  if (files.length > 0) {
    const avgSize = Math.round(files.reduce((sum, f) => sum + f.lines, 0) / files.length);
    const criticalCount = files.filter(f => f.lines > 500).length;
    const warningCount = files.filter(f => f.lines > 300 && f.lines <= 500).length;
    
    console.log(`\n${name.toUpperCase()}:`);
    console.log(`  Total: ${files.length} files, Avg: ${avgSize} lines`);
    if (criticalCount > 0) console.log(`  🔴 Critical: ${criticalCount}`);
    if (warningCount > 0) console.log(`  🟡 Warning: ${warningCount}`);
    
    // Show top 3 largest in this category
    const top3 = files.slice(0, 3);
    top3.forEach(f => {
      const marker = f.lines > 500 ? '🔴' : f.lines > 300 ? '🟡' : '✅';
      console.log(`  ${marker} ${f.lines.toString().padStart(4)} | ${f.path}`);
    });
  }
});

console.log('\n' + '='.repeat(80));
console.log('✅ Audit complete! Check FILE_SIZE_AUDIT.json for full details.');
