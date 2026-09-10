const User = require('../../../../domain/entities/User');
const pool = require('../connection');

function mapUser(row) {
  if (!row) return null;
  return new User({
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.password_hash,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

class PostgresUserRepository {
  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return mapUser(rows[0]);
  }

  async findByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    return mapUser(rows[0]);
  }

  async findByUsername(username) {
    const { rows } = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
    return mapUser(rows[0]);
  }

  async create(user) {
    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, avatar_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user.username, user.email, user.passwordHash, user.fullName, user.avatarUrl],
    );
    return mapUser(rows[0]);
  }

  async updateProfile(id, { username, fullName, avatarUrl }) {
    const { rows } = await pool.query(
      `UPDATE users SET username = COALESCE($2, username), full_name = $3, avatar_url = $4
       WHERE id = $1 RETURNING *`,
      [id, username, fullName ?? null, avatarUrl ?? null],
    );
    return mapUser(rows[0]);
  }

  async updatePassword(id, passwordHash) {
    const { rows } = await pool.query(
      'UPDATE users SET password_hash = $2 WHERE id = $1 RETURNING *',
      [id, passwordHash],
    );
    return mapUser(rows[0]);
  }

  async listMembers({ page, limit, search }) {
    const offset = (page - 1) * limit;
    const pattern = `%${search}%`;
    const [itemsResult, countResult] = await Promise.all([
      pool.query(
        `SELECT * FROM users WHERE role = 'member'
         AND ($1 = '' OR username ILIKE $2 OR email ILIKE $2 OR COALESCE(full_name, '') ILIKE $2)
         ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
        [search, pattern, limit, offset],
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total FROM users WHERE role = 'member'
         AND ($1 = '' OR username ILIKE $2 OR email ILIKE $2 OR COALESCE(full_name, '') ILIKE $2)`,
        [search, pattern],
      ),
    ]);
    return { items: itemsResult.rows.map(mapUser), total: countResult.rows[0].total };
  }

  async updateStatus(id, status) {
    const { rows } = await pool.query('UPDATE users SET status = $2 WHERE id = $1 RETURNING *', [id, status]);
    return mapUser(rows[0]);
  }

  async countByStatus() {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status = 'active')::int AS active,
       COUNT(*) FILTER (WHERE status = 'locked')::int AS locked
       FROM users WHERE role = 'member'`,
    );
    return rows[0];
  }
}

module.exports = PostgresUserRepository;
