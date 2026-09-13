const pool = require('../connection');

function mapSummary(row) {
  if (!row) return null;
  return { summary: row.summary, model: row.model, generatedAt: row.generated_at };
}

class PostgresPostSummaryRepository {
  async findFresh(postId, sourceVersion, database = pool) {
    const { rows } = await database.query(
      'SELECT summary, model, generated_at FROM post_ai_summaries WHERE post_id = $1 AND source_version = $2',
      [postId, sourceVersion],
    );
    return mapSummary(rows[0]);
  }

  async save({ postId, summary, model, sourceVersion }, database = pool) {
    const { rows } = await database.query(
      `INSERT INTO post_ai_summaries (post_id, summary, model, source_version)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (post_id) DO UPDATE SET summary = EXCLUDED.summary, model = EXCLUDED.model,
         source_version = EXCLUDED.source_version, generated_at = now()
       RETURNING summary, model, generated_at`,
      [postId, summary, model, sourceVersion],
    );
    return mapSummary(rows[0]);
  }
}

module.exports = PostgresPostSummaryRepository;
