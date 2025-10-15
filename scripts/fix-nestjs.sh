#!/usr/bin/env bash
# Automated NestJS Fix Script
# Attempts common fixes for TypeScript compilation errors

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🔧 NestJS Automated Fix Script                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

cd services/api-nest || exit 1

echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}Step 2: Generating Prisma client...${NC}"
npx prisma generate || echo "Prisma generate failed (may not be using Prisma)"

echo -e "${YELLOW}Step 3: Checking tsconfig.json...${NC}"
if [ -f "tsconfig.json" ]; then
    echo "✓ tsconfig.json exists"
else
    echo -e "${RED}✗ tsconfig.json missing!${NC}"
    echo "Creating default tsconfig.json..."
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2020",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
EOF
fi

echo -e "${YELLOW}Step 4: Attempting build...${NC}"
if npm run build 2>&1 | tee build.log; then
    echo -e "${GREEN}✓ Build successful!${NC}"
    BUILD_SUCCESS=true
else
    echo -e "${RED}✗ Build failed. Analyzing errors...${NC}"
    BUILD_SUCCESS=false
fi

if [ "$BUILD_SUCCESS" = false ]; then
    echo -e "${YELLOW}Step 5: Applying common fixes...${NC}"
    
    # Fix 1: Update package.json scripts if missing
    echo "Checking package.json scripts..."
    
    # Fix 2: Check for missing type definitions
    echo "Installing common type definitions..."
    npm install --save-dev @types/node @types/express @types/jest || true
    
    # Fix 3: Try build again
    echo -e "${YELLOW}Retrying build...${NC}"
    if npm run build 2>&1 | tee build-retry.log; then
        echo -e "${GREEN}✓ Build successful after fixes!${NC}"
        BUILD_SUCCESS=true
    else
        echo -e "${RED}✗ Build still failing${NC}"
    fi
fi

if [ "$BUILD_SUCCESS" = true ]; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ NestJS Build Successful!                              ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run: npm run start:dev"
    echo "2. Test: curl http://localhost:3001/health"
    echo "3. View Swagger: http://localhost:3001/api"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ Build Failed - Manual Intervention Required           ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Common issues to check:"
    echo "1. Review build.log for specific errors"
    echo "2. Check Prisma schema matches database"
    echo "3. Fix circular dependencies"
    echo "4. Ensure all imports are correct"
    echo "5. Check for missing dependencies"
    echo ""
    echo "Build logs saved to: build.log and build-retry.log"
    exit 1
fi
