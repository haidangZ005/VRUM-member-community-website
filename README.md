# VRUM

> Làn gió mới của diễn đàn Việt — The Fresh Air of VN Forums.

Đây là mã nguồn của **VRUM**, một diễn đàn cộng đồng hiện đại dành cho việc thảo luận, chia sẻ kiến thức và kết nối những người có cùng mối quan tâm. Thành viên có thể tạo tài khoản, cập nhật hồ sơ, đăng bài, bình luận và thích nội dung; quản trị viên có khu vực riêng để quản lý thành viên, bài viết, bình luận và chuyên mục.

Dự án gồm frontend React, REST API Express và PostgreSQL. Giao diện hỗ trợ chế độ sáng, tối và tự nhận diện theo thiết bị.

## Cách hoạt động

```text
Trình duyệt React → REST API Express → PostgreSQL
```

- Backend được tổ chức theo Clean Architecture, kiểm tra dữ liệu bằng Zod.
- Access token dùng để gọi API; refresh token nằm trong cookie `HttpOnly`.
- Mật khẩu được băm bằng bcrypt trước khi lưu vào database.
- Route quản trị yêu cầu đăng nhập và role `admin`.

## Chạy khi phát triển

Cần Node.js 20+ và PostgreSQL 16+. Có thể dùng PostgreSQL đã cài trên máy hoặc container Docker bên dưới.

```powershell
npm run install:all
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Sửa `DATABASE_URL` và các JWT secret trong `backend/.env`, sau đó chuẩn bị database:

```powershell
docker compose up -d postgres
npm run migrate:up --prefix backend
```

Nếu PostgreSQL đang chạy trực tiếp trên máy, không cần chạy lệnh Docker; chỉ cần `DATABASE_URL` trỏ đúng database, tài khoản và mật khẩu của PostgreSQL đó.

Mở hai cửa sổ PowerShell:

```powershell
npm run dev:backend
```

```powershell
npm run dev:frontend
```

Truy cập `http://localhost:5173`. API chạy tại `http://localhost:4000`, health check là `http://localhost:4000/api/health`.

## Tạo dữ liệu ban đầu

Tạo hoặc cập nhật admin:

```powershell
$env:ADMIN_EMAIL = "admin@example.com"
$env:ADMIN_USERNAME = "admin"
$env:ADMIN_PASSWORD = "MatKhauRiengCuaBan"
npm run seed:admin --prefix backend
Remove-Item Env:ADMIN_EMAIL, Env:ADMIN_USERNAME, Env:ADMIN_PASSWORD
```

Hãy đổi mật khẩu ví dụ trước khi chạy. Seed sẽ băm mật khẩu bằng bcrypt; database chỉ lưu chuỗi băm.

Tạo ba thành viên, bài viết, bình luận và lượt thích để demo:

```powershell
$env:DEMO_PASSWORD = "MatKhauDemo123"
npm run seed:demo --prefix backend
Remove-Item Env:DEMO_PASSWORD
```

Các tài khoản demo được in ra sau khi seed. Chạy lại lệnh sẽ làm mới dữ liệu của chính các tài khoản demo, không xóa dữ liệu người dùng khác.

### Bổ sung dữ liệu công nghệ

Sau khi chạy migration, thêm 3 cộng đồng **ThinkPad, Framework, Linux** và 6 bài mẫu:

```powershell
npm run seed:tech --prefix backend
```

Lệnh này chỉ thêm dữ liệu còn thiếu: chạy lại không nhân đôi bài, không xóa bài cũ, không đổi mật khẩu hay ghi đè nội dung đã sửa. Không cần `DEMO_PASSWORD`. Tài khoản “VRUM · Demo công nghệ” chỉ để trình bày nguồn tổng hợp, có mật khẩu ngẫu nhiên được băm bcrypt và không dùng để đăng nhập thử.

