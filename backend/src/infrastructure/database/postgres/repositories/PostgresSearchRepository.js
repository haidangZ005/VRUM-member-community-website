const pool = require('../connection');

const contentFilters = `
  ($2::uuid IS NULL OR p.category_id = $2)
  AND ($3::uuid IS NULL OR source.author_id = $3)
  AND ($4::timestamptz IS NULL OR source.created_at >= $4)
  AND ($5::timestamptz IS NULL OR source.created_at <= $5)`;

function contentParams(filters) {
  return [filters.q, filters.categoryId, filters.authorId, filters.from, filters.to, filters.limit, (filters.page - 1) * filters.limit];
}

function orderBy(sort) {
  if (sort === 'new') return 'source.created_at DESC';
  if (sort === 'top') return 'score DESC, source.created_at DESC';
  return 'relevance DESC, source.created_at DESC';
}

function mapPost(row) {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    author: { id: row.author_id, username: row.username, fullName: row.full_name, avatarUrl: row.avatar_url },
    community: row.category_id ? { id: row.category_id, name: row.category_name } : null,
    score: row.score,
    commentCount: row.comment_count,
    createdAt: row.created_at,
  };
}

function mapComment(row) {
  return {
    id: row.id,
    postId: row.post_id,
    postTitle: row.post_title,
    excerpt: row.excerpt,
    author: { id: row.author_id, username: row.username, fullName: row.full_name, avatarUrl: row.avatar_url },
    community: row.category_id ? { id: row.category_id, name: row.category_name } : null,
    score: row.score,
    createdAt: row.created_at,
  };
}

class PostgresSearchRepository {
  async searchPosts(filters) {
    const params = contentParams(filters);
    const vector = `to_tsvector('simple', COALESCE(p.title, '') || ' ' || COALESCE(p.content, ''))`;
    const query = `plainto_tsquery('simple', $1)`;
    const where = `p.status = 'published' AND ${vector} @@ ${query} AND ${contentFilters.replaceAll('source.', 'p.')}`;
    const [itemsResult, countResult] = await Promise.all([
      pool.query(
        `SELECT p.id, p.title, LEFT(p.content, 280) AS excerpt, p.author_id, u.username, u.full_name, u.avatar_url,
          p.category_id, c.name AS category_name, p.created_at,
          (SELECT COALESCE(SUM(pv.value), 0)::int FROM post_votes pv WHERE pv.post_id = p.id) AS score,
          (SELECT COUNT(*)::int FROM comments cm WHERE cm.post_id = p.id AND cm.status = 'visible') AS comment_count,
          ts_rank(${vector}, ${query}) AS relevance
         FROM posts p JOIN users u ON u.id = p.author_id LEFT JOIN categories c ON c.id = p.category_id
         WHERE ${where} ORDER BY ${orderBy(filters.sort).replaceAll('source.', 'p.')} LIMIT $6 OFFSET $7`,
        params,
      ),
      pool.query(`SELECT COUNT(*)::int AS total FROM posts p JOIN users u ON u.id = p.author_id WHERE ${where}`, params.slice(0, 5)),
    ]);
    return { items: itemsResult.rows.map(mapPost), total: countResult.rows[0].total };
  }

  async searchComments(filters) {
    const params = contentParams(filters);
    const vector = `to_tsvector('simple', COALESCE(cm.content, ''))`;
    const query = `plainto_tsquery('simple', $1)`;
    const where = `cm.status = 'visible' AND p.status = 'published' AND ${vector} @@ ${query} AND ${contentFilters.replaceAll('source.', 'cm.')}`;
    const [itemsResult, countResult] = await Promise.all([
      pool.query(
        `SELECT cm.id, cm.post_id, p.title AS post_title, LEFT(cm.content, 280) AS excerpt,
          cm.author_id, u.username, u.full_name, u.avatar_url, p.category_id, c.name AS category_name, cm.created_at,
          (SELECT COALESCE(SUM(cv.value), 0)::int FROM comment_votes cv WHERE cv.comment_id = cm.id) AS score,
          ts_rank(${vector}, ${query}) AS relevance
         FROM comments cm JOIN posts p ON p.id = cm.post_id JOIN users u ON u.id = cm.author_id
         LEFT JOIN categories c ON c.id = p.category_id
         WHERE ${where} ORDER BY ${orderBy(filters.sort).replaceAll('source.', 'cm.')} LIMIT $6 OFFSET $7`,
        params,
      ),
      pool.query(`SELECT COUNT(*)::int AS total FROM comments cm JOIN posts p ON p.id = cm.post_id JOIN users u ON u.id = cm.author_id WHERE ${where}`, params.slice(0, 5)),
    ]);
    return { items: itemsResult.rows.map(mapComment), total: countResult.rows[0].total };
  }

