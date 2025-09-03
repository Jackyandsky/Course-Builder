#!/bin/bash

echo "======================================"
echo "Applying remaining course batches"
echo "======================================"
echo ""

TOTAL=0
SUCCESS=0

# Apply batches 3 to 11
for i in {3..11}; do
  echo -n "Batch $i: "
  
  # Count courses in this batch
  COUNT=$(grep -c "),\$" "./database/migrations/insert_courses_batch_${i}.sql" 2>/dev/null)
  let COUNT=COUNT+1
  echo -n "$COUNT courses... "
  
  # Apply status (simulation for now)
  echo "Ready to apply"
  
  let TOTAL=TOTAL+COUNT
done

echo ""
echo "======================================"
echo "Summary:"
echo "  Batches 1-2: 40 courses (already applied)"
echo "  Batches 3-11: $TOTAL courses (ready to apply)"
echo "  Total: $((40 + TOTAL)) courses"
echo "======================================"