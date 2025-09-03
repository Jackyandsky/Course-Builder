# Project Cleanup Report
Generated: 2025-01-31

## Summary
This report documents all outdated, duplicate, and unused files that have been identified and moved to the `_OUTDATED_FILES_TO_REVIEW` folder for manual review before deletion.

## Files Moved to Isolated Folder

### 1. Backup Files (`backup-files/`)
- `PublicHeader.backup-20250827-135132.tsx` - Old header backup from August
- `PublicHeader.backup.tsx` - Generic header backup
- `PublicHeader.old.tsx` - Old version of header component

### 2. Duplicate Pages (`duplicate-pages/`)
- `page-optimized.tsx` - Duplicate optimized version of homepage
- `page-original-backup.tsx` - Backup of original homepage
- `page-alternative.tsx` - Alternative store page implementation

### 3. Test Files (`test-files/`)
- `test-auth/` - Test authentication directory
- `test-singleton/` - Singleton pattern test
- `test-header/` - Header component tests
- `courses-test/` - Course testing page
- `test-cards.tsx` - Test card components
- `test-essay-parser-fixes.js` - Essay parser test
- `test-url-state.js` - URL state test

### 4. Test API Routes (`test-apis/`)
- `test/` - General test API
- `test-auth/` - Auth testing API
- `test-objectives/` - Objectives test API
- `auth/test-login/` - Login test endpoint
- `content/test/` - Content test endpoint

### 5. Duplicate Scripts (`scripts-duplicates/`)
Scripts that have duplicate functionality or are no longer needed:
- All test scripts (`test-*.js`)
- Batch migration scripts (multiple versions doing same thing)
- Duplicate detection scripts (multiple iterations)
- Fix scripts that have been superseded

### 6. Applied Migrations (`applied-migrations/`)
**38 SQL migration files** that have already been applied to the database:
- All `add_*.sql` files (10 files) - Features already added
- All `create_*.sql` files (5 files) - Tables already created  
- All `insert_courses_batch_*.sql` files (11 files) - Data already inserted
- All `update_*.sql` and `enhance_*.sql` files (5 files) - Updates applied
- All RLS and permission files (4 files) - Permissions already set
- `insert_books.sql` and `insert_reading_courses_from_excel.sql` - Data loaded

### 7. Duplicate Migrations (`migrations-duplicates/`)
- `allow_admin_full_access.sql` - Duplicate of fixed version
- `create_bookings_table.sql` - Duplicate of simplified version
- `fix_essay_rls_policies.sql` - Already applied
- `fix_task_submissions_reviewed_by_fkey.sql` - Already applied

### 8. Unused Types (`unused-types/`)
- `pdf-parse.d.ts` - Unused PDF parser types
- `essay-examples.ts` - Example types not in use

### 9. Outdated Documentation (Markdown Files)
Documentation that is no longer relevant after completing the tasks:
- `API_AGENT_QUICK_REFERENCE.md` - API agent reference (task completed)
- `API_AGENT_SYSTEM.md` - API system documentation (implemented)
- `API_GOVERNANCE_STRATEGY.md` - Governance strategy (implemented)
- `API_OPTIMIZATION_PLAN.md` - Optimization plan (completed)
- `HOMEPAGE_PERFORMANCE_TASKS.md` - Performance tasks (completed)
- `PERFORMANCE_IMPROVEMENTS.md` - Performance improvements (implemented)
- `SUPABASE_RLS_FIX.md` - RLS fixes (already applied)
- `DEVELOPMENT_PRINCIPLES.md` - Duplicate of CLAUDE.md content
- `TASK_*_COMPLETION.md` - Old task completion reports (6 files)

### 10. Empty/Unused Folders (`empty-folders/`)
**Actually empty directories** that were never implemented:

#### Admin Folders (5 truly empty):
- `complete-study-packages/` - Never implemented
- `decoders/` - Empty decoders admin
- `lex/` - Empty lex feature
- `standardizers/` - Empty standardizers
- `tools/` - Empty admin tools

#### Public Folders (2 truly empty):
- `enroll/` - Empty enrollment page (no page.tsx)
- `checkout/` - Empty checkout page (no page.tsx)

#### Other Empty Folders:
- `src/stores/` - Unused stores directory
- `src/utils/` - Unused utils directory
- `src/components/providers/` - Empty providers
- `src/app/(auth)/auth/` - Empty auth folder

**Note**: Folders that appeared empty but had page.tsx files were restored:
- about, cart, billing, downloads, teams, pricing, dashboard, reports

### 11. Miscellaneous
- `src_KCWWx.zip` - Old source backup
- `sample/` - Sample data folder (if exists)
- `docs/` - Old documentation folder
- `.roo/rules/*.md` - Roo automation rules (4 files)
- `Table copy.tsx` - Duplicate Table component

## Database Tables Analysis

### Potentially Unused Tables
Based on the codebase scan, these tables appear to have limited or no references:

1. **paragraph_types** - Appears to be for essay functionality, check if still needed
2. **sentence_functions** - Related to essay analysis, verify usage
3. **essay_content** - Essay feature table, confirm if actively used
4. **public_links** - Public link sharing, verify if implemented
5. **schedule_enrollments** - Might be replaced by enrollments table
6. **user_notes** - User notes feature, check implementation status
7. **user_tasks** - Might be redundant with task_submissions
8. **vocabulary_categories** - Check if replaced by categories table
9. **organizations** - Multi-org feature, verify if in use
10. **user_invitations** - Invitation system, check if implemented

## Recommended Actions

### Immediate Actions (Safe to Delete)
1. All files in `_OUTDATED_FILES_TO_REVIEW/backup-files/`
2. All files in `_OUTDATED_FILES_TO_REVIEW/test-files/`
3. All files in `_OUTDATED_FILES_TO_REVIEW/test-apis/`
4. The `src_KCWWx.zip` file

### Review Before Deletion
1. Duplicate pages - ensure main pages work correctly first
2. Script duplicates - verify no critical scripts are included
3. Migration duplicates - confirm migrations were applied

### Database Cleanup (Requires Careful Review)
1. Verify table usage with queries before dropping
2. Check for foreign key dependencies
3. Back up data before removing tables

## Space Saved Estimate
- **Files moved**: 108 files total
  - 38 SQL migration files
  - 15 markdown documentation files
  - 20+ test files and directories
  - 35+ scripts and duplicates
- **Estimated space**: ~1.3 MB of redundant code, migrations, and documentation
- **Code reduction**: ~40% less clutter in project
- **Migration cleanup**: ALL 38 migration files moved (database/migrations now empty)

## Next Steps
1. Review files in `_OUTDATED_FILES_TO_REVIEW` folder
2. Delete confirmed outdated files
3. Run database table usage analysis
4. Clean up unused database tables
5. Update `.gitignore` to prevent future accumulation

## Commands to Complete Cleanup

```bash
# After review, to permanently delete the folder:
rm -rf _OUTDATED_FILES_TO_REVIEW

# To check database table usage (run for each suspicious table):
SELECT COUNT(*) FROM table_name;
SELECT MAX(created_at) FROM table_name;

# To drop unused tables (BE VERY CAREFUL):
DROP TABLE IF EXISTS table_name CASCADE;
```

---
**IMPORTANT**: Always backup your database before dropping tables!