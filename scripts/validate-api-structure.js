#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const API_RULES = {
  // Must use proper imports
  mustImportNextTypes: /import.*\{.*NextRequest.*NextResponse.*\}.*from.*['"]next\/server['"]/,
  
  // Should use service layer (with exceptions for auth and public endpoints)
  shouldUseService: /import.*from.*['"]@\/lib\/services/,
  
  // Cannot directly create Supabase client (except in specific allowed patterns)
  noDirectSupabase: /createClient|createSupabaseClient|new SupabaseClient/,
  
  // Must use createRouteHandlerClient for server-side
  mustUseRouteHandler: /createRouteHandlerClient/,
  
  // Must have proper error handling
  shouldHaveErrorHandling: /try\s*\{[\s\S]*\}\s*catch/,
  
  // Must export proper HTTP methods
  validHttpMethods: /export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(/,
  
  // Should not have console.log in production
  noConsoleLog: /console\.log\(/
};

const EXCEPTIONS = {
  // Auth routes have different patterns
  '/api/auth/': ['shouldUseService'],
  
  // Public routes may not need service layer
  '/api/public/': ['shouldUseService'],
  
  // Upload routes have special handling
  '/api/content/upload': ['shouldUseService'],
  
  // Test/debug routes
  '/api/test/': ['noConsoleLog', 'shouldUseService'],
  '/api/debug/': ['noConsoleLog', 'shouldUseService']
};

function validateApiFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const violations = [];
  const warnings = [];
  const relativePath = path.relative(process.cwd(), filePath);
  
  // Check which exceptions apply
  const applicableExceptions = [];
  for (const [pattern, exceptions] of Object.entries(EXCEPTIONS)) {
    if (relativePath.includes(pattern)) {
      applicableExceptions.push(...exceptions);
    }
  }
  
  // Check for Next.js types
  if (!API_RULES.mustImportNextTypes.test(content)) {
    violations.push('❌ Must import NextRequest and NextResponse from next/server');
  }
  
  // Check for service layer usage (unless excepted)
  if (!applicableExceptions.includes('shouldUseService')) {
    if (!API_RULES.shouldUseService.test(content) && !relativePath.includes('/api/auth/')) {
      warnings.push('⚠️  Should use service layer instead of direct database queries');
    }
  }
  
  // Check for direct Supabase client creation
  if (API_RULES.noDirectSupabase.test(content) && !API_RULES.mustUseRouteHandler.test(content)) {
    violations.push('❌ Cannot create Supabase client directly - use createRouteHandlerClient');
  }
  
  // Check for error handling
  if (!API_RULES.shouldHaveErrorHandling.test(content)) {
    warnings.push('⚠️  Should have try-catch error handling');
  }
  
  // Check for valid HTTP methods
  if (!API_RULES.validHttpMethods.test(content)) {
    violations.push('❌ Must export valid HTTP method functions (GET, POST, PUT, DELETE, PATCH)');
  }
  
  // Check for console.log (unless in test/debug)
  if (!applicableExceptions.includes('noConsoleLog')) {
    if (API_RULES.noConsoleLog.test(content)) {
      warnings.push('⚠️  Remove console.log statements (use proper logging)');
    }
  }
  
  return { violations, warnings, file: relativePath };
}

// Main execution
if (require.main === module) {
  const files = process.argv.slice(2);
  let hasViolations = false;
  let hasWarnings = false;
  
  console.log('🔍 Validating API structure...\n');
  
  files.forEach(file => {
    if (!file.endsWith('.ts') && !file.endsWith('.tsx')) return;
    
    const result = validateApiFile(file);
    
    if (result.violations.length > 0 || result.warnings.length > 0) {
      console.log(`📄 ${result.file}`);
      
      result.violations.forEach(v => {
        console.log(`  ${v}`);
        hasViolations = true;
      });
      
      result.warnings.forEach(w => {
        console.log(`  ${w}`);
        hasWarnings = true;
      });
      
      console.log('');
    }
  });
  
  if (!hasViolations && !hasWarnings) {
    console.log('✅ All API files pass validation!\n');
  } else if (hasViolations) {
    console.log('❌ API validation failed. Please fix violations before committing.\n');
    process.exit(1);
  } else {
    console.log('⚠️  API validation passed with warnings. Consider addressing them.\n');
  }
}

module.exports = { validateApiFile };