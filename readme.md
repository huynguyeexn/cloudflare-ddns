## Cloudflare DDNS

Script tự động cập nhật IP hiện tại của server cho những record A, AAAA của các domain được quản lý bằng Cloudflare, thông qua [Cloudflare's client API](https://api.cloudflare.com/).

### Yêu cầu

Môi trường Linux OS, đã cài đặt [Bun.sh](https://bun.sh/)

### Tạo API

Đăng nhập vào Cloudflare, vào [My Profile](https://dash.cloudflare.com/profile), chọn [API Tokens](https://dash.cloudflare.com/profile).

Tạo `API Tokens` Zone DNS Edit, copy token này để cài đặt bước tiếp theo.

### Cài đặt

Tải source code:

```bash
git clone https://github.com/huynguyeexn/cloudflare-ddns.git
```

Sau khi tải, di chuyển đến thư mục `cloudflare-ddns` chứa source code.

```bash
cd cloudflare-ddns
```

Tạo file `.env` từ file `.env.example` có sẵn.

```bash
cp .env.example .env
```

Thiết lập lại các thông số của file .env.

- `API_TOKEN`
  - Token được tạo ở bước trước đó.
  - Ví dụ `API_TOKEN="ABCdeF-T6K7ppvhk6XDGbpN1fzBtr3WxP1P_mxoh"`
- `RECORDS_NAME`
  - Mảng các records cần cập nhật.
  - Ví dụ `RECORDS_NAME=["domaincuaban.com"]`, `RECORDS_NAME=["domain1.com", "domain2.com"]`
- `LATEST_IPV4`
  - IP gần nhất được cập nhật, script sẽ tự động điền, không cần điền cũng được.
  - Ví dụ `LATEST_IPV4=142.251.214.142`.

### Run source

**Cần cập nhật thông số cho file `.env`, và cài đặt [Bun.sh](https://bun.sh/) trước khi run source**

Lệnh run source:

```bash
bun cloudflare-ddns.js
```

> Lưu ý: Script không chạy tự động, script chỉ chạy khi dùng lệnh trên.

Nếu bạn muốn script chạy định kì thì xem tiếp phần dưới.

### Cập nhật IP định kì

Để có thể định kì kiểm tra và cập nhật IP mới thì cần phải setup [crontab](https://vietnix.vn/crontab/):

Trong source code có file `cloudflare-ddns-crontab`, được thiết lập cơ bản như sau:

- `*/5 * * * *` chạy crontab mỗi 5 phút, xem thêm tại đây [crontab.guru](https://crontab.guru/examples.html).
- `cd /root/.cloudflare-ddns/` di chuyển tới thư mục chứa source code, chỉnh sửa giá trị trên thành đường dẫn đến thư mục source code của bạn.
- `bun cloudflare-ddns.js >> logs 2>&1` run source và ghi kết quả vào file `logs`.

Sau khi cập nhật lại các thiết lập trong file `cloudflare-ddns-crontab`.

Chúng ta copy file vào thư mục có đường dẫn `/etc/cron.d/`.

```bash
cp cloudflare-ddns-crontab /etc/cron.d/cloudflare-ddns-crontab
```
