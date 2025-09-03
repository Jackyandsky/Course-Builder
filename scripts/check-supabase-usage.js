#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const FORBIDDEN_PATTERNS = [
  // Direct Supabase client creation in components
  /createClientComponentClient\(\)/g,
  /createSupabaseClient\(\)/g,
  /new SupabaseClient/g,
  
  // Direct database queries in components
  /supabase\.(from|rpc|storage|auth)\(/g,
  
  // Importing from wrong locations
  /from\s+['"]@\/lib\/supabase['"](?!\/client)/g
];

const ALLOWED_PATTERNS = [
  // API calls are allowed
  /fetch\s*\(\s*['"]\/?api\//,
  
  // Importing types is OK
  /import\s+type\s+.*from.*supabase/,
  
  // Comments mentioning supabase are OK
  /\/\/.*supabase/i,
  /\/\*[\s\S]*?supabase[\s\S]*?\*\//
];

const EXCEPTIONS = {
  // Auth context needs Supabase for session management
  'AuthContext.tsx': true,
  'OptimizedAuthContext.tsx': true,
  
  // Login/signup pages have special handling
  'login/page.tsx': true,
  'signup/page.tsx': true,
  
  // Singleton pattern files
  'supabase-singleton.ts': true,
  'singleton-client.ts': true
};

function checkSupabaseUsage(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const violations = [];
  const fileName = path.basename(filePath);
  const relativePath = path.relative(process.cwd(), filePath);
  
  // Skip if file is in exceptions
  if (EXCEPTIONS[fileName] || relativePath.includes('/api/')) {
    return { violations: [], file: relativePath };
  }
  
  // Remove comments and strings to avoid false positives
  let cleanContent = content
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .replace(/\/\/.*/g, '') // Remove line comments
    .replace(/'[^']*'/g, '""') // Remove single-quoted strings
    .replace(/"[^"]*"/g, '""'); // Remove double-quoted strings
  
  // Check for forbidden patterns
  FORBIDDEN_PATTERNS.forEach(pattern => {
    const matches = cleanContent.match(pattern);
    if (matches) {
      // Check if it's actually allowed (e.g., in a fetch URL)
      const isAllowed = ALLOWED_PATTERNS.some(allowed => allowed.test(content));
      
      if (!isAllowed) {
        violations.push({
          pattern: pattern.source,
          count: matches.length,
          message: `Found direct Supabase usage: ${matches[0]}`
        });
      }
    }
  });
  
  // Check for service imports instead
  const hasApiCalls = /fetch\s*\(\s*['"]\/?api\//.test(content);
  const hasServiceImports = /import.*from.*['"]@\/lib\/services/.test(content);
  
  if (violations.length > 0 && !hasApiCalls && !hasServiceImports) {
    violations.push({
      message: '💡 Use API routes or service layer instead of direct Supabase access'
    });
  }
  
  return { violations, file: relativePath };
}

// Main execution
if (require.main === module) {
  const files = process.argv.slice(2);
  let hasViolations = false;
  
  console.log('🔍 Checking for direct Supabase usage in components...\n');
  
  files.forEach(file => {
    if (!file.endsWith('.tsx') && !file.endsWith('.ts')) return;
    
    const result = checkSupabaseUsage(file);
    
    if (result.violations.length > 0) {
      console.log(`📄 ${result.file}`);
      
      result.violations.forEach(v => {
        if (v.count) {
          console.log(`  ❌ ${v.message} (${v.count} occurrence${v.count > 1 ? 's' : ''})`);
        } else {
          console.log(`  ${v.message}`);
        }
        hasViolations = true;
      });
      
      console.log('');
    }
  });
  
  if (!hasViolations) {
    console.log('✅ No direct Supabase usage found in components!\n');
  } else {
    console.log(`❌ Direct Supabase usage detected in components.

📝 How to fix:
1. Move database operations to API routes (/app/api/...)
2. Use fetch() to call your API routes from components
3. Or use the service layer with proper patterns

Example fix:
  // ❌ Bad (in component)
  const supabase = createClientComponentClient();
  const { data } = await supabase.from('users').select();
  
  // ✅ Good (in component)
  const response = await fetch('/api/users');
  const data = await response.json();
`);
    process.exit(1);
  }
}

module.exports = { checkSupabaseUsage };