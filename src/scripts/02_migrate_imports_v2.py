#!/usr/bin/env python3
"""
IMPORT-MIGRATION SCRIPT V2 - Phase 1
====================================
Migriert alle relativen Imports zu @ Aliassen

VORHER:  import X from '../../components/X'
NACHHER: import X from '@components/X'
"""

import os
import re
import sys
from pathlib import Path

# Alias-Mapping
ALIAS_MAP = {
    'components': '@components',
    'screens': '@screens',
    'stores': '@stores',
    'hooks': '@hooks',
    'utils': '@utils',
    'types': '@types',
    'layouts': '@layouts',
    'styles': '@styles',
    'config': '@config',
}

def migrate_imports(content: str) -> tuple[str, int]:
    """
    Migriert Imports in einem File-Content
    Returns: (neuer_content, anzahl_änderungen)
    """
    changes = 0
    new_content = content
    
    # Pattern 1: from '../../../folder/...' → from '@folder/...'
    # Pattern 2: from '../../folder/...' → from '@folder/...'
    # Pattern 3: from '../folder/...' → from '@folder/...'
    
    for folder, alias in ALIAS_MAP.items():
        # Match: from '../../components/Something'
        # Match: from "../../../screens/Admin/Something"
        # etc.
        
        patterns = [
            # Normal imports with quotes
            (rf"from\s+['\"](\.\./)+{folder}/", f"from '{alias}/"),
            (rf'from\s+["\'](\.\./)+{folder}/', f'from "{alias}/'),
            
            # Dynamic imports
            (rf"import\(['\"](\.\./)+{folder}/", f"import('{alias}/"),
            (rf'import\(["\'](\.\./)+{folder}/', f'import("{alias}/'),
        ]
        
        for pattern, replacement in patterns:
            new_text, count = re.subn(pattern, replacement, new_content)
            if count > 0:
                new_content = new_text
                changes += count
    
    return new_content, changes

def process_file(file_path: Path) -> bool:
    """
    Verarbeitet eine einzelne Datei
    Returns: True wenn Änderungen gemacht wurden
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        new_content, changes = migrate_imports(original_content)
        
        if changes > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            print(f"✅ Migrated: {file_path} ({changes} changes)")
            return True
        
        return False
        
    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")
        return False

def main():
    print("🚀 HRthis Refactoring - Phase 1: Import-Migration V2")
    print("=" * 60)
    print()
    
    # Check if we're in the right directory
    if not Path("App.tsx").exists():
        print("❌ ERROR: App.tsx not found. Run this script from project root!")
        sys.exit(1)
    
    print("📋 Scanning for TypeScript files...")
    print()
    
    # Find all .ts and .tsx files
    exclude_dirs = {'node_modules', 'dist', 'build', '.git'}
    files_to_process = []
    
    for root, dirs, files in os.walk('.'):
        # Remove excluded directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                file_path = Path(root) / file
                files_to_process.append(file_path)
    
    print(f"Found {len(files_to_process)} files to scan")
    print()
    
    # Process files
    migrated_count = 0
    for file_path in files_to_process:
        if process_file(file_path):
            migrated_count += 1
    
    print()
    print("=" * 60)
    print("✅ MIGRATION COMPLETE!")
    print("=" * 60)
    print()
    print(f"📊 Statistics:")
    print(f"   Total files scanned: {len(files_to_process)}")
    print(f"   Files migrated:      {migrated_count}")
    print()
    print("📝 Next steps:")
    print("   1. Review changes: git diff")
    print("   2. Test build:     npm run build")
    print("   3. If OK, commit:  git add -A && git commit -m 'refactor: migrate imports to @ aliases'")
    print("   4. If errors, rollback: git reset --hard HEAD~1")
    print()

if __name__ == '__main__':
    main()
