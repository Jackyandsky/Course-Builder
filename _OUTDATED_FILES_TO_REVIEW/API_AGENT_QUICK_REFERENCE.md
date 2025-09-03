# API Agent Quick Reference Card 🤖

## Most Common Commands

### Daily Development
```bash
# Start watch mode (runs in background)
npm run agent:watch

# Review current file you're working on
npm run agent:review src/app/api/users/route.ts

# Auto-fix violations
npm run agent:fix src/app/api/users/route.ts
```

### Before Committing
```bash
# Scan all your changes
npm run agent:scan

# Fix all violations automatically
npm run agent:scan -- --fix
```

### Creating New APIs
```bash
# 1. Generate correct structure
npm run generate:api -- --name products --operations CRUD

# 2. Agent reviews it automatically
npm run agent:review src/app/api/v2/products/route.ts
```

## Homepage Optimization Workflow

### Step 1: Identify Homepage APIs
```bash
# Find all homepage-related endpoints
grep -r "homepage\|navigation\|public" src/app/api --include="*.ts"
```

### Step 2: Review Each API
```bash
npm run agent:review src/app/api/navigation/menu/route.ts
npm run agent:review src/app/api/navigation/homepage/route.ts
npm run agent:review src/app/api/public/store-products/route.ts
npm run agent:review src/app/api/public/courses/route.ts
```

### Step 3: Apply Optimizations
```bash
# Auto-fix with optimization flag
npm run agent:fix src/app/api/navigation/menu/route.ts
npm run agent:fix src/app/api/navigation/homepage/route.ts
```

### Step 4: Verify Performance
```bash
# Generate performance report
npm run agent scan --filter "navigation|homepage" --report
```

## Common Violations & Quick Fixes

| Violation | Quick Fix Command |
|-----------|-------------------|
| Direct Supabase usage | `npm run agent:fix [file] --service-layer` |
| Missing error handling | `npm run agent:fix [file] --add-try-catch` |
| No authentication | `npm run agent:fix [file] --add-auth` |
| Duplicate endpoint | `npm run agent:fix [file] --consolidate` |
| Missing timeout | `npm run agent:fix [file] --add-timeout` |

## Interactive Mode Commands

```bash
# Start interactive mode
npm run agent:interactive

# Commands in interactive mode:
agent> review src/app/api/users/route.ts
agent> fix src/app/api/users/route.ts
agent> scan
agent> stats
agent> learn
agent> help
agent> exit
```

## VS Code Integration

### Keyboard Shortcuts
- `Ctrl+Shift+R` - Review current file
- `Ctrl+Shift+F` - Fix current file
- `Ctrl+Shift+S` - Scan project

### Command Palette
- `API Agent: Review Current File`
- `API Agent: Fix Violations`
- `API Agent: Scan Project`

## CI/CD Integration

### GitHub Actions
```yaml
# Automatically runs on PRs
- name: API Agent Review
  run: npm run agent:scan
  
# Auto-fix option
- name: Auto-fix violations
  run: npm run agent:scan -- --fix --commit
```

## Performance Metrics

### Check API Health
```bash
# Generate health report
npm run api:health

# Check specific metrics
npm run agent stats --metric response-time
npm run agent stats --metric duplicate-count
npm run agent stats --metric violation-rate
```

## Troubleshooting

### Agent Not Working?
```bash
# Check agent status
npm run agent --version

# Reset agent cache
rm -rf .agent-cache

# Reinstall dependencies
npm install
```

### False Positives?
```bash
# Add exception
echo "src/app/api/special/route.ts" >> .agent-ignore

# Configure rules
vim lib/agents/api-guardian-agent.ts
```

## Best Practices

1. **Run watch mode during development**
   ```bash
   npm run agent:watch
   ```

2. **Review before committing**
   ```bash
   npm run pre-commit
   ```

3. **Fix violations immediately**
   ```bash
   npm run agent:fix [file]
   ```

4. **Use generator for new APIs**
   ```bash
   npm run generate:api -- --name [name]
   ```

5. **Check health weekly**
   ```bash
   npm run agent:scan --report
   ```

---

## Emergency Commands

### Fix Everything Now
```bash
# Nuclear option - fix all violations
npm run agent:scan -- --fix --force --all
```

### Rollback Changes
```bash
# If agent breaks something
git diff > agent-changes.patch
git checkout -- .
```

### Report Issues
```bash
# Generate debug report
npm run agent --debug > agent-debug.log
```

---

**Remember**: The agent is here to help, not hinder. If it's blocking you incorrectly, add exceptions or adjust rules!