#!/usr/bin/env node

/**
 * COMPREHENSIVE IMPORT MIGRATION
 * ===============================
 * Migriert ALLE relativen Imports zu @ Aliassen
 */

const fs = require('fs');
const path = require('path');

// Alias Mapping
const ALIAS_MAP = {
  'components': '@components',
  'screens': '@screens',
  'stores': '@stores',
  'hooks': '@hooks',
  'utils': '@utils',
  'types': '@types',
  'layouts': '@layouts',
  'styles': '@styles',
  'config': '@config',
};

function migrateImports(content) {
  let newContent = content;
  let changes = 0;
  
  Object.entries(ALIAS_MAP).forEach(([folder, alias]) => {
    // Pattern 1: from '../../folder/file'
    // Pattern 2: from '../../../folder/file'
    // etc.
    
    const patterns = [
      // Normal imports with single quotes
      {
        regex: new RegExp(`from\\s+['](\\.\\.\\/)+(${folder}\\/[^']+)[']`, 'g'),
        replace: `from '${alias}/$2'`
      },
      // Normal imports with double quotes
      {
        regex: new RegExp(`from\\s+["](\\.\\.\\/)+(${folder}\\/[^"]+)["]`, 'g'),
        replace: `from "${alias}/$2"`
      },
      // Dynamic imports with single quotes
      {
        regex: new RegExp(`import\\(['](\\.\\.\\/)+(${folder}\\/[^']+)[']\\)`, 'g'),
        replace: `import('${alias}/$2')`
      },
      // Dynamic imports with double quotes
      {
        regex: new RegExp(`import\\(["](\\.\\.\\/)+(${folder}\\/[^"]+)["]\\)`, 'g'),
        replace: `import("${alias}/$2")`
      },
    ];
    
    patterns.forEach(({ regex, replace }) => {
      const result = newContent.replace(regex, replace);
      if (result !== newContent) {
        const count = (newContent.match(regex) || []).length;
        changes += count;
        newContent = result;
      }
    });
  });
  
  return { newContent, changes };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { newContent, changes } = migrateImports(content);
    
    if (changes > 0) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ ${filePath} (${changes} changes)`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
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

// Main
console.log('🚀 HRthis - Comprehensive Import Migration');
console.log('='.repeat(60));
console.log('');

if (!fs.existsSync('App.tsx')) {
  console.error('❌ ERROR: App.tsx not found. Run from project root!');
  process.exit(1);
}

console.log('📋 Scanning TypeScript files...');
const allFiles = getAllFiles('.');
console.log(`Found ${allFiles.length} files`);
console.log('');

console.log('🔄 Migrating imports...');
console.log('');

let migratedCount = 0;
allFiles.forEach(file => {
  if (processFile(file)) {
    migratedCount++;
  }
});

console.log('');
console.log('='.repeat(60));
console.log('✅ MIGRATION COMPLETE!');
console.log('='.repeat(60));
console.log('');
console.log(`📊 Statistics:`);
console.log(`   Total files:    ${allFiles.length}`);
console.log(`   Files migrated: ${migratedCount}`);
console.log(`   Unchanged:      ${allFiles.length - migratedCount}`);
console.log('');
console.log('📝 Next steps:');
console.log('   1. Review changes: git diff');
console.log('   2. Test build:     npm run build');
console.log('   3. If OK:          git add -A && git commit -m "refactor: migrate to @ import aliases"');
console.log('   4. If errors:      git reset --hard HEAD~1');
console.log('');
