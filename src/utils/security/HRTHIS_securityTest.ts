/**
 * SECURITY TEST UTILITY
 * =====================
 * Test security headers and configurations
 * 
 * Part of Phase 4 - Priority 1
 * 
 * Usage:
 * - Run this in browser console
 * - Or import in a test file
 */

/**
 * Test CSP Headers
 */
export function testCSP(): void {
  console.log('🔒 Testing Content Security Policy...\n');
  
  // Check if CSP meta tag exists
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  
  if (cspMeta) {
    console.log('✅ CSP Meta Tag Found');
    console.log('Content:', cspMeta.getAttribute('content'));
  } else {
    console.error('❌ CSP Meta Tag NOT Found');
  }
  
  console.log('\n');
}

/**
 * Test Security Headers
 */
export function testSecurityHeaders(): void {
  console.log('🛡️ Testing Security Headers...\n');
  
  // Check X-Frame-Options
  const frameOptions = document.querySelector('meta[http-equiv="X-Frame-Options"]');
  if (frameOptions) {
    console.log('✅ X-Frame-Options:', frameOptions.getAttribute('content'));
  } else {
    console.error('❌ X-Frame-Options NOT Found');
  }
  
  // Check X-Content-Type-Options
  const contentType = document.querySelector('meta[http-equiv="X-Content-Type-Options"]');
  if (contentType) {
    console.log('✅ X-Content-Type-Options:', contentType.getAttribute('content'));
  } else {
    console.error('❌ X-Content-Type-Options NOT Found');
  }
  
  console.log('\n');
}

/**
 * Test HTTPS
 */
export function testHTTPS(): void {
  console.log('🔐 Testing HTTPS...\n');
  
  if (window.location.protocol === 'https:') {
    console.log('✅ HTTPS Enabled');
  } else {
    console.warn('⚠️ Not using HTTPS (OK for local development)');
    console.log('Current protocol:', window.location.protocol);
  }
  
  console.log('\n');
}

/**
 * Test Third-Party Resources
 */
export function testThirdPartyResources(): void {
  console.log('🌐 Testing Third-Party Resources...\n');
  
  // Check for inline scripts (should be minimal)
  const inlineScripts = document.querySelectorAll('script:not([src])');
  console.log(`Inline Scripts: ${inlineScripts.length}`);
  
  if (inlineScripts.length > 0) {
    console.warn('⚠️ Inline scripts detected (consider removing for stricter CSP)');
  }
  
  // Check for inline styles (should use CSS files)
  const inlineStyles = document.querySelectorAll('style:not([data-styled])');
  console.log(`Inline Styles: ${inlineStyles.length}`);
  
  // Check for external resources
  const externalScripts = document.querySelectorAll('script[src]');
  console.log(`External Scripts: ${externalScripts.length}`);
  
  console.log('\n');
}

/**
 * Test Local Storage Security
 */
export function testLocalStorage(): void {
  console.log('💾 Testing Local Storage Security...\n');
  
  // Check for sensitive data in localStorage
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey'];
  const foundSensitive: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        foundSensitive.push(key);
      }
    }
  }
  
  if (foundSensitive.length > 0) {
    console.error('❌ Sensitive keys in localStorage:');
    foundSensitive.forEach(key => console.log(`  - ${key}`));
    console.warn('⚠️ Consider using sessionStorage or secure cookies instead');
  } else {
    console.log('✅ No obvious sensitive data in localStorage');
  }
  
  console.log('\n');
}

/**
 * Test Session Storage Security
 */
export function testSessionStorage(): void {
  console.log('📝 Testing Session Storage...\n');
  
  console.log(`Session Storage Items: ${sessionStorage.length}`);
  
  // List all keys (without values for security)
  const keys: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key) keys.push(key);
  }
  
  if (keys.length > 0) {
    console.log('Keys:', keys);
  } else {
    console.log('Session Storage is empty');
  }
  
  console.log('\n');
}

/**
 * Test Console Security (prevent console.log in production)
 */
export function testConsoleProtection(): void {
  console.log('🔇 Testing Console Protection...\n');
  
  // Check if we're in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    console.log('✅ Production mode detected');
    console.warn('⚠️ Consider disabling console.log in production');
  } else {
    console.log('✅ Development mode - console.log allowed');
  }
  
  console.log('\n');
}

/**
 * Run All Security Tests
 */
export function runAllSecurityTests(): void {
  console.log('=' .repeat(60));
  console.log('🔒 RUNNING ALL SECURITY TESTS');
  console.log('=' .repeat(60));
  console.log('\n');
  
  testCSP();
  testSecurityHeaders();
  testHTTPS();
  testThirdPartyResources();
  testLocalStorage();
  testSessionStorage();
  testConsoleProtection();
  
  console.log('=' .repeat(60));
  console.log('✅ ALL TESTS COMPLETE');
  console.log('=' .repeat(60));
}

/**
 * Quick Security Score
 */
export function getSecurityScore(): number {
  let score = 0;
  let maxScore = 7;
  
  // CSP (1 point)
  if (document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
    score++;
  }
  
  // X-Frame-Options (1 point)
  if (document.querySelector('meta[http-equiv="X-Frame-Options"]')) {
    score++;
  }
  
  // X-Content-Type-Options (1 point)
  if (document.querySelector('meta[http-equiv="X-Content-Type-Options"]')) {
    score++;
  }
  
  // HTTPS (1 point)
  if (window.location.protocol === 'https:') {
    score++;
  }
  
  // No sensitive data in localStorage (1 point)
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey'];
  let hasSensitive = false;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        hasSensitive = true;
        break;
      }
    }
  }
  if (!hasSensitive) score++;
  
  // Limited inline scripts (1 point)
  const inlineScripts = document.querySelectorAll('script:not([src])');
  if (inlineScripts.length < 5) {
    score++;
  }
  
  // Production mode check (1 point)
  if (process.env.NODE_ENV === 'production') {
    score++;
  }
  
  const percentage = Math.round((score / maxScore) * 100);
  
  console.log('\n');
  console.log('=' .repeat(60));
  console.log(`🔒 SECURITY SCORE: ${score}/${maxScore} (${percentage}%)`);
  console.log('=' .repeat(60));
  
  if (percentage >= 80) {
    console.log('✅ EXCELLENT - Your app is well secured!');
  } else if (percentage >= 60) {
    console.log('⚠️ GOOD - Some improvements recommended');
  } else {
    console.log('❌ NEEDS WORK - Important security measures missing');
  }
  
  return percentage;
}

// Export for use in console
if (typeof window !== 'undefined') {
  (window as any).securityTest = {
    runAll: runAllSecurityTests,
    testCSP,
    testSecurityHeaders,
    testHTTPS,
    testThirdPartyResources,
    testLocalStorage,
    testSessionStorage,
    testConsoleProtection,
    getScore: getSecurityScore,
  };
  
  console.log('🔒 Security Test Utility Loaded!');
  console.log('Run: securityTest.runAll() to test all security features');
  console.log('Run: securityTest.getScore() to get security score');
}
