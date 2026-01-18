#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  DinaZen Demo - Docker Build${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Check secrets
if [ ! -f .secrets/nuget_username.txt ] || [ ! -f .secrets/nuget_token.txt ]; then
    echo -e "${YELLOW}⚠ Warning: NuGet secrets not found!${NC}"
    echo "Create .secrets/nuget_username.txt and .secrets/nuget_token.txt"
    echo ""
    echo "Example:"
    echo "  mkdir -p .secrets"
    echo "  echo 'your-github-username' > .secrets/nuget_username.txt"
    echo "  echo 'ghp_yourPersonalAccessToken' > .secrets/nuget_token.txt"
    echo ""
    exit 1
fi

# Build image
echo -e "${GREEN}Building DinaZen Demo image...${NC}"
docker build \
    --secret id=nuget_username,src=.secrets/nuget_username.txt \
    --secret id=nuget_token,src=.secrets/nuget_token.txt \
    --build-arg PFX_PASSWORD=dinazen-dev \
    -t dinazen-demo:latest \
    .

echo ""
echo -e "${GREEN}✓ Build complete!${NC}"
echo ""
echo "To run the container:"
echo "  docker run -p 5000:80 -p 5001:443 dinazen-demo:latest"
echo ""
echo "Or use docker-compose:"
echo "  docker-compose up"
echo ""
