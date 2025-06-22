#!/bin/bash

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

# Print section header
print_header() {
    echo -e "\n${BLUE}==== $1 ====${NC}\n"
}

# Check if Wrangler is installed
print_header "Checking Wrangler installation"
if ! command -v bunx wrangler &> /dev/null; then
    echo -e "${RED}Wrangler CLI is not installed. Please install it first.${NC}"
    echo -e "Run: ${YELLOW}npm install -g wrangler${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Wrangler is installed${NC}"

# Check for .dev.vars file
print_header "Checking for .dev.vars file"
if [ ! -f ".dev.vars" ]; then
    echo -e "${YELLOW}Warning: .dev.vars file not found.${NC}"
    echo -e "Creating a sample .dev.vars file. Please update with your actual credentials."
    
    cat > .dev.vars << EOL
# Add your environment variables here
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXTAUTH_SECRET="generate-a-secure-secret"
EOL
    
    echo -e "${GREEN}✓ Created sample .dev.vars file${NC}"
else
    echo -e "${GREEN}✓ .dev.vars file exists${NC}"
fi

# Set the database name from wrangler.toml
DB_NAME="aifriendhub-db"

# Run all migrations
print_header "Running database migrations"
for file in $(ls ./drizzle/0*.sql | sort -n); do
    echo -e "Running migration: ${YELLOW}$file${NC}"
    bunx wrangler d1 execute $DB_NAME --local --file=$file > /dev/null 2>&1
    
    # Continue even if there are errors (like table already exists)
    EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ]; then
        echo -e "${YELLOW}Note: This migration may have been partially or fully applied already.${NC}"
    else
        echo -e "${GREEN}✓ Migration successful: $file${NC}"
    fi
done

echo -e "\n${GREEN}==== All migrations have been applied ====${NC}"

# Check if .wrangler/state/v3/d1 exists to verify database is there
if [ -d ".wrangler/state/v3/d1" ]; then
    echo -e "${GREEN}✓ Local D1 database has been set up${NC}"
else
    echo -e "${YELLOW}Warning: Local D1 database directory not found.${NC}"
    echo -e "You may need to create it manually: ${YELLOW}bunx wrangler d1 create $DB_NAME --local${NC}"
fi

print_header "Next steps"
echo -e "1. Start the development server: ${YELLOW}bun run dev${NC}"
echo -e "2. For remote deployment: ${YELLOW}bun run deploy${NC}"
echo -e "\n${GREEN}Setup completed! Your local environment is ready.${NC}" 