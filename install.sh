#!/bin/bash

# Cloudflare DDNS Installer
# This script will try to download a pre-built binary. 
# If that fails, it will fallback to building from source (requires Bun).

set -e

REPO="huynguyeexn/cloudflare-ddns"
INSTALL_DIR="/usr/local/bin"
APP_NAME="cloudflare-ddns"

echo "🚀 Installing Cloudflare DDNS ($APP_NAME)..."

# 1. Detect Platform & Architecture
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "$ARCH" in
    x86_64) ARCH="x64" ;;
    aarch64|arm64) ARCH="arm64" ;;
    *) echo "❌ Unsupported architecture: $ARCH"; exit 1 ;;
esac

case "$OS" in
    darwin) PLATFORM="macos" ;;
    linux) PLATFORM="linux" ;;
    *) echo "❌ Unsupported OS: $OS"; exit 1 ;;
esac

BINARY_NAME="${APP_NAME}-${PLATFORM}-${ARCH}"
RELEASE_URL="https://github.com/${REPO}/releases/latest/download/${BINARY_NAME}"

# 2. Try to download pre-built binary
echo "🔍 Checking for pre-built binary for ${PLATFORM}-${ARCH}..."

DOWNLOADED=false
TEMP_BIN="/tmp/${APP_NAME}"

# Check if we are running in a local source directory
if [ -f "./package.json" ] && [ -f "./src/index.ts" ]; then
    echo "📦 Local source detected. Building from source instead of downloading..."
else
    if curl -L --output /dev/null --silent --head --fail "$RELEASE_URL"; then
        echo "📥 Downloading binary from GitHub Releases..."
        curl -L "$RELEASE_URL" -o "$TEMP_BIN"
        chmod +x "$TEMP_BIN"
        DOWNLOADED=true
    else
        echo "⚠️  Pre-built binary not found for your platform. Falling back to source build..."
    fi
fi

# 3. Fallback to Build from Source
if [ "$DOWNLOADED" = false ]; then
    # Check/Install Bun
    if ! command -v bun &> /dev/null; then
        echo "🐰 Bun not found. Installing Bun..."
        curl -fsSL https://bun.sh/install | bash
        export BUN_INSTALL="$HOME/.bun"
        export PATH="$BUN_INSTALL/bin:$PATH"
    fi

    SOURCE_DIR="$HOME/.cloudflare-ddns-src"
    if [ -f "./package.json" ]; then
        SOURCE_DIR=$(pwd)
    else
        if [ -d "$SOURCE_DIR" ]; then
            cd "$SOURCE_DIR" && git pull
        else
            git clone "https://github.com/${REPO}.git" "$SOURCE_DIR"
            cd "$SOURCE_DIR"
        fi
    fi

    echo "⚙️  Building from source..."
    bun install
    bun run build
    TEMP_BIN="${SOURCE_DIR}/${APP_NAME}"
fi

# 4. Install Binary
echo "🚚 Installing binary to $INSTALL_DIR..."
if [ -w "$INSTALL_DIR" ]; then
    mv "$TEMP_BIN" "$INSTALL_DIR/$APP_NAME"
else
    sudo mv "$TEMP_BIN" "$INSTALL_DIR/$APP_NAME"
fi

echo "✅ Installation complete!"
echo "👉 Run '$APP_NAME setup' to configure."
echo "👉 Run '$APP_NAME status' to check health."

