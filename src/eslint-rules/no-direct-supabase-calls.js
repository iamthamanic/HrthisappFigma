/**
 * Custom ESLint Rule: no-direct-supabase-calls
 * =============================================
 * Prevents direct Supabase method calls (.from(), .rpc(), .storage., .channel())
 * outside of the Service Layer
 * 
 * Version: v4.11.0 - Adapter Architecture Phase 1
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow direct Supabase API calls outside services/',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/your-org/hrthis/blob/main/docs/ADAPTER_ARCHITECTURE.md'
    },
    messages: {
      directSupabaseCall: 'Direct Supabase call .{{ method }}() is forbidden in {{ layer }}. Use Service Layer (getServices()) instead.',
      directSupabaseStorage: 'Direct Supabase .storage access is forbidden in {{ layer }}. Use BFF Storage endpoints instead.',
      directSupabaseChannel: 'Direct Supabase .channel() is forbidden in {{ layer }}. Use RealtimeService instead.',
    },
    schema: [], // no options
    fixable: null, // not auto-fixable (requires manual refactoring)
  },

  create(context) {
    const filename = context.getFilename();
    
    /**
     * WHITELIST: Allow direct Supabase in these directories
     */
    const isWhitelisted = 
      filename.includes('/services/') ||
      filename.includes('/supabase/functions/') ||
      filename.includes('/utils/supabase/');
    
    if (isWhitelisted) {
      return {}; // Skip rule for whitelisted files
    }
    
    /**
     * Determine UI layer (for better error messages)
     */
    let layer = 'UI';
    if (filename.includes('/components/')) layer = 'Component';
    else if (filename.includes('/hooks/')) layer = 'Hook';
    else if (filename.includes('/stores/')) layer = 'Store';
    else if (filename.includes('/screens/')) layer = 'Screen';
    else if (filename.includes('/utils/')) layer = 'Util';
    
    /**
     * AST Visitor
     */
    return {
      /**
       * Check for MemberExpression (e.g., supabase.from())
       */
      MemberExpression(node) {
        // Check if this is a supabase.* call
        if (!node.object || !node.object.name || node.object.name !== 'supabase') {
          return;
        }
        
        const methodName = node.property.name;
        
        // Check for .from() calls
        if (methodName === 'from') {
          context.report({
            node,
            messageId: 'directSupabaseCall',
            data: { 
              method: 'from',
              layer,
            }
          });
        }
        
        // Check for .rpc() calls
        if (methodName === 'rpc') {
          context.report({
            node,
            messageId: 'directSupabaseCall',
            data: { 
              method: 'rpc',
              layer,
            }
          });
        }
        
        // Check for .storage access
        if (methodName === 'storage') {
          context.report({
            node,
            messageId: 'directSupabaseStorage',
            data: { layer }
          });
        }
        
        // Check for .channel() calls
        if (methodName === 'channel') {
          context.report({
            node,
            messageId: 'directSupabaseChannel',
            data: { layer }
          });
        }
        
        // Check for .removeChannel() calls
        if (methodName === 'removeChannel') {
          context.report({
            node,
            messageId: 'directSupabaseChannel',
            data: { layer }
          });
        }
      },
      
      /**
       * Check for CallExpression (catch edge cases)
       */
      CallExpression(node) {
        // Check for supabase.auth.* (already allowed, but could be restricted)
        // Currently: Auth is OK (already encapsulated in AuthService)
        
        // Future: Could add checks for other Supabase APIs
      },
    };
  }
};
