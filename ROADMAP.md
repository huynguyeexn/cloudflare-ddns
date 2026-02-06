# 🗺️ Product Roadmap

This document outlines the planned features and improvements for `cloudflare-ddns`.

## 🚀 Phase 1: Essentials & Reliability
- [x] **Log Rotation**: Prevent log files from growing indefinitely.
  - Implement max file size (e.g., 5MB).
  - Keep a history of last $N$ log files.
- [ ] **Notifications**: Get alerted when IP changes or errors occur.
  - [x] NTFY notifications.
  - [ ] Pushover notifications.
  - [ ] Email notifications.
  - [ ] Telegram Bot integration.
  - [ ] Discord Webhook integration.
  - [ ] Slack Webhook integration.

## 🛠️ Phase 2: Usability & Deployment
- [x] **Service Management**:
  - [x] Support Systemd (Linux).
  - [x] Support Launchd (macOS).
  - [x] Manage service with `cloudflare-ddns service start|stop|restart`.
- [x] **Status Command**: Add `cloudflare-ddns status` to view:
  - Current detected IP (v4/v6).
  - Last update timestamp.
  - Service health status.
- [x] **Logs Command**: Add `cloudflare-ddns logs` to view and follow logs.
- [x] **Distribution**:
  - [x] GitHub Actions CI/CD for cross-platform binaries.
  - [x] Intelligent installer with pre-built binary detection.
- [x] **Docker Support**: Containerize the application for easy deployment on NAS/Pi.
  - [x] Create `Dockerfile`.
  - [x] Create `docker-compose.yml`.
  - [x] CI/CD to Docker Hub via GitHub Actions.
- [ ] **Cron / One-shot Mode**: Add `--once` flag provided for users who prefer system `crontab`.
- [x] **Manual Sync**: Add `cloudflare-ddns run now` to manually trigger Cloudflare record updates (always forced).

## ⚡ Phase 3: Advanced Features
- [ ] **Custom IP Providers**: Allow users to configure their own list of "Check IP" URLs in `config.json`.
- [ ] **Dry Run Mode**: Add `cloudflare-ddns run now --dry-run` to simulate updates without calling APIs.
- [ ] **Proxy Toggle**: Add ability to toggle Cloudflare Proxy (orange cloud) via CLI.
- [ ] **Interactive Config Editor**: Add `cloudflare-ddns config edit` to modify specific settings without rerunning setup.
- [ ] **Network Interface Binding**: Select specific network interface (e.g., `eth0`, `wlan0`) for multi-WAN setups.

## 🌟 Phase 4: Pro Features
- [ ] **Self-update**: Add `cloudflare-ddns self-update` to automatically pull latest binary from GitHub.
- [ ] **IP History**: Track and display last $N$ IP changes in `cloudflare-ddns status`.
- [ ] **Hooks / Scripts**: Support `pre-update` and `post-update` shell scripts.
- [ ] **Health Checks**: Support integration with services like Healthchecks.io or Uptime Kuma.
- [ ] **Web Dashboard**: Optional mini web UI to monitor status and logs via browser.
