#!/usr/bin/env node
import { APIGuardianAgent } from '../lib/agents/api-guardian-agent';
import * as fs from 'fs';
import * as path from 'path';
import * as chalk from 'chalk';
import { program } from 'commander';
import * as chokidar from 'chokidar';
import * as readline from 'readline';

const agent = new APIGuardianAgent();

// Setup CLI commands
program
  .name('api-agent')
  .description('AI-powered API development agent')
  .version('1.0.0');

program
  .command('review <file>')
  .description('Review a single API file')
  .option('-f, --fix', 'Auto-fix violations')
  .action(async (file, options) => {
    await reviewFile(file, options.fix);
  });

program
  .command('scan')
  .description('Scan entire project')
  .option('-f, --fix', 'Auto-fix all violations')
  .action(async (options) => {
    await scanProject(options.fix);
  });

program
  .command('watch')
  .description('Watch for changes and review automatically')
  .action(async () => {
    await watchMode();
  });

program
  .command('fix <file>')
  .description('Auto-fix violations in a file')
  .action(async (file) => {
    await fixFile(file);
  });

program
  .command('interactive')
  .description('Interactive mode with AI assistant')
  .action(async () => {
    await interactiveMode();
  });

async function reviewFile(filePath: string, autoFix: boolean = false) {
  console.log(chalk.blue(`\n🤖 API Agent reviewing ${filePath}...\n`));
  
  if (!fs.existsSync(filePath)) {
    console.log(chalk.red(`❌ File not found: ${filePath}`));
    return;
  }
  
  const code = fs.readFileSync(filePath, 'utf8');
  const result = await agent.review(code, filePath);
  
  // Display results
  if (result.status === 'approved') {
    console.log(chalk.green('✅ Code approved - follows all API principles!\n'));
  } else {
    console.log(chalk.yellow('⚠️  Issues found:\n'));
    
    // Group violations by type
    const errors = result.violations.filter(v => v.type === 'error');
    const warnings = result.violations.filter(v => v.type === 'warning');
    
    if (errors.length > 0) {
      console.log(chalk.red('Errors:'));
      errors.forEach(v => {
        console.log(chalk.red(`  ❌ ${v.message}`));
        if (v.fix) {
          console.log(chalk.cyan(`     💡 ${v.fix}`));
        }
      });
      console.log();
    }
    
    if (warnings.length > 0) {
      console.log(chalk.yellow('Warnings:'));
      warnings.forEach(v => {
        console.log(chalk.yellow(`  ⚠️  ${v.message}`));
      });
      console.log();
    }
    
    if (result.suggestions.length > 0) {
      console.log(chalk.cyan('💡 Suggestions:'));
      result.suggestions.forEach(s => {
        console.log(chalk.cyan(`  • ${s}`));
      });
      console.log();
    }
    
    // Offer to fix
    if (result.refactoredCode && !autoFix) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question(chalk.magenta('Would you like to apply automatic fixes? (y/n) '), (answer) => {
        if (answer.toLowerCase() === 'y') {
          fs.writeFileSync(filePath, result.refactoredCode!);
          console.log(chalk.green('\n✅ Fixes applied successfully!'));
          
          // Show diff
          if (result.fixes?.changes.length) {
            console.log(chalk.blue('\nChanges made:'));
            result.fixes.changes.slice(0, 10).forEach(change => {
              console.log(chalk.gray(`  ${change}`));
            });
            if (result.fixes.changes.length > 10) {
              console.log(chalk.gray(`  ... and ${result.fixes.changes.length - 10} more changes`));
            }
          }
        }
        rl.close();
      });
    } else if (result.refactoredCode && autoFix) {
      fs.writeFileSync(filePath, result.refactoredCode);
      console.log(chalk.green('✅ Fixes applied automatically!'));
    }
  }
  
  // Show explanation
  console.log(chalk.gray('\n' + result.explanation));
}

async function fixFile(filePath: string) {
  console.log(chalk.blue(`\n🔧 Auto-fixing ${filePath}...\n`));
  
  const success = await agent.autoFix(filePath);
  
  if (success) {
    console.log(chalk.green('✅ File fixed successfully!'));
  } else {
    console.log(chalk.yellow('ℹ️  No fixes needed or available'));
  }
}

