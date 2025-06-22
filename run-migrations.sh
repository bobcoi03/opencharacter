#!/bin/bash

# Set the database name from wrangler.toml
DB_NAME="aifriendhub-db"

# Run all migration files in order
for file in $(ls ./drizzle/0*.sql | sort -n); do
  echo "Running migration: $file"
  bunx wrangler d1 execute $DB_NAME --local --file=$file
  
  # Continue even if there are errors (like table already exists)
  # We capture the error code but don't exit on error
  EXIT_CODE=$?
  if [ $EXIT_CODE -ne 0 ]; then
    echo "Note: This migration may have been partially or fully applied already."
  else
    echo "Migration successful: $file"
  fi
  
  echo "------------------------"
done

echo "Migration process completed!" 