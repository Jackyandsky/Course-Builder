# API Development Governance Strategy

## Objective
Ensure all future API development adheres to established principles and prevents regression to duplicated, inefficient patterns.

## 1. Automated Enforcement Layer

### 1.1 Pre-commit Hooks
```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: api-structure-check
        name: Validate API Structure
        entry: scripts/validate-api-structure.js
        language: node
        files: ^src/app/api/.*\.ts$
        
      - id: no-direct-supabase
        name: Prevent Direct Supabase Usage
        entry: scripts/check-supabase-usage.js
        language: node
        files: ^src/app/(account|admin|public)/.*\.tsx$
        
      - id: service-layer-check
        name: Ensure Service Layer Usage
        entry: scripts/validate-service-usage.js
        language: node
        files: ^src/app/api/.*\.ts$
```

### 1.2 API Validation Script
```javascript
// scripts/validate-api-structure.js
const fs = require('fs');
const path = require('path');

const API_RULES = {
  // Must use service layer
  mustImportService: /import.*from.*['"]@\/lib\/services/,
  
  // Cannot directly import Supabase in API routes
  noDirectSupabase: /import.*createClient.*from.*supabase/,
  
  // Must use unified error handling
  mustUseErrorHandler: /handleApiError|ApiError/,
  
  // Must have proper typing
  mustHaveTypes: /NextRequest.*NextResponse/,
  
  // Must follow naming convention
  validEndpoint: /^(GET|POST|PUT|DELETE|PATCH)$/
};

function validateApiFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const violations = [];
  
  // Check for service layer usage
  if (!API_RULES.mustImportService.test(content)) {
    violations.push('Must use service layer - no direct database queries');
  }
  
  // Check for direct Supabase usage
  if (API_RULES.noDirectSupabase.test(content)) {
    violations.push('Cannot use Supabase directly - use service layer');
  }
  
  // Check for error handling
  if (!API_RULES.mustUseErrorHandler.test(content)) {
    violations.push('Must use unified error handling');
  }
  
  return violations;
}

module.exports = { validateApiFile };
```

## 2. Development Templates & Generators

### 2.1 API Route Generator
```bash
# CLI command to generate new API routes
npm run generate:api -- --name users --operations CRUD --service user

# This creates:
# - /api/v2/users/route.ts (with proper structure)
# - /lib/services/user.service.ts (if not exists)
# - /tests/api/users.test.ts (test file)
```

### 2.2 Template Structure
```typescript
// templates/api-route.template.ts
import { NextRequest, NextResponse } from 'next/server';
import { {{ServiceName}}Service } from '@/lib/services/{{service}}.service';
import { handleApiError } from '@/lib/api/error-handler';
import { validateRequest } from '@/lib/api/validator';
import { withAuth } from '@/lib/api/middleware';

export async function {{METHOD}}(request: NextRequest) {
  try {
    // 1. Authentication
    const auth = await withAuth(request);
    if (auth.error) return auth.error;
    
    // 2. Validation
    const validation = await validateRequest(request, {{SCHEMA}});
    if (validation.error) return validation.error;
    
    // 3. Service layer operation
    const service = new {{ServiceName}}Service(auth.supabase);
    const result = await service.{{operation}}(validation.data);
    
    // 4. Response
    return NextResponse.json(result);
    
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 2.3 Service Template
```typescript
// templates/service.template.ts
import { BaseService } from './base.service';
import { SupabaseClient } from '@supabase/supabase-js';
import { cache } from '@/lib/cache';

export class {{ServiceName}}Service extends BaseService {
  constructor(supabase: SupabaseClient) {
    super(supabase);
  }
  
  @cache({ ttl: 300, key: '{{serviceName}}:{id}' })
  async getById(id: string) {
    return this.withPermission('read', async () => {
      const query = this.buildQuery('{{tableName}}', {
        filters: { id },
        select: '*, relations(*)'
      });
      
      const { data, error } = await query.single();
      if (error) throw error;
      
      return this.transform(data);
    });
  }
  
  // Other CRUD operations following same pattern
}
```

## 3. Continuous Integration Checks

### 3.1 GitHub Actions Workflow
```yaml
# .github/workflows/api-validation.yml
name: API Validation

