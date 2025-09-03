#!/bin/bash

# Apply all batch migrations sequentially

echo "Starting batch migration process..."
echo "================================"

SUCCESS_COUNT=0
ERROR_COUNT=0
MIGRATION_DIR="/mnt/d/dev/cursor/course builder/database/migrations"

# Loop through batch files in order
for i in {1..10}; do
    FILE="$MIGRATION_DIR/insert_courses_batch_${i}.sql"
    
    if [ -f "$FILE" ]; then
        echo -n "Applying batch ${i}... "
        
        # Read the SQL file content
        SQL_CONTENT=$(cat "$FILE")
        
        # Apply using Node.js script
        node -e "
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://djvmoqharkefksvceetu.supabase.co',
  '${SUPABASE_SERVICE_ROLE_KEY:-your_service_role_key}'
);

const sql = fs.readFileSync('${FILE}', 'utf8');

(async () => {
  try {
    const { data, error } = await supabase.rpc('exec', { sql });
    if (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
    console.log('Success');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo "✅ Success"
            ((SUCCESS_COUNT++))
        else
            echo "❌ Failed"
            ((ERROR_COUNT++))
        fi
        
        # Small delay between batches
        sleep 1
    fi
done

echo ""
echo "================================"
echo "Migration Summary:"
echo "  ✅ Successful: ${SUCCESS_COUNT} batches"
echo "  ❌ Failed: ${ERROR_COUNT} batches"
echo "================================"