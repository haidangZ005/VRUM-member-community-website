process.env.NODE_ENV = 'test';

const request = require('supertest');
const createApp = require('../../src/main/app');
const makeUseCases = require('../../src/main/factories/makeUseCases');
const { makeFakeDependencies } = require('../helpers/fakes');

describe('Community API', () => {
  let app;
  let agent;
  let authorization;

  beforeEach(async () => {
    const dependencies = makeFakeDependencies();
    app = createApp({ dependencies, useCases: makeUseCases(dependencies), tokenService: dependencies.tokenService });
    agent = request.agent(app);
    await agent.post('/api/auth/register').send({ username: 'haidang', email: 'dang@example.com', password: 'Matkhau123', fullName: 'Hải Đăng' });
    const login = await agent.post('/api/auth/login').send({ email: 'dang@example.com', password: 'Matkhau123' });
    authorization = `Bearer ${login.body.data.accessToken}`;
  });

  test('tạo → đọc → sửa → vote → bình luận → xóa bài viết', async () => {
    const categories = await agent.get('/api/posts/categories').set('Authorization', authorization).expect(200);
    const created = await agent.post('/api/posts').set('Authorization', authorization).send({
      title: 'Cùng xây một không gian chia sẻ',
      content: 'Đây là nội dung thảo luận đầu tiên dành cho tất cả thành viên.',
      categoryId: categories.body.data[0].id,
    }).expect(201);
    const postId = created.body.data.id;

    await agent.get('/api/posts?page=1').set('Authorization', authorization).expect(200).expect(({ body }) => {
      expect(body.data).toHaveLength(1);
      expect(body.meta.total).toBe(1);
    });
    await agent.get(`/api/posts/${postId}`).set('Authorization', authorization).expect(200);
    await agent.put(`/api/posts/${postId}`).set('Authorization', authorization).send({ title: 'Cùng xây không gian chia sẻ tốt hơn' }).expect(200);
    await agent.put(`/api/posts/${postId}/votes`).set('Authorization', authorization).send({ value: 1 }).expect(200)
      .expect(({ body }) => expect(body.data).toEqual({ score: 1, viewerVote: 1 }));
    const comment = await agent.post(`/api/posts/${postId}/comments`).set('Authorization', authorization).send({ content: 'Mình rất đồng tình với ý tưởng này.' }).expect(201);
    await agent.put(`/api/posts/${postId}/comments/${comment.body.data.id}/votes`).set('Authorization', authorization).send({ value: -1 }).expect(200)
      .expect(({ body }) => expect(body.data).toEqual({ score: -1, viewerVote: -1 }));
    await agent.get(`/api/posts/${postId}/comments`).set('Authorization', authorization).expect(200)
      .expect(({ body }) => expect(body.data[0]).toMatchObject({ score: -1, viewerVote: -1 }));
    await agent.put(`/api/posts/${postId}/votes`).set('Authorization', authorization).send({ value: 0 }).expect(200)
      .expect(({ body }) => expect(body.data).toEqual({ score: 0, viewerVote: 0 }));
    await agent.delete(`/api/posts/${postId}`).set('Authorization', authorization).expect(200);
    await agent.get(`/api/posts/${postId}`).set('Authorization', authorization).expect(404);
  });

  test('lọc bài theo tác giả trong đúng cộng đồng, phân trang và bỏ bài đã xóa', async () => {
    const categories = (await agent.get('/api/posts/categories').expect(200)).body.data;
    const create = async (categoryId) => (await agent.post('/api/posts').set('Authorization', authorization).send({
      title: 'Bài kiểm tra lọc tác giả', content: 'Nội dung bài kiểm tra trong cộng đồng.', categoryId,
    }).expect(201)).body.data;
    const first = await create(categories[0].id);
    await create(categories[0].id);
    await create(categories[1].id);
    const removed = await create(categories[0].id);
    await agent.delete(`/api/posts/${removed.id}`).set('Authorization', authorization).expect(200);
    const query = { authorId: first.authorId, categoryId: categories[0].id, limit: 1 };
    const page1 = (await request(app).get('/api/posts').query(query).expect(200)).body;
    const page2 = (await request(app).get('/api/posts').query({ ...query, page: 2 }).expect(200)).body;
    expect(page1.meta).toMatchObject({ total: 2, totalPages: 2 });
    expect(page1.data).toHaveLength(1);
    expect(page2.data).toHaveLength(1);
    expect(page1.data[0].id).not.toBe(page2.data[0].id);
    for (const post of [...page1.data, ...page2.data]) expect(post).toMatchObject({ authorId: first.authorId, categoryId: categories[0].id });
    await request(app).get('/api/posts').query({ ...query, authorId: '00000000-0000-4000-8000-000000000000' }).expect(200)
      .expect(({ body }) => expect(body.meta.total).toBe(0));
    await request(app).get('/api/posts').query({ ...query, authorId: 'invalid' }).expect(422);
  });

  test('bảo vệ endpoint và validate nội dung', async () => {
    await request(app).get('/api/posts').expect(200);
    await request(app).get('/api/posts/categories').expect(200);
    await request(app).get('/api/posts').set('Authorization', 'Bearer token-khong-hop-le').expect(200);
    await request(app).post('/api/posts').send({
      title: 'Guest không được đăng bài',
      content: 'Nội dung này hợp lệ nhưng chưa đăng nhập.',
      categoryId: '00000000-0000-4000-8000-000000000000',
    }).expect(401);
    await agent.post('/api/posts').set('Authorization', authorization).send({ title: 'Bài viết không có chủ đề', content: 'Nội dung này đủ dài nhưng chưa chọn chủ đề.' }).expect(422);
    await agent.post('/api/posts').set('Authorization', authorization).send({ title: 'x', content: 'ngắn' }).expect(422);
    await agent.post('/api/posts/00000000-0000-4000-8000-000000000000/comments').set('Authorization', authorization).send({ content: 'Nội dung bình luận' }).expect(404);
    await agent.get('/api/posts?page=0').set('Authorization', authorization).expect(422);
  });

  test('guest đọc được bài viết và bình luận nhưng không được tương tác', async () => {
    const categories = await request(app).get('/api/posts/categories').expect(200);
    const created = await agent.post('/api/posts').set('Authorization', authorization).send({
      title: 'Bài viết công khai cho khách',
      content: 'Khách chưa đăng nhập vẫn có thể đọc đầy đủ nội dung này.',
      categoryId: categories.body.data[0].id,
    }).expect(201);
    const postId = created.body.data.id;
    const comment = await agent.post(`/api/posts/${postId}/comments`).set('Authorization', authorization)
      .send({ content: 'Bình luận công khai để khách đọc.' }).expect(201);
    await agent.put(`/api/posts/${postId}/votes`).set('Authorization', authorization).send({ value: 1 }).expect(200);

    await request(app).get(`/api/posts/${postId}`).expect(200)
      .expect(({ body }) => expect(body.data.viewerVote).toBe(0));
    await agent.get(`/api/posts/${postId}`).set('Authorization', authorization).expect(200)
      .expect(({ body }) => expect(body.data.viewerVote).toBe(1));
    await request(app).get(`/api/posts/${postId}/comments`).expect(200)
      .expect(({ body }) => expect(body.data).toHaveLength(1));
    await request(app).put(`/api/posts/${postId}/votes`).send({ value: 1 }).expect(401);
    await request(app).post(`/api/posts/${postId}/comments`)
      .send({ content: 'Guest không được bình luận.' }).expect(401);
    await request(app).post(`/api/posts/${postId}/comments`)
      .send({ content: 'Guest không được trả lời.', parentId: comment.body.data.id }).expect(401);
  });

  test('lưu ảnh cộng đồng, giữ ảnh khi sửa tên và từ chối dữ liệu ảnh không an toàn', async () => {
    const avatarUrl = 'data:image/jpeg;base64,/9j/2Q==';
    const created = await agent.post('/api/posts/categories').set('Authorization', authorization)
      .send({ name: 'Cộng đồng ảnh', avatarUrl }).expect(201);
    const id = created.body.data.id;
    for (const name of ['thinkpad', 'framework', 'linux']) {
      await agent.put(`/api/posts/categories/${id}`).set('Authorization', authorization)
        .send({ name: 'Cộng đồng ảnh', avatarUrl: `/community-icons/${name}.svg` }).expect(200);
    }
    await agent.put(`/api/posts/categories/${id}`).set('Authorization', authorization)
      .send({ name: 'Cộng đồng ảnh', avatarUrl }).expect(200);
    expect(created.body.data.avatarUrl).toBe(avatarUrl);
    await agent.get('/api/posts/categories').query({ id }).set('Authorization', authorization).expect(200)
      .expect(({ body }) => expect(body.data[0].avatarUrl).toBe(avatarUrl));
    await agent.put(`/api/posts/categories/${id}`).set('Authorization', authorization)
      .send({ name: 'Cộng đồng đổi tên' }).expect(200)
      .expect(({ body }) => expect(body.data.avatarUrl).toBe(avatarUrl));
    await agent.put(`/api/posts/categories/${id}`).set('Authorization', authorization)
      .send({ name: 'Cộng đồng đổi tên', avatarUrl: null }).expect(200)
      .expect(({ body }) => expect(body.data.avatarUrl).toBeNull());
    for (const invalid of ['/community-icons/../evil.svg', 'https://example.com/avatar.svg', 'javascript:alert(1)', 'data:image/svg+xml;base64,PHN2Zz4=', 'data:image/jpeg;base64,aGVsbG8=', 'x'.repeat(90001)]) {
      await agent.post('/api/posts/categories').set('Authorization', authorization)
        .send({ name: 'Ảnh không hợp lệ', avatarUrl: invalid }).expect(422);
    }
  });

  test('tìm chủ đề theo tên và lấy chủ đề theo id', async () => {
    const search = await agent.get('/api/posts/categories').query({ search: 'hỏi', limit: 1 }).set('Authorization', authorization).expect(200);
    expect(search.body.data).toHaveLength(1);
    expect(search.body.data[0].name).toBe('Hỏi đáp');

    await agent.get('/api/posts/categories').query({ id: search.body.data[0].id }).set('Authorization', authorization).expect(200)
      .expect(({ body }) => expect(body.data[0].id).toBe(search.body.data[0].id));
    await agent.get('/api/posts/categories').query({ limit: 0 }).set('Authorization', authorization).expect(422);
  });

  test('tham gia, yêu thích và rời cộng đồng', async () => {
    const categories = await agent.get('/api/posts/categories').set('Authorization', authorization).expect(200);
    const categoryId = categories.body.data[0].id;

    await agent.post(`/api/posts/categories/${categoryId}/join`).set('Authorization', authorization).expect(200)
      .expect(({ body }) => expect(body.data).toMatchObject({ joinedByCurrentUser: true, favoriteByCurrentUser: false }));
    await agent.post(`/api/posts/categories/${categoryId}/favorite`).set('Authorization', authorization).expect(200)
      .expect(({ body }) => expect(body.data.favoriteByCurrentUser).toBe(true));
    await agent.get('/api/posts/categories').query({ favorites: 'true' }).set('Authorization', authorization).expect(200)
      .expect(({ body }) => expect(body.data.map((item) => item.id)).toEqual([categoryId]));
    await agent.delete(`/api/posts/categories/${categoryId}/favorite`).set('Authorization', authorization).expect(200)
      .expect(({ body }) => expect(body.data).toMatchObject({ joinedByCurrentUser: true, favoriteByCurrentUser: false }));
    await agent.delete(`/api/posts/categories/${categoryId}/join`).set('Authorization', authorization).expect(200)
      .expect(({ body }) => expect(body.data.joinedByCurrentUser).toBe(false));
    await agent.get('/api/posts/categories').query({ joined: 'true' }).set('Authorization', authorization).expect(200)
      .expect(({ body }) => expect(body.data).toHaveLength(0));
  });

  test('thành viên tạo cộng đồng và xem bài viết phổ biến', async () => {
    const community = await agent.post('/api/posts/categories').set('Authorization', authorization)
      .send({ name: 'Công nghệ Việt', description: 'Nơi chia sẻ sản phẩm và kiến thức công nghệ.' }).expect(201);
    expect(community.body.data).toMatchObject({ ownerId: expect.any(String), joinedByCurrentUser: true, favoriteByCurrentUser: false });
    await agent.get('/api/posts/categories').query({ mine: 'true' }).set('Authorization', authorization).expect(200)
      .expect(({ body }) => expect(body.data.map((item) => item.id)).toEqual([community.body.data.id]));
    await agent.put(`/api/posts/categories/${community.body.data.id}`).set('Authorization', authorization)
      .send({ name: 'Công nghệ Việt Nam', description: 'Nơi chia sẻ sản phẩm và kiến thức công nghệ.' }).expect(200);

    const otherAgent = request.agent(app);
    await otherAgent.post('/api/auth/register').send({ username: 'nguoidungkhac', email: 'other@example.com', password: 'Matkhau123' });
    const otherLogin = await otherAgent.post('/api/auth/login').send({ email: 'other@example.com', password: 'Matkhau123' });
    const otherAuthorization = `Bearer ${otherLogin.body.data.accessToken}`;
    await otherAgent.delete(`/api/posts/categories/${community.body.data.id}`).set('Authorization', otherAuthorization).expect(403);

    const first = await agent.post('/api/posts').set('Authorization', authorization)
      .send({ title: 'Bài viết thứ nhất', content: 'Nội dung bài viết thứ nhất trong cộng đồng.', categoryId: community.body.data.id }).expect(201);
    await agent.post('/api/posts').set('Authorization', authorization)
      .send({ title: 'Bài viết thứ hai', content: 'Nội dung bài viết thứ hai trong cộng đồng.', categoryId: community.body.data.id }).expect(201);
    await agent.put(`/api/posts/${first.body.data.id}/votes`).set('Authorization', authorization).send({ value: 1 }).expect(200);

    await agent.get('/api/posts').query({ feed: 'popular', sort: 'hot' }).set('Authorization', authorization).expect(200)
      .expect(({ body }) => expect(body.data[0].id).toBe(first.body.data.id));
    await agent.get('/api/posts').query({ sort: 'unknown' }).set('Authorization', authorization).expect(422);
    await agent.delete(`/api/posts/categories/${community.body.data.id}`).set('Authorization', authorization).expect(200);
    await agent.get(`/api/posts/${first.body.data.id}`).set('Authorization', authorization).expect(200);
    await agent.get('/api/posts/categories').query({ mine: 'true' }).set('Authorization', authorization).expect(200)
      .expect(({ body }) => expect(body.data).toHaveLength(0));
  });
});
