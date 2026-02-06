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

Sau khi cài đặt, bạn có thể sử dụng lệnh `cfddns` từ bất kỳ đâu.

### 1. Cấu hình (Setup)

Lần đầu chạy cần cấu hình Token và chọn Domain:

```bash
cfddns setup
```

### 2. Cài đặt Service (Chạy ngầm)

Để tool tự động chạy ngầm và khởi động cùng máy:

```bash
sudo cfddns service install
```

Dịch vụ này hỗ trợ cả **Systemd (Linux)** và **Launchd (macOS)**.

### 3. Kiểm tra trạng thái & Logs

Xem trạng thái hoạt động của IP và Service:
```bash
cfddns status
```

Xem logs realtime:
```bash
cfddns logs -f
```

### 4. Các lệnh quản lý Service

- **Dừng service**: `sudo cfddns service stop`
- **Chạy lại service**: `sudo cfddns service start`
- **Khởi động lại**: `sudo cfddns service restart`
- **Gỡ bỏ service**: `sudo cfddns service uninstall`

## Phát triển (Dành cho Developer)

Nếu bạn muốn tự build từ source:

```bash
# Cài dependency
bun install

# Chạy dev
bun run src/index.ts start

# Build binary local
bun run build
```

