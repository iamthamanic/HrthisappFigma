#!/usr/bin/env python3
"""
Batch rename remaining HRTHIS_* files to BrowoKo_*
Handles: Utils/Resilience, Utils/Security, Scripts
"""

import os
import shutil
from pathlib import Path

# File mappings
FILES_TO_RENAME = {
    # Resilience
    'utils/resilience/HRTHIS_retry.ts': 'utils/resilience/BrowoKo_retry.ts',
    'utils/resilience/HRTHIS_timeout.ts': 'utils/resilience/BrowoKo_timeout.ts',
    
    # Security
    'utils/security/HRTHIS_bruteForceProtection.ts': 'utils/security/BrowoKo_bruteForceProtection.ts',
    'utils/security/HRTHIS_passwordPolicies.ts': 'utils/security/BrowoKo_passwordPolicies.ts',
    'utils/security/HRTHIS_securityTest.ts': 'utils/security/BrowoKo_securityTest.ts',
    'utils/security/HRTHIS_sessionManager.ts': 'utils/security/BrowoKo_sessionManager.ts',
    'utils/security/HRTHIS_validation.ts': 'utils/security/BrowoKo_validation.ts',
    
    # Scripts
    'scripts/HRTHIS_buildProduction.sh': 'scripts/BrowoKo_buildProduction.sh',
    'scripts/HRTHIS_bundleAnalyzer.js': 'scripts/BrowoKo_bundleAnalyzer.js',
    'scripts/HRTHIS_dependencyScanner.js': 'scripts/BrowoKo_dependencyScanner.js',
    'scripts/HRTHIS_performanceBudgetCheck.js': 'scripts/BrowoKo_performanceBudgetCheck.js',
    'scripts/HRTHIS_securityAudit.js': 'scripts/BrowoKo_securityAudit.js',
    'scripts/HRTHIS_securityAuditComplete.js': 'scripts/BrowoKo_securityAuditComplete.js',
}

def rename_file_with_content_update(old_path: str, new_path: str):
    """Rename file and update HRTHIS_ references in content"""
    if not os.path.exists(old_path):
        print(f"⚠️  SKIP: {old_path} (not found)")
        return False
    
    # Read content
    with open(old_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace HRTHIS_ with BrowoKo_ in content
    updated_content = content.replace('HRTHIS_', 'BrowoKo_')
    updated_content = updated_content.replace('HRthis', 'Browo Koordinator')
    
    # Write to new location
    os.makedirs(os.path.dirname(new_path), exist_ok=True)
    with open(new_path, 'w', encoding='utf-8') as f:
        f.write(updated_content)
    
    # Delete old file
    os.remove(old_path)
    
    print(f"✅  {old_path} → {new_path}")
    return True

def main():
    print("🚀 Starting batch rename of HRTHIS_* files...")
    print("=" * 60)
    
    success_count = 0
    skip_count = 0
    
    for old_path, new_path in FILES_TO_RENAME.items():
        if rename_file_with_content_update(old_path, new_path):
            success_count += 1
        else:
            skip_count += 1
    
    print("=" * 60)
    print(f"✅ Successfully renamed: {success_count} files")
    print(f"⚠️  Skipped: {skip_count} files")
    print("\n📋 Next steps:")
    print("  1. Update resilience/index.ts imports")
    print("  2. Check for any HRTHIS_ references: grep -r 'HRTHIS_' --include='*.ts' --include='*.tsx'")

if __name__ == '__main__':
    main()
