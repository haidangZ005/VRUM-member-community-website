process.env.NODE_ENV = 'test';

const request = require('supertest');
const createApp = require('../../src/main/app');
const { makeFakeDependencies } = require('../helpers/fakes');

describe('Admin API', () => {
  let app;
  let dependencies;
  let memberAgent;
  let adminAgent;
  let memberAuthorization;
  let adminAuthorization;
  let memberId;
  let postId;
  let commentId;

  beforeEach(async () => {
    dependencies = makeFakeDependencies();
    await dependencies.userRepository.create({
      username: 'admin', email: 'admin@example.com', passwordHash: 'hashed:Admin12345', fullName: 'Quản trị viên', role: 'admin',
    });
    app = createApp({ dependencies });
    memberAgent = request.agent(app);
    adminAgent = request.agent(app);

    const registered = await memberAgent.post('/api/auth/register').send({ username: 'member', email: 'member@example.com', password: 'Member12345', fullName: 'Thành viên' });
    memberId = registered.body.data.id;
    const memberLogin = await memberAgent.post('/api/auth/login').send({ email: 'member@example.com', password: 'Member12345' });
    memberAuthorization = `Bearer ${memberLogin.body.data.accessToken}`;
    const adminLogin = await adminAgent.post('/api/auth/login').send({ email: 'admin@example.com', password: 'Admin12345' });
    adminAuthorization = `Bearer ${adminLogin.body.data.accessToken}`;

    const [category] = await dependencies.categoryRepository.list();
    const post = await memberAgent.post('/api/posts').set('Authorization', memberAuthorization).send({
      title: 'Bài viết dành cho kiểm duyệt', content: 'Nội dung bài viết được tạo để kiểm tra luồng quản trị.', categoryId: category.id,
    });
    postId = post.body.data.id;
    const comment = await memberAgent.post(`/api/posts/${postId}/comments`).set('Authorization', memberAuthorization).send({ content: 'Bình luận cho kiểm duyệt.' });
    commentId = comment.body.data.id;
  });

  test('member bị chặn, admin xem dashboard và quản lý nội dung', async () => {
    await memberAgent.get('/api/admin/dashboard').set('Authorization', memberAuthorization).expect(403);
    await adminAgent.get('/api/admin/dashboard').set('Authorization', adminAuthorization).expect(200).expect(({ body }) => {
      expect(body.data.members.total).toBe(1);
      expect(body.data.posts.published).toBe(1);
    });
    await adminAgent.get('/api/admin/posts').set('Authorization', adminAuthorization).expect(200);
    await adminAgent.get('/api/admin/comments').set('Authorization', adminAuthorization).expect(200);
    await adminAgent.delete(`/api/admin/comments/${commentId}`).set('Authorization', adminAuthorization).send({ reason: 'Vi phạm quy định cộng đồng' }).expect(200);
    await adminAgent.delete(`/api/admin/posts/${postId}`).set('Authorization', adminAuthorization).send({ reason: 'Vi phạm quy định cộng đồng' }).expect(200);
    await memberAgent.get(`/api/posts/${postId}`).set('Authorization', memberAuthorization).expect(404);
  });

  test('admin khóa/mở khóa thành viên và phiên đang dùng bị chặn ngay', async () => {
    await adminAgent.get('/api/admin/members?search=member').set('Authorization', adminAuthorization).expect(200).expect(({ body }) => expect(body.data).toHaveLength(1));
    await adminAgent.patch(`/api/admin/members/${memberId}/lock`).set('Authorization', adminAuthorization).expect(200).expect(({ body }) => expect(body.data.status).toBe('locked'));
    await memberAgent.get('/api/users/me').set('Authorization', memberAuthorization).expect(401);
    await adminAgent.patch(`/api/admin/members/${memberId}/unlock`).set('Authorization', adminAuthorization).expect(200).expect(({ body }) => expect(body.data.status).toBe('active'));
  });

  test('admin tạo, sửa và xóa chuyên mục', async () => {
    const created = await adminAgent.post('/api/admin/categories').set('Authorization', adminAuthorization).send({ name: 'Thông báo', description: 'Tin mới từ ban quản trị' }).expect(201);
    const categoryId = created.body.data.id;
    await adminAgent.put(`/api/admin/categories/${categoryId}`).set('Authorization', adminAuthorization).send({ name: 'Thông báo chung', description: null }).expect(200);
    await adminAgent.get('/api/admin/categories').set('Authorization', adminAuthorization).expect(200).expect(({ body }) => expect(body.data.some((item) => item.id === categoryId)).toBe(true));
    await adminAgent.delete(`/api/admin/categories/${categoryId}`).set('Authorization', adminAuthorization).expect(200);
  });
});
