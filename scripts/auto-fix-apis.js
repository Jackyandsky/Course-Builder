#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');

class APIAutoFixer {
  constructor() {
    this.fixCount = 0;
    this.errorCount = 0;
  }

  fixFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      let modified = false;

      // Fix 1: Replace createClientComponentClient with createRouteHandlerClient
      if (content.includes('createClientComponentClient')) {
        content = content.replace(
          /import\s*{\s*createClientComponentClient\s*}\s*from\s*['"]@supabase\/auth-helpers-nextjs['"]/g,
          "import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'"
        );
        content = content.replace(
          /const\s+supabase\s*=\s*createClientComponentClient\(\)/g,
          'const supabase = createRouteHandlerClient({ cookies })'
        );
        modified = true;
      }

      // Fix 2: Replace createSupabaseClient with createRouteHandlerClient
      if (content.includes('createSupabaseClient')) {
        // Add import if not present
        if (!content.includes('createRouteHandlerClient')) {
          content = "import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';\n" + content;
        }
        if (!content.includes("from 'next/headers'")) {
          content = "import { cookies } from 'next/headers';\n" + content;
        }
        content = content.replace(
          /const\s+supabase\s*=\s*createSupabaseClient\(\)/g,
          'const supabase = createRouteHandlerClient({ cookies })'
        );
        // Remove the old import
        content = content.replace(/import.*createSupabaseClient.*\n/g, '');
        modified = true;
      }

      // Fix 3: Ensure Next.js imports are present
      if (!content.includes('NextRequest') && !content.includes('NextResponse')) {
        const hasExports = /export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)/.test(content);
        if (hasExports) {
          content = "import { NextRequest, NextResponse } from 'next/server';\n" + content;
          modified = true;
        }
      }

      // Fix 4: Ensure cookies import when using createRouteHandlerClient
      if (content.includes('createRouteHandlerClient') && !content.includes("from 'next/headers'")) {
        content = "import { cookies } from 'next/headers';\n" + content;
        modified = true;
      }

      // Fix 5: Add try-catch if missing
      const functionRegex = /export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)\s*\([^)]*\)\s*{([^}]+)}/g;
      let match;
      while ((match = functionRegex.exec(content)) !== null) {
        const functionBody = match[3];
        if (!functionBody.includes('try {')) {
          const methodName = match[2];
          const newFunction = match[0].replace(
            functionBody,
            `
  try {${functionBody}
  } catch (error) {
    console.error('Error in ${methodName}:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }`
          );
          content = content.replace(match[0], newFunction);
          modified = true;
        }
      }

      // Fix 6: Remove console.log statements (except in error handlers)
      content = content.replace(/^\s*console\.log\([^)]*\);?\s*$/gm, '');

      // Fix 7: Add Database type import if using createRouteHandlerClient
      if (content.includes('createRouteHandlerClient') && !content.includes('type { Database }')) {
        content = content.replace(
          /import { createRouteHandlerClient } from '@supabase\/auth-helpers-nextjs';/,
          "import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';\nimport type { Database } from '@/types/database';"
        );
        modified = true;
      }

      // Fix 8: Update createRouteHandlerClient to include type
      content = content.replace(
        /createRouteHandlerClient\({ cookies }\)/g,
        'createRouteHandlerClient<Database>({ cookies })'
      );

      // Save if modified
      if (modified && content !== originalContent) {
        fs.writeFileSync(filePath, content);
        console.log(chalk.green(`✅ Fixed: ${filePath}`));
        this.fixCount++;
        return true;
      } else if (!modified) {
        console.log(chalk.yellow(`⏭️  No fixes needed: ${filePath}`));
      }
      return false;
    } catch (error) {
      console.error(chalk.red(`❌ Error fixing ${filePath}:`, error.message));
      this.errorCount++;
      return false;
    }
  }

  fixAllAPIs() {
    console.log(chalk.blue('\n🔧 Auto-fixing all API violations...\n'));
    
    const files = glob.sync('src/app/api/**/*.ts');
    const problematicFiles = [];

    // First, identify files with issues
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for violations
      const hasViolations = 
        content.includes('createClientComponentClient') ||
        content.includes('createSupabaseClient') ||
        (!content.includes('NextRequest') && /export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)/.test(content)) ||
        (!content.includes('try {') && /export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)/.test(content));
      
      if (hasViolations) {
        problematicFiles.push(file);
      }
    });

    console.log(chalk.yellow(`Found ${problematicFiles.length} files with violations\n`));

    // Fix each problematic file
    problematicFiles.forEach(file => {
      this.fixFile(file);
    });

    // Summary
    console.log(chalk.blue('\n📊 Summary:'));
    console.log(`  Fixed: ${chalk.green(this.fixCount)} files`);
    console.log(`  Errors: ${chalk.red(this.errorCount)} files`);
    console.log(`  Success Rate: ${((this.fixCount / problematicFiles.length) * 100).toFixed(1)}%`);
  }

  fixSpecificFiles(fileList) {
    console.log(chalk.blue('\n🔧 Fixing specific files...\n'));
    
    fileList.forEach(file => {
      if (fs.existsSync(file)) {
        this.fixFile(file);
      } else {
        console.log(chalk.red(`❌ File not found: ${file}`));
      }
    });

    console.log(chalk.blue('\n📊 Summary:'));
    console.log(`  Fixed: ${chalk.green(this.fixCount)} files`);
    console.log(`  Errors: ${chalk.red(this.errorCount)} files`);
  }
}

// Main execution
const fixer = new APIAutoFixer();
const args = process.argv.slice(2);

if (args[0] === '--all') {
  fixer.fixAllAPIs();
} else if (args.length > 0) {
  fixer.fixSpecificFiles(args);
} else {
  console.log(chalk.blue('🔧 API Auto-Fixer\n'));
  console.log('Usage:');
  console.log('  node scripts/auto-fix-apis.js --all           # Fix all APIs');
  console.log('  node scripts/auto-fix-apis.js <file1> <file2> # Fix specific files');
  console.log();
  console.log('This will fix:');
  console.log('  • Direct Supabase client usage');
  console.log('  • Missing Next.js imports');
  console.log('  • Missing error handling');
  console.log('  • Console.log statements');
}