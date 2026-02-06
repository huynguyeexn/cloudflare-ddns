# Cloudflare DDNS CLI

A powerful, interactive CLI tool to automatically update Cloudflare DNS records with your public IP address. Designed for simplicity with built-in service management for Linux (Systemd) and macOS (Launchd).

[![Docker Publish](https://github.com/huynguyeexn/cloudflare-ddns/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/huynguyeexn/cloudflare-ddns/actions/workflows/docker-publish.yml)

## ✨ Features

- **🚀 One-command Installation**: Automated script to install Bun, build binary, and setup the CLI.
- **🔄 Auto Update**: Runs in the background (as a service) to update your IP every 5 minutes (configurable).
- **🛠️ Interactive Setup**: Easy wizard to configure API tokens and select DNS records.
- **🐧 Systemd & Launchd**: Seamless background service integration for Linux and macOS.
- **🐳 Docker Support**: Ready-to-use Docker images for NAS (Synology/QNAP), Raspberry Pi, and servers.
- **🔔 Notifications**: Support for `ntfy` to alert you when your IP changes.
- **🔍 IP Diagnostics**: Built-in tool to verify and debug public IP lookup sources.

---

## 📦 Installation

Run the following command to automatically detect your OS, download the correct binary, and setup the CLI:

```bash
curl -fsSL https://raw.githubusercontent.com/huynguyeexn/cloudflare-ddns/main/install.sh | bash
```

*Note: The installer will try to download a pre-built binary from GitHub Releases first. If a compatible binary is not found, it will build from source locally (requires [Bun](https://bun.sh)).*

---

## 🚀 Quick Start

After installation, the `cloudflare-ddns` command will be available globally.

### 1. Interactive Configuration
Run the setup wizard to enter your Cloudflare API Token and select which domains/subdomains should be updated.

```bash
cloudflare-ddns setup
```

### 2. Run as a Background Service
To ensure the IP stays updated automatically across reboots, install the background service:

```bash
sudo cloudflare-ddns service install
```
*This will detect your OS (Linux/macOS) and install the appropriate service manager configuration.*

---

## 🛠️ Usage Examples

### Check Status
View your current public IPs (v4/v6), last update time, and service health.
```bash
cloudflare-ddns status
```

### Real-time Logs
Monitor activity and troubleshoot IP changes.
```bash
cloudflare-ddns logs -f
```

### Manual Force Update
If you've just changed something and want to force an update immediately:
```bash
cloudflare-ddns run now
```

### Service Management
- **Start**: `sudo cloudflare-ddns service start`
- **Stop**: `sudo cloudflare-ddns service stop`
- **Restart**: `sudo cloudflare-ddns service restart`
- **Uninstall**: `sudo cloudflare-ddns service uninstall`

---

## 🐳 Docker Usage

Recommended for NAS or server environments.

### Docker Compose
Create a `docker-compose.yml` file:
```yaml
services:
  cloudflare-ddns:
    image: huynguyeexn/cloudflare-ddns:latest
    container_name: cloudflare-ddns
    restart: unless-stopped
    volumes:
      - ./config:/config
    environment:
      - CLOUDFLARE_DDNS_CONFIG_PATH=/config/config.json
```

### Command Line
```bash
docker run -d \
  --name cloudflare-ddns \
  --restart unless-stopped \
  -v $(pwd)/config:/config \
  huynguyeexn/cloudflare-ddns:latest
```

*Tip: It's easiest to run `cloudflare-ddns setup` on your local machine first, then copy the generated `config.json` to your server's config directory.*

---

## 🔧 Maintenance & Diagnostics

### IP Source Check
If you are having trouble getting your public IP, run the diagnostic tool to see which lookup sources are working:
```bash
# Only available if you have the source code / dev environment
bun tests/check-ip-sources.ts
```

### Running Tests
Ensure everything is working correctly:
```bash
bun test
```

---

## 🏗️ Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run src/index.ts run

# Build local binary
bun run build
```

---

## 📄 License
MIT © [Huy Nguyen](https://github.com/huynguyeexn)
