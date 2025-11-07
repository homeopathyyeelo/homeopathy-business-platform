#!/bin/bash

##############################################
# Codegen Script - Generate models from Proto
# Usage: ./codegen/generate.sh [go|ts|python|all]
##############################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PROTO_DIR="$ROOT_DIR/proto"
GEN_DIR="$ROOT_DIR/gen"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if buf is installed
check_buf() {
    if command -v buf &> /dev/null; then
        echo -e "${GREEN}✓${NC} buf CLI found"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} buf CLI not found. Install from: https://buf.build/docs/installation"
        return 1
    fi
}

# Generate using buf (preferred method)
generate_with_buf() {
    echo -e "\n${GREEN}Generating code with buf...${NC}"
    cd "$ROOT_DIR"
    buf generate
    echo -e "${GREEN}✓${NC} Code generation complete"
}

# Generate Go code using protoc
generate_go() {
    echo -e "\n${GREEN}Generating Go code...${NC}"
    mkdir -p "$GEN_DIR/go"
    
    protoc \
        --proto_path="$PROTO_DIR" \
        --go_out="$GEN_DIR/go" \
        --go_opt=paths=source_relative \
        "$PROTO_DIR"/*.proto
    
    echo -e "${GREEN}✓${NC} Go code generated in gen/go/"
}

# Generate TypeScript code using protoc
generate_typescript() {
    echo -e "\n${GREEN}Generating TypeScript code...${NC}"
    mkdir -p "$GEN_DIR/ts"
    
    # Check if ts-proto is installed
    if ! npm list -g ts-proto &> /dev/null && ! npm list ts-proto &> /dev/null; then
        echo -e "${YELLOW}⚠${NC} ts-proto not found. Installing..."
        npm install --save-dev ts-proto
    fi
    
    protoc \
        --proto_path="$PROTO_DIR" \
        --plugin=./node_modules/.bin/protoc-gen-ts_proto \
        --ts_proto_out="$GEN_DIR/ts" \
        --ts_proto_opt=esModuleInterop=true \
        "$PROTO_DIR"/*.proto
    
    echo -e "${GREEN}✓${NC} TypeScript code generated in gen/ts/"
}

# Generate Python code using protoc
generate_python() {
    echo -e "\n${GREEN}Generating Python code...${NC}"
    mkdir -p "$GEN_DIR/python"
    
    protoc \
        --proto_path="$PROTO_DIR" \
        --python_out="$GEN_DIR/python" \
        "$PROTO_DIR"/*.proto
    
    # Create __init__.py files
    touch "$GEN_DIR/python/__init__.py"
    
    echo -e "${GREEN}✓${NC} Python code generated in gen/python/"
}

# Main script
main() {
    echo "================================================"
    echo "  Schema Contracts - Code Generation"
    echo "================================================"
    
    TARGET="${1:-all}"
    
    # Try buf first, fall back to protoc
    if check_buf; then
        generate_with_buf
    else
        echo -e "\n${YELLOW}Using protoc as fallback...${NC}"
        
        case "$TARGET" in
            go)
                generate_go
                ;;
            ts|typescript)
                generate_typescript
                ;;
            python|py)
                generate_python
                ;;
            all)
                generate_go
                generate_typescript
                generate_python
                ;;
            *)
                echo -e "${RED}✗${NC} Invalid target: $TARGET"
                echo "Usage: $0 [go|ts|python|all]"
                exit 1
                ;;
        esac
    fi
    
    echo -e "\n${GREEN}✨ Code generation complete!${NC}"
    echo -e "Generated files are in: ${GEN_DIR}\n"
}

main "$@"
