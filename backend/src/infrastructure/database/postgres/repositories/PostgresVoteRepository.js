const pool = require('../connection');

async function setVote({ table, targetColumn, targetId, userId, value }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (value === 0) {
      await client.query(`DELETE FROM ${table} WHERE ${targetColumn} = $1 AND user_id = $2`, [targetId, userId]);
    } else {
      await client.query(
        `INSERT INTO ${table} (${targetColumn}, user_id, value) VALUES ($1, $2, $3)
         ON CONFLICT (${targetColumn}, user_id)
         DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
        [targetId, userId, value],
      );
    }
    const { rows } = await client.query(
      `SELECT COALESCE(SUM(value), 0)::int AS score,
       COALESCE(MAX(value) FILTER (WHERE user_id = $2), 0)::int AS viewer_vote
       FROM ${table} WHERE ${targetColumn} = $1`,
      [targetId, userId],
    );
    await client.query('COMMIT');
    return { score: rows[0].score, viewerVote: rows[0].viewer_vote };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

class PostgresVoteRepository {
  async setPostVote(postId, userId, value) {
    return setVote({ table: 'post_votes', targetColumn: 'post_id', targetId: postId, userId, value });
  }

  async setCommentVote(commentId, userId, value) {
    return setVote({ table: 'comment_votes', targetColumn: 'comment_id', targetId: commentId, userId, value });
  }
}

module.exports = PostgresVoteRepository;
