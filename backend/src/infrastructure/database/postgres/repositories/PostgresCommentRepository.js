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
    score: row.score,
    viewerVote: row.viewer_vote,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

const selectComment = `
  SELECT cm.*, u.username AS author_username, u.full_name AS author_full_name, u.avatar_url AS author_avatar_url,
    (SELECT COALESCE(SUM(v.value), 0)::int FROM comment_votes v WHERE v.comment_id = cm.id) AS score,
    COALESCE((SELECT mine.value FROM comment_votes mine WHERE mine.comment_id = cm.id AND mine.user_id = $1), 0)::int AS viewer_vote
  FROM comments cm JOIN users u ON u.id = cm.author_id
  JOIN posts p ON p.id = cm.post_id`;

class PostgresCommentRepository {
  async create(comment, database = pool) {
    const { rows } = await database.query(
      'INSERT INTO comments (post_id, author_id, content, parent_id, images) VALUES ($1, $2, $3, $4, $5::jsonb) RETURNING id',
      [comment.postId, comment.authorId, comment.content, comment.parentId, JSON.stringify(comment.images || [])],
    );
    const result = await database.query(`${selectComment.replace('SELECT cm.*', 'SELECT cm.*, p.title AS post_title')} WHERE cm.id = $2`, [comment.authorId, rows[0].id]);
    return mapComment(result.rows[0]);
  }

  async listByPost(postId, viewerId = null) {
    const { rows } = await pool.query(
      `${selectComment.replace('SELECT cm.*', 'SELECT cm.*, p.title AS post_title')} WHERE cm.post_id = $2 AND cm.status = 'visible' ORDER BY cm.created_at ASC`,
      [viewerId, postId],
    );
    return rows.map(mapComment);
  }

  async findById(id, viewerId = null, database = pool) {
    const { rows } = await database.query(
      `${selectComment.replace('SELECT cm.*', 'SELECT cm.*, p.title AS post_title')} WHERE cm.id = $2`,
      [viewerId, id],
    );
    return mapComment(rows[0]);
  }

  async listAll({ page, limit, search, status }) {
    const offset = (page - 1) * limit;
    const pattern = `%${search}%`;
    const select = selectComment.replace('SELECT cm.*', 'SELECT cm.*, p.title AS post_title');
    const [itemsResult, countResult] = await Promise.all([
      pool.query(
        `${select} WHERE ($2 = '' OR cm.content ILIKE $3 OR u.username ILIKE $3 OR p.title ILIKE $3)
         AND ($4::comment_status IS NULL OR cm.status = $4)
         ORDER BY cm.created_at DESC LIMIT $5 OFFSET $6`,
        [null, search, pattern, status, limit, offset],
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

  async moderate(id, status, database = pool) {
    await database.query('UPDATE comments SET status = $2 WHERE id = $1', [id, status]);
    return this.findById(id, null, database);
  }

  async countByStatus() {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status = 'visible')::int AS visible,
       COUNT(*) FILTER (WHERE status = 'removed')::int AS removed FROM comments`,
    );
    return rows[0];
  }

  async update(id, { content, images }, database = pool) {
    await database.query('UPDATE comments SET content = $2, images = $3::jsonb WHERE id = $1', [id, content, JSON.stringify(images)]);
    return this.findById(id, null, database);
  }
}

module.exports = PostgresCommentRepository;
