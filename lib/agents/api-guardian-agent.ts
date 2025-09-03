import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface Violation {
  type: 'error' | 'warning';
  message: string;
  line?: number;
  column?: number;
  rule: string;
  fix?: string;
}

interface AgentResponse {
  status: 'approved' | 'needs-changes' | 'error';
  violations: Violation[];
  suggestions: string[];
  fixes?: {
    code: string;
    changes: string[];
  };
  refactoredCode?: string;
  explanation: string;
}

interface APIRules {
  forbiddenPatterns: RegExp[];
  requiredPatterns: RegExp[];
  serviceLayerRequired: boolean;
  authenticationRequired: boolean;
  errorHandlingRequired: boolean;
}

export class APIGuardianAgent {
  private rules: APIRules;
  private knownAPIs: Map<string, string>;
  private serviceRegistry: Map<string, string[]>;
  
  constructor() {
    this.rules = this.loadRules();
    this.knownAPIs = this.scanExistingAPIs();
    this.serviceRegistry = this.scanServices();
  }
  
  private loadRules(): APIRules {
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
      ],
      serviceLayerRequired: true,
      authenticationRequired: true,
      errorHandlingRequired: true
    };
  }
  
  private scanExistingAPIs(): Map<string, string> {
    const apis = new Map<string, string>();
    const files = glob.sync('src/app/api/**/*.ts');
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const operations = this.extractOperations(content);
      
      operations.forEach(op => {
        const key = `${op.method}-${op.resource}-${op.action}`;
        apis.set(key, file);
      });
    });
    
    return apis;
  }
  
  private scanServices(): Map<string, string[]> {
    const services = new Map<string, string[]>();
    const files = glob.sync('src/lib/services/**/*.ts');
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const serviceName = path.basename(file, '.service.ts');
      const methods = this.extractServiceMethods(content);
      services.set(serviceName, methods);
    });
    
    return services;
  }
  
  private extractOperations(code: string): Array<{method: string, resource: string, action: string}> {
    const operations = [];
    const methodRegex = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)/g;
    const pathRegex = /\/api\/([^\/]+)(?:\/([^\/]+))?/;
    
    let match;
    while ((match = methodRegex.exec(code)) !== null) {
      operations.push({
        method: match[1],
        resource: 'unknown',
        action: match[1].toLowerCase()
      });
    }
    
    return operations;
  }
  
  private extractServiceMethods(code: string): string[] {
    const methods = [];
    const methodRegex = /(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/g;
    
    let match;
    while ((match = methodRegex.exec(code)) !== null) {
      if (!['constructor', 'private', 'protected'].includes(match[1])) {
        methods.push(match[1]);
      }
    }
    
    return methods;
  }
  
  async review(code: string, filePath: string): Promise<AgentResponse> {
    const violations: Violation[] = [];
    const suggestions: string[] = [];
    
    // Check forbidden patterns
    this.rules.forbiddenPatterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) {
        violations.push({
          type: 'error',
          message: `Forbidden pattern found: ${matches[0]}`,
          rule: 'no-direct-supabase',
          fix: this.suggestFix(matches[0])
        });
      }
    });
    
    // Check required patterns
    this.rules.requiredPatterns.forEach(pattern => {
      if (!pattern.test(code)) {
        violations.push({
          type: 'error',
          message: `Required pattern missing: ${pattern.source}`,
          rule: 'required-imports'
        });
      }
    });
    
    // Check for service layer usage
    if (this.rules.serviceLayerRequired && !this.usesServiceLayer(code)) {
      violations.push({
        type: 'warning',
        message: 'Should use service layer instead of direct database queries',
        rule: 'use-service-layer'
      });
      suggestions.push('Create a service class to handle database operations');
    }
    
    // Check for duplicate APIs
    const operations = this.extractOperations(code);
    operations.forEach(op => {
      const key = `${op.method}-${op.resource}-${op.action}`;
      if (this.knownAPIs.has(key) && this.knownAPIs.get(key) !== filePath) {
        violations.push({
          type: 'error',
          message: `Duplicate API endpoint: ${key} already exists in ${this.knownAPIs.get(key)}`,
          rule: 'no-duplicates'
        });
      }
    });
    
    // Generate refactored code if violations exist
    let refactoredCode: string | undefined;
    if (violations.length > 0) {
      refactoredCode = this.generateRefactoredCode(code, violations);
    }
    
    // Generate explanation
    const explanation = this.generateExplanation(violations, suggestions);
    
    return {
      status: violations.filter(v => v.type === 'error').length > 0 ? 'needs-changes' : 
              violations.length > 0 ? 'needs-changes' : 'approved',
      violations,
      suggestions,
      refactoredCode,
      fixes: refactoredCode ? {
        code: refactoredCode,
        changes: this.diffChanges(code, refactoredCode)
      } : undefined,
      explanation
    };
  }
  
  private usesServiceLayer(code: string): boolean {
    return /import.*from.*['"]@\/lib\/services/.test(code);
  }
  
  private suggestFix(pattern: string): string {
    const fixes: Record<string, string> = {
      'createClientComponentClient()': 'Use createRouteHandlerClient({ cookies }) in API routes',
      'createSupabaseClient()': 'Use createRouteHandlerClient({ cookies }) in API routes',
      'supabase.from': 'Move to service layer: await userService.getUsers()',
      'console.log': 'Use proper logging service or remove'
    };
    
    for (const [key, fix] of Object.entries(fixes)) {
      if (pattern.includes(key)) {
        return fix;
      }
    }
    
    return 'Refactor to follow API patterns';
  }
  
  private generateRefactoredCode(code: string, violations: Violation[]): string {
    let refactored = code;
    
    // Fix direct Supabase usage
    refactored = refactored.replace(
      /const supabase = createClientComponentClient\(\);?/g,
      'const supabase = createRouteHandlerClient({ cookies });'
    );
    
    // Add missing imports
    if (!refactored.includes("import { cookies } from 'next/headers'")) {
      refactored = `import { cookies } from 'next/headers';\n${refactored}`;
    }
    
    // Add error handling if missing
    if (!refactored.includes('try {')) {
      refactored = this.wrapInTryCatch(refactored);
    }
    
    // Convert direct queries to service calls
    refactored = this.convertToServiceLayer(refactored);
    
    return refactored;
  }
  
  private wrapInTryCatch(code: string): string {
    // Find function bodies and wrap them
    const functionRegex = /export\s+(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{([\s\S]*?)\n\}/g;
    
    return code.replace(functionRegex, (match, name, body) => {
      if (!body.includes('try {')) {
        return `export async function ${name}(request: NextRequest) {
  try {${body}
  } catch (error) {
    console.error('Error in ${name}:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}`;
      }
      return match;
    });
  }
  
  private convertToServiceLayer(code: string): string {
    // Convert direct Supabase queries to service calls
    let refactored = code;
    
    // Example: Convert supabase.from('users').select() to userService.getUsers()
    refactored = refactored.replace(
      /supabase\.from\(['"](\w+)['"]\)\.select\([^)]*\)/g,
      (match, table) => {
        const serviceName = table.replace(/s$/, '');
        return `${serviceName}Service.get${this.capitalize(table)}()`;
      }
    );
    
    // Add service import if needed
    if (refactored !== code && !refactored.includes('Service')) {
      const serviceImports = this.generateServiceImports(refactored);
      refactored = `${serviceImports}\n${refactored}`;
    }
    
    return refactored;
  }
  
  private generateServiceImports(code: string): string {
    const imports: string[] = [];
    const servicePattern = /(\w+)Service\./g;
    const services = new Set<string>();
    
    let match;
    while ((match = servicePattern.exec(code)) !== null) {
      services.add(match[1]);
    }
    
    services.forEach(service => {
      imports.push(`import { ${this.capitalize(service)}Service } from '@/lib/services/${service}.service';`);
    });
    
    return imports.join('\n');
  }
  
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  private diffChanges(original: string, refactored: string): string[] {
    const changes: string[] = [];
    const originalLines = original.split('\n');
    const refactoredLines = refactored.split('\n');
    
    for (let i = 0; i < Math.max(originalLines.length, refactoredLines.length); i++) {
      if (originalLines[i] !== refactoredLines[i]) {
        if (originalLines[i] && !refactoredLines[i]) {
          changes.push(`- Line ${i + 1}: ${originalLines[i]}`);
        } else if (!originalLines[i] && refactoredLines[i]) {
          changes.push(`+ Line ${i + 1}: ${refactoredLines[i]}`);
        } else if (originalLines[i] && refactoredLines[i]) {
          changes.push(`~ Line ${i + 1}: ${originalLines[i]} -> ${refactoredLines[i]}`);
        }
      }
    }
    
    return changes;
  }
  
  private generateExplanation(violations: Violation[], suggestions: string[]): string {
    if (violations.length === 0) {
      return '✅ Code follows all API development principles!';
    }
    
    let explanation = `Found ${violations.length} violation(s):\n`;
    
    const errors = violations.filter(v => v.type === 'error');
    const warnings = violations.filter(v => v.type === 'warning');
    
    if (errors.length > 0) {
      explanation += `\n❌ Errors (${errors.length}):\n`;
      errors.forEach(e => {
        explanation += `  • ${e.message}\n`;
        if (e.fix) {
          explanation += `    Fix: ${e.fix}\n`;
        }
      });
    }
    
    if (warnings.length > 0) {
      explanation += `\n⚠️  Warnings (${warnings.length}):\n`;
      warnings.forEach(w => {
        explanation += `  • ${w.message}\n`;
      });
    }
    
    if (suggestions.length > 0) {
      explanation += `\n💡 Suggestions:\n`;
      suggestions.forEach(s => {
        explanation += `  • ${s}\n`;
      });
    }
    
    return explanation;
  }
  
  // Batch operations
  async reviewMultiple(files: string[]): Promise<Map<string, AgentResponse>> {
    const results = new Map<string, AgentResponse>();
    
    for (const file of files) {
      const code = fs.readFileSync(file, 'utf8');
      const result = await this.review(code, file);
      results.set(file, result);
    }
    
    return results;
  }
  
  // Auto-fix all violations in a file
  async autoFix(filePath: string): Promise<boolean> {
    const code = fs.readFileSync(filePath, 'utf8');
    const result = await this.review(code, filePath);
    
    if (result.refactoredCode && result.status === 'needs-changes') {
      fs.writeFileSync(filePath, result.refactoredCode);
      return true;
    }
    
    return false;
  }
  
  // Scan entire project
  async scanProject(): Promise<{
    total: number;
    approved: number;
    violations: number;
    fixed: number;
    report: string;
  }> {
    const files = glob.sync('src/app/api/**/*.ts');
    const results = {
      total: files.length,
      approved: 0,
      violations: 0,
      fixed: 0,
      report: ''
    };
    
    for (const file of files) {
      const code = fs.readFileSync(file, 'utf8');
      const result = await this.review(code, file);
      
      if (result.status === 'approved') {
        results.approved++;
      } else {
        results.violations++;
        
        if (result.refactoredCode) {
          fs.writeFileSync(file, result.refactoredCode);
          results.fixed++;
        }
      }
    }
    
    results.report = `
API Agent Scan Complete:
========================
Total Files: ${results.total}
Approved: ${results.approved}
Violations: ${results.violations}
Auto-Fixed: ${results.fixed}
Success Rate: ${((results.approved / results.total) * 100).toFixed(1)}%
    `;
    
    return results;
  }
}