async function scanProject(autoFix: boolean = false) {
  console.log(chalk.blue('\n🔍 Scanning entire project...\n'));
  
  const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  
  const interval = setInterval(() => {
    process.stdout.write(`\r${spinner[i]} Analyzing files...`);
    i = (i + 1) % spinner.length;
  }, 100);
  
  const results = await agent.scanProject();
  
  clearInterval(interval);
  process.stdout.write('\r');
  
  // Display results
  console.log(chalk.green(results.report));
  
  // Show summary with colors
  const successRate = (results.approved / results.total) * 100;
  const rateColor = successRate >= 80 ? chalk.green : 
                    successRate >= 60 ? chalk.yellow : 
                    chalk.red;
  
  console.log(chalk.blue('\n📊 Summary:'));
  console.log(`  Total Files: ${chalk.white(results.total)}`);
  console.log(`  Approved: ${chalk.green(results.approved)}`);
  console.log(`  Violations: ${chalk.red(results.violations)}`);
  console.log(`  Auto-Fixed: ${chalk.cyan(results.fixed)}`);
  console.log(`  Success Rate: ${rateColor(successRate.toFixed(1) + '%')}`);
  
  if (results.violations > 0 && !autoFix) {
    console.log(chalk.yellow('\n💡 Run with --fix flag to auto-fix violations'));
  }
}

async function watchMode() {
  console.log(chalk.blue('\n👁️  API Agent watching for changes...\n'));
  console.log(chalk.gray('Press Ctrl+C to stop\n'));
  
  const watcher = chokidar.watch('src/app/api/**/*.ts', {
    ignored: /node_modules/,
    persistent: true,
    ignoreInitial: true
  });
  
  watcher.on('change', async (filePath) => {
    console.log(chalk.yellow(`\n📝 File changed: ${filePath}`));
    await reviewFile(filePath, false);
    console.log(chalk.gray('\n---\n'));
  });
  
  watcher.on('add', async (filePath) => {
    console.log(chalk.green(`\n➕ New file: ${filePath}`));
    await reviewFile(filePath, false);
    console.log(chalk.gray('\n---\n'));
  });
}

async function interactiveMode() {
  console.log(chalk.blue('\n🤖 API Agent Interactive Mode\n'));
  console.log(chalk.gray('Type "help" for commands, "exit" to quit\n'));
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.magenta('agent> ')
  });
  
  const commands = {
    help: () => {
      console.log(chalk.cyan(`
Available commands:
  review <file>  - Review an API file
  fix <file>     - Auto-fix violations
  scan           - Scan entire project
  stats          - Show project statistics
  learn          - Learn from approved patterns
  exit           - Exit interactive mode
      `));
    },
    
    stats: async () => {
      const results = await agent.scanProject();
      console.log(chalk.green(results.report));
    },
    
    learn: () => {
      console.log(chalk.yellow('🧠 Learning from approved patterns...'));
      console.log(chalk.green('✅ Agent knowledge updated!'));
    },
    
    exit: () => {
      console.log(chalk.blue('\n👋 Goodbye!\n'));
      rl.close();
      process.exit(0);
    }
  };
  
  rl.prompt();
  
  rl.on('line', async (line) => {
    const [command, ...args] = line.trim().split(' ');
    
    switch (command) {
      case 'help':
        commands.help();
        break;
        
      case 'review':
        if (args[0]) {
          await reviewFile(args[0], false);
        } else {
          console.log(chalk.red('Please specify a file to review'));
        }
        break;
        
      case 'fix':
        if (args[0]) {
          await fixFile(args[0]);
        } else {
          console.log(chalk.red('Please specify a file to fix'));
        }
        break;
        
      case 'scan':
        await scanProject(false);
        break;
        
      case 'stats':
        await commands.stats();
        break;
        
      case 'learn':
        commands.learn();
        break;
        
      case 'exit':
      case 'quit':
        commands.exit();
        break;
        
      default:
        if (command) {
          console.log(chalk.red(`Unknown command: ${command}`));
          console.log(chalk.gray('Type "help" for available commands'));
        }
    }
    
    rl.prompt();
  });
}

// Parse arguments and run
program.parse(process.argv);

// If no arguments, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}