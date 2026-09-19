process.env.NODE_ENV = 'test';

const request = require('supertest');
const createApp = require('../../src/main/app');
const { makeFakeDependencies } = require('../helpers/fakes');

describe('MVP journey', () => {
  test('đăng ký → đăng nhập → đăng bài → bình luận → admin kiểm duyệt', async () => {
    const dependencies = makeFakeDependencies();
    await dependencies.userRepository.create({
      username: 'moderator', email: 'moderator@example.com', passwordHash: 'hashed:Admin12345', fullName: 'Điều phối viên', role: 'admin',
    });
    const app = createApp({ dependencies });
    const member = request.agent(app);
    const admin = request.agent(app);

    await member.post('/api/auth/register').send({
      username: 'new_member', email: 'new.member@example.com', password: 'Member12345', fullName: 'Thành viên mới',
    }).expect(201);
    const memberLogin = await member.post('/api/auth/login').send({ email: 'new.member@example.com', password: 'Member12345' }).expect(200);
    const memberAuth = `Bearer ${memberLogin.body.data.accessToken}`;
    const [category] = await dependencies.categoryRepository.list();

    const createdPost = await member.post('/api/posts').set('Authorization', memberAuth).send({
      title: 'Chia sẻ đầu tiên trong cộng đồng',
      content: 'Mình rất vui khi tham gia và muốn làm quen với mọi người.',
      categoryId: category.id,
    }).expect(201);
    const postId = createdPost.body.data.id;
    const createdComment = await member.post(`/api/posts/${postId}/comments`).set('Authorization', memberAuth).send({
      content: 'Đây là phản hồi đầu tiên của mình.',
    }).expect(201);
    const commentId = createdComment.body.data.id;

    await member.get('/api/admin/dashboard').set('Authorization', memberAuth).expect(403);
    const adminLogin = await admin.post('/api/auth/login').send({ email: 'moderator@example.com', password: 'Admin12345' }).expect(200);
    const adminAuth = `Bearer ${adminLogin.body.data.accessToken}`;
    await admin.get('/api/admin/dashboard').set('Authorization', adminAuth).expect(200).expect(({ body }) => {
      expect(body.data.posts.published).toBe(1);
      expect(body.data.comments.visible).toBe(1);
    });
    await admin.delete(`/api/admin/comments/${commentId}`).set('Authorization', adminAuth).send({ reason: 'Vi phạm quy định cộng đồng' }).expect(200);
    await admin.delete(`/api/admin/posts/${postId}`).set('Authorization', adminAuth).send({ reason: 'Vi phạm quy định cộng đồng' }).expect(200);

    await member.get(`/api/posts/${postId}`).set('Authorization', memberAuth).expect(404);
    await admin.get('/api/admin/comments?status=removed').set('Authorization', adminAuth).expect(200).expect(({ body }) => {
      expect(body.data).toHaveLength(1);
    });
  });
});
