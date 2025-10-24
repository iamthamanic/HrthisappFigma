#!/usr/bin/env node

/**
 * BUNDLE ANALYZER - HRthis
 * =========================
 * 
 * Analyzes the production build and generates a report.
 * 
 * Usage:
 *   npm run build
 *   node scripts/HRTHIS_bundleAnalyzer.js
 * 
 * Part of: Phase 5 - Priority 2 - Bundle Optimization - Step 3
 * 
 * Features:
 * - Bundle size analysis
 * - Chunk breakdown
 * - Compression estimation
 * - Performance recommendations
 * 
 * @version 1.0.0
 * @since 2025-01-10
 */

const fs = require('fs');
const path = require('path');
const { gzipSync } = require('zlib');

// ============================================================================
// CONFIGURATION
// ============================================================================

const DIST_DIR = path.join(process.cwd(), 'dist', 'assets');
const OUTPUT_FILE = path.join(process.cwd(), 'bundle-analysis.json');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file size
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (err) {
    return 0;
  }
}

/**
 * Get gzipped size
 */
function getGzippedSize(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    const compressed = gzipSync(content, { level: 9 });
    return compressed.length;
  } catch (err) {
    return 0;
  }
}

/**
 * Analyze a file
 */
function analyzeFile(filePath, fileName) {
  const size = getFileSize(filePath);
  const gzippedSize = getGzippedSize(filePath);
  
  return {
    name: fileName,
    path: filePath,
    size,
    sizeFormatted: formatBytes(size),
    gzippedSize,
    gzippedSizeFormatted: formatBytes(gzippedSize),
    compression: ((1 - gzippedSize / size) * 100).toFixed(1) + '%',
  };
}

// ============================================================================
// ANALYSIS
// ============================================================================

/**
 * Analyze all files in dist
 */
