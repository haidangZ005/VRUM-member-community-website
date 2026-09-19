process.env.NODE_ENV = 'test';
const shouldRun = process.env.VRUM_SMOKE === 'true' && Boolean(process.env.TEST_DATABASE_URL);
if (shouldRun) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const request = require('supertest');
const pool = require('../../src/infrastructure/database/postgres/connection');
const createApp = require('../../src/main/app');
const makeDependencies = require('../../src/main/factories/makeDependencies');
const User = require('../../src/domain/entities/User');
const Category = require('../../src/domain/entities/Category');

// Opt-in against a migrated test database; real transactions need committed fixtures.
const smoke = shouldRun ? describe : describe.skip;
smoke('Post and comment API with real PostgreSQL', () => {
  const users = [];
  let app;
  let owner;
  let other;
  let category;
  const image = `data:image/jpeg;base64,${Buffer.from([255, 216, 255, 224, 0, 0, 255, 217]).toString('base64')}`;
  beforeAll(async () => {
    const dependencies = makeDependencies();
    app = createApp({ dependencies });
    const suffix = Date.now();
    for (const name of ['owner', 'other']) {
      const user = await dependencies.userRepository.create(new User({ username: `qa_${name}_${suffix}`, email: `qa_${name}_${suffix}@example.test`, passwordHash: 'unused-test-only' }));
      users.push(user);
      user.token = dependencies.tokenService.generateAccessToken({ sub: user.id, role: 'member' });
    }
    [owner, other] = users;
    category = await dependencies.categoryRepository.create(new Category({ name: `QA ${suffix}`, ownerId: owner.id }));
  });
  afterAll(async () => {
    const userIds = users.map((user) => user.id);
    try {
      // Owner IDs also cover a category inserted before fixture setup fails.
      await pool.query('DELETE FROM categories WHERE owner_id = ANY($1::uuid[])', [userIds]);
      await pool.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [userIds]);
    } finally {
      await pool.end();
    }
  });
  const api = (method, url, actor = owner) => request(app)[method](`/api/posts${url}`).set('Authorization', `Bearer ${actor.token}`);
  test('image persistence, editing, replies and ownership', async () => {
    const created = await api('post', '').send({ title: 'QA image post', content: 'Text accompanying the test image.', categoryId: category.id, images: [image] }).expect(201);
    const id = created.body.data.id;
    expect((await api('get', `/${id}`).expect(200)).body.data.images).toEqual([image]);
    await api('put', `/${id}`, other).send({ images: [] }).expect(403);
    await api('put', `/${id}`).send({ images: [] }).expect(200);
    expect((await api('get', `/${id}`).expect(200)).body.data.images).toEqual([]);
    const comment = (await api('post', `/${id}/comments`).send({ content: 'Test image comment', images: [image] }).expect(201)).body.data;
    await api('put', `/${id}/comments/${comment.id}`, other).send({ content: 'Unauthorized edit' }).expect(403);
    await api('delete', `/${id}/comments/${comment.id}`, other).expect(403);
    await api('put', `/${id}/comments/${comment.id}`).send({ content: 'Updated comment', images: [] }).expect(200);
    for (const actor of [owner, other]) {
      await api('post', `/${id}/comments`, actor).send({ content: 'Reply to comment', parentId: comment.id, images: [image] }).expect(201);
    }
    const list = (await api('get', `/${id}/comments`).expect(200)).body.data;
    expect(list).toHaveLength(3);
    expect(list.filter((item) => item.parentId === comment.id)).toHaveLength(2);
    expect(list.find((item) => item.id === comment.id).images).toEqual([]);
    await api('delete', `/${id}/comments/${comment.id}`).expect(200);
    expect((await api('get', `/${id}/comments`).expect(200)).body.data).toHaveLength(2);
    await api('post', `/${id}/comments`).send({ content: 'Invalid image', images: ['data:image/svg+xml;base64,PHN2Zz4='] }).expect(422);
  });
});
