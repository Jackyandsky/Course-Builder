#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  name: '',
  operations: 'CRUD',
  service: '',
  auth: 'required'
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--name' && args[i + 1]) {
    options.name = args[i + 1];
    i++;
  } else if (args[i] === '--operations' && args[i + 1]) {
    options.operations = args[i + 1];
    i++;
  } else if (args[i] === '--service' && args[i + 1]) {
    options.service = args[i + 1];
    i++;
  } else if (args[i] === '--auth' && args[i + 1]) {
    options.auth = args[i + 1];
    i++;
  }
}

if (!options.name) {
  console.error(`
❌ API name is required!

Usage: npm run generate:api -- --name <name> [options]

Options:
  --name <name>         API endpoint name (required)
  --operations <ops>    Operations to generate (default: CRUD)
                       C = Create (POST)
                       R = Read (GET)
                       U = Update (PUT)
                       D = Delete (DELETE)
  --service <name>     Service to use (default: same as name)
  --auth <type>        Authentication type (default: required)
                       required | admin | public

Examples:
  npm run generate:api -- --name users --operations CRUD --service user
  npm run generate:api -- --name products --operations CR --auth public
  npm run generate:api -- --name analytics --operations R --auth admin
`);
  process.exit(1);
}

// Set defaults
if (!options.service) {
  options.service = options.name.replace(/s$/, ''); // Remove trailing 's'
}

// Template for API route
const apiTemplate = `import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ${capitalize(options.service)}Service } from '@/lib/services/${options.service}.service';
import type { Database } from '@/types/database';

${generateAuthFunction(options.auth)}

${generateOperations(options.operations, options)}
`;

// Template for service
const serviceTemplate = `import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export class ${capitalize(options.service)}Service {
  private supabase: SupabaseClient<Database>;
  
  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }
  
  ${generateServiceMethods(options.operations, options)}
}
`;

// Helper functions
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateAuthFunction(authType) {
  if (authType === 'public') {
    return '// Public endpoint - no authentication required';
  }
  
  return `async function authenticate(request: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  ${authType === 'admin' ? `
  // Check admin role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  if (profile?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) };
  }` : ''}
  
  return { user, supabase };
}`;
}

function generateOperations(operations, options) {
  const ops = [];
  
  if (operations.includes('C')) {
    ops.push(generateCreateOperation(options));
  }
  if (operations.includes('R')) {
    ops.push(generateReadOperation(options));
  }
  if (operations.includes('U')) {
    ops.push(generateUpdateOperation(options));
  }
  if (operations.includes('D')) {
    ops.push(generateDeleteOperation(options));
  }
  
  return ops.join('\n\n');
}

function generateCreateOperation(options) {
  return `// POST /api/v2/${options.name} - Create new ${options.service}
export async function POST(request: NextRequest) {
  try {
    ${options.auth === 'public' ? 
      `const supabase = createRouteHandlerClient<Database>({ cookies });` :
      `const auth = await authenticate(request);
    if (auth.error) return auth.error;
    const { user, supabase } = auth;`}
    
    const body = await request.json();
    
    // Validate input
    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    const service = new ${capitalize(options.service)}Service(supabase);
    const result = await service.create({
      ...body,
      ${options.auth !== 'public' ? 'user_id: user.id' : ''}
    });
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /${options.name}:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}`;
}

function generateReadOperation(options) {
  return `// GET /api/v2/${options.name} - Get ${options.name} list
export async function GET(request: NextRequest) {
  try {
    ${options.auth === 'public' ? 
      `const supabase = createRouteHandlerClient<Database>({ cookies });` :
      `const auth = await authenticate(request);
    if (auth.error) return auth.error;
    const { user, supabase } = auth;`}
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    
    const service = new ${capitalize(options.service)}Service(supabase);
    const result = await service.list({
      page,
      limit,
      search,
      ${options.auth !== 'public' && options.auth !== 'admin' ? 'userId: user.id' : ''}
    });
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in GET /${options.name}:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}`;
}

function generateUpdateOperation(options) {
  return `// PUT /api/v2/${options.name}/[id] - Update ${options.service}
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    ${options.auth === 'public' ? 
      `const supabase = createRouteHandlerClient<Database>({ cookies });` :
      `const auth = await authenticate(request);
    if (auth.error) return auth.error;
    const { user, supabase } = auth;`}
    
    const body = await request.json();
    
    const service = new ${capitalize(options.service)}Service(supabase);
    const result = await service.update(params.id, {
      ...body,
      ${options.auth !== 'public' ? 'updated_by: user.id' : ''}
    });
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in PUT /${options.name}/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}`;
}

function generateDeleteOperation(options) {
  return `// DELETE /api/v2/${options.name}/[id] - Delete ${options.service}
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    ${options.auth === 'public' ? 
      `const supabase = createRouteHandlerClient<Database>({ cookies });` :
      `const auth = await authenticate(request);
    if (auth.error) return auth.error;
    const { user, supabase } = auth;`}
    
    const service = new ${capitalize(options.service)}Service(supabase);
    const result = await service.delete(params.id${options.auth !== 'public' && options.auth !== 'admin' ? ', user.id' : ''});
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /${options.name}/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}`;
}

