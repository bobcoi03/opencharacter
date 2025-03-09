#!/bin/bash

# Check if a token is provided
if [ -z "$1" ]; then
  echo "Usage: ./scripts/set-replicate-token.sh <your-replicate-api-token>"
  echo "Find your API token in your account settings at https://replicate.com/account"
  exit 1
fi

# Set the token in the .env file
if [ -f .env ]; then
  # Check if REPLICATE_API_TOKEN already exists in .env
  if grep -q "REPLICATE_API_TOKEN" .env; then
    # Replace the existing token
    sed -i '' "s/REPLICATE_API_TOKEN=.*/REPLICATE_API_TOKEN=$1/" .env
  else
    # Add the token to the end of the file
    echo "REPLICATE_API_TOKEN=$1" >> .env
  fi
else
  # Create a new .env file with the token
  echo "REPLICATE_API_TOKEN=$1" > .env
fi

echo "Replicate API token has been set in .env file"
echo "You can now use the image generator at /image-generator" 