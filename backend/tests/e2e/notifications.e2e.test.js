process.env.NODE_ENV = 'test';

const request = require('supertest');
const createApp = require('../../src/main/app');
const makeUseCases = require('../../src/main/factories/makeUseCases');
const { makeFakeDependencies } = require('../helpers/fakes');

async function register(app, username) {
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send({ username, email: `${username}@example.com`, password: 'Matkhau123', fullName: username }).expect(201);
  const login = await agent.post('/api/auth/login').send({ email: `${username}@example.com`, password: 'Matkhau123' }).expect(200);
  return { agent, user: login.body.data.user, authorization: `Bearer ${login.body.data.accessToken}` };
}

describe('Notifications API', () => {
  test('tạo notification cho comment, reply, mention và hỗ trợ read/preferences', async () => {
    const dependencies = makeFakeDependencies();
    const app = createApp({ dependencies, useCases: makeUseCases(dependencies), tokenService: dependencies.tokenService });
    const owner = await register(app, 'notify_owner');
    const author = await register(app, 'notify_author');
    const mentioned = await register(app, 'notify_mentioned');
    const categories = await request(app).get('/api/posts/categories').expect(200);
    const post = await owner.agent.post('/api/posts').set('Authorization', owner.authorization).send({
      title: 'Bài viết kiểm tra notification', content: 'Nội dung đủ dài để kiểm tra luồng notification.', categoryId: categories.body.data[0].id,
    }).expect(201);

    const comment = await author.agent.post(`/api/posts/${post.body.data.id}/comments`).set('Authorization', author.authorization)
      .send({ content: 'Chào @notify_mentioned, cùng xem nội dung này.' }).expect(201);

    await owner.agent.get('/api/notifications/unread-count').set('Authorization', owner.authorization).expect(200)
      .expect(({ body }) => expect(body.data.count).toBe(1));
    await mentioned.agent.get('/api/notifications').set('Authorization', mentioned.authorization).expect(200)
      .expect(({ body }) => expect(body.data[0].type).toBe('MENTION'));

    await owner.agent.post(`/api/posts/${post.body.data.id}/comments`).set('Authorization', owner.authorization)
      .send({ content: 'Mình trả lời bình luận này.', parentId: comment.body.data.id }).expect(201);
    const authorNotifications = await author.agent.get('/api/notifications?unreadOnly=true').set('Authorization', author.authorization).expect(200);
    expect(authorNotifications.body.data[0].type).toBe('COMMENT_REPLY');

    const ownerNotifications = await owner.agent.get('/api/notifications').set('Authorization', owner.authorization).expect(200);
    const notificationId = ownerNotifications.body.data[0].id;
    await owner.agent.patch(`/api/notifications/${notificationId}/read`).set('Authorization', owner.authorization).expect(200);
    await owner.agent.get('/api/notifications/unread-count').set('Authorization', owner.authorization).expect(200)
      .expect(({ body }) => expect(body.data.count).toBe(0));

    await author.agent.post(`/api/posts/${post.body.data.id}/comments`).set('Authorization', author.authorization)
      .send({ content: 'Một bình luận mới để kiểm tra đọc tất cả.' }).expect(201);
    await owner.agent.patch('/api/notifications/read-all').set('Authorization', owner.authorization).expect(200)
      .expect(({ body }) => expect(body.data.updated).toBe(1));
    await owner.agent.get('/api/notifications/unread-count').set('Authorization', owner.authorization).expect(200)
      .expect(({ body }) => expect(body.data.count).toBe(0));

    await mentioned.agent.put('/api/notification-preferences').set('Authorization', mentioned.authorization)
      .send({ preferences: [{ type: 'MENTION', inAppEnabled: false }] }).expect(200);
    await author.agent.post(`/api/posts/${post.body.data.id}/comments`).set('Authorization', author.authorization)
      .send({ content: 'Nhắc lại @notify_mentioned nhưng đã tắt.' }).expect(201);
    await mentioned.agent.get('/api/notifications/unread-count').set('Authorization', mentioned.authorization).expect(200)
      .expect(({ body }) => expect(body.data.count).toBe(1));
  });
});
