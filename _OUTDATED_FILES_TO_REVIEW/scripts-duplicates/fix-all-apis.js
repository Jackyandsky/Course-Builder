#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');
// Chalk v5 uses ESM, so we'll use colors instead for simplicity

class APIBatchFixer {
  constructor() {
    this.fixed = [];
    this.failed = [];
    this.skipped = [];
  }

  addMissingImports(content) {
    let modified = false;
    
    // Add NextRequest if missing
    if (!content.includes('NextRequest') && /export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)/.test(content)) {
      if (content.includes('NextResponse')) {
        content = content.replace(
          /import\s*{\s*NextResponse\s*}\s*from\s*['"]next\/server['"]/,
          "import { NextRequest, NextResponse } from 'next/server'"
        );
      } else {
        content = "import { NextRequest, NextResponse } from 'next/server';\n" + content;
      }
      modified = true;
    }
    
    // Add request parameter to functions
    const functionRegex = /export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(\s*\)/g;
    if (functionRegex.test(content)) {
      content = content.replace(functionRegex, 'export async function $2(request: NextRequest)');
      modified = true;
    }
    
    return { content, modified };
  }

  fixSupabaseImports(content) {
    let modified = false;
    
    // Fix createSupabaseClient usage
    if (content.includes('createSupabaseClient')) {
      // Add proper imports
      if (!content.includes('createRouteHandlerClient')) {
        content = "import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';\n" + content;
      }
      if (!content.includes("from 'next/headers'")) {
        content = "import { cookies } from 'next/headers';\n" + content;
      }
      
      // Replace function calls
      content = content.replace(
        /const\s+supabase\s*=\s*createSupabaseClient\(\)/g,
        'const supabase = createRouteHandlerClient({ cookies })'
      );
      
      // Remove old imports
      content = content.replace(/import.*createSupabaseClient.*from.*\n/g, '');
      
      modified = true;
    }
    
    // Add Database type if using createRouteHandlerClient
    if (content.includes('createRouteHandlerClient') && !content.includes('Database>')) {
      content = content.replace(
        /createRouteHandlerClient\({ cookies }\)/g,
        'createRouteHandlerClient<Database>({ cookies })'
      );
      
      if (!content.includes("import type { Database }")) {
        content = content.replace(
          /import { createRouteHandlerClient } from '@supabase\/auth-helpers-nextjs';/,
          "import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';\nimport type { Database } from '@/types/database';"
        );
      }
      
      modified = true;
    }
    
    return { content, modified };
  }

  addErrorHandling(content) {
    let modified = false;
    
    // Find functions without try-catch
    const functionMatches = content.match(/export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)\s*\([^)]*\)\s*{([^}]|{[^}]*})*}/g);
    
    if (functionMatches) {
      functionMatches.forEach(func => {
        if (!func.includes('try {')) {
          const methodName = func.match(/function\s+(\w+)/)[1];
          const functionBody = func.match(/{([\s\S]*)}/)[1];
          
          const wrappedFunction = func.replace(
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
          
          content = content.replace(func, wrappedFunction);
          modified = true;
        }
      });
    }
    
    return { content, modified };
  }

  fixFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      let totalModified = false;
      
      // Apply fixes
      const imports = this.addMissingImports(content);
      content = imports.content;
      totalModified = totalModified || imports.modified;
      
      const supabase = this.fixSupabaseImports(content);
      content = supabase.content;
      totalModified = totalModified || supabase.modified;
      
      const errorHandling = this.addErrorHandling(content);
      content = errorHandling.content;
      totalModified = totalModified || errorHandling.modified;
      
      // Remove console.log (except in error handlers)
      const beforeConsole = content;
      content = content.replace(/^(?!.*catch|.*error).*console\.log\([^)]*\);?\s*$/gm, '');
      if (content !== beforeConsole) totalModified = true;
      
      // Save if modified
      if (totalModified) {
        fs.writeFileSync(filePath, content);
        this.fixed.push(filePath);
        return 'fixed';
      } else {
        this.skipped.push(filePath);
        return 'skipped';
      }
    } catch (error) {
      this.failed.push({ file: filePath, error: error.message });
      return 'failed';
    }
  }

  async fixAll() {
    console.log('\n🔧 Batch fixing all API files...\n');
    
    const files = glob.sync('src/app/api/**/*.ts');
    const progressBar = '█';
    const total = files.length;
    
    files.forEach((file, index) => {
      const progress = Math.floor((index / total) * 20);
      process.stdout.write(`\r[${progressBar.repeat(progress)}${' '.repeat(20 - progress)}] ${index + 1}/${total}`);
      
      this.fixFile(file);
    });
    
    console.log('\n');
    console.log(`\n✅ Fixed: ${this.fixed.length} files`);
    console.log(`⏭️  Skipped: ${this.skipped.length} files`);
    console.log(`❌ Failed: ${this.failed.length} files`);
    
    if (this.fixed.length > 0) {
      console.log('\nFixed files:');
      this.fixed.slice(0, 10).forEach(f => console.log(`  ✅ ${f}`));
      if (this.fixed.length > 10) {
        console.log(`  ... and ${this.fixed.length - 10} more`);
      }
    }
    
    if (this.failed.length > 0) {
      console.log('\nFailed files:');
      this.failed.forEach(f => console.log(`  ❌ ${f.file}: ${f.error}`));
    }
  }
}

// Run the fixer
const fixer = new APIBatchFixer();
fixer.fixAll();