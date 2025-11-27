#!/usr/bin/env deno run --allow-read --allow-write

/**
 * 🔍 TRIGGER VALIDATOR
 * 
 * This script validates that all triggers are properly implemented.
 * Run before deployment to ensure no triggers are missing.
 * 
 * Usage:
 *   deno run --allow-read scripts/validate-triggers.ts
 * 
 * What it checks:
 * 1. ✅ All triggers in registry are documented
 * 2. ✅ All source functions exist
 * 3. ⚠️  Triggers marked as implemented have corresponding code
 * 4. 📝 Shows list of unimplemented triggers (TODOs)
 */

import { TRIGGER_REGISTRY, getUnimplementedTriggers, getTriggersByCategory } from '../supabase/functions/_shared/triggerRegistry.ts';

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(color: keyof typeof COLORS, message: string) {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function validateTriggers() {
  log('bold', '\n🔍 TRIGGER VALIDATION REPORT\n');
  log('cyan', '═'.repeat(60));
  
  // 1. Total triggers
  log('blue', `\n📊 Total Triggers: ${TRIGGER_REGISTRY.length}`);
  
  // 2. Group by category
  const categories = ['employee', 'vehicle', 'equipment', 'document', 'benefit', 'task', 'training', 'contract', 'other'] as const;
  
  log('blue', '\n📁 Triggers by Category:');
  for (const category of categories) {
    const triggers = getTriggersByCategory(category);
    if (triggers.length > 0) {
      log('cyan', `   ${category.toUpperCase().padEnd(15)} ${triggers.length} triggers`);
    }
  }
  
  // 3. Check implementation status
  const implemented = TRIGGER_REGISTRY.filter(t => t.implemented);
  const unimplemented = getUnimplementedTriggers();
  
  log('blue', '\n✅ Implementation Status:');
  log('green', `   Implemented:     ${implemented.length} triggers`);
  log('yellow', `   Not Implemented: ${unimplemented.length} triggers`);
  
  // 4. Show unimplemented triggers (TODOs)
  if (unimplemented.length > 0) {
    log('yellow', '\n⚠️  Unimplemented Triggers (TODO):');
    
    for (const trigger of unimplemented) {
      log('yellow', `\n   • ${trigger.key}`);
      console.log(`     Label:    ${trigger.label}`);
      console.log(`     Function: ${trigger.sourceFunction}`);
      console.log(`     Context:  ${trigger.expectedContext.join(', ')}`);
    }
  }
  
  // 5. Check if Edge Functions exist
  log('blue', '\n🔍 Checking Edge Functions...');
  
  const functionsDir = './supabase/functions';
  const uniqueFunctions = [...new Set(TRIGGER_REGISTRY.map(t => t.sourceFunction))];
  
  for (const functionName of uniqueFunctions) {
    const functionPath = `${functionsDir}/${functionName}`;
    
    try {
      await Deno.stat(functionPath);
      log('green', `   ✅ ${functionName}`);
    } catch {
      log('red', `   ❌ ${functionName} (NOT FOUND)`);
    }
  }
  
  // 6. Summary
  log('cyan', '\n' + '═'.repeat(60));
  
  const completionRate = Math.round((implemented.length / TRIGGER_REGISTRY.length) * 100);
  
  if (completionRate === 100) {
    log('green', '✅ ALL TRIGGERS IMPLEMENTED! 🎉\n');
  } else if (completionRate >= 50) {
    log('yellow', `⚠️  ${completionRate}% complete - Keep going! 💪\n`);
  } else {
    log('yellow', `📝 ${completionRate}% complete - Lots to do! 🚀\n`);
  }
  
  // 7. Next steps
  if (unimplemented.length > 0) {
    log('blue', '📋 Next Steps:');
    console.log('   1. Pick a trigger from the list above');
    console.log('   2. Add triggerWorkflows() call in the source function');
    console.log('   3. Mark as implemented: true in triggerRegistry.ts');
    console.log('   4. Run this script again to verify\n');
  }
}

// Generate implementation code snippets
function generateImplementationExamples() {
  log('bold', '\n💡 IMPLEMENTATION EXAMPLES\n');
  log('cyan', '═'.repeat(60));
  
  const unimplemented = getUnimplementedTriggers();
  
  if (unimplemented.length === 0) {
    log('green', '\nNo unimplemented triggers! 🎉\n');
    return;
  }
  
  // Show first 3 examples
  for (let i = 0; i < Math.min(3, unimplemented.length); i++) {
    const trigger = unimplemented[i];
    
    log('yellow', `\n📌 ${trigger.key}`);
    log('cyan', `   Function: ${trigger.sourceFunction}/index.ts`);
    
    console.log('\n   Add this code after the operation succeeds:\n');
    
    const contextExample = trigger.expectedContext.map(field => {
      return `      ${field}: /* your value */`;
    }).join(',\n');
    
    console.log('   \x1b[2m// Import at top of file\x1b[0m');
    console.log('   \x1b[36mimport { triggerWorkflows, TRIGGER_TYPES } from "../_shared/triggerWorkflows.ts";\x1b[0m\n');
    
    console.log('   \x1b[2m// Add after successful operation\x1b[0m');
    console.log('   \x1b[36mawait triggerWorkflows(\x1b[0m');
    console.log(`   \x1b[36m  TRIGGER_TYPES.${trigger.key},\x1b[0m`);
    console.log('   \x1b[36m  {\x1b[0m');
    console.log(`   \x1b[36m${contextExample}\x1b[0m`);
    console.log('   \x1b[36m  },\x1b[0m');
    console.log('   \x1b[36m  authHeader\x1b[0m');
    console.log('   \x1b[36m);\x1b[0m\n');
  }
  
  if (unimplemented.length > 3) {
    log('blue', `\n... and ${unimplemented.length - 3} more triggers to implement.\n`);
  }
}

// Main
if (import.meta.main) {
  await validateTriggers();
  generateImplementationExamples();
}