function analyzeBuild() {
  console.log(`\n${colors.cyan}======================================`);
  console.log(`  HRthis Bundle Analyzer`);
  console.log(`======================================${colors.reset}\n`);

  if (!fs.existsSync(DIST_DIR)) {
    console.error(`${colors.red}Error: dist/assets directory not found!${colors.reset}`);
    console.log(`${colors.yellow}Run 'npm run build' first.${colors.reset}\n`);
    process.exit(1);
  }

  // Get all files
  const files = fs.readdirSync(DIST_DIR);
  
  // Categorize files
  const analysis = {
    js: [],
    css: [],
    other: [],
  };

  files.forEach(file => {
    const filePath = path.join(DIST_DIR, file);
    const ext = path.extname(file).toLowerCase();
    
    if (ext === '.js') {
      analysis.js.push(analyzeFile(filePath, file));
    } else if (ext === '.css') {
      analysis.css.push(analyzeFile(filePath, file));
    } else {
      analysis.other.push(analyzeFile(filePath, file));
    }
  });

  // Sort by size (descending)
  analysis.js.sort((a, b) => b.size - a.size);
  analysis.css.sort((a, b) => b.size - a.size);
  analysis.other.sort((a, b) => b.size - a.size);

  // Calculate totals
  const totalJS = analysis.js.reduce((sum, f) => sum + f.size, 0);
  const totalJSGzipped = analysis.js.reduce((sum, f) => sum + f.gzippedSize, 0);
  const totalCSS = analysis.css.reduce((sum, f) => sum + f.size, 0);
  const totalCSSGzipped = analysis.css.reduce((sum, f) => sum + f.gzippedSize, 0);
  const totalOther = analysis.other.reduce((sum, f) => sum + f.size, 0);
  const total = totalJS + totalCSS + totalOther;
  const totalGzipped = totalJSGzipped + totalCSSGzipped;

  // ============================================================================
  // OUTPUT
  // ============================================================================

  console.log(`${colors.magenta}JavaScript Files (${analysis.js.length})${colors.reset}`);
  console.log(`${'─'.repeat(80)}`);
  
  analysis.js.forEach((file, i) => {
    const color = file.size > 200000 ? colors.red : 
                  file.size > 100000 ? colors.yellow : 
                  colors.green;
    
    console.log(`${color}${(i + 1).toString().padStart(2)}. ${file.name}${colors.reset}`);
    console.log(`    Size: ${file.sizeFormatted.padEnd(10)} Gzipped: ${file.gzippedSizeFormatted.padEnd(10)} (${file.compression} compressed)`);
  });
  
  console.log(`\n${colors.cyan}Total JS: ${formatBytes(totalJS)} → ${formatBytes(totalJSGzipped)} gzipped${colors.reset}\n`);

  if (analysis.css.length > 0) {
    console.log(`${colors.magenta}CSS Files (${analysis.css.length})${colors.reset}`);
    console.log(`${'─'.repeat(80)}`);
    
    analysis.css.forEach((file, i) => {
      console.log(`${colors.green}${(i + 1).toString().padStart(2)}. ${file.name}${colors.reset}`);
      console.log(`    Size: ${file.sizeFormatted.padEnd(10)} Gzipped: ${file.gzippedSizeFormatted.padEnd(10)} (${file.compression} compressed)`);
    });
    
    console.log(`\n${colors.cyan}Total CSS: ${formatBytes(totalCSS)} → ${formatBytes(totalCSSGzipped)} gzipped${colors.reset}\n`);
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================

  console.log(`${colors.cyan}======================================`);
  console.log(`  Summary`);
  console.log(`======================================${colors.reset}\n`);

  console.log(`${colors.blue}Total Bundle Size:${colors.reset}`);
  console.log(`  Uncompressed: ${formatBytes(total)}`);
  console.log(`  Gzipped:      ${formatBytes(totalGzipped)}`);
  console.log(`  Compression:  ${((1 - totalGzipped / total) * 100).toFixed(1)}%\n`);

  // ============================================================================
  // RECOMMENDATIONS
  // ============================================================================

  console.log(`${colors.yellow}Recommendations:${colors.reset}\n`);

  const largeChunks = analysis.js.filter(f => f.size > 200000);
  if (largeChunks.length > 0) {
    console.log(`  ${colors.red}⚠${colors.reset}  Large chunks detected (>${formatBytes(200000)}):`);
    largeChunks.forEach(chunk => {
      console.log(`     - ${chunk.name} (${chunk.sizeFormatted})`);
    });
    console.log(`     ${colors.yellow}Consider code-splitting or lazy loading${colors.reset}\n`);
  }

  const mainBundle = analysis.js.find(f => f.name.includes('index'));
  if (mainBundle && mainBundle.size > 500000) {
    console.log(`  ${colors.red}⚠${colors.reset}  Main bundle is large (${mainBundle.sizeFormatted})`);
    console.log(`     ${colors.yellow}Consider splitting vendor code${colors.reset}\n`);
  }

  if (totalJSGzipped < 400000) {
    console.log(`  ${colors.green}✓${colors.reset}  Excellent bundle size! (<400 KB gzipped)\n`);
  } else if (totalJSGzipped < 600000) {
    console.log(`  ${colors.yellow}◐${colors.reset}  Good bundle size (400-600 KB gzipped)\n`);
  } else {
    console.log(`  ${colors.red}✗${colors.reset}  Large bundle size (>600 KB gzipped)\n`);
  }

  // ============================================================================
  // SAVE REPORT
  // ============================================================================

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total,
      totalFormatted: formatBytes(total),
      totalGzipped,
      totalGzippedFormatted: formatBytes(totalGzipped),
      compression: ((1 - totalGzipped / total) * 100).toFixed(1) + '%',
    },
    js: {
      count: analysis.js.length,
      total: totalJS,
      totalFormatted: formatBytes(totalJS),
      totalGzipped: totalJSGzipped,
      totalGzippedFormatted: formatBytes(totalJSGzipped),
      files: analysis.js,
    },
    css: {
      count: analysis.css.length,
      total: totalCSS,
      totalFormatted: formatBytes(totalCSS),
      totalGzipped: totalCSSGzipped,
      totalGzippedFormatted: formatBytes(totalCSSGzipped),
      files: analysis.css,
    },
    recommendations: [],
  };

  // Add recommendations to report
  if (largeChunks.length > 0) {
    report.recommendations.push({
      type: 'warning',
      message: `${largeChunks.length} large chunks detected (>200 KB)`,
      chunks: largeChunks.map(c => c.name),
    });
  }

  if (mainBundle && mainBundle.size > 500000) {
    report.recommendations.push({
      type: 'warning',
      message: 'Main bundle is large (>500 KB)',
      chunk: mainBundle.name,
    });
  }

  if (totalJSGzipped < 400000) {
    report.recommendations.push({
      type: 'success',
      message: 'Excellent bundle size (<400 KB gzipped)',
    });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));
  console.log(`${colors.green}Report saved to: ${OUTPUT_FILE}${colors.reset}\n`);
}

// ============================================================================
// RUN
// ============================================================================

analyzeBuild();
