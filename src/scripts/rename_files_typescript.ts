#!/usr/bin/env ts-node
/**
 * ============================================
 * BROWO KOORDINATOR - TYPESCRIPT RENAME SCRIPT
 * ============================================
 * 
 * Dieses Script renamed alle HRTHIS_* Files zu BrowoKo_*
 * und ersetzt alle Text-Inhalte.
 * 
 * USAGE:
 * ------
 * Option 1: ts-node scripts/rename_files_typescript.ts
 * Option 2: npx tsx scripts/rename_files_typescript.ts
 * Option 3: Compile to JS and run with node
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// CONFIGURATION
// ============================================

const REPLACEMENTS: Array<[RegExp, string]> = [
  [/HRTHIS_/g, 'BrowoKo_'],
  [/HRTHISIcons/g, 'BrowoKoIcons'],
  [/HRthis/g, 'Browo Koordinator'],
  [/hrthis/g, 'browoko'],
];

const FILE_PATTERNS = {
  services: '/services/HRTHIS_*.ts',
  components: '/components/**/HRTHIS_*.tsx',
  hooks: '/hooks/HRTHIS_*.ts',
  stores: '/stores/HRTHIS_*.ts',
  utils: '/utils/**/HRTHIS_*.ts',
  config: '/config/HRTHIS_*.ts',
  schemas: '/types/schemas/HRTHIS_*.ts',
  scripts: '/scripts/HRTHIS_*',
  icons: '/components/icons/HRTHISIcons*.tsx',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function getAllFiles(dir: string, pattern: RegExp): string[] {
  const files: string[] = [];
  
  function traverse(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          traverse(fullPath);
        }
      } else if (entry.isFile() && pattern.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function renameFile(oldPath: string): string {
  const dir = path.dirname(oldPath);
  const filename = path.basename(oldPath);
  
  const newFilename = filename
    .replace(/HRTHIS_/g, 'BrowoKo_')
    .replace(/HRTHISIcons/g, 'BrowoKoIcons');
  
  const newPath = path.join(dir, newFilename);
  
  return newPath;
}

function replaceContent(content: string): string {
  let updated = content;
  
  for (const [pattern, replacement] of REPLACEMENTS) {
    updated = updated.replace(pattern, replacement);
  }
  
  return updated;
}

// ============================================
// MAIN RENAME LOGIC
// ============================================

async function renameFiles() {
  console.log('🚀 Starting Browo Koordinator Rename Process...');
  console.log('================================================\n');
  
  const rootDir = process.cwd();
  let totalRenamed = 0;
  let totalUpdated = 0;
  
  // Step 1: Find all HRTHIS_* files
  console.log('📝 STEP 1: Finding Files to Rename...');
  console.log('-------------------------------------------');
  
  const filesToRename = getAllFiles(rootDir, /HRTHIS_.*\.(ts|tsx|js|jsx|sh)$/);
  const iconFiles = getAllFiles(rootDir, /HRTHISIcons.*\.tsx$/);
  
  const allFiles = [...filesToRename, ...iconFiles];
  
  console.log(`  → Found ${allFiles.length} files to rename\n`);
  
  // Step 2: Rename files and update content
  console.log('📝 STEP 2: Renaming Files and Updating Content...');
  console.log('-------------------------------------------');
  
  for (const oldPath of allFiles) {
    try {
      // Read content
      const content = fs.readFileSync(oldPath, 'utf-8');
      
      // Replace content
      const newContent = replaceContent(content);
      
      // Generate new path
      const newPath = renameFile(oldPath);
      
      // Write to new file
      fs.writeFileSync(newPath, newContent, 'utf-8');
      
      // Delete old file (if names are different)
      if (oldPath !== newPath) {
        fs.unlinkSync(oldPath);
      }
      
      const relativePath = path.relative(rootDir, newPath);
      console.log(`  ✓ ${path.basename(oldPath)} → ${path.basename(newPath)}`);
      
      totalRenamed++;
    } catch (error) {
      console.error(`  ✗ Failed to rename ${oldPath}:`, error);
    }
  }
  
  console.log(`\n✅ Renamed ${totalRenamed} files\n`);
  
  // Step 3: Update content in ALL files (imports, references, etc.)
  console.log('📝 STEP 3: Updating Content in All Files...');
  console.log('-------------------------------------------');
  
  const allTsFiles = getAllFiles(rootDir, /\.(ts|tsx|js|jsx)$/);
  
  for (const filePath of allTsFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const newContent = replaceContent(content);
      
      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        totalUpdated++;
      }
    } catch (error) {
      console.error(`  ✗ Failed to update ${filePath}:`, error);
    }
  }
  
  console.log(`  ✓ Updated ${totalUpdated} files\n`);
  
  // Step 4: Update special files
  console.log('📝 STEP 4: Updating Special Files...');
  console.log('-------------------------------------------');
  
  // Update package.json
  const packageJsonPath = path.join(rootDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      packageJson.name = 'browo-koordinator';
      packageJson.description = 'Browo Koordinator - HR Management System';
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
      console.log('  ✓ Updated package.json');
    } catch (error) {
      console.error('  ✗ Failed to update package.json:', error);
    }
  }
  
  // Update README.md
  const readmePath = path.join(rootDir, 'README.md');
  if (fs.existsSync(readmePath)) {
    try {
      let readme = fs.readFileSync(readmePath, 'utf-8');
      readme = replaceContent(readme);
      fs.writeFileSync(readmePath, readme, 'utf-8');
      console.log('  ✓ Updated README.md');
    } catch (error) {
      console.error('  ✗ Failed to update README.md:', error);
    }
  }
  
  console.log('');
  console.log('================================================');
  console.log('✅ RENAME COMPLETE!');
  console.log('================================================');
  console.log('');
  console.log('📊 Summary:');
  console.log(`  - Files renamed: ${totalRenamed}`);
  console.log(`  - Files updated: ${totalUpdated}`);
  console.log('');
  console.log('⚠️  Next Steps:');
  console.log('  1. Review changes: git status');
  console.log('  2. Test the application: npm run dev');
  console.log('  3. Commit changes: git add . && git commit -m "Rename: HRTHIS → BrowoKo"');
  console.log('');
}

// ============================================
// RUN SCRIPT
// ============================================

renameFiles().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
