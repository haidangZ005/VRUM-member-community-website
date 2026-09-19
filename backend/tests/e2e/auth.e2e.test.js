process.env.NODE_ENV = 'test';

const request = require('supertest');
const createApp = require('../../src/main/app');
const UnauthorizedError = require('../../src/domain/errors/UnauthorizedError');
const { makeFakeDependencies } = require('../helpers/fakes');

describe('Auth & profile API', () => {
  let app;
  let agent;

  beforeEach(() => {
    const dependencies = makeFakeDependencies();
    app = createApp({ dependencies });
    agent = request.agent(app);
  });

  test('đăng ký → đăng nhập → xem/cập nhật hồ sơ → refresh → logout', async () => {
    await agent.post('/api/auth/register').send({ username: 'haidang', email: 'dang@example.com', password: 'Matkhau123', fullName: 'Hải Đăng' }).expect(201);

    const login = await agent.post('/api/auth/login').send({ email: 'dang@example.com', password: 'Matkhau123' }).expect(200);
    expect(login.body.data.accessToken).toBeTruthy();
    expect(login.headers['set-cookie'][0]).toContain('HttpOnly');
    const authorization = `Bearer ${login.body.data.accessToken}`;

    await agent.get('/api/users/me').set('Authorization', authorization).expect(200).expect(({ body }) => {
      expect(body.data.email).toBe('dang@example.com');
      expect(body.data.passwordHash).toBeUndefined();
    });

    await agent.put('/api/users/me').set('Authorization', authorization).send({ fullName: 'Vũ Hải Đăng', username: 'vuhaidang', avatarUrl: '' }).expect(200).expect(({ body }) => {
      expect(body.data.username).toBe('vuhaidang');
    });

    const refreshed = await agent.post('/api/auth/refresh').expect(200);
    expect(refreshed.body.data.accessToken).toBeTruthy();
    await agent.post('/api/auth/logout').expect(200);
    await agent.post('/api/auth/refresh').expect(401);
  });

  test('validate input và bảo vệ profile', async () => {
    await request(app).post('/api/auth/register').send({ username: 'x', email: 'sai', password: '123' }).expect(422);
    await request(app).get('/api/users/me').expect(401);
  });

  test.each([
    [new UnauthorizedError('Thông tin xác thực không hợp lệ'), 401, 'UNAUTHORIZED', 'Thông tin xác thực không hợp lệ'],
    [new Error('Private internal details'), 500, 'INTERNAL_ERROR', 'Đã có lỗi xảy ra'],
  ])('chuyển lỗi Promise tới errorHandler: %s', async (error, status, code, message) => {
    const failingApp = createApp({
      dependencies: makeFakeDependencies(),
      useCases: { loginUser: { execute: jest.fn().mockRejectedValue(error) } },
    });
    await request(failingApp).post('/api/auth/login')
      .send({ email: 'dang@example.com', password: 'Matkhau123' }).expect(status)
      .expect(({ body }) => expect(body).toEqual({ error: { code, message } }));
  });

  test('quên và đặt lại mật khẩu không làm lộ email', async () => {
    await request(app).post('/api/auth/forgot-password').send({ email: 'unknown@example.com' }).expect(200).expect(({ body }) => {
      expect(body.data.message).toContain('Nếu email tồn tại');
    });
  });
});
