# Backend

Xem hướng dẫn cài đặt tại [README gốc](../README.md).

Các migration nằm trong `src/infrastructure/database/postgres/migrations`. Chạy `npm run migrate:up` sau khi cấu hình `DATABASE_URL`.

## Contract của các dependency

Backend dùng dependency injection với object JavaScript (duck typing), không cần kế thừa lớp `I*`. [makeDependencies.js](src/main/factories/makeDependencies.js) tạo implementation; [makeUseCases.js](src/main/factories/makeUseCases.js) truyền chúng vào use case. Các stub `I*` chỉ ném `Not implemented` đã được bỏ; ranh giới Domain/Application/Infrastructure vẫn giữ nguyên.

| Dependency được inject | Các phương thức nghiệp vụ |
|---|---|
| `userRepository` | `findById`, `findByEmail`, `findByUsername`, `create`, `updateProfile`, `updatePassword`, `listMembers`, `updateStatus`, `countByStatus` |
| `postRepository` | `create`, `list`, `findById`, `update`, `remove`, `recordView`, `setHidden`, `markNotInterested`, `listAll`, `countByStatus` |
| `commentRepository` | `create`, `listByPost`, `findById`, `update`, `listAll`, `moderate`, `countByStatus` |
| `categoryRepository` | `findById`, `list`, `findByName`, `create`, `update`, `remove`, `join`, `leave`, `setFavorite`, `setMuted`, `listRecommended`, `count` |
| `voteRepository` | `setPostVote`, `setCommentVote` |
| `notificationRepository` | `create`, `list`, `unreadCount`, `markRead`, `markAllRead`, `getPreferences`, `updatePreferences` |
| `searchRepository` | `searchPosts`, `searchComments`, `searchCommunities`, `searchUsers`, `searchMedia` |
| `refreshTokenRepository` | `create`, `findValidByHash`, `revokeByHash`, `revokeAllForUser` |
| `resetTokenRepository` | `create`, `findValidByHash`, `markUsed`, `invalidateForUser` |
| `postSummaryRepository` | `findFresh`, `save` |
| `hashService` | `hash`, `compare` |
| `tokenService` | `generateAccessToken`, `generateRefreshToken`, `verifyAccessToken`, `verifyRefreshToken`, `generateOpaqueToken`, `hashToken`, `getExpiration` |
| `emailService` | `sendPasswordReset` |
| `summaryService` | `summarize` |
| `unitOfWork` | `run` |

Đây là bản tra cứu tên phương thức, không mô tả đầy đủ chữ ký, kiểu trả về hay quy tắc lỗi. Xem [repository PostgreSQL](src/infrastructure/database/postgres/repositories), [service](src/infrastructure/services), use case gọi chúng và [tests](tests) khi thay implementation. `unitOfWork.run(work)` cung cấp các thao tác repository trong cùng transaction; phải giữ commit/rollback khi thay thế. Mock trong unit test chỉ cần cung cấp các phương thức mà use case đang kiểm thử thực sự gọi.
