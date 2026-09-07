const Comment = require('../../../../domain/entities/Comment');
const pool = require('../connection');

function mapComment(row) {
  if (!row) return null;
  return new Comment({
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    content: row.content,
    images: row.images,
    parentId: row.parent_id,
    status: row.status,
    author: row.author_username ? {
      id: row.author_id,
      username: row.author_username,
      fullName: row.author_full_name,
      avatarUrl: row.author_avatar_url,
    } : null,
    post: row.post_title ? { id: row.post_id, title: row.post_title } : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

const selectComment = `
  SELECT cm.*, u.username AS author_username, u.full_name AS author_full_name, u.avatar_url AS author_avatar_url
  FROM comments cm JOIN users u ON u.id = cm.author_id
  JOIN posts p ON p.id = cm.post_id`;

class PostgresCommentRepository {
  async create(comment) {
    const { rows } = await pool.query(
      'INSERT INTO comments (post_id, author_id, content, parent_id, images) VALUES ($1, $2, $3, $4, $5::jsonb) RETURNING id',
      [comment.postId, comment.authorId, comment.content, comment.parentId, JSON.stringify(comment.images || [])],
    );
    const result = await pool.query(`${selectComment.replace('SELECT cm.*', 'SELECT cm.*, p.title AS post_title')} WHERE cm.id = $1`, [rows[0].id]);
    return mapComment(result.rows[0]);
  }

  async listByPost(postId) {
    const { rows } = await pool.query(
      `${selectComment.replace('SELECT cm.*', 'SELECT cm.*, p.title AS post_title')} WHERE cm.post_id = $1 AND cm.status = 'visible' ORDER BY cm.created_at ASC`,
      [postId],
    );
    return rows.map(mapComment);
  }

  async findById(id) {
    const { rows } = await pool.query(
      `${selectComment.replace('SELECT cm.*', 'SELECT cm.*, p.title AS post_title')} WHERE cm.id = $1`,
      [id],
    );
    return mapComment(rows[0]);
  }

  async listAll({ page, limit, search, status }) {
    const offset = (page - 1) * limit;
    const pattern = `%${search}%`;
    const select = selectComment.replace('SELECT cm.*', 'SELECT cm.*, p.title AS post_title');
    const [itemsResult, countResult] = await Promise.all([
      pool.query(
        `${select} WHERE ($1 = '' OR cm.content ILIKE $2 OR u.username ILIKE $2 OR p.title ILIKE $2)
         AND ($3::comment_status IS NULL OR cm.status = $3)
         ORDER BY cm.created_at DESC LIMIT $4 OFFSET $5`,
        [search, pattern, status, limit, offset],
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total FROM comments cm
         JOIN users u ON u.id = cm.author_id JOIN posts p ON p.id = cm.post_id
         WHERE ($1 = '' OR cm.content ILIKE $2 OR u.username ILIKE $2 OR p.title ILIKE $2)
         AND ($3::comment_status IS NULL OR cm.status = $3)`,
        [search, pattern, status],
      ),
    ]);
    return { items: itemsResult.rows.map(mapComment), total: countResult.rows[0].total };
  }

  async moderate(id, status) {
    await pool.query('UPDATE comments SET status = $2 WHERE id = $1', [id, status]);
    return this.findById(id);
  }

  async countByStatus() {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status = 'visible')::int AS visible,
       COUNT(*) FILTER (WHERE status = 'removed')::int AS removed FROM comments`,
    );
    return rows[0];
  }

  async update(id, { content, images }) {
    await pool.query('UPDATE comments SET content = $2, images = $3::jsonb WHERE id = $1', [id, content, JSON.stringify(images)]);
    return this.findById(id);
  }
}

module.exports = PostgresCommentRepository;
