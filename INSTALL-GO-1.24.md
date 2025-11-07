# Install Go 1.24 on Ubuntu

## 🚀 Quick Installation

### Method 1: Using Official Go Archive (Recommended)

```bash
# Remove old Go installation
sudo rm -rf /usr/local/go

# Download Go 1.24.0
wget https://go.dev/dl/go1.24.0.linux-amd64.tar.gz

# Extract to /usr/local
sudo tar -C /usr/local -xzf go1.24.0.linux-amd64.tar.gz

# Clean up
rm go1.24.0.linux-amd64.tar.gz
```

### Method 2: Add to PATH

Add to `~/.bashrc` or `~/.zshrc`:

```bash
export PATH=$PATH:/usr/local/go/bin
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin
```

Apply changes:

```bash
source ~/.bashrc
# or
source ~/.zshrc
```

## ✅ Verify Installation

```bash
# Check Go version (should show go1.24.0 or go1.24.x)
go version

# Should output: go version go1.24.0 linux/amd64
```

## 🔧 Set Environment Variable for Project

To ensure the project uses the local Go 1.24 installation:

```bash
export GOTOOLCHAIN=local
```

Add this to your shell profile to make it permanent:

```bash
echo 'export GOTOOLCHAIN=local' >> ~/.bashrc
source ~/.bashrc
```

## 📦 Alternative: Using go install

If you already have Go installed but need 1.24:

```bash
# Download and install Go 1.24
go install golang.org/dl/go1.24.0@latest
go1.24.0 download

# Use it for this project
alias go=go1.24.0
```

## 🐳 Docker (Already Configured)

The Docker containers will automatically use Go 1.24 from the Dockerfile:

```dockerfile
FROM golang:1.24-alpine
```

No action needed for Docker - it's already configured!

## 🧪 Test Installation

After installing, test with the project:

```bash
cd /var/www/homeopathy-business-platform/services/api-golang-master

# This should work without errors
GOTOOLCHAIN=local go mod tidy
GOTOOLCHAIN=local go build -o api-golang cmd/main.go

# Run the binary
./api-golang
```

## 🔍 Troubleshooting

### Issue: "go: go.mod requires go >= 1.24"

**Solution**: You're still using an older Go version. Check:

```bash
which go
go version
```

Make sure `/usr/local/go/bin` is in your PATH before other Go installations.

### Issue: "toolchain not available"

**Solution**: Use local toolchain:

```bash
export GOTOOLCHAIN=local
go mod tidy
```

### Issue: Multiple Go versions installed

**Solution**: Remove old versions:

```bash
# Find all Go installations
which -a go

# Remove old ones (e.g., from apt)
sudo apt remove golang-go
sudo apt autoremove

# Keep only /usr/local/go
```

## 📋 Complete Setup Script

Save this as `install-go-1.24.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Installing Go 1.24..."

# Remove old installation
sudo rm -rf /usr/local/go

# Download Go 1.24
wget -q https://go.dev/dl/go1.24.0.linux-amd64.tar.gz

# Install
sudo tar -C /usr/local -xzf go1.24.0.linux-amd64.tar.gz

# Clean up
rm go1.24.0.linux-amd64.tar.gz

# Add to PATH if not already there
if ! grep -q "/usr/local/go/bin" ~/.bashrc; then
    echo "" >> ~/.bashrc
    echo "# Go 1.24" >> ~/.bashrc
    echo "export PATH=\$PATH:/usr/local/go/bin" >> ~/.bashrc
    echo "export GOPATH=\$HOME/go" >> ~/.bashrc
    echo "export PATH=\$PATH:\$GOPATH/bin" >> ~/.bashrc
    echo "export GOTOOLCHAIN=local" >> ~/.bashrc
fi

# Source bashrc
source ~/.bashrc

echo "✅ Go 1.24 installed successfully!"
go version
```

Run it:

```bash
chmod +x install-go-1.24.sh
./install-go-1.24.sh
```

## 🎯 After Installation

Once Go 1.24 is installed, run the project:

```bash
./start-fresh.sh
```

Everything will now use Go 1.24 consistently! 🎉