on:
  pull_request:
    paths:
      - 'src/app/api/**'
      - 'src/lib/services/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run API structure validation
        run: npm run validate:api
        
      - name: Check for API duplicates
        run: npm run check:api-duplicates
        
      - name: Validate service layer usage
        run: npm run validate:services
        
      - name: Run API tests
        run: npm run test:api
        
      - name: Check API documentation
        run: npm run docs:api-check
```

### 3.2 Duplicate Detection Script
```javascript
// scripts/check-api-duplicates.js
const glob = require('glob');
const fs = require('fs');
const path = require('path');

function findDuplicateEndpoints() {
  const apiFiles = glob.sync('src/app/api/**/*.ts');
  const endpoints = new Map();
  
  apiFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Extract operations (GET user by ID, GET all users, etc.)
    const operations = extractOperations(content);
    
    operations.forEach(op => {
      const key = `${op.resource}-${op.action}`;
      if (endpoints.has(key)) {
        console.error(`Duplicate endpoint found:
          - Existing: ${endpoints.get(key)}
          - Duplicate: ${file}
          - Operation: ${key}
        `);
        process.exit(1);
      }
      endpoints.set(key, file);
    });
  });
}

function extractOperations(content) {
  // Parse TypeScript to extract what the API does
  // Return array of { resource: 'user', action: 'getById' }
}
```

## 4. Runtime Monitoring & Alerts

### 4.1 API Middleware for Monitoring
```typescript
// lib/api/monitoring.ts
export function withMonitoring(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    const start = Date.now();
    const apiPath = req.nextUrl.pathname;
    
    try {
      const response = await handler(req, ...args);
      
      // Log successful operations
      await logApiCall({
        path: apiPath,
        method: req.method,
        duration: Date.now() - start,
        status: response.status,
        userId: req.headers.get('user-id')
      });
      
      // Alert if response time > threshold
      if (Date.now() - start > 1000) {
        await sendAlert({
          type: 'SLOW_API',
          path: apiPath,
          duration: Date.now() - start
        });
      }
      
      return response;
    } catch (error) {
      // Log errors
      await logApiError({
        path: apiPath,
        method: req.method,
        error: error.message,
        stack: error.stack
      });
      
      throw error;
    }
  };
}
```

### 4.2 Duplicate Call Detection
```typescript
// lib/api/duplicate-detector.ts
const recentCalls = new Map();

export function detectDuplicates(req: NextRequest) {
  const key = `${req.method}-${req.nextUrl.pathname}-${req.headers.get('user-id')}`;
  const now = Date.now();
  
  if (recentCalls.has(key)) {
    const lastCall = recentCalls.get(key);
    if (now - lastCall < 100) { // Within 100ms
      console.warn(`Duplicate API call detected: ${key}`);
      // Send alert to monitoring system
    }
  }
  
  recentCalls.set(key, now);
  
  // Clean old entries
  setTimeout(() => recentCalls.delete(key), 5000);
}
```

## 5. Documentation Requirements

### 5.1 API Documentation Standard
```typescript
/**
 * @api {get} /api/v2/users/:id Get User
 * @apiVersion 2.0.0
 * @apiName GetUser
 * @apiGroup Users
 * @apiPermission authenticated
 * 
 * @apiParam {String} id User's unique ID
 * 
 * @apiSuccess {Object} user User object
 * @apiSuccess {String} user.id User ID
 * @apiSuccess {String} user.email User email
 * 
 * @apiError (401) Unauthorized User not authenticated
 * @apiError (404) NotFound User not found
 * 
 * @apiExample {curl} Example usage:
 *     curl -H "Authorization: Bearer token" \
 *          https://api.example.com/api/v2/users/123
 */
```

### 5.2 Auto-generated API Docs
```javascript
// scripts/generate-api-docs.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Course Builder API',
      version: '2.0.0',
    },
  },
  apis: ['./src/app/api/**/*.ts'],
};

