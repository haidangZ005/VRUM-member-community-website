# TÀI LIỆU KIẾN TRÚC KỸ THUẬT — MEMBER COMMUNITY WEBSITE

> **Product Goal:** Xây dựng một nền tảng diễn đàn cộng đồng trực tuyến, nơi thành viên có thể dễ dàng kết nối, chia sẻ nội dung và trao đổi ý kiến trong một môi trường an toàn, thuận tiện và có khả năng kiểm duyệt.
>
> **Tech stack:** Node.js (Backend) · React (Frontend) · PostgreSQL (Database) · Clean Architecture
> **Vai trò:** SM: Vũ Hải Đăng · PO: Nguyễn Thành Đạt · DEV chính: Vũ Hải Đăng, Nguyễn Thành Đạt

> **Phạm vi tài liệu:** Đây là bản thiết kế ban đầu, không phải danh mục đầy đủ của phiên bản đang chạy. Các bảng backlog, cây thư mục và thiết kế API/DB bên dưới giữ vai trò tham khảo lịch sử; dùng [README](README.md), mã nguồn và migration để tra cứu triển khai hiện tại. Phần contract và ví dụ dependency injection dưới đây đã được cập nhật theo cách triển khai hiện hành.

---

## Mục lục

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Nguyên tắc Clean Architecture](#2-nguyên-tắc-clean-architecture)
3. [Tech Stack chi tiết](#3-tech-stack-chi-tiết)
4. [Cấu trúc thư mục Backend (Node.js)](#4-cấu-trúc-thư-mục-backend-nodejs)
5. [Cấu trúc thư mục Frontend (React)](#5-cấu-trúc-thư-mục-frontend-react)
6. [Thiết kế Database (PostgreSQL)](#6-thiết-kế-database-postgresql)
7. [Thiết kế API Endpoints](#7-thiết-kế-api-endpoints)
8. [Luồng xác thực (Authentication Flow)](#8-luồng-xác-thực-authentication-flow)
9. [Coding Conventions](#9-coding-conventions)
10. [Chiến lược Testing](#10-chiến-lược-testing)
11. [Thiết lập môi trường & Scripts](#11-thiết-lập-môi-trường--scripts)
12. [Lộ trình triển khai theo Sprint](#12-lộ-trình-triển-khai-theo-sprint)
13. [Checklist trước khi release MVP](#13-checklist-trước-khi-release-mvp)

---

## 1. Tổng quan dự án

### 1.1. Phạm vi (Scope)

Dự án gồm 4 Epic tương ứng 4 Sprint, dựa trên backlog đã có trong Jira:

| Epic | Sprint | Số Story | Story Points |
|---|---|---|---|
| Account & Authentication | Sprint 1 | 5 | 14 |
| Community Features | Sprint 2 | 7 | 21 |
| Administration | Sprint 3 | 6 | 18 |
| MVP Testing & Release | Sprint 4 | 6 | 20 |

### 1.2. Vai trò người dùng (User Roles)

| Role | Mô tả | Quyền hạn |
|---|---|---|
| `guest` | Khách truy cập, chưa đăng nhập | Xem trang đăng ký/đăng nhập |
| `member` | Thành viên đã đăng ký | Tạo/sửa/xóa bài viết & bình luận của mình, thích bài viết, xem danh sách bài viết |
| `admin` | Quản trị viên | Toàn quyền `member` + quản lý thành viên, kiểm duyệt bài viết/bình luận, quản lý danh mục, xem dashboard |

### 1.3. Nguyên tắc thiết kế tổng thể

- **Tách biệt rõ ràng (Separation of Concerns)**: logic nghiệp vụ không phụ thuộc framework, database hay giao diện.
- **Dễ kiểm thử (Testable)**: mỗi lớp có thể test độc lập bằng cách mock các lớp phụ thuộc.
- **Dễ mở rộng (Scalable)**: thêm tính năng mới không phá vỡ cấu trúc hiện có.
- **Nhất quán (Consistent)**: một quy ước đặt tên, một cách tổ chức thư mục cho toàn bộ team.

---

## 2. Nguyên tắc Clean Architecture

Clean Architecture (Robert C. Martin) chia hệ thống thành các lớp đồng tâm. **Quy tắc phụ thuộc (Dependency Rule): lớp bên trong không bao giờ biết đến lớp bên ngoài.** Mọi phụ thuộc chỉ được trỏ vào trong.

```
┌─────────────────────────────────────────────────┐
│  Frameworks & Drivers (Infrastructure)           │  ← Express, PostgreSQL, JWT lib...
│   ┌───────────────────────────────────────────┐ │
│   │  Interface Adapters                        │ │  ← Controllers, Routes, Presenters
│   │   ┌─────────────────────────────────────┐ │ │
│   │   │  Application Business Rules          │ │ │  ← Use Cases
│   │   │   ┌─────────────────────────────┐   │ │ │
│   │   │   │  Enterprise Business Rules   │   │ │ │  ← Entities (Domain)
│   │   │   └─────────────────────────────┘   │ │ │
│   │   └─────────────────────────────────────┘ │ │
│   └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 2.1. Bốn lớp trong dự án này

| Lớp | Thư mục | Trách nhiệm | Ví dụ |
|---|---|---|---|
| **Domain (Entities)** | `src/domain/` | Định nghĩa đối tượng nghiệp vụ cốt lõi, quy tắc bất biến của nghiệp vụ | `User`, `Post`, `Comment` — không import Express, không import pg |
| **Application (Use Cases)** | `src/application/` | Điều phối logic nghiệp vụ cho từng chức năng cụ thể | `RegisterUser`, `CreatePost`, `ModerateComment` |
| **Interface Adapters** | `src/interfaces/` | Chuyển đổi dữ liệu giữa thế giới bên ngoài (HTTP) và Use Case | `AuthController`, `PostRoutes`, `authValidator` |
| **Frameworks & Drivers** | `src/infrastructure/` | Cài đặt cụ thể: kết nối PostgreSQL, gửi email, hash mật khẩu | `PostgresUserRepository`, `BcryptHashService` |

### 2.2. Ví dụ minh họa luồng: "Đăng nhập" (SCRUM-11)

```
[React LoginForm]
      │  POST /api/auth/login { email, password }
      ▼
[interfaces/http/routes/authRoutes.js]        ← định nghĩa route
      ▼
[interfaces/http/controllers/AuthController.js]  ← nhận request, gọi use case
      ▼
[application/use-cases/auth/LoginUser.js]     ← logic: kiểm tra user tồn tại,
      │   ├─ gọi userRepository.findByEmail()      so khớp mật khẩu, tạo token
      │   ├─ gọi hashService.compare()
      │   ├─ gọi tokenService.generateAccessToken() / generateRefreshToken()
      │   └─ gọi refreshTokenRepository.create()  lưu hash của refresh token
      ▼
[domain/entities/User.js]                     ← entity thuần, không phụ thuộc gì
      ▲
      │ (được cài đặt cụ thể bởi)
[infrastructure/database/postgres/repositories/PostgresUserRepository.js]
[infrastructure/services/BcryptHashService.js]
[infrastructure/services/JwtTokenService.js]
```

**Điểm mấu chốt:** `LoginUser.js` nhận object `userRepository` qua constructor và chỉ gọi các phương thức trong contract, không biết PostgreSQL là gì. Đây là duck typing của JavaScript, không cần import hay `extends` lớp `I*`. Nhờ vậy có thể đổi database hoặc mock repository mà không sửa logic nghiệp vụ. Xem [contract của các dependency](backend/README.md#contract-của-các-dependency); các lớp stub `I*` không được sử dụng đã được loại bỏ.

### 2.3. Dependency Injection (Composition Root)

Việc nối contract với cài đặt cụ thể diễn ra tại `src/main/factories/`: `makeDependencies.js` tạo repository/service, còn `makeUseCases.js` inject chúng vào use case. Ví dụ rút gọn từ `makeUseCases.js`:

```js
// src/main/factories/makeUseCases.js (trích phần đăng nhập)
const LoginUser = require('../../application/use-cases/auth/LoginUser');

function makeUseCases({ userRepository, hashService, tokenService, refreshTokenRepository }) {
  return { loginUser: new LoginUser({ userRepository, hashService, tokenService, refreshTokenRepository }) };
}

module.exports = makeUseCases;
```

`src/main/app.js` truyền các use case đã lắp ráp vào route/controller; controller chỉ gọi `useCases.loginUser.execute(...)`, không tự tạo các class infrastructure. Đây chính là cách Clean Architecture giữ cho use case không lẫn chi tiết kỹ thuật.

---

## 3. Tech Stack chi tiết

### 3.1. Backend (Node.js)

| Nhóm | Thư viện đề xuất | Ghi chú |
|---|---|---|
| Web framework | `express` | Nhẹ, phổ biến, dễ tùy biến layer routing |
| Database driver | `pg` | Driver PostgreSQL thuần, dùng trong Repository — giữ quyền kiểm soát SQL, đúng tinh thần Clean Architecture |
| Migration | `node-pg-migrate` | Quản lý version cho schema DB |
| Hash mật khẩu | `bcrypt` | Băm password, dùng cho SCRUM-10, SCRUM-13 |
| Authentication | `jsonwebtoken` | Access token + refresh token, dùng cho SCRUM-11, SCRUM-12 |
| Validate input | `zod` hoặc `express-validator` | Validate dữ liệu tại lớp Interface Adapters |
| Biến môi trường | `dotenv` | Đọc file `.env` |
| Bảo mật | `helmet`, `cors`, `express-rate-limit` | Chặn tấn công cơ bản (XSS header, CORS, brute-force login) |
| Logging | `morgan` + `winston` | Log request & log lỗi hệ thống |
| Gửi email | `nodemailer` | Gửi email reset password (SCRUM-13) |
| Testing | `jest`, `supertest` | Unit test + integration test API |

### 3.2. Frontend (React)

| Nhóm | Thư viện đề xuất | Ghi chú |
|---|---|---|
| Build tool | `vite` | Khởi tạo & build nhanh hơn Create React App |
| Routing | `react-router-dom` | Điều hướng SPA |
| Gọi API | `axios` | HTTP client, kèm interceptor gắn token |
| Quản lý server state | `@tanstack/react-query` | Cache, refetch, loading/error state cho API |
| Quản lý global state | `zustand` | Lưu trạng thái auth (user hiện tại, token) — nhẹ hơn Redux |
| Form & validate | `react-hook-form` + `zod` | Xử lý form đăng ký/đăng nhập/tạo bài viết |
| Styling | `tailwindcss` | Utility-first CSS, tốc độ dựng UI nhanh |
| Icon | `lucide-react` | Bộ icon nhất quán |

### 3.3. Database

- **PostgreSQL 15+**
- Extension cần bật: `pgcrypto` (để dùng `gen_random_uuid()` làm khóa chính)

---

## 4. Cấu trúc thư mục Backend (Node.js)

```
backend/
├── src/
│   ├── domain/                          # ===== LỚP 1: ENTERPRISE BUSINESS RULES =====
│   │   ├── entities/
│   │   │   ├── User.js                  # Thuộc tính + quy tắc bất biến của User
│   │   │   ├── Post.js
│   │   │   ├── Comment.js
│   │   │   ├── Category.js
│   │   │   └── Like.js
│   │   └── errors/
│   │       ├── DomainError.js
│   │       ├── NotFoundError.js
│   │       ├── UnauthorizedError.js
│   │       └── ValidationError.js
│   │
│   ├── application/                     # ===== LỚP 2: APPLICATION BUSINESS RULES =====
│   │   ├── use-cases/
│   │   │   ├── auth/
│   │   │   │   ├── RegisterUser.js      # SCRUM-10
│   │   │   │   ├── LoginUser.js         # SCRUM-11
│   │   │   │   ├── LogoutUser.js        # SCRUM-12
│   │   │   │   ├── ForgotPassword.js    # SCRUM-13
│   │   │   │   ├── ResetPassword.js     # SCRUM-13
│   │   │   │   └── UpdateProfile.js     # SCRUM-14
│   │   │   ├── posts/
│   │   │   │   ├── CreatePost.js        # SCRUM-17
│   │   │   │   ├── ListPosts.js         # SCRUM-18
│   │   │   │   ├── GetPostDetail.js     # SCRUM-19
│   │   │   │   ├── EditPost.js          # SCRUM-21
│   │   │   │   ├── DeletePost.js        # SCRUM-22
│   │   │   │   ├── LikePost.js          # SCRUM-23
│   │   │   │   └── UnlikePost.js
│   │   │   ├── comments/
│   │   │   │   ├── CreateComment.js     # SCRUM-20
│   │   │   │   └── ListCommentsByPost.js
│   │   │   └── admin/
│   │   │       ├── ListMembers.js       # SCRUM-31
│   │   │       ├── LockMemberAccount.js # SCRUM-32
│   │   │       ├── UnlockMemberAccount.js
│   │   │       ├── AdminListPosts.js    # SCRUM-33
│   │   │       ├── AdminDeletePost.js   # SCRUM-33
│   │   │       ├── ModerateComment.js   # SCRUM-34
│   │   │       ├── CreateCategory.js    # SCRUM-35
│   │   │       ├── UpdateCategory.js
│   │   │       ├── DeleteCategory.js
│   │   │       └── GetDashboardStats.js # SCRUM-36
│   │   └── dtos/
│   │       ├── RegisterUserDTO.js
│   │       ├── CreatePostDTO.js
│   │       └── ...
│   │
│   ├── infrastructure/                  # ===== LỚP 4: FRAMEWORKS & DRIVERS =====
│   │   ├── database/
│   │   │   └── postgres/
│   │   │       ├── connection.js        # Pool connection (pg)
│   │   │       ├── migrations/
│   │   │       │   ├── 001_create_users.sql
│   │   │       │   ├── 002_create_categories.sql
│   │   │       │   ├── 003_create_posts.sql
│   │   │       │   ├── 004_create_comments.sql
│   │   │       │   ├── 005_create_likes.sql
│   │   │       │   └── 006_create_tokens.sql
│   │   │       ├── seeds/
│   │   │       │   └── seed_admin_user.sql
│   │   │       └── repositories/        # Cài đặt contract repository (backend/README.md)
│   │   │           ├── PostgresUserRepository.js
│   │   │           ├── PostgresPostRepository.js
│   │   │           ├── PostgresCommentRepository.js
│   │   │           ├── PostgresCategoryRepository.js
│   │   │           └── PostgresLikeRepository.js
│   │   ├── services/
│   │   │   ├── BcryptHashService.js
│   │   │   ├── JwtTokenService.js
│   │   │   └── NodemailerEmailService.js
│   │   └── config/
│   │       ├── env.js                   # Đọc & validate biến môi trường
│   │       └── database.config.js
│   │
│   ├── interfaces/                      # ===== LỚP 3: INTERFACE ADAPTERS =====
│   │   └── http/
│   │       ├── controllers/
│   │       │   ├── AuthController.js
│   │       │   ├── PostController.js
│   │       │   ├── CommentController.js
│   │       │   ├── UserController.js
│   │       │   └── AdminController.js
│   │       ├── routes/
│   │       │   ├── authRoutes.js
│   │       │   ├── postRoutes.js
│   │       │   ├── commentRoutes.js
│   │       │   ├── userRoutes.js
│   │       │   ├── adminRoutes.js
│   │       │   └── index.js             # Gộp toàn bộ router
│   │       ├── middlewares/
│   │       │   ├── authMiddleware.js    # Verify JWT
│   │       │   ├── roleGuard.js         # Chỉ cho phép role admin
│   │       │   ├── errorHandler.js      # Middleware xử lý lỗi tập trung
│   │       │   └── validateRequest.js   # Chạy schema zod trước khi vào controller
│   │       └── validators/
│   │           ├── authValidator.js
│   │           ├── postValidator.js
│   │           └── commentValidator.js
│   │
│   ├── main/                            # Composition root — nơi "lắp ráp" mọi thứ
│   │   ├── factories/
│   │   │   ├── makeRegisterUser.js
│   │   │   ├── makeLoginUser.js
│   │   │   ├── makeCreatePost.js
│   │   │   └── ...
│   │   ├── app.js                       # Khởi tạo Express app, gắn middleware & routes
│   │   └── server.js                    # Entry point — listen port
│   │
│   └── shared/
│       ├── utils/
│       │   └── pagination.js
│       └── constants/
│           ├── roles.js                 # { MEMBER: 'member', ADMIN: 'admin' }
│           └── httpStatus.js
│
├── tests/
│   ├── unit/
│   │   ├── domain/
│   │   └── application/
│   │       ├── auth/LoginUser.test.js
│   │       └── posts/CreatePost.test.js
│   ├── integration/
│   │   └── postgres/PostgresUserRepository.test.js
│   └── e2e/
│       └── auth.e2e.test.js
│
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── package.json
└── README.md
```

> **Quy tắc vàng khi code Backend:** file trong `domain/` và `application/` **không được phép** có dòng nào `require('express')`, `require('pg')`. Nếu thấy import framework trong 2 thư mục này — đó là dấu hiệu vi phạm Clean Architecture.

---

## 5. Cấu trúc thư mục Frontend (React)

React không có "Clean Architecture chuẩn" như backend, nhưng ta vẫn áp dụng tinh thần **tách logic khỏi giao diện** bằng cấu trúc feature-based:

```
frontend/
├── src/
│   ├── app/
│   │   ├── App.jsx                      # Root component
│   │   ├── routes/
│   │   │   ├── AppRoutes.jsx            # Khai báo toàn bộ route
│   │   │   └── ProtectedRoute.jsx       # Route yêu cầu đăng nhập
│   │   └── providers/
│   │       ├── AuthProvider.jsx
│   │       └── QueryProvider.jsx        # Bọc React Query
│   │
│   ├── pages/                           # Component gắn trực tiếp với 1 route
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx            # SCRUM-11
│   │   │   ├── RegisterPage.jsx         # SCRUM-10
│   │   │   └── ForgotPasswordPage.jsx   # SCRUM-13
│   │   ├── posts/
│   │   │   ├── PostListPage.jsx         # SCRUM-18
│   │   │   ├── PostDetailPage.jsx       # SCRUM-19
│   │   │   └── CreatePostPage.jsx       # SCRUM-17
│   │   ├── profile/
│   │   │   └── ProfilePage.jsx          # SCRUM-14
│   │   └── admin/
│   │       ├── DashboardPage.jsx        # SCRUM-36
│   │       ├── MemberManagementPage.jsx # SCRUM-31, 32
│   │       ├── PostModerationPage.jsx   # SCRUM-33
│   │       ├── CommentModerationPage.jsx# SCRUM-34
│   │       └── CategoryManagementPage.jsx # SCRUM-35
│   │
│   ├── features/                        # Logic nghiệp vụ theo từng nhóm chức năng
│   │   ├── auth/
│   │   │   ├── api/authApi.js           # Gọi axios đến /api/auth/*
│   │   │   ├── hooks/useAuth.js         # useLogin(), useRegister()...
│   │   │   ├── components/LoginForm.jsx
│   │   │   └── schema/authSchema.js     # zod schema validate form
│   │   ├── posts/
│   │   │   ├── api/postApi.js
│   │   │   ├── hooks/usePosts.js
│   │   │   ├── components/
│   │   │   │   ├── PostCard.jsx
│   │   │   │   ├── PostForm.jsx
│   │   │   │   └── LikeButton.jsx
│   │   │   └── schema/postSchema.js
│   │   ├── comments/
│   │   │   ├── api/commentApi.js
│   │   │   ├── hooks/useComments.js
│   │   │   └── components/CommentList.jsx
│   │   └── admin/
│   │       ├── api/adminApi.js
│   │       ├── hooks/useAdminMembers.js
│   │       └── components/
│   │           ├── MemberTable.jsx
│   │           ├── DashboardStats.jsx
│   │           └── CategoryForm.jsx
│   │
│   ├── components/                      # UI dùng chung, KHÔNG chứa logic nghiệp vụ
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Pagination.jsx
│   │   │   └── Spinner.jsx
│   │   └── layout/
│   │       ├── Header.jsx
│   │       ├── Footer.jsx
│   │       ├── Sidebar.jsx
│   │       └── AdminLayout.jsx
│   │
│   ├── services/
│   │   └── httpClient.js                # axios instance + interceptor gắn JWT
│   │
│   ├── store/
│   │   └── authStore.js                 # zustand store: user, token, isAuthenticated
│   │
│   ├── hooks/                           # Hook dùng chung (không thuộc feature riêng)
│   │   └── useDebounce.js
│   │
│   ├── utils/
│   │   ├── formatDate.js
│   │   └── validators.js
│   │
│   ├── constants/
│   │   └── roles.js
│   │
│   ├── assets/
│   └── styles/
│       └── index.css                    # Tailwind entry
│
├── public/
├── .env.example
├── vite.config.js
├── tailwind.config.js
├── package.json
└── README.md
```

> **Quy tắc:** `components/` chỉ nhận props và render — không tự gọi API. Việc gọi API nằm trong `features/*/api` và `features/*/hooks`, để page/component dễ test và tái sử dụng.

---

## 6. Thiết kế Database (PostgreSQL)

### 6.1. Sơ đồ quan hệ (ERD dạng chữ)

```
users ──┬──< posts ──┬──< comments
        │            └──< likes >── users
        ├──< comments
        ├──< likes
        ├──< password_reset_tokens
        └──< refresh_tokens

categories ──< posts
```

### 6.2. Bật extension cần thiết

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 6.3. Bảng `users`

```sql
CREATE TYPE user_role AS ENUM ('member', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'locked');

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(50)  NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(100),
    avatar_url      TEXT,
    role            user_role   NOT NULL DEFAULT 'member',
    status          user_status NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```
*Phục vụ: SCRUM-10 (đăng ký), SCRUM-14 (cập nhật hồ sơ), SCRUM-31/32 (quản trị viên xem & khóa tài khoản).*

### 6.4. Bảng `password_reset_tokens`

```sql
CREATE TABLE password_reset_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_password_reset_user ON password_reset_tokens(user_id);
```
*Phục vụ: SCRUM-13 (quên mật khẩu).*

### 6.5. Bảng `refresh_tokens`

```sql
CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
```
*Phục vụ: SCRUM-11 (đăng nhập), SCRUM-12 (đăng xuất — thu hồi token).*

### 6.6. Bảng `categories`

```sql
CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
*Phục vụ: SCRUM-35 (quản lý danh mục).*

### 6.7. Bảng `posts`

```sql
CREATE TYPE post_status AS ENUM ('published', 'removed');

CREATE TABLE posts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
    title        VARCHAR(255) NOT NULL,
    content      TEXT NOT NULL,
    status       post_status NOT NULL DEFAULT 'published',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_category ON posts(category_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
```
*Phục vụ: SCRUM-17, 18, 19, 21, 22 (CRUD bài viết), SCRUM-33 (admin quản lý bài viết).*

### 6.8. Bảng `comments`

```sql
CREATE TYPE comment_status AS ENUM ('visible', 'removed');

CREATE TABLE comments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    status      comment_status NOT NULL DEFAULT 'visible',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_author ON comments(author_id);
```
*Phục vụ: SCRUM-20 (bình luận), SCRUM-34 (admin kiểm duyệt bình luận).*

### 6.9. Bảng `likes`

```sql
CREATE TABLE likes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (post_id, user_id)
);

CREATE INDEX idx_likes_post ON likes(post_id);
```
*Phục vụ: SCRUM-23 (thích bài viết) — ràng buộc `UNIQUE` đảm bảo 1 người chỉ like 1 lần / bài.*

### 6.10. Trigger tự động cập nhật `updated_at`

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

## 7. Thiết kế API Endpoints

Quy ước chung: base URL `/api`, response JSON, lỗi trả về dạng `{ "error": { "code": "...", "message": "..." } }`.

### 7.1. Auth & Profile

| Method | Endpoint | Story | Quyền | Mô tả |
|---|---|---|---|---|
| POST | `/api/auth/register` | SCRUM-10 | guest | Tạo tài khoản |
| POST | `/api/auth/login` | SCRUM-11 | guest | Đăng nhập, trả access + refresh token |
| POST | `/api/auth/logout` | SCRUM-12 | member | Thu hồi refresh token |
| POST | `/api/auth/refresh` | SCRUM-11 | member | Cấp lại access token mới |
| POST | `/api/auth/forgot-password` | SCRUM-13 | guest | Gửi email chứa link reset |
| POST | `/api/auth/reset-password` | SCRUM-13 | guest | Đặt lại mật khẩu bằng token |
| GET | `/api/users/me` | SCRUM-14 | member | Lấy thông tin cá nhân |
| PUT | `/api/users/me` | SCRUM-14 | member | Cập nhật thông tin cá nhân |

### 7.2. Posts & Comments

| Method | Endpoint | Story | Quyền | Mô tả |
|---|---|---|---|---|
| POST | `/api/posts` | SCRUM-17 | member | Tạo bài viết |
| GET | `/api/posts?page=&categoryId=` | SCRUM-18 | member | Danh sách bài viết (phân trang) |
| GET | `/api/posts/:id` | SCRUM-19 | member | Chi tiết bài viết |
| PUT | `/api/posts/:id` | SCRUM-21 | member (chủ bài) | Sửa bài viết của mình |
| DELETE | `/api/posts/:id` | SCRUM-22 | member (chủ bài) | Xóa bài viết của mình |
| POST | `/api/posts/:id/like` | SCRUM-23 | member | Thích bài viết |
| DELETE | `/api/posts/:id/like` | SCRUM-23 | member | Bỏ thích |
| POST | `/api/posts/:id/comments` | SCRUM-20 | member | Bình luận bài viết |
| GET | `/api/posts/:id/comments` | SCRUM-20 | member | Danh sách bình luận |

### 7.3. Administration

| Method | Endpoint | Story | Quyền | Mô tả |
|---|---|---|---|---|
| GET | `/api/admin/members?search=` | SCRUM-31 | admin | Danh sách thành viên |
| PATCH | `/api/admin/members/:id/lock` | SCRUM-32 | admin | Khóa tài khoản |
| PATCH | `/api/admin/members/:id/unlock` | SCRUM-32 | admin | Mở khóa tài khoản |
| GET | `/api/admin/posts` | SCRUM-33 | admin | Xem toàn bộ bài viết |
| DELETE | `/api/admin/posts/:id` | SCRUM-33 | admin | Xóa bài viết vi phạm |
| GET | `/api/admin/comments` | SCRUM-34 | admin | Xem toàn bộ bình luận |
| DELETE | `/api/admin/comments/:id` | SCRUM-34 | admin | Xóa bình luận vi phạm |
| GET | `/api/admin/categories` | SCRUM-35 | admin | Danh sách danh mục |
| POST | `/api/admin/categories` | SCRUM-35 | admin | Tạo danh mục |
| PUT | `/api/admin/categories/:id` | SCRUM-35 | admin | Sửa danh mục |
| DELETE | `/api/admin/categories/:id` | SCRUM-35 | admin | Xóa danh mục |
| GET | `/api/admin/dashboard` | SCRUM-36 | admin | Số liệu tổng quan (tổng thành viên, bài viết, bình luận) |

---

## 8. Luồng xác thực (Authentication Flow)

### 8.1. Chiến lược: Access Token + Refresh Token

- **Access Token** (JWT, hết hạn ~15 phút): gửi kèm mỗi request qua header `Authorization: Bearer <token>`.
- **Refresh Token** (hết hạn ~7 ngày): lưu trong PostgreSQL (bảng `refresh_tokens`) + trả về client dưới dạng **HttpOnly Cookie** (an toàn hơn localStorage, tránh XSS).

### 8.2. Luồng đăng ký & đăng nhập

```
1. POST /api/auth/register
   → RegisterUser use case: kiểm tra email/username trùng
   → BcryptHashService.hash(password)
   → Lưu user (role='member', status='active')

2. POST /api/auth/login
   → LoginUser use case: tìm user theo email
   → BcryptHashService.compare(password, user.password_hash)
   → Nếu đúng: tạo access token (15p) + refresh token (7 ngày)
   → Lưu refresh token hash vào DB
   → Trả access token trong response body,
     refresh token trong Set-Cookie (HttpOnly, Secure, SameSite=Strict)

3. Mỗi request cần xác thực:
   → authMiddleware đọc header Authorization
   → Verify access token bằng JwtTokenService
   → Gắn req.user = { id, role } để controller/use case dùng tiếp

4. Khi access token hết hạn:
   → Client gọi POST /api/auth/refresh (gửi kèm cookie)
   → Server kiểm tra refresh token còn hợp lệ trong DB (chưa revoke, chưa hết hạn)
   → Cấp access token mới

5. POST /api/auth/logout
   → Đánh dấu revoked_at cho refresh token hiện tại trong DB
   → Xóa cookie phía client
```

### 8.3. Phân quyền (Authorization)

```js
// middlewares/roleGuard.js
function roleGuard(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Không đủ quyền truy cập' } });
    }
    next();
  };
}

// Sử dụng trong route:
router.get('/admin/members', authMiddleware, roleGuard('admin'), AdminController.listMembers);
```

---

## 9. Coding Conventions

### 9.1. Đặt tên

| Đối tượng | Quy ước | Ví dụ |
|---|---|---|
| File Class/Use Case (Backend) | PascalCase | `LoginUser.js`, `PostgresUserRepository.js` |
| File utility/helper | camelCase | `pagination.js`, `formatDate.js` |
| Component React | PascalCase | `PostCard.jsx`, `LoginForm.jsx` |
| Hook React | camelCase, tiền tố `use` | `usePosts.js`, `useAuth.js` |
| Route/API path | kebab-case, số nhiều | `/api/posts`, `/api/password-reset-tokens` |
| Bảng & cột DB | snake_case, số nhiều cho bảng | `users`, `password_hash`, `created_at` |
| Biến môi trường | UPPER_SNAKE_CASE | `DATABASE_URL`, `JWT_ACCESS_SECRET` |

### 9.2. Quy ước response API

```json
// Thành công
{ "data": { ... } }

// Danh sách có phân trang
{ "data": [...], "meta": { "page": 1, "limit": 20, "total": 57 } }

// Lỗi
{ "error": { "code": "NOT_FOUND", "message": "Không tìm thấy bài viết" } }
```

### 9.3. Quy ước Git commit

Dùng [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(auth): thêm chức năng đăng ký tài khoản (SCRUM-10)
fix(posts): sửa lỗi không xóa được bài viết của chính mình (SCRUM-22)
test(auth): thêm unit test cho LoginUser use case
docs: cập nhật README hướng dẫn cài đặt
```

---

## 10. Chiến lược Testing

Test theo đúng 4 lớp kiến trúc, ưu tiên test nhiều nhất ở lớp trong cùng (rẻ, nhanh, ổn định):

| Lớp | Loại test | Công cụ | Ví dụ |
|---|---|---|---|
| Domain | Unit test | Jest | Entity `User` tự validate email hợp lệ |
| Application (Use Case) | Unit test (mock repository) | Jest | Mock các object dependency mà `LoginUser` nhận qua constructor |
| Infrastructure (Repository) | Integration test | Jest + PostgreSQL test DB | `PostgresUserRepository.test.js` — chạy thật với DB test |
| Interface (API) | E2E test | Supertest | Gửi request thật đến `/api/auth/login`, kiểm tra response |

**Ví dụ unit test Use Case (mock repository — không chạm DB thật):**

```js
// tests/unit/application/auth/LoginUser.test.js
const LoginUser = require('../../../../src/application/use-cases/auth/LoginUser');

test('đăng nhập thành công trả về access token', async () => {
  const mockUserRepo = { findByEmail: jest.fn().mockResolvedValue({
    id: '1', passwordHash: 'hashed', status: 'active', role: 'member',
    toPublicJSON: () => ({ id: '1', role: 'member' }),
  }) };
  const mockHashService = { compare: jest.fn().mockResolvedValue(true) };
  const mockTokenService = {
    generateAccessToken: jest.fn().mockReturnValue('fake-token'),
    generateRefreshToken: jest.fn().mockReturnValue('fake-refresh'),
    hashToken: jest.fn().mockReturnValue('refresh-hash'),
    getExpiration: jest.fn().mockReturnValue(new Date('2030-01-01')),
  };
  const mockRefreshTokenRepo = { create: jest.fn().mockResolvedValue(undefined) };

  const loginUser = new LoginUser({
    userRepository: mockUserRepo,
    hashService: mockHashService,
    tokenService: mockTokenService,
    refreshTokenRepository: mockRefreshTokenRepo,
  });

  const result = await loginUser.execute({ email: 'a@test.com', password: '123456' });

  expect(result.accessToken).toBe('fake-token');
});
```

---

## 11. Thiết lập môi trường & Scripts

### 11.1. Backend `.env.example`

```env
NODE_ENV=development
PORT=4000

DATABASE_URL=postgresql://postgres:password@localhost:5432/member_community_db

JWT_ACCESS_SECRET=change_this_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change_this_secret_too
JWT_REFRESH_EXPIRES_IN=7d

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password

CLIENT_URL=http://localhost:5173
```

### 11.2. Frontend `.env.example`

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

### 11.3. Scripts (`package.json` backend)

```json
{
  "scripts": {
    "dev": "node --watch src/main/server.js",
    "start": "node src/main/server.js",
    "migrate:up": "node-pg-migrate up",
    "migrate:down": "node-pg-migrate down",
    "seed": "node src/infrastructure/database/postgres/seeds/run.js",
    "test": "jest --coverage",
    "test:unit": "jest tests/unit",
    "test:e2e": "jest tests/e2e",
    "lint": "eslint src --ext .js"
  }
}
```

### 11.4. Các bước khởi tạo dự án lần đầu

```bash
# 1. Tạo database
createdb member_community_db

# 2. Backend
cd backend
cp .env.example .env    # rồi chỉnh thông tin thật
npm install
npm run migrate:up
npm run seed             # tạo sẵn 1 tài khoản admin
npm run dev

# 3. Frontend
cd frontend
cp .env.example .env
npm install
npm run dev
```

---

## 12. Lộ trình triển khai theo Sprint

Bám sát đúng backlog đã có trong Jira để team code theo thứ tự hợp lý — Backend luôn đi trước 1 nhịp để Frontend có API để gọi.

### Sprint 1 — Tài khoản & Xác thực (16–22 Aug)

- [ ] Setup project skeleton (backend + frontend theo cấu trúc mục 4, 5)
- [ ] Migration bảng `users`, `password_reset_tokens`, `refresh_tokens`
- [ ] Use case: `RegisterUser`, `LoginUser`, `LogoutUser`, `ForgotPassword`, `ResetPassword`, `UpdateProfile`
- [ ] API: toàn bộ nhóm `/api/auth/*`, `/api/users/me`
- [ ] Frontend: `RegisterPage`, `LoginPage`, `ForgotPasswordPage`, `ProfilePage`
- [ ] `authMiddleware`, `AuthProvider`, `authStore` (zustand)

### Sprint 2 — Chức năng cộng đồng (23–29 Aug)

- [ ] Migration bảng `categories`, `posts`, `comments`, `likes`
- [ ] Use case: `CreatePost`, `ListPosts`, `GetPostDetail`, `EditPost`, `DeletePost`, `LikePost`, `CreateComment`
- [ ] API: nhóm `/api/posts/*`
- [ ] Frontend: `PostListPage`, `PostDetailPage`, `CreatePostPage`, `PostCard`, `CommentList`, `LikeButton`

### Sprint 3 — Quản trị & Kiểm duyệt (30 Aug–5 Sep)

- [ ] Use case: `ListMembers`, `LockMemberAccount`, `UnlockMemberAccount`, `AdminListPosts`, `AdminDeletePost`, `ModerateComment`, `CreateCategory`/`UpdateCategory`/`DeleteCategory`, `GetDashboardStats`
- [ ] API: toàn bộ nhóm `/api/admin/*`
- [ ] `roleGuard` middleware chặn route admin
- [ ] Frontend: `AdminLayout`, `MemberManagementPage`, `PostModerationPage`, `CommentModerationPage`, `CategoryManagementPage`, `DashboardPage`

### Sprint 4 — Kiểm thử & Phát hành MVP (6–12 Sep)

- [ ] Viết đầy đủ unit test cho các Use Case quan trọng (auth, posts, admin)
- [ ] Viết integration test cho Repository
- [ ] Viết E2E test cho luồng chính: đăng ký → đăng nhập → tạo bài viết → bình luận → admin kiểm duyệt
- [ ] Fix bug phát hiện được, kiểm tra phân quyền (member không vào được route admin)
- [ ] Chuẩn bị dữ liệu mẫu (seed) cho buổi demo
- [ ] Đóng gói / deploy bản MVP cuối cùng

---

## 13. Checklist trước khi release MVP

- [ ] Tất cả biến môi trường nhạy cảm (`JWT_*_SECRET`, `DATABASE_URL`) không bị commit lên Git (`.env` nằm trong `.gitignore`)
- [ ] Mật khẩu luôn được hash bằng `bcrypt`, không bao giờ lưu plain text
- [ ] Mọi route admin đều có `authMiddleware` + `roleGuard('admin')`
- [ ] Member không thể sửa/xóa bài viết hoặc bình luận của người khác (kiểm tra `author_id === req.user.id` trong Use Case)
- [ ] Input từ client được validate ở tầng `interfaces/http/validators` trước khi vào Use Case
- [ ] Có xử lý lỗi tập trung (`errorHandler`), không để lộ stack trace ra ngoài ở môi trường production
- [ ] Database có index cho các cột thường xuyên query (`email`, `author_id`, `post_id`, `created_at`)
- [ ] Tài khoản admin mặc định (seed) đã đổi mật khẩu trước khi demo/deploy thật
- [ ] README có hướng dẫn cài đặt đầy đủ cho người mới join dự án
