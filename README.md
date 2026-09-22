# VRUM

> Làn gió mới của diễn đàn Việt — The Fresh Air of VN Forums.

Đây là mã nguồn của **VRUM**, một diễn đàn cộng đồng hiện đại dành cho việc thảo luận, chia sẻ kiến thức và kết nối những người có cùng mối quan tâm. Thành viên có thể tạo tài khoản, cập nhật hồ sơ, đăng bài, bình luận và thích nội dung; quản trị viên có khu vực riêng để quản lý thành viên, bài viết, bình luận và chuyên mục.

Dự án sử dụng **React, Express và PostgreSQL**, hỗ trợ giao diện sáng/tối và tóm tắt bài viết bằng AI.

[Sơ đồ Architecture, Workflow và Sequence](docs/diagrams/README.md)

## Cài đặt

Cần Node.js 20.19+ hoặc 22.12+ và PostgreSQL 16+. Chạy các lệnh tại thư mục gốc dự án.

```powershell
npm run install:all
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Chỉ sao chép khi chưa có file `.env`. Cấu hình `DATABASE_URL`, `JWT_ACCESS_SECRET` và `JWT_REFRESH_SECRET` trong `backend/.env`; không commit khóa hoặc mật khẩu.

Nếu dùng PostgreSQL qua Docker:

```powershell
docker compose up -d postgres
```

Database Docker dùng cổng **5434** trên máy: `postgresql://postgres:password@localhost:5434/member_community_db` (chỉ dùng phát triển). Nếu đã có PostgreSQL riêng, bỏ qua Docker và đặt URL tương ứng.

Tạo hoặc cập nhật bảng dữ liệu:

```powershell
npm run migrate:up --prefix backend
```

## Tạo dữ liệu mẫu

Đặt `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` và `DEMO_PASSWORD` trong `backend/.env`. Mật khẩu phải có ít nhất 8 ký tự, sau đó chạy:

```powershell
npm run seed:all
```

Chạy lần lượt **admin → demo → tech**, dừng khi lỗi nhưng không hoàn tác bước trước. Chỉ dùng khi phát triển: chạy lại có thể cập nhật tài khoản admin và làm mới dữ liệu demo.

## Chạy ứng dụng

Mở hai terminal riêng:

```powershell
npm run dev:backend
```

```powershell
npm run dev:frontend
```

Website: [localhost:5173](http://localhost:5173) · API: [localhost:4000/api/health](http://localhost:4000/api/health).

Để dùng tóm tắt AI, thêm `GROQ_API_KEY` vào `backend/.env` rồi khởi động lại backend. Không đưa khóa API vào frontend.

## Chạy bằng Docker

Cần Docker Desktop đang chạy **Linux containers**, Docker Compose **v2 trở lên** và cổng **5173**, **5434** chưa bị chương trình khác sử dụng; không cần cài Node.js hoặc PostgreSQL trên máy. Chạy PowerShell tại thư mục gốc dự án, sao chép `backend/.env.example` thành `backend/.env` nếu chưa có, thay hai JWT secret bằng chuỗi ngẫu nhiên riêng. Thêm `GROQ_API_KEY` nếu dùng AI.

Chọn **một** trong hai cách dưới đây:

### Build từ mã nguồn

```powershell
$vrumCompose = @('--env-file', 'backend/.env', '--profile', 'app')
docker compose @vrumCompose up -d --build --wait
```

### Dùng image trên Docker Hub

Hai image `linux/amd64` dùng chung repository [dwng/vrum](https://hub.docker.com/r/dwng/vrum/tags), phân biệt bằng tag **backend-2907f48-patch1** và **frontend-2907f48**. Đây là bản phát hành cố định, không tự thay đổi theo mã nguồn mới.

```powershell
$vrumCompose = @('--env-file', 'backend/.env', '-f', 'docker-compose.yml', '-f', 'docker-compose.hub.yml', '--profile', 'app')
docker compose @vrumCompose pull postgres backend frontend
docker compose @vrumCompose up -d --no-build --wait
```

Cả hai cách đều mở website tại [localhost:5173](http://localhost:5173), kiểm tra API tại [localhost:5173/api/health](http://localhost:5173/api/health). Nginx chuyển tiếp `/api` tới `backend:4000`; Compose không mở cổng backend 4000 ra máy. PostgreSQL dùng cổng **5434** trên máy, cổng **5432** trong mạng Docker.

Backend tự chạy migration trước khi mở API. Database nằm trong Docker volume, **không nằm trong image**; image cũng không chứa file `.env` hoặc khóa API. `--env-file` cung cấp giá trị cho các biến được khai báo trong Compose, không tự chuyển toàn bộ `backend/.env` vào container. Khi đổi JWT secret hoặc khóa Groq, chạy lại lệnh `up` đã chọn để tạo lại container với cấu hình mới.

### Tạo dữ liệu mẫu trong Docker (tùy chọn)

Chỉ chạy cho môi trường demo; seed có thể cập nhật admin và làm mới dữ liệu mẫu đang có. Trong **cùng cửa sổ PowerShell** đã đặt `$vrumCompose`, nhập mật khẩu riêng (ít nhất 8 ký tự):

```powershell
$env:ADMIN_EMAIL = 'admin@example.com'
$env:ADMIN_USERNAME = 'admin'
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', (Read-Host 'Mat khau admin' -AsSecureString)).Password
$env:DEMO_PASSWORD = [System.Net.NetworkCredential]::new('', (Read-Host 'Mat khau demo' -AsSecureString)).Password
try {
    docker compose @vrumCompose exec -e ADMIN_EMAIL -e ADMIN_USERNAME -e ADMIN_PASSWORD -e DEMO_PASSWORD backend sh -c 'npm run seed:admin && npm run seed:demo && npm run seed:tech'
} finally {
    Remove-Item Env:ADMIN_EMAIL, Env:ADMIN_USERNAME, Env:ADMIN_PASSWORD, Env:DEMO_PASSWORD
}
```

Lệnh chạy lần lượt ba bước, dừng khi lỗi nhưng không hoàn tác bước trước. Không dùng `npm run seed:all` trong container vì script này thuộc thư mục gốc dự án, không thuộc backend image.

### Kiểm tra và dừng

```powershell
docker compose @vrumCompose ps
docker compose @vrumCompose logs --tail 100 backend frontend
docker compose @vrumCompose down
```

`down` giữ dữ liệu trong volume; **không thêm `-v`** nếu muốn giữ database. Hai cách chạy trên dùng chung volume của dự án, hãy sao lưu dữ liệu quan trọng trước khi đổi phiên bản. Cấu hình Compose hiện dành cho local/demo, chưa cấu hình gửi email SMTP thật.

## Kiểm tra

```powershell
npm test
npm run lint --prefix backend
npm run lint --prefix frontend
npm run build
```

Integration test cần database thử nghiệm riêng qua `TEST_DATABASE_URL`; không dùng database chứa dữ liệu thật.

## Triển khai

Dùng HTTPS, đặt `COOKIE_SECURE=true`, cấu hình database và JWT secret riêng, chạy migration trước khi mở API. Không dùng dữ liệu demo hoặc mật khẩu phát triển trên production.
