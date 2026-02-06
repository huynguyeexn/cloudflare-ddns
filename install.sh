#!/bin/bash

# Cloudflare DDNS Installer

set -e

REPO_URL="https://github.com/huynguyeexn/cloudflare-ddns.git"
INSTALL_DIR="/usr/local/bin"
APP_NAME="cfddns"
SOURCE_DIR="$HOME/.cloudflare-ddns-src"

echo "Installing Cloudflare DDNS..."

# 1. Check/Install Bun
if ! command -v bun &> /dev/null; then
    echo "Bun not found. Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
fi

# 2. Setup Source Directory
if [ -f "./package.json" ] && [ -f "./src/index.ts" ]; then
    echo "Detected local source at $(pwd). Installing from here..."
    SOURCE_DIR=$(pwd)
else
    if [ -d "$SOURCE_DIR" ]; then
        echo "Updating source code from Git..."
        cd "$SOURCE_DIR"
        git pull
    else
        echo "Cloning source code..."
        git clone "$REPO_URL" "$SOURCE_DIR"
        cd "$SOURCE_DIR"
    fi
fi

# 3. Install Dependencies
echo "Installing dependencies..."
bun install

# 4. Build Binary
echo "Building binary..."
bun run build

# 5. Install Binary
echo "Installing binary to $INSTALL_DIR..."
# Check for sudo/root to move to /usr/local/bin
if [ -w "$INSTALL_DIR" ]; then
    mv "$SOURCE_DIR/$APP_NAME" "$INSTALL_DIR/$APP_NAME"
else
    echo "Root privileges required to move binary to $INSTALL_DIR"
    sudo mv "$SOURCE_DIR/$APP_NAME" "$INSTALL_DIR/$APP_NAME"
fi

echo "Installation complete!"
echo "Run '$APP_NAME setup' to configure."
