const pool = require('../connection');

async function setVote({ table, targetColumn, targetId, userId, value, database = null }) {
  const client = database || await pool.connect();
  const ownsTransaction = !database;
  try {
    if (ownsTransaction) await client.query('BEGIN');
    const previousResult = await client.query(`SELECT COALESCE(SUM(value), 0)::int AS score FROM ${table} WHERE ${targetColumn} = $1`, [targetId]);
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
    if (ownsTransaction) await client.query('COMMIT');
    return { previousScore: previousResult.rows[0].score, score: rows[0].score, viewerVote: rows[0].viewer_vote };
  } catch (error) {
    if (ownsTransaction) await client.query('ROLLBACK');
    throw error;
  } finally {
    if (ownsTransaction) client.release();
  }
}

class PostgresVoteRepository {
  async setPostVote(postId, userId, value, database = null) {
    return setVote({ table: 'post_votes', targetColumn: 'post_id', targetId: postId, userId, value, database });
  }

  async setCommentVote(commentId, userId, value) {
    return setVote({ table: 'comment_votes', targetColumn: 'comment_id', targetId: commentId, userId, value });
  }
}

module.exports = PostgresVoteRepository;
