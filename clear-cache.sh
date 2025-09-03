#!/bin/bash

echo "Clearing Next.js cache..."

# Remove .next cache directory
rm -rf .next

# Clear node_modules cache if needed
# rm -rf node_modules/.cache

echo "Cache cleared! Please restart your development server:"
echo "npm run dev"