# Cloudflare DDNS CLI

Công cụ CLI tự động cập nhật IP cho Cloudflare DNS Records, hỗ trợ cài đặt nhanh và chạy ngầm (Systemd).

## Tính năng

- **Cài đặt 1 dòng lệnh**: Tự động cài đặt Bun, build và setup service.
- **Auto Update IP**: Chạy ngầm cập nhật IP mỗi 5 phút (mặc định).
- **Quản lý dễ dàng**: Giao diện CLI tương tác để thêm/bớt domain.
- **Systemd Integration**: Tự động khởi động cùng hệ thống.

## Cài đặt

Chạy lệnh sau để cài đặt:

```bash
curl -fsSL https://raw.githubusercontent.com/huynguyeexn/cloudflare-ddns/main/install.sh | bash
```

_(Nếu repo chưa public hoặc bạn đang chạy local, hãy chạy file `./install.sh`)_

```bash
chmod +x install.sh
./install.sh
```

## Sử dụng

Sau khi cài đặt, bạn có thể sử dụng lệnh `cloudflare-ddns` từ bất kỳ đâu.

### 1. Cấu hình (Setup)

Lần đầu chạy cần cấu hình Token và chọn Domain::

```bash
cloudflare-ddns setup
```

- Nhập Cloudflare API Token.
- Chọn các Zone và Record cần cập nhật tự động.

### 2. Cài đặt Service (Chạy ngầm)

Để tool tự động chạy ngầm và khởi động cùng máy:

```bash
sudo cloudflare-ddns service install
```

### 3. Các lệnh khác

- **Chạy thủ công (Loop)**:
    ```bash
    cloudflare-ddns start
    ```
- **Xem cấu hình hiện tại**:
    ```bash
    cloudflare-ddns config
    ```
- **Gỡ bỏ Service**:
    ```bash
    sudo cloudflare-ddns service uninstall
    ```

## Logs

Logs được ghi tại `src/app.log` (hoặc nơi bạn chạy lệnh).
_(Phiên bản binary sẽ ghi log theo cấu hình systemd hoặc file logs riêng)_

## Phát triển

Yêu cầu [Bun](https://bun.sh).

```bash
# Cài dependency
bun install

# Chạy dev
bun src/index.ts start

# Build binary
bun run build
```
