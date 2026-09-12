// Only upgrade known demo identities; never replace a member's chosen picture.
async function seedAvatars(client) {
  const members = [
    ['minh_anh', 'minhanh@example.com', 'MA', 'f97316'],
    ['quang_huy', 'quanghuy@example.com', 'QH', '2563eb'],
    ['thu_trang', 'thutrang@example.com', 'TT', 'db2777'],
    ['lan_phuong', 'lanphuong@example.com', 'LP', '9333ea'],
    ['duc_long', 'duclong@example.com', 'ĐL', '0891b2'],
    ['hai_yen', 'haiyen@example.com', 'HY', '059669'],
    ['bao_ngoc', 'baongoc@example.com', 'BN', 'dc2626'],
    ['gia_bao', 'giabao@example.com', 'GB', 'ca8a04'],
    ['khanh_linh', 'khanhlinh@example.com', 'KL', '4f46e5'],
    ['tuan_kiet', 'tuankiet@example.com', 'TK', '0f766e'],
    ['vrum_tech_demo', 'tech-demo@example.invalid', '', ''],
  ];
  for (const [username, email, initials, color] of members) {
    const legacy = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="#${color}"/><circle cx="49" cy="15" r="13" fill="#fff" opacity=".2"/><text x="32" y="41" text-anchor="middle" font-family="Arial,sans-serif" font-size="23" font-weight="700" fill="white">${initials}</text></svg>`)}`;
    await client.query(`UPDATE users SET avatar_url = $1 WHERE username = $2 AND email = $3
      AND (avatar_url IS NULL OR avatar_url = '' OR avatar_url = $4)`,
    [`/demo-avatars/${username}.svg`, username, email, legacy]);
  }
  for (const [name, image] of [['Hỏi đáp', 'questions'], ['Chia sẻ', 'sharing'], ['Dự án', 'projects'], ['Công nghệ', 'technology'], ['Đời sống', 'life'], ['ThinkPad', 'thinkpad'], ['Framework', 'framework'], ['Linux', 'linux']]) {
    await client.query('UPDATE categories SET avatar_url = $1 WHERE name = $2 AND owner_id IS NULL AND avatar_url IS NULL',
      [`/community-icons/${image}.svg`, name]);
  }
}

if (require.main === module) {
  const pool = require('../connection');
  (async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await seedAvatars(client);
      await client.query('COMMIT');
      console.log('Đã bổ sung ảnh mẫu; giữ nguyên ảnh tùy chọn và các dữ liệu khác.');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  })().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
}

module.exports = seedAvatars;
