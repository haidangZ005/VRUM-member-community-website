const pool = require('../connection');
const env = require('../../../config/env');
const BcryptHashService = require('../../../services/BcryptHashService');

const members = [
  { username: 'minh_anh', email: 'minhanh@example.com', fullName: 'Nguyễn Minh Anh' },
  { username: 'quang_huy', email: 'quanghuy@example.com', fullName: 'Trần Quang Huy' },
  { username: 'thu_trang', email: 'thutrang@example.com', fullName: 'Lê Thu Trang' },
];

const posts = [
  {
    author: 'minhanh@example.com',
    category: 'Chia sẻ',
    title: 'Ba cách giúp buổi họp nhóm hiệu quả hơn',
    content: 'Nhóm mình thường gửi trước mục tiêu, giới hạn thời gian cho từng nội dung và chốt người phụ trách ngay cuối buổi. Ba thay đổi nhỏ này giúp mọi người dễ theo dõi công việc hơn.',
  },
  {
    author: 'quanghuy@example.com',
    category: 'Hỏi đáp',
    title: 'Mọi người quản lý tài liệu dự án như thế nào?',
    content: 'Nhóm của mình đang có khá nhiều tài liệu nằm rải rác. Mình muốn tìm một cách đặt tên và phân loại đơn giản để thành viên mới cũng dễ tìm kiếm.',
  },
  {
    author: 'thutrang@example.com',
    category: 'Dự án',
    title: 'Tìm cộng sự cho hoạt động đổi sách cuối tuần',
    content: 'Mình đang chuẩn bị một góc đổi sách nhỏ vào cuối tuần và cần thêm hai bạn hỗ trợ tiếp nhận, phân loại sách. Nếu quan tâm, hãy để lại bình luận nhé!',
  },
];

async function seedDemo() {
  if (!env.DEMO_PASSWORD) {
    throw new Error('Cần cấu hình DEMO_PASSWORD có ít nhất 8 ký tự');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const passwordHash = await new BcryptHashService().hash(env.DEMO_PASSWORD);
    const userIds = new Map();

    for (const member of members) {
      const { rows } = await client.query(
        `INSERT INTO users (username, email, password_hash, full_name, role, status)
         VALUES ($1, $2, $3, $4, 'member', 'active')
         ON CONFLICT (email) DO UPDATE SET
           username = EXCLUDED.username,
           password_hash = EXCLUDED.password_hash,
           full_name = EXCLUDED.full_name,
           role = 'member',
           status = 'active'
         RETURNING id`,
        [member.username, member.email, passwordHash, member.fullName],
      );
      userIds.set(member.email, rows[0].id);
    }

    const demoUserIds = [...userIds.values()];
    await client.query('DELETE FROM posts WHERE author_id = ANY($1::uuid[])', [demoUserIds]);

    await client.query(
      `INSERT INTO categories (name, description) VALUES
       ('Hỏi đáp', 'Cùng nhau giải đáp những điều còn băn khoăn'),
       ('Chia sẻ', 'Câu chuyện, kinh nghiệm và góc nhìn từ thành viên'),
       ('Dự án', 'Cập nhật dự án và tìm cộng sự')
       ON CONFLICT (name) DO NOTHING`,
    );
    const { rows: categories } = await client.query('SELECT id, name FROM categories');
    const categoryIds = new Map(categories.map((category) => [category.name, category.id]));
    const postIds = [];

    for (const post of posts) {
      const authorId = userIds.get(post.author);
      const categoryId = categoryIds.get(post.category);
      if (!authorId) throw new Error(`Không tìm thấy tài khoản demo ${post.author}`);
      if (!categoryId) throw new Error(`Chưa có chuyên mục ${post.category}; hãy chạy migration trước`);
      const { rows } = await client.query(
        `INSERT INTO posts (author_id, category_id, title, content)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [authorId, categoryId, post.title, post.content],
      );
      postIds.push(rows[0].id);
    }

    await client.query(
      `INSERT INTO comments (post_id, author_id, content) VALUES
       ($1, $4, 'Cảm ơn bạn, phần chốt người phụ trách rất hữu ích.'),
       ($2, $5, 'Nhóm mình chia theo chủ đề và thêm ngày cập nhật vào tên tài liệu.'),
       ($3, $6, 'Mình quan tâm và có thể hỗ trợ khung giờ buổi sáng.')`,
      [postIds[0], postIds[1], postIds[2], userIds.get(members[1].email), userIds.get(members[2].email), userIds.get(members[0].email)],
    );

    await client.query(
      `INSERT INTO post_votes (post_id, user_id, value) VALUES
       ($1, $4, 1), ($1, $5, 1), ($2, $6, 1), ($3, $4, 1)
       ON CONFLICT (post_id, user_id) DO NOTHING`,
      [postIds[0], postIds[1], postIds[2], userIds.get(members[1].email), userIds.get(members[2].email), userIds.get(members[0].email)],
    );

    await client.query('COMMIT');
    console.log(`Đã tạo ${members.length} thành viên, ${posts.length} bài viết và dữ liệu tương tác demo.`);
    console.log(`Tài khoản demo: ${members.map((member) => member.email).join(', ')}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

seedDemo()
  .catch((error) => { console.error(error.message); process.exitCode = 1; })
  .finally(() => pool.end());
