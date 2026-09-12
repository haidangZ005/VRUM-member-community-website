const { randomBytes } = require('node:crypto');
const BcryptHashService = require('../../../services/BcryptHashService');
const data = require('./techData.json');

async function seedTech(pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Presentation-only account: no shared demo password and no copied Reddit identity.
    const passwordHash = await new BcryptHashService().hash(randomBytes(32).toString('hex'));
    await client.query(
      `INSERT INTO users (username, email, password_hash, full_name, role, status)
       VALUES ('vrum_tech_demo', 'tech-demo@example.invalid', $1, 'VRUM · Demo công nghệ', 'member', 'active')
       ON CONFLICT (email) DO NOTHING`, [passwordHash],
    );
    const { rows: users } = await client.query(
      "SELECT id, username FROM users WHERE email = 'tech-demo@example.invalid'",
    );
    if (users[0]?.username !== 'vrum_tech_demo') throw new Error('Email seed công nghệ đang được tài khoản khác sử dụng.');

    const categoryIds = new Map();
    for (const category of data.categories) {
      await client.query(
        'INSERT INTO categories (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
        [category.name, category.description],
      );
      const { rows } = await client.query('SELECT id FROM categories WHERE name = $1', [category.name]);
      await client.query('UPDATE categories SET avatar_url = $1 WHERE id = $2 AND avatar_url IS NULL',
        [`/community-icons/${category.name.toLowerCase()}.svg`, rows[0].id]);
      categoryIds.set(category.name, rows[0].id);
    }

    let inserted = 0;
    for (const post of data.posts) {
      const content = `Dữ liệu demo · Tóm lược tiếng Việt từ r/${post.category.toLowerCase()}. Không phải bài đăng của tác giả Reddit trên VRUM.\n\n${post.summary}\n\nBài gốc: ${post.sourceTitle}\nNguồn: ${post.sourceUrl}\nNgày tổng hợp: ${data.collectedOn}`;
      const result = await client.query(
        `INSERT INTO posts (id, author_id, category_id, title, content)
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
        [post.id, users[0].id, categoryIds.get(post.category), post.title, post.summary],
      );
      // Only migrate the exact old seed body; preserve posts edited by a user.
      await client.query('UPDATE posts SET content = $1 WHERE id = $2 AND author_id = $3 AND content = $4',
        [post.summary, post.id, users[0].id, content]);
      inserted += result.rowCount;
    }
    await require('./seedAvatars')(client);
    await client.query('COMMIT');
    return inserted;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  const pool = require('../connection');
  seedTech(pool)
    .then((count) => console.log(`Đã thêm ${count} bài demo công nghệ; bổ sung ảnh nhóm và rút gọn bài mẫu chưa chỉnh sửa. Không xóa dữ liệu.`))
    .catch((error) => { console.error(error.message); process.exitCode = 1; })
    .finally(() => pool.end());
}

module.exports = seedTech;