const specs = swaggerJsdoc(options);
// Generate and serve documentation
```

## 6. Code Review Checklist

### 6.1 Automated PR Checks
```markdown
## API Development Checklist
- [ ] Uses service layer (no direct DB queries)
- [ ] Follows REST conventions
- [ ] Has proper error handling
- [ ] Includes request validation
- [ ] Has authentication/authorization
- [ ] Documented with JSDoc/OpenAPI
- [ ] Has corresponding tests
- [ ] No duplicate functionality
- [ ] Follows naming conventions
- [ ] Performance optimized (< 200ms)
```

### 6.2 Review Bot Configuration
```yaml
# .github/review-bot.yml
api_rules:
  - pattern: 'src/app/api/**'
    require:
      - service_layer_usage
      - error_handling
      - authentication
      - tests
    block:
      - direct_database_access
      - duplicate_endpoints
```

## 7. Developer Training & Onboarding

### 7.1 API Development Guide
Create comprehensive guide covering:
1. Architecture principles
2. Service layer usage
3. Error handling patterns
4. Testing requirements
5. Performance guidelines

### 7.2 Interactive Examples
```bash
# Developer onboarding command
npm run onboarding:api

# This launches interactive tutorial:
# 1. Create your first API endpoint
# 2. Use the service layer
# 3. Add authentication
# 4. Write tests
# 5. Document your API
```

## 8. Metrics & Reporting

### 8.1 API Health Dashboard
```typescript
// Track and display:
- API response times (p50, p95, p99)
- Error rates by endpoint
- Duplicate call frequency
- Service layer adoption %
- Test coverage %
- Documentation coverage %
```

### 8.2 Weekly API Health Report
```javascript
// scripts/api-health-report.js
async function generateWeeklyReport() {
  const metrics = await collectMetrics();
  
  return {
    compliance: {
      serviceLayerUsage: metrics.serviceLayerUsage, // Target: 100%
      testCoverage: metrics.testCoverage,           // Target: > 80%
      docCoverage: metrics.docCoverage,             // Target: 100%
      avgResponseTime: metrics.avgResponseTime,     // Target: < 200ms
    },
    violations: {
      directDbAccess: metrics.directDbViolations,
      duplicateApis: metrics.duplicateEndpoints,
      slowApis: metrics.slowEndpoints,
    },
    recommendations: generateRecommendations(metrics)
  };
}
```

## 9. Enforcement Policies

### 9.1 Gradual Enforcement
```javascript
// Phase 1 (Weeks 1-2): Warning only
config.enforcement = 'warn';

// Phase 2 (Weeks 3-4): Block on CI
config.enforcement = 'ci-block';

// Phase 3 (Week 5+): Block on commit
config.enforcement = 'strict';
```

### 9.2 Exception Process
```yaml
# .api-exceptions.yml
exceptions:
  - path: /api/legacy/*
    reason: "Legacy endpoints - to be migrated"
    expires: "2024-03-01"
    
  - path: /api/webhooks/*
    reason: "External webhooks - different pattern"
    expires: null
```

## 10. Implementation Roadmap

### Week 1: Foundation
- [ ] Set up pre-commit hooks
- [ ] Create validation scripts
- [ ] Generate first templates

### Week 2: Automation
- [ ] Configure CI/CD checks
- [ ] Set up monitoring middleware
- [ ] Create API generator CLI

### Week 3: Documentation
- [ ] Write developer guide
- [ ] Set up auto-documentation
- [ ] Create onboarding tutorial

### Week 4: Monitoring
- [ ] Deploy health dashboard
- [ ] Configure alerts
- [ ] Generate first report

### Week 5: Full Enforcement
- [ ] Enable strict mode
- [ ] Review exceptions
- [ ] Team training session

## Success Metrics

1. **Zero new duplicate APIs** after implementation
2. **100% service layer adoption** for new endpoints
3. **< 200ms p95 response time** maintained
4. **> 90% test coverage** for API layer
5. **100% documentation coverage** for public APIs
6. **< 5 API-related bugs** per month

## Conclusion

This governance strategy ensures that:
1. **Prevention**: Bad patterns are caught before commit
2. **Automation**: Correct patterns are easy to follow
3. **Monitoring**: Violations are detected immediately
4. **Education**: Developers understand the "why"
5. **Enforcement**: Rules are consistently applied

By implementing this strategy, we guarantee that all future development will follow the established principles, preventing regression to the inefficient patterns we're fixing.