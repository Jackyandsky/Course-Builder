#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Simple API Guardian Agent for immediate use
class APIGuardianAgent {
  constructor() {
    this.rules = this.loadRules();
  }
  
  loadRules() {
    return {
      forbiddenPatterns: [
        /createClientComponentClient\(\)/g,
        /createSupabaseClient\(\)/g,
        /new SupabaseClient/g,
        /supabase\.(from|rpc|storage)\(/g,
        /console\.log\(/g
      ],
      requiredPatterns: [
        /import.*NextRequest.*NextResponse.*from.*next\/server/,
        /createRouteHandlerClient/,
        /try\s*\{[\s\S]*\}\s*catch/
      ]
    };
  }
  
  review(code, filePath) {
    const violations = [];
    const suggestions = [];
    
    // Check forbidden patterns
    this.rules.forbiddenPatterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) {
        violations.push({
          type: 'error',
          message: `Forbidden pattern found: ${matches[0]}`,
          rule: 'no-direct-supabase'
        });
      }
    });
    
    // Check required patterns
    this.rules.requiredPatterns.forEach((pattern, index) => {
      if (!pattern.test(code)) {
        const patternNames = [
          'Next.js imports (NextRequest, NextResponse)',
          'createRouteHandlerClient for server-side',
          'try-catch error handling'
        ];
        violations.push({
          type: 'warning',
          message: `Missing: ${patternNames[index] || pattern.source}`,
          rule: 'required-pattern'
        });
      }
    });
    
    // Check for service layer
    if (!/import.*from.*['"]@\/lib\/services/.test(code)) {
      suggestions.push('Consider using service layer instead of direct database queries');
    }
    
    return {
      status: violations.filter(v => v.type === 'error').length > 0 ? 'needs-changes' : 
              violations.length > 0 ? 'needs-changes' : 'approved',
      violations,
      suggestions
    };
  }
}

// Main CLI functionality
const agent = new APIGuardianAgent();
const command = process.argv[2];
const file = process.argv[3];

function reviewFile(filePath) {
  console.log(`\n🤖 API Agent reviewing ${filePath}...\n`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }
  
  const code = fs.readFileSync(filePath, 'utf8');
  const result = agent.review(code, filePath);
  
  if (result.status === 'approved') {
    console.log('✅ Code approved - follows API principles!\n');
  } else {
    console.log('⚠️  Issues found:\n');
    
    const errors = result.violations.filter(v => v.type === 'error');
    const warnings = result.violations.filter(v => v.type === 'warning');
    
    if (errors.length > 0) {
      console.log('Errors:');
      errors.forEach(v => {
        console.log(`  ❌ ${v.message}`);
      });
      console.log();
    }
    
    if (warnings.length > 0) {
      console.log('Warnings:');
      warnings.forEach(v => {
        console.log(`  ⚠️  ${v.message}`);
      });
      console.log();
    }
    
    if (result.suggestions.length > 0) {
      console.log('💡 Suggestions:');
      result.suggestions.forEach(s => {
        console.log(`  • ${s}`);
      });
    }
  }
}

function watchMode() {
  console.log('\n👁️  API Agent watching for changes...\n');
  console.log('Watching: src/app/api/**/*.ts');
  console.log('Press Ctrl+C to stop\n');
  
  const chokidar = require('chokidar');
  const watcher = chokidar.watch('src/app/api/**/*.ts', {
    ignored: /node_modules/,
    persistent: true,
    ignoreInitial: true
  });
  
  watcher.on('change', (filePath) => {
    console.log(`\n📝 File changed: ${filePath}`);
    reviewFile(filePath);
    console.log('\n---\n');
  });
  
  watcher.on('add', (filePath) => {
    console.log(`\n➕ New file: ${filePath}`);
    reviewFile(filePath);
    console.log('\n---\n');
  });
  
  watcher.on('error', error => {
    console.error('Watcher error:', error);
  });
}

function scanProject() {
  console.log('\n🔍 Scanning project APIs...\n');
  
  const glob = require('glob');
  const files = glob.sync('src/app/api/**/*.ts');
  
  let approved = 0;
  let violations = 0;
  
  files.forEach(file => {
    const code = fs.readFileSync(file, 'utf8');
    const result = agent.review(code, file);
    
    if (result.status === 'approved') {
      approved++;
      console.log(`✅ ${file}`);
    } else {
      violations++;
      console.log(`❌ ${file} - ${result.violations.length} issue(s)`);
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`  Total: ${files.length}`);
  console.log(`  Approved: ${approved}`);
  console.log(`  Violations: ${violations}`);
  console.log(`  Success Rate: ${((approved / files.length) * 100).toFixed(1)}%`);
}

// Command handling
switch (command) {
  case 'watch':
    watchMode();
    break;
    
  case 'review':
    if (file) {
      reviewFile(file);
    } else {
      console.log('Please specify a file to review');
      console.log('Usage: npm run agent:review <file>');
    }
    break;
    
  case 'scan':
    scanProject();
    break;
    
  default:
    console.log('🤖 API Guardian Agent\n');
    console.log('Commands:');
    console.log('  npm run agent:watch           - Watch for changes');
    console.log('  npm run agent:review <file>   - Review a file');
    console.log('  npm run agent:scan            - Scan all APIs');
    console.log();
    if (command) {
      console.log(`Unknown command: ${command}`);
    }
}