Dữ liệu là các bản tóm lược tiếng Việt từ bài công khai trên Reddit, được tìm qua công cụ tìm kiếm ngày 05/09/2026 (endpoint JSON không tải được). Tên bài gốc và URL nguồn được giữ trong `backend/src/infrastructure/database/postgres/seeds/techData.json`, không chèn vào nội dung hiển thị. Không sao chép danh tính, lượt thích hay bình luận. Đây là snapshot nhỏ để demo, không phải crawler hoặc dữ liệu cập nhật trực tiếp.

Chạy lại seed sẽ bỏ chú thích ở những bài mẫu còn nguyên nội dung cũ và bổ sung ảnh cho nhóm mẫu chưa có ảnh; không ghi đè bài hoặc ảnh đã chỉnh sửa. Ba biểu tượng ThinkPad, Framework, Linux trong `frontend/public/community-icons` là hình minh họa tự tạo, không phải logo chính thức.

Người tạo có nút **Xóa cộng đồng** trong trang cộng đồng, kèm xác nhận. Backend kiểm tra quyền sở hữu; người khác không được xóa. Bài đăng được giữ lại khi xóa nhóm, còn lượt tham gia/yêu thích của nhóm sẽ được gỡ.

Trong giao diện, chọn **Bắt đầu một cộng đồng** để mở cửa sổ tạo ngay trên trang hiện tại, nhập tên/mô tả và xem trước. Nhấn **Hủy**, nút **×** hoặc **Esc** để đóng; tạo thành công sẽ mở cộng đồng vừa tạo.

Có thể chọn **ảnh đại diện** JPG/PNG/WebP tối đa 5 MB. Trình duyệt cắt vuông phần giữa, thu nhỏ thành JPEG 256 × 256 rồi lưu cùng cộng đồng; ảnh hiển thị tại trang cộng đồng, mục Gần đây và Quản lý cộng đồng. Nếu chưa chọn ảnh, giao diện dùng biểu tượng nhóm thay cho chữ cái đầu. Khi cập nhật code, chạy `npm run migrate:up --prefix backend` để thêm cột ảnh (migration 010); các cộng đồng cũ vẫn hoạt động. Rollback migration 010 chỉ bỏ cột ảnh, nên sao lưu ảnh trước nếu cần quay lui.

## Chạy toàn bộ bằng Docker

Đảm bảo cổng `5432`, `4000` và `5173` chưa được chương trình khác sử dụng:

```powershell
$env:JWT_ACCESS_SECRET = "mot-access-secret-dai-va-ngau-nhien"
$env:JWT_REFRESH_SECRET = "mot-refresh-secret-khac-va-ngau-nhien"
docker compose --profile app up --build
```

Migration được chạy tự động khi backend khởi động. Mở `http://localhost:5173`; nhấn `Ctrl+C` rồi chạy `docker compose --profile app down` để dừng.

## Kiểm tra

Chạy kiểm tra thông thường:

```powershell
npm test
npm run lint --prefix backend
npm run lint --prefix frontend
npm run build
```

Chạy integration test với PostgreSQL riêng trên cổng `5433`:

```powershell
docker compose --profile test up -d postgres-test
$env:TEST_DATABASE_URL = "postgresql://postgres:test_password@localhost:5433/member_community_test_db"
npm run test:integration --prefix backend
Remove-Item Env:TEST_DATABASE_URL
docker compose --profile test stop postgres-test
```

GitHub Actions cũng tự động chạy lint, test, integration test và frontend build cho mỗi pull request.

## Triển khai

- Dùng HTTPS và đặt `COOKIE_SECURE=true` ở backend.
- Tạo `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` riêng trên nền tảng triển khai; không commit file `.env`.
- Chạy migration trước khi mở API. Docker image backend đã có lệnh migration và frontend image phục vụ SPA qua Nginx.
- Chạy `seed:admin` với mật khẩu thật, sau đó xóa các biến `ADMIN_*` khỏi môi trường nếu không còn cần.

## Thư mục chính

```text
backend/src/domain/          Entity và quy tắc nghiệp vụ
backend/src/application/     Use case
backend/src/interfaces/      HTTP controller, route và validation
backend/src/infrastructure/  PostgreSQL, JWT, bcrypt và email
frontend/src/                Trang React, component và API client
```