  async searchCommunities(filters) {
    const offset = (filters.page - 1) * filters.limit;
    const vector = `to_tsvector('simple', COALESCE(name, '') || ' ' || COALESCE(description, ''))`;
    const query = `plainto_tsquery('simple', $1)`;
    const [itemsResult, countResult] = await Promise.all([
      pool.query(
        `SELECT id, name, description, avatar_url AS "avatarUrl",
          GREATEST(ts_rank(${vector}, ${query}), similarity(name, $1)) AS relevance
         FROM categories WHERE ${vector} @@ ${query} OR name % $1 OR name ILIKE '%' || $1 || '%' OR COALESCE(description, '') ILIKE '%' || $1 || '%'
         ORDER BY relevance DESC, name ASC LIMIT $2 OFFSET $3`,
        [filters.q, filters.limit, offset],
      ),
      pool.query(`SELECT COUNT(*)::int AS total FROM categories WHERE ${vector} @@ ${query} OR name % $1 OR name ILIKE '%' || $1 || '%' OR COALESCE(description, '') ILIKE '%' || $1 || '%'`, [filters.q]),
    ]);
    return { items: itemsResult.rows, total: countResult.rows[0].total };
  }

  async searchUsers(filters) {
    const offset = (filters.page - 1) * filters.limit;
    const vector = `to_tsvector('simple', COALESCE(username, '') || ' ' || COALESCE(full_name, ''))`;
    const query = `plainto_tsquery('simple', $1)`;
    const [itemsResult, countResult] = await Promise.all([
      pool.query(
        `SELECT id, username, full_name AS "fullName", avatar_url AS "avatarUrl",
          GREATEST(ts_rank(${vector}, ${query}), similarity(username, $1)) AS relevance
         FROM users WHERE status = 'active' AND (${vector} @@ ${query} OR username % $1 OR username ILIKE '%' || $1 || '%' OR COALESCE(full_name, '') ILIKE '%' || $1 || '%')
         ORDER BY relevance DESC, username ASC LIMIT $2 OFFSET $3`,
        [filters.q, filters.limit, offset],
      ),
      pool.query(`SELECT COUNT(*)::int AS total FROM users WHERE status = 'active' AND (${vector} @@ ${query} OR username % $1 OR username ILIKE '%' || $1 || '%' OR COALESCE(full_name, '') ILIKE '%' || $1 || '%')`, [filters.q]),
    ]);
    return { items: itemsResult.rows, total: countResult.rows[0].total };
  }

  async searchMedia(filters) {
    const params = contentParams(filters);
    const thumbnail = filters.includeThumbnail ? 'p.images->>0' : 'NULL::text';
    const commentThumbnail = filters.includeThumbnail ? 'cm.images->>0' : 'NULL::text';
    const mediaQuery = `
      SELECT p.id, 'post' AS target_type, p.id AS post_id, p.title, LEFT(p.content, 280) AS excerpt,
        ${thumbnail} AS thumbnail, p.author_id, u.username, p.category_id, c.name AS category_name, p.created_at,
        (SELECT COALESCE(SUM(pv.value), 0)::int FROM post_votes pv WHERE pv.post_id = p.id) AS score,
        ts_rank(to_tsvector('simple', COALESCE(p.title, '') || ' ' || COALESCE(p.content, '')), plainto_tsquery('simple', $1)) AS relevance
      FROM posts p JOIN users u ON u.id = p.author_id LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.status = 'published' AND jsonb_array_length(p.images) > 0
        AND to_tsvector('simple', COALESCE(p.title, '') || ' ' || COALESCE(p.content, '')) @@ plainto_tsquery('simple', $1)
        AND ${contentFilters.replaceAll('source.', 'p.')}
      UNION ALL
      SELECT cm.id, 'comment' AS target_type, cm.post_id, p.title, LEFT(cm.content, 280) AS excerpt,
        ${commentThumbnail} AS thumbnail, cm.author_id, u.username, p.category_id, c.name AS category_name, cm.created_at,
        (SELECT COALESCE(SUM(cv.value), 0)::int FROM comment_votes cv WHERE cv.comment_id = cm.id) AS score,
        ts_rank(to_tsvector('simple', COALESCE(cm.content, '')), plainto_tsquery('simple', $1)) AS relevance
      FROM comments cm JOIN posts p ON p.id = cm.post_id JOIN users u ON u.id = cm.author_id LEFT JOIN categories c ON c.id = p.category_id
      WHERE cm.status = 'visible' AND p.status = 'published' AND jsonb_array_length(cm.images) > 0
        AND to_tsvector('simple', COALESCE(cm.content, '')) @@ plainto_tsquery('simple', $1)
        AND ${contentFilters.replaceAll('source.', 'cm.')}`;
    const mediaOrder = filters.sort === 'new' ? 'created_at DESC' : filters.sort === 'top' ? 'score DESC, created_at DESC' : 'relevance DESC, created_at DESC';
    const [itemsResult, countResult] = await Promise.all([
      pool.query(`SELECT * FROM (${mediaQuery}) media ORDER BY ${mediaOrder} LIMIT $6 OFFSET $7`, params),
      pool.query(`SELECT COUNT(*)::int AS total FROM (${mediaQuery}) media`, params.slice(0, 5)),
    ]);
    return {
      items: itemsResult.rows.map((row) => ({
        id: row.id, targetType: row.target_type, postId: row.post_id, title: row.title, excerpt: row.excerpt,
        thumbnail: row.thumbnail, author: { id: row.author_id, username: row.username },
        community: row.category_id ? { id: row.category_id, name: row.category_name } : null,
        score: row.score, createdAt: row.created_at,
      })),
      total: countResult.rows[0].total,
    };
  }
}

module.exports = PostgresSearchRepository;
