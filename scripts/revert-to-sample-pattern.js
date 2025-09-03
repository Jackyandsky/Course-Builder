const fs = require('fs');
const path = require('path');

// List of all files to update
const files = {
  // Library files
  libFiles: [
    'src/lib/supabase/user-management.ts',
    'src/lib/supabase/courses.ts',
    'src/lib/supabase/content.ts',
    'src/lib/supabase/vocabulary.ts',
    'src/lib/supabase/books.ts',
    'src/lib/supabase/schedules.ts',
    'src/lib/supabase/lessons.ts',
    'src/lib/supabase/tasks.ts',
    'src/lib/supabase/objectives.ts',
    'src/lib/supabase/methods.ts',
    'src/lib/supabase/categories.ts',
    'src/lib/supabase/course-objectives.ts',
    'src/lib/supabase/decoders.ts'
  ],
  // Component files
  componentFiles: [
    'src/app/(admin)/layout.tsx',
    'src/app/(admin)/admin/users/page.tsx',
    'src/app/(admin)/admin/users/[id]/page.tsx',
    'src/app/(auth)/layout.tsx',
    'src/app/(account)/layout.tsx'
  ]
};

// Update library files
files.libFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove type parameter from createClientComponentClient
  content = content.replace(
    /const supabase = createClientComponentClient<Database>\(\);/g,
    'const supabase = createClientComponentClient();'
  );
  
  // Remove Database type import if it's only used for the client
  // First check if Database is used elsewhere
  const databaseUsageCount = (content.match(/Database/g) || []).length;
  const importMatch = content.match(/import type { Database } from ['"]@\/types\/database['"];?\n/);
  
  if (databaseUsageCount === 2 && importMatch) {
    // Only used in import and createClientComponentClient
    content = content.replace(/import type { Database } from ['"]@\/types\/database['"];?\n/, '');
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
});

// Update component files
files.componentFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace typed createClientComponentClient with untyped version
  content = content.replace(
    /const supabase = createClientComponentClient<Database>\(\);/g,
    'const supabase = createClientComponentClient();'
  );
  
  // Remove Database type import if not used elsewhere
  const databaseUsageCount = (content.match(/Database/g) || []).length;
  const importMatch = content.match(/import type { Database } from ['"]@\/types\/database['"];?\n/);
  
  if (databaseUsageCount === 2 && importMatch) {
    content = content.replace(/import type { Database } from ['"]@\/types\/database['"];?\n/, '');
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
});

// Update the main lib/supabase.ts file
const supabaseLibPath = path.join(process.cwd(), 'src/lib/supabase.ts');
if (fs.existsSync(supabaseLibPath)) {
  let content = fs.readFileSync(supabaseLibPath, 'utf8');
  
  // Replace with sample pattern
  content = `import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// This is the client-side Supabase client.
// It's used in client components (hooks, etc.)
export const createSupabaseClient = () => {
  return createClientComponentClient();
};

// We export the type for convenience.
// The server-side client will be created directly in server-side functions.
export type SupabaseClient = ReturnType<typeof createSupabaseClient>;`;
  
  fs.writeFileSync(supabaseLibPath, content);
  console.log('Updated src/lib/supabase.ts');
}

// Update the client.ts file
const clientPath = path.join(process.cwd(), 'src/lib/supabase/client.ts');
if (fs.existsSync(clientPath)) {
  let content = `import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// This is the client-side Supabase client.
// Matching the sample/src pattern exactly
export const getSupabaseClient = () => {
  return createClientComponentClient();
};

// Direct export for components that prefer to use createClientComponentClient directly
export { createClientComponentClient };`;
  
  fs.writeFileSync(clientPath, content);
  console.log('Updated src/lib/supabase/client.ts');
}

console.log('Done!');