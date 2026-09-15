# VRUM

> Làn gió mới của diễn đàn Việt — The Fresh Air of VN Forums.

Diễn đàn cộng đồng với đăng bài, bình luận, bình chọn, tìm kiếm, tóm tắt AI và quản trị nội dung. Sử dụng **React, Express và PostgreSQL**, hỗ trợ giao diện sáng/tối.

[Sơ đồ Architecture, Workflow và Sequence](docs/diagrams/README.md)

## Cài đặt

Cần Node.js 20+ và PostgreSQL 16+. Chạy các lệnh tại thư mục gốc dự án.

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
