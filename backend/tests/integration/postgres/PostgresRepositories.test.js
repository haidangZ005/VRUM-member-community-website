process.env.NODE_ENV = 'test';

const fs = require('fs');
const path = require('path');

const shouldRun = Boolean(process.env.TEST_DATABASE_URL);
if (shouldRun) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const pool = require('../../../src/infrastructure/database/postgres/connection');
const User = require('../../../src/domain/entities/User');
const Post = require('../../../src/domain/entities/Post');
const Comment = require('../../../src/domain/entities/Comment');
const Category = require('../../../src/domain/entities/Category');
const PostgresUserRepository = require('../../../src/infrastructure/database/postgres/repositories/PostgresUserRepository');
const PostgresPostRepository = require('../../../src/infrastructure/database/postgres/repositories/PostgresPostRepository');
const PostgresCommentRepository = require('../../../src/infrastructure/database/postgres/repositories/PostgresCommentRepository');
const PostgresCategoryRepository = require('../../../src/infrastructure/database/postgres/repositories/PostgresCategoryRepository');
const PostgresVoteRepository = require('../../../src/infrastructure/database/postgres/repositories/PostgresVoteRepository');

const describeIntegration = shouldRun ? describe : describe.skip;

async function applyMigrations() {
  const directory = path.resolve(__dirname, '../../../src/infrastructure/database/postgres/migrations');
  const files = fs.readdirSync(directory).filter((file) => file.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(directory, file), 'utf8');
    const upMigration = sql.split('-- Down Migration')[0].replace('-- Up Migration', '');
    await pool.query(upMigration);
  }
}

describeIntegration('PostgreSQL repositories', () => {
  const users = new PostgresUserRepository();
  const posts = new PostgresPostRepository();
  const comments = new PostgresCommentRepository();
  const categories = new PostgresCategoryRepository();
  const votes = new PostgresVoteRepository();

  beforeAll(async () => { await applyMigrations(); });
  beforeEach(async () => {
    await pool.query('TRUNCATE community_memberships, post_votes, comment_votes, comments, posts, categories, password_reset_tokens, refresh_tokens, users CASCADE');
  });
  afterAll(async () => { await pool.end(); });

  test('lưu, tìm kiếm và cập nhật trạng thái thành viên', async () => {
    const member = await users.create(new User({
      username: 'integration_member', email: 'integration@example.com', passwordHash: 'hashed-password', fullName: 'Thành viên tích hợp',
    }));
    expect((await users.findByEmail('integration@example.com')).id).toBe(member.id);
    expect((await users.listMembers({ page: 1, limit: 10, search: 'tích hợp' })).total).toBe(1);
    expect((await users.updateStatus(member.id, 'locked')).status).toBe('locked');
    expect(await users.countByStatus()).toMatchObject({ total: 1, active: 0, locked: 1 });
  });

  test('lưu và truy vấn đầy đủ chuyên mục, bài viết, bình luận và vote', async () => {
    const author = await users.create(new User({
      username: 'repository_author', email: 'author@example.com', passwordHash: 'hashed-password', fullName: 'Tác giả',
    }));
    const category = await categories.create(new Category({ name: 'Kiểm thử', description: 'Dữ liệu tích hợp', ownerId: author.id }));
    expect((await categories.list({ ownerId: author.id }))[0].id).toBe(category.id);
    expect((await categories.list({ viewerId: author.id, joinedOnly: true }))[0]).toMatchObject({ id: category.id, joinedByCurrentUser: true });
    await categories.setFavorite(category.id, author.id, true);
    expect((await categories.list({ viewerId: author.id, favoritesOnly: true }))[0].favoriteByCurrentUser).toBe(true);
    const post = await posts.create(new Post({
      authorId: author.id, categoryId: category.id, title: 'Bài viết kiểm thử repository', content: 'Nội dung được lưu trực tiếp vào PostgreSQL thật.',
    }));
    const comment = await comments.create(new Comment({ postId: post.id, authorId: author.id, content: 'Bình luận tích hợp.' }));
    await votes.setPostVote(post.id, author.id, 1);
    await votes.setCommentVote(comment.id, author.id, -1);

    const detail = await posts.findById(post.id, author.id);
    expect(detail).toMatchObject({ score: 1, commentCount: 1, viewerVote: 1 });
    expect((await comments.listByPost(post.id, author.id))[0]).toMatchObject({ score: -1, viewerVote: -1 });
    expect((await posts.list({ page: 1, limit: 10, categoryId: category.id, viewerId: author.id })).total).toBe(1);
    expect((await posts.listAll({ page: 1, limit: 10, search: 'repository', status: 'published' })).total).toBe(1);
    expect((await comments.listAll({ page: 1, limit: 10, search: 'tích hợp', status: 'visible' })).items[0].post.title).toBe(post.title);

    await comments.moderate(comment.id, 'removed');
    await posts.remove(post.id);
    expect(await posts.countByStatus()).toMatchObject({ total: 1, published: 0, removed: 1 });
    expect(await comments.countByStatus()).toMatchObject({ total: 1, visible: 0, removed: 1 });
    await categories.update(category.id, new Category({ ...category.toJSON(), name: 'Kiểm thử cập nhật' }));
    expect((await categories.findByName('kiểm thử cập nhật')).id).toBe(category.id);
    expect(await votes.setPostVote(post.id, author.id, 0)).toEqual({ score: 0, viewerVote: 0 });
  });
});
