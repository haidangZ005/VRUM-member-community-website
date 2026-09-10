const pool = require('../connection');
const env = require('../../../config/env');
const BcryptHashService = require('../../../services/BcryptHashService');

const members = [
  { username: 'minh_anh', email: 'minhanh@example.com', fullName: 'Nguyễn Minh Anh' },
  { username: 'quang_huy', email: 'quanghuy@example.com', fullName: 'Trần Quang Huy' },
  { username: 'thu_trang', email: 'thutrang@example.com', fullName: 'Lê Thu Trang' },
  { username: 'lan_phuong', email: 'lanphuong@example.com', fullName: 'Phạm Lan Phương' },
  { username: 'duc_long', email: 'duclong@example.com', fullName: 'Vũ Đức Long' },
  { username: 'hai_yen', email: 'haiyen@example.com', fullName: 'Đỗ Hải Yến' },
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
  {
    author: 'lanphuong@example.com',
    category: 'Chia sẻ',
    title: 'Checklist chuẩn bị buổi thuyết trình nhóm',
    content: 'Mình thường kiểm tra mục tiêu, thời lượng, người trình bày và phần hỏi đáp trước một ngày. @minh_anh có thể bổ sung thêm kinh nghiệm nhé.',
  },
  {
    author: 'duclong@example.com',
    category: 'Hỏi đáp',
    title: 'Nên bắt đầu học PostgreSQL từ đâu?',
    content: 'Mình muốn học PostgreSQL để xây chức năng tìm kiếm và feed cộng đồng. Mọi người có tài liệu hoặc lộ trình thực hành nào dễ theo dõi không?',
  },
  {
    author: 'haiyen@example.com',
    category: 'Dự án',
    title: 'Ảnh cập nhật không gian sinh hoạt cộng đồng',
    content: 'Không gian mới đã hoàn thiện khu đọc sách và bàn làm việc nhóm. Đây là bài có media để kiểm tra trang tìm kiếm hình ảnh.',
    images: ['data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='],
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

    await client.query(
      `INSERT INTO categories (name, description) VALUES
       ('Hỏi đáp', 'Cùng nhau giải đáp những điều còn băn khoăn'),
       ('Chia sẻ', 'Câu chuyện, kinh nghiệm và góc nhìn từ thành viên'),
       ('Dự án', 'Cập nhật dự án và tìm cộng sự')
       ON CONFLICT (name) DO NOTHING`,
    );
    const { rows: categories } = await client.query('SELECT id, name FROM categories');
    const categoryIds = new Map(categories.map((category) => [category.name, category.id]));
    const postIds = new Map();

    for (const post of posts) {
      const authorId = userIds.get(post.author);
      const categoryId = categoryIds.get(post.category);
      if (!authorId) throw new Error(`Không tìm thấy tài khoản demo ${post.author}`);
      if (!categoryId) throw new Error(`Chưa có chuyên mục ${post.category}; hãy chạy migration trước`);
      const { rows } = await client.query(
        `WITH existing AS (
           SELECT id FROM posts WHERE author_id = $1 AND title = $3 ORDER BY created_at ASC LIMIT 1
         ), updated AS (
           UPDATE posts SET category_id = $2, content = $4, images = $5::jsonb, updated_at = now()
           WHERE id = (SELECT id FROM existing) RETURNING id
         )
         INSERT INTO posts (author_id, category_id, title, content, images)
         SELECT $1, $2, $3, $4, $5::jsonb WHERE NOT EXISTS (SELECT 1 FROM updated)
         RETURNING id`,
        [authorId, categoryId, post.title, post.content, JSON.stringify(post.images || [])],
      );
      if (rows.length === 0) {
        const existing = await client.query(
          'SELECT id FROM posts WHERE author_id = $1 AND title = $2 ORDER BY created_at ASC LIMIT 1',
          [authorId, post.title],
        );
        postIds.set(post.title, existing.rows[0].id);
      } else {
        postIds.set(post.title, rows[0].id);
      }
    }

    const ensureComment = async ({ postTitle, authorEmail, content, parentId = null }) => {
      const postId = postIds.get(postTitle);
      const authorId = userIds.get(authorEmail);
      const existing = await client.query(
        `SELECT id, post_id FROM comments
         WHERE post_id = $1 AND author_id = $2 AND content = $3 AND parent_id IS NOT DISTINCT FROM $4
         ORDER BY created_at ASC LIMIT 1`,
        [postId, authorId, content, parentId],
      );
      if (existing.rows[0]) return existing.rows[0];
      const inserted = await client.query(
        `INSERT INTO comments (post_id, author_id, content, parent_id)
         VALUES ($1, $2, $3, $4) RETURNING id, post_id`,
        [postId, authorId, content, parentId],
      );
      return inserted.rows[0];
    };

    const firstComment = await ensureComment({
      postTitle: posts[0].title,
      authorEmail: members[1].email,
      content: 'Cảm ơn bạn, phần chốt người phụ trách rất hữu ích.',
    });
    const documentComment = await ensureComment({
      postTitle: posts[1].title,
      authorEmail: members[2].email,
      content: 'Nhóm mình chia theo chủ đề và thêm ngày cập nhật vào tên tài liệu.',
    });
    const projectComment = await ensureComment({
      postTitle: posts[2].title,
      authorEmail: members[0].email,
      content: 'Mình quan tâm và có thể hỗ trợ khung giờ buổi sáng.',
    });
    const reply = await ensureComment({
      postTitle: posts[2].title,
      authorEmail: members[1].email,
      content: 'Mình đã xem và trả lời trực tiếp bình luận của bạn @minh_anh.',
      parentId: projectComment.id,
    });

    await client.query(
      `INSERT INTO post_votes (post_id, user_id, value) VALUES
       ($1, $6, 1), ($1, $7, 1), ($1, $8, 1), ($1, $9, 1), ($1, $10, 1),
       ($2, $8, 1), ($3, $6, 1), ($4, $7, -1), ($5, $8, 1)
       ON CONFLICT (post_id, user_id) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [postIds.get(posts[0].title), postIds.get(posts[1].title), postIds.get(posts[2].title), postIds.get(posts[3].title), postIds.get(posts[4].title),
        userIds.get(members[1].email), userIds.get(members[2].email), userIds.get(members[3].email), userIds.get(members[4].email), userIds.get(members[5].email)],
    );

    await client.query(
      `INSERT INTO comment_votes (comment_id, user_id, value) VALUES
       ($1, $4, 1), ($1, $5, 1), ($2, $6, -1), ($3, $5, 1)
       ON CONFLICT (comment_id, user_id) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [firstComment.id, documentComment.id, reply.id,
        userIds.get(members[0].email), userIds.get(members[2].email), userIds.get(members[3].email)],
    );

    await client.query(
      `INSERT INTO community_memberships (user_id, category_id, is_favorite) VALUES
       ($1, $4, TRUE), ($1, $5, FALSE), ($2, $5, TRUE), ($3, $6, FALSE)
       ON CONFLICT (user_id, category_id) DO UPDATE SET is_favorite = EXCLUDED.is_favorite`,
      [userIds.get(members[0].email), userIds.get(members[1].email), userIds.get(members[2].email),
        categoryIds.get('Chia sẻ'), categoryIds.get('Hỏi đáp'), categoryIds.get('Dự án')],
    );
    await client.query('INSERT INTO post_views (user_id, post_id) VALUES ($1, $2) ON CONFLICT (user_id, post_id) DO UPDATE SET viewed_at = now()', [userIds.get(members[0].email), postIds.get(posts[1].title)]);
    await client.query('INSERT INTO hidden_posts (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userIds.get(members[0].email), postIds.get(posts[2].title)]);

    const notificationRecipientId = userIds.get(members[0].email);
    const notificationRows = [
      ['POST_COMMENT', members[1].email, 'comment', firstComment.id, { actorUsername: 'quang_huy', postTitle: posts[0].title, excerpt: 'Cảm ơn bạn, phần chốt người phụ trách rất hữu ích.', postId: postIds.get(posts[0].title) }, 'seed:post-comment'],
      ['COMMENT_REPLY', members[1].email, 'comment', reply.id, { actorUsername: 'quang_huy', postTitle: posts[2].title, excerpt: 'Một phản hồi mới trong cuộc trò chuyện.', postId: reply.post_id, commentId: reply.id }, 'seed:comment-reply'],
      ['MENTION', members[3].email, 'post', postIds.get(posts[3].title), { actorUsername: 'lan_phuong', postTitle: posts[3].title, excerpt: posts[3].content, postId: postIds.get(posts[3].title) }, 'seed:mention'],
      ['POST_VOTE_MILESTONE', null, 'post', postIds.get(posts[0].title), { postTitle: posts[0].title, score: 5, postId: postIds.get(posts[0].title) }, 'seed:vote-milestone'],
      ['CONTENT_MODERATED', null, 'post', postIds.get(posts[2].title), { title: posts[2].title, reason: 'Dữ liệu mẫu để kiểm tra thông báo kiểm duyệt.', postId: postIds.get(posts[2].title) }, 'seed:moderated'],
    ];
    for (const [type, actorEmail, entityType, entityId, payload, dedupeKey] of notificationRows) {
      await client.query(
        `INSERT INTO notifications (recipient_id, actor_id, type, entity_type, entity_id, payload, dedupe_key)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
         ON CONFLICT (dedupe_key) DO UPDATE SET
           recipient_id = EXCLUDED.recipient_id, actor_id = EXCLUDED.actor_id,
           entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id,
           payload = EXCLUDED.payload, read_at = NULL, created_at = now()`,
        [notificationRecipientId, actorEmail ? userIds.get(actorEmail) : null, type, entityType, entityId, JSON.stringify(payload), dedupeKey],
      );
    }

    await client.query('COMMIT');
    console.log(`Đã tạo ${members.length} thành viên, ${posts.length} bài viết và dữ liệu feed/search/notification demo.`);
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
