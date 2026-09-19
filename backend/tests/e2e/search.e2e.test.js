process.env.NODE_ENV = 'test';

const request = require('supertest');
const createApp = require('../../src/main/app');
const { makeFakeDependencies } = require('../helpers/fakes');

describe('Global search API', () => {
  test('tìm nội dung công khai theo loại, cộng đồng và tác giả mà không lộ dữ liệu riêng tư', async () => {
    const dependencies = makeFakeDependencies();
    const app = createApp({ dependencies });
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({ username: 'search_author', email: 'search@example.com', password: 'Matkhau123', fullName: 'Tác giả tìm kiếm' });
    const login = await agent.post('/api/auth/login').send({ email: 'search@example.com', password: 'Matkhau123' });
    const authorization = `Bearer ${login.body.data.accessToken}`;
    const categories = await agent.get('/api/posts/categories').expect(200);
    const image = `data:image/jpeg;base64,${Buffer.from([255, 216, 255, 224, 0, 0, 255, 217]).toString('base64')}`;
    const post = await agent.post('/api/posts').set('Authorization', authorization).send({
      title: 'PostgreSQL cho cộng đồng Việt', content: 'Hướng dẫn tìm kiếm toàn văn trong ứng dụng cộng đồng.', categoryId: categories.body.data[0].id, images: [image],
    }).expect(201);
    await agent.post(`/api/posts/${post.body.data.id}/comments`).set('Authorization', authorization)
      .send({ content: 'Bình luận về tìm kiếm PostgreSQL.' }).expect(201);

    await request(app).get('/api/search').query({ q: 'PostgreSQL', type: 'posts', categoryId: categories.body.data[0].id, authorId: login.body.data.user.id }).expect(200)
      .expect(({ body }) => {
        expect(body.data).toHaveLength(1);
        expect(body.meta).toMatchObject({ page: 1, total: 1 });
      });
    await request(app).get('/api/search').query({ q: 'Bình luận', type: 'comments' }).expect(200)
      .expect(({ body }) => expect(body.data[0].postId).toBe(post.body.data.id));
    await request(app).get('/api/search').query({ q: 'search_author', type: 'users' }).expect(200)
      .expect(({ body }) => {
        expect(body.data).toHaveLength(1);
        expect(body.data[0]).not.toHaveProperty('email');
        expect(body.data[0]).not.toHaveProperty('status');
      });
    await request(app).get('/api/search').query({ q: 'PostgreSQL', type: 'media' }).expect(200)
      .expect(({ body }) => expect(body.data[0]).toMatchObject({ targetType: 'post', postId: post.body.data.id }));
    await request(app).get('/api/search').query({ q: 'Hỏi', type: 'communities' }).expect(200)
      .expect(({ body }) => expect(body.data.length).toBeGreaterThan(0));

    await request(app).get('/api/search').query({ q: 'PostgreSQL', type: 'all' }).expect(200)
      .expect(({ body }) => expect(body.data.media[0].thumbnail).toBeNull());

    await agent.delete(`/api/posts/${post.body.data.id}`).set('Authorization', authorization).expect(200);
    await request(app).get('/api/search').query({ q: 'PostgreSQL', type: 'posts' }).expect(200)
      .expect(({ body }) => expect(body.data).toHaveLength(0));
  });
});
