# Configuration Management Guide

## Overview

This application uses a hybrid approach for configuration storage:

1. **Environment Variables** - For sensitive data and deployment-specific settings
2. **Database Storage** - For user-configurable settings
3. **Configuration Service** - For centralized access to settings

## 1. Environment Variables (.env.local)

### What to Store
- API keys and secrets
- Database connection strings
- Third-party service credentials
- Deployment-specific URLs

### Example `.env.local`
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Stripe (if using payments)
STRIPE_SECRET_KEY=your_stripe_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_public

# Email Service
SENDGRID_API_KEY=your_sendgrid_key

# AI/LLM Services
OPENAI_API_KEY=your_openai_key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Security Notes
- Never commit `.env.local` to version control
- Use `.env.example` to document required variables
- In production, use platform-specific secret management (Vercel, AWS Secrets Manager, etc.)

## 2. Database Storage (system_settings table)

### What to Store
- Site information (name, URL, emails)
- Company details
- Regional settings (timezone, currency)
- Feature flags
- User preferences
- Maintenance settings

### Database Schema
```sql
CREATE TABLE system_settings (
  id UUID PRIMARY KEY,
  key VARCHAR(255) UNIQUE,
  value JSONB,
  category VARCHAR(100),
  description TEXT,
  is_sensitive BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  updated_by UUID
);
```

### Categories
- `general` - Site-wide settings
- `company` - Company information
- `regional` - Locale and timezone
- `system` - System behavior settings
- `features` - Feature flags
- `integration` - Third-party integration settings

## 3. Configuration Service

### Usage
```typescript
import { configService } from '@/lib/config/settings';

// Get a single setting
const siteName = await configService.get('site_name', 'Default Name');

// Get settings by category
const companySettings = await configService.getByCategory('company');

// Update a setting
await configService.set('maintenance_mode', true, 'system');

// Bulk update
await configService.bulkUpdate([
  { key: 'site_name', value: 'My Site' },
  { key: 'site_url', value: 'https://mysite.com' }
]);
```

### Helper Functions
```typescript
import { 
  getSiteName,
  getSiteUrl,
  getAdminEmail,
  isMaintenanceMode 
} from '@/lib/config/settings';

const siteName = await getSiteName();
const inMaintenance = await isMaintenanceMode();
```

## 4. Admin Settings Page

The admin settings page (`/admin/settings`) provides a UI for managing database-stored settings.

### Features
- View all settings
- Edit mode with validation
- Categorized settings
- Real-time updates
- Audit trail (who changed what)

## 5. API Endpoints

### GET /api/settings
Retrieve all or filtered settings
```typescript
// Get all settings
fetch('/api/settings')

// Get by category
fetch('/api/settings?category=company')
```

### PUT /api/settings
Update multiple settings
```typescript
fetch('/api/settings', {
  method: 'PUT',
  body: JSON.stringify({
    settings: [
      { key: 'site_name', value: 'New Name', category: 'general' },
      { key: 'timezone', value: 'UTC', category: 'regional' }
    ]
  })
})
```

### POST /api/settings
Create a new setting
```typescript
fetch('/api/settings', {
  method: 'POST',
  body: JSON.stringify({
    key: 'new_feature_flag',
    value: true,
    category: 'features',
    description: 'Enable new feature X'
  })
})
```

### DELETE /api/settings?key=setting_key
Delete a setting

## 6. Best Practices

### Security
1. **Never store sensitive data in the database** - Use environment variables
2. **Implement proper access control** - Only admins can modify settings
3. **Audit changes** - Track who changed what and when
4. **Validate input** - Ensure settings have valid values
5. **Use HTTPS** - Encrypt data in transit

### Performance
1. **Cache settings** - The ConfigService caches for 5 minutes
2. **Bulk operations** - Update multiple settings in one request
3. **Lazy loading** - Only load settings when needed

### Organization
1. **Use categories** - Group related settings
2. **Document settings** - Use the description field
3. **Provide defaults** - Always have fallback values
4. **Version control** - Track setting changes in migrations

## 7. Environment-Specific Configuration

### Development
```typescript
// .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Staging
```typescript
// .env.staging
NEXT_PUBLIC_APP_URL=https://staging.yourapp.com
NODE_ENV=staging
```

### Production
```typescript
// Use platform secrets management
NEXT_PUBLIC_APP_URL=https://yourapp.com
NODE_ENV=production
```

## 8. Migration Strategy

When adding new settings:

1. Add to migration with default value
2. Update ConfigService if needed
3. Add to admin UI if user-configurable
4. Document in this guide

```sql
-- Example migration
INSERT INTO system_settings (key, value, category, description)
VALUES 
  ('new_setting', 'default_value', 'category', 'Description')
ON CONFLICT (key) DO NOTHING;
```

## 9. Troubleshooting

### Settings not updating
- Clear the ConfigService cache: `configService.clearCache()`
- Check RLS policies in database
- Verify admin role

### Environment variables not loading
- Restart Next.js development server
- Check `.env.local` file location
- Verify variable naming (NEXT_PUBLIC_ prefix for client-side)

### Performance issues
- Increase cache duration in ConfigService
- Use bulk operations
- Index the settings table properly

## 10. Future Enhancements

- [ ] Settings versioning/history
- [ ] Settings import/export
- [ ] Environment-specific overrides
- [ ] Settings validation schemas
- [ ] Webhook notifications on changes
- [ ] Settings backup/restore