function generateServiceMethods(operations, options) {
  const methods = [];
  
  if (operations.includes('C')) {
    methods.push(`async create(data: any) {
    const { data: result, error } = await this.supabase
      .from('${options.name}')
      .insert(data)
      .select()
      .single();
    
    return { data: result, error: error?.message };
  }`);
  }
  
  if (operations.includes('R')) {
    methods.push(`async list(options: { page: number; limit: number; search?: string; userId?: string }) {
    const start = (options.page - 1) * options.limit;
    const end = start + options.limit - 1;
    
    let query = this.supabase
      .from('${options.name}')
      .select('*', { count: 'exact' });
    
    if (options.search) {
      query = query.ilike('name', \`%\${options.search}%\`);
    }
    
    if (options.userId) {
      query = query.eq('user_id', options.userId);
    }
    
    const { data, error, count } = await query
      .range(start, end)
      .order('created_at', { ascending: false });
    
    return { 
      data: {
        items: data || [],
        total: count || 0,
        page: options.page,
        limit: options.limit
      },
      error: error?.message 
    };
  }
  
  async getById(id: string) {
    const { data, error } = await this.supabase
      .from('${options.name}')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error: error?.message };
  }`);
  }
  
  if (operations.includes('U')) {
    methods.push(`async update(id: string, data: any) {
    const { data: result, error } = await this.supabase
      .from('${options.name}')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    return { data: result, error: error?.message };
  }`);
  }
  
  if (operations.includes('D')) {
    methods.push(`async delete(id: string, userId?: string) {
    let query = this.supabase
      .from('${options.name}')
      .delete()
      .eq('id', id);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { error } = await query;
    
    return { error: error?.message };
  }`);
  }
  
  return methods.join('\n\n  ');
}

// Create directories if they don't exist
const apiDir = path.join(process.cwd(), 'src', 'app', 'api', 'v2', options.name);
const serviceDir = path.join(process.cwd(), 'src', 'lib', 'services');

if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true });
}

if (!fs.existsSync(serviceDir)) {
  fs.mkdirSync(serviceDir, { recursive: true });
}

// Write API route file
const apiPath = path.join(apiDir, 'route.ts');
fs.writeFileSync(apiPath, apiTemplate);

// Write service file (if it doesn't exist)
const servicePath = path.join(serviceDir, `${options.service}.service.ts`);
if (!fs.existsSync(servicePath)) {
  fs.writeFileSync(servicePath, serviceTemplate);
}

// If operations include U or D, create [id] route
if (options.operations.includes('U') || options.operations.includes('D')) {
  const idDir = path.join(apiDir, '[id]');
  if (!fs.existsSync(idDir)) {
    fs.mkdirSync(idDir, { recursive: true });
  }
  
  const idRouteTemplate = `import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ${capitalize(options.service)}Service } from '@/lib/services/${options.service}.service';
import type { Database } from '@/types/database';

${generateAuthFunction(options.auth)}

// GET /api/v2/${options.name}/[id] - Get single ${options.service}
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    ${options.auth === 'public' ? 
      `const supabase = createRouteHandlerClient<Database>({ cookies });` :
      `const auth = await authenticate(request);
    if (auth.error) return auth.error;
    const { user, supabase } = auth;`}
    
    const service = new ${capitalize(options.service)}Service(supabase);
    const result = await service.getById(params.id);
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in GET /${options.name}/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

${options.operations.includes('U') ? generateUpdateOperation(options) : ''}

${options.operations.includes('D') ? generateDeleteOperation(options) : ''}
`;
  
  fs.writeFileSync(path.join(idDir, 'route.ts'), idRouteTemplate);
}

console.log(`
✅ API generated successfully!

Created files:
  📄 ${path.relative(process.cwd(), apiPath)}
  ${options.operations.includes('U') || options.operations.includes('D') ? 
    `📄 ${path.relative(process.cwd(), path.join(apiDir, '[id]', 'route.ts'))}` : ''}
  📄 ${path.relative(process.cwd(), servicePath)}

API endpoints:
  ${options.operations.includes('C') ? `POST   /api/v2/${options.name} - Create ${options.service}` : ''}
  ${options.operations.includes('R') ? `GET    /api/v2/${options.name} - List ${options.name}` : ''}
  ${options.operations.includes('R') ? `GET    /api/v2/${options.name}/[id] - Get ${options.service} by ID` : ''}
  ${options.operations.includes('U') ? `PUT    /api/v2/${options.name}/[id] - Update ${options.service}` : ''}
  ${options.operations.includes('D') ? `DELETE /api/v2/${options.name}/[id] - Delete ${options.service}` : ''}

Next steps:
  1. Update the service implementation in ${options.service}.service.ts
  2. Add proper TypeScript types for your data
  3. Test your new API endpoints
  4. Update frontend to use the new API
`);