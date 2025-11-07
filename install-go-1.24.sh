#!/bin/bash

# ============================================================================
# Install Go 1.24.0 on Ubuntu
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Installing Go 1.24.0 on Ubuntu                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root for system-wide install
if [ "$EUID" -eq 0 ]; then 
    INSTALL_DIR="/usr/local"
    SUDO=""
else
    echo -e "${YELLOW}Note: Not running as root. Will use sudo for installation.${NC}"
    SUDO="sudo"
fi

# Step 1: Check current Go version
echo -e "${YELLOW}[1/5]${NC} Checking current Go installation..."
if command -v go &> /dev/null; then
    CURRENT_VERSION=$(go version | awk '{print $3}')
    echo -e "${BLUE}Current Go version: ${CURRENT_VERSION}${NC}"
    
    if [[ "$CURRENT_VERSION" == "go1.24"* ]]; then
        echo -e "${GREEN}✓ Go 1.24 is already installed!${NC}"
        exit 0
    fi
else
    echo -e "${YELLOW}Go is not currently installed${NC}"
fi
echo ""

# Step 2: Remove old Go installation
echo -e "${YELLOW}[2/5]${NC} Removing old Go installation..."
$SUDO rm -rf /usr/local/go
echo -e "${GREEN}✓ Old installation removed${NC}"
echo ""

# Step 3: Download Go 1.24.0
echo -e "${YELLOW}[3/5]${NC} Downloading Go 1.24.0..."
cd /tmp
wget -q --show-progress https://go.dev/dl/go1.24.0.linux-amd64.tar.gz

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Download complete${NC}"
else
    echo -e "${RED}✗ Download failed${NC}"
    exit 1
fi
echo ""

# Step 4: Install Go
echo -e "${YELLOW}[4/5]${NC} Installing Go 1.24.0..."
$SUDO tar -C /usr/local -xzf go1.24.0.linux-amd64.tar.gz

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Go 1.24.0 installed to /usr/local/go${NC}"
else
    echo -e "${RED}✗ Installation failed${NC}"
    exit 1
fi

# Clean up
rm go1.24.0.linux-amd64.tar.gz
echo ""

# Step 5: Configure PATH
echo -e "${YELLOW}[5/5]${NC} Configuring environment..."

# Determine shell config file
if [ -n "$ZSH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
else
    SHELL_CONFIG="$HOME/.profile"
fi

# Add Go to PATH if not already there
if ! grep -q "/usr/local/go/bin" "$SHELL_CONFIG" 2>/dev/null; then
    echo "" >> "$SHELL_CONFIG"
    echo "# Go 1.24 Configuration" >> "$SHELL_CONFIG"
    echo "export PATH=\$PATH:/usr/local/go/bin" >> "$SHELL_CONFIG"
    echo "export GOPATH=\$HOME/go" >> "$SHELL_CONFIG"
    echo "export PATH=\$PATH:\$GOPATH/bin" >> "$SHELL_CONFIG"
    echo "export GOTOOLCHAIN=local" >> "$SHELL_CONFIG"
    echo -e "${GREEN}✓ Added Go to PATH in $SHELL_CONFIG${NC}"
else
    echo -e "${BLUE}ℹ Go already in PATH${NC}"
fi

# Update current session
export PATH=$PATH:/usr/local/go/bin
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin
export GOTOOLCHAIN=local

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ✅ Go 1.24.0 Installation Complete!                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verify installation
GO_VERSION=$(go version)
echo -e "${GREEN}Installed version:${NC} $GO_VERSION"
echo ""

echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "  1. Reload your shell: ${BLUE}source $SHELL_CONFIG${NC}"
echo -e "  2. Verify Go version: ${BLUE}go version${NC}"
echo -e "  3. Start the project: ${BLUE}./start-fresh.sh${NC}"
echo ""

echo -e "${GREEN}✨ Go 1.24.0 is ready to use!${NC}"
