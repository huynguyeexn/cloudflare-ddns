# Cloudflare DDNS CLI

Công cụ CLI tự động cập nhật IP cho Cloudflare DNS Records, hỗ trợ cài đặt nhanh và chạy ngầm (Systemd).

## Tính năng

- **Cài đặt 1 dòng lệnh**: Tự động cài đặt Bun, build và setup service.
- **Auto Update IP**: Chạy ngầm cập nhật IP mỗi 5 phút (mặc định).
- **Quản lý dễ dàng**: Giao diện CLI tương tác để thêm/bớt domain.
- **Systemd Integration**: Tự động khởi động cùng hệ thống.

## Cài đặt

Chạy lệnh sau để cài đặt (Tự động nhận diện hệ điều hành và tải bản build phù hợp):

```bash
curl -fsSL https://raw.githubusercontent.com/huynguyeexn/cloudflare-ddns/main/install.sh | bash
```

**Lưu ý:** Installer sẽ ưu tiên tải binary đã build sẵn từ GitHub Releases. Nếu không tìm thấy bản phù hợp, nó sẽ tự động tải source code và build (yêu cầu máy có cài [Bun](https://bun.sh)).

## Sử dụng

Sau khi cài đặt, bạn có thể sử dụng lệnh `cloudflare-ddns` từ bất kỳ đâu.

### 1. Cấu hình (Setup)

Lần đầu chạy cần cấu hình Token và chọn Domain:

```bash
cloudflare-ddns setup
```

### 2. Cài đặt Service (Chạy ngầm)

Để tool tự động chạy ngầm và khởi động cùng máy:

```bash
sudo cloudflare-ddns service install
```

Dịch vụ này hỗ trợ cả **Systemd (Linux)** và **Launchd (macOS)**.

### 3. Kiểm tra trạng thái & Logs

Xem trạng thái hoạt động của IP và Service:
```bash
cloudflare-ddns status
```

Xem logs realtime:
```bash
cloudflare-ddns logs -f
```

### 4. Các lệnh quản lý Service

- **Dừng service**: `sudo cloudflare-ddns service stop`
- **Chạy lại service**: `sudo cloudflare-ddns service start`
- **Khởi động lại**: `sudo cloudflare-ddns service restart`
- **Gỡ bỏ service**: `sudo cloudflare-ddns service uninstall`

### 5. Cập nhật thủ công (Manual Update)

Chạy cập nhật IP ngay lập tức (luôn ép buộc đồng bộ với Cloudflare):
```bash
cloudflare-ddns run now
```

## Docker (Khuyên dùng cho NAS/Synology/RPi)

Bạn có thể sử dụng Docker để chạy ổn định hơn trên các thiết bị NAS hoặc Server:

```bash
# 1. Tạo thư mục config và file config.json (hoặc copy từ máy khác)
mkdir config
# Cấu hình file config.json của bạn vào thư mục config

# 2. Chạy bằng Docker Compose
docker-compose up -d
```

Hoặc chạy lệnh trực tiếp bằng Docker:

```bash
docker run -d \
  --name cloudflare-ddns \
  --restart unless-stopped \
  -v $(pwd)/config:/config \
  huynguyeexn/cloudflare-ddns:latest
```

*Lưu ý: Bạn nên thực hiện lệnh `cloudflare-ddns setup` trên máy cá nhân trước để lấy file `config.json`, sau đó mount nó vào container.*


## Phát triển (Dành cho Developer)

Nếu bạn muốn tự build từ source:

```bash
# Cài dependency
bun install

# Chạy dev
bun run src/index.ts run

# Build binary local
bun run build
```

