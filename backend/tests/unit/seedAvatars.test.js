const fs = require('node:fs');
const path = require('node:path');
const seedAvatars = require('../../src/infrastructure/database/postgres/seeds/seedAvatars');
const Category = require('../../src/domain/entities/Category');

test('demo avatar upgrade is scoped, non-destructive and uses valid bundled images', async () => {
  const client = { query: jest.fn().mockResolvedValue({ rowCount: 1 }) };
  await seedAvatars(client);
  expect(client.query).toHaveBeenCalledTimes(19);
  for (const [sql, values] of client.query.mock.calls) {
    expect(sql).toMatch(/^UPDATE (users|categories) SET avatar_url = \$1 WHERE/);
    expect(sql).toContain('avatar_url IS NULL');
    if (sql.startsWith('UPDATE users')) {
      expect(sql).toContain('username = $2 AND email = $3');
      expect(sql).toContain('avatar_url = $4');
    } else {
      expect(sql).toContain('owner_id IS NULL');
      expect(new Category({ name: values[1], avatarUrl: values[0] }).avatarUrl).toBe(values[0]);
    }
    const svg = fs.readFileSync(path.resolve(__dirname, '../../../frontend/public', values[0].slice(1)), 'utf8');
    expect(svg).toContain('<svg');
    expect(svg).not.toMatch(/<script|<text|href=/);
  }
  expect(() => new Category({ name: 'Test', avatarUrl: '/community-icons/untrusted.svg' })).toThrow();
});
