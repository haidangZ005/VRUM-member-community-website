const seedTech = require('../../src/infrastructure/database/postgres/seeds/seedTech');
const data = require('../../src/infrastructure/database/postgres/seeds/techData.json');

test('tech snapshot has unique identities and source links for all three communities', () => {
  expect(new Set(data.posts.map((post) => post.id)).size).toBe(data.posts.length);
  expect(new Set(data.posts.map((post) => post.sourceUrl)).size).toBe(data.posts.length);
  expect(new Set(data.posts.map((post) => post.category))).toEqual(new Set(data.categories.map((category) => category.name)));
  for (const post of data.posts) {
    expect(post.sourceUrl).toMatch(/^https:\/\/www\.reddit\.com\/r\/(thinkpad|framework|linux)\/comments\//);
    expect(post.summary.length).toBeGreaterThan(40);
  }
});

test('seed preserves user edits and keeps provenance outside displayed post bodies', async () => {
  const client = {
    query: jest.fn(async (sql) => {
      if (sql.startsWith('SELECT id, username')) return { rows: [{ id: 'demo-user', username: 'vrum_tech_demo' }] };
      if (sql.startsWith('SELECT id FROM categories')) return { rows: [{ id: 'category' }] };
      return { rowCount: 1 };
    }),
    release: jest.fn(),
  };
  expect(await seedTech({ connect: async () => client })).toBe(data.posts.length);
  expect(client.query.mock.calls[0][0]).toBe('BEGIN');
  expect(client.query.mock.calls.at(-1)[0]).toBe('COMMIT');
  for (const [sql, params] of client.query.mock.calls) {
    expect(sql).not.toMatch(/\b(DELETE|TRUNCATE)\b/);
    if (sql.startsWith('UPDATE categories')) expect(sql).toContain('AND avatar_url IS NULL');
    if (sql.startsWith('UPDATE posts')) {
      expect(sql).toContain('WHERE id = $2 AND author_id = $3 AND content = $4');
      expect(params[3]).toContain('Nguồn: https://www.reddit.com/');
      expect(params[0]).toBe(data.posts.find((post) => post.id === params[1]).summary);
    }
    if (sql.includes('INSERT INTO')) expect(sql).toMatch(/ON CONFLICT \(\w+\) DO NOTHING/);
    if (sql.includes('INSERT INTO posts')) expect(params[4]).toBe(data.posts.find((post) => post.id === params[0]).summary);
  }
  expect(client.release).toHaveBeenCalledTimes(1);
});

test('a database failure rolls back the seed and releases its connection', async () => {
  const client = {
    query: jest.fn().mockResolvedValue({}).mockRejectedValueOnce(new Error('database unavailable')),
    release: jest.fn(),
  };
  await expect(seedTech({ connect: async () => client })).rejects.toThrow('database unavailable');
  expect(client.query).toHaveBeenLastCalledWith('ROLLBACK');
  expect(client.release).toHaveBeenCalledTimes(1);
});
