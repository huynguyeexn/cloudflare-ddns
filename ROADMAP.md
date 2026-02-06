# 🗺️ Product Roadmap

This document outlines the planned features and improvements for `cfddns`.

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
- [ ] **Docker Support**: Containerize the application for easy deployment on NAS/Pi.
  - Create `Dockerfile`.
  - Create `docker-compose.yml`.
- [ ] **Cron / One-shot Mode**: Add `--once` flag provided for users who prefer system `crontab`.
- [x] **Status Command**: Add `cfddns status` to view:
  - Current detected IP (v4/v6).
  - Last update timestamp.
  - Service health status.
- [ ] **Force Update**: Add `cfddns update --force` to manually trigger Cloudflare record updates (even if IP hasn't changed).

## ⚡ Phase 3: Advanced Features
- [ ] **Custom IP Providers**: Allow users to configure their own list of "Check IP" URLs in `config.json`.
- [ ] **Network Interface Binding**: Select specific network interface (e.g., `eth0`, `wlan0`) for multi-WAN setups.
