const makeUseCases = require('../../../../src/main/factories/makeUseCases');
const { makeFakeDependencies } = require('../../../helpers/fakes');

async function createUser(dependencies, input) {
  return dependencies.userRepository.create({ passwordHash: 'hashed:Matkhau123', ...input });
}

describe('Sprint 3 admin use cases', () => {
  let dependencies;
  let useCases;
  let member;

  beforeEach(async () => {
    dependencies = makeFakeDependencies();
    useCases = makeUseCases(dependencies);
    await createUser(dependencies, { username: 'quantri', email: 'admin@example.com', fullName: 'Quản trị', role: 'admin' });
    member = await createUser(dependencies, { username: 'thanhvien', email: 'member@example.com', fullName: 'Thành viên' });
  });

  test('liệt kê, tìm kiếm, khóa và mở khóa thành viên', async () => {
    const list = await useCases.listMembers.execute({ search: 'member@', page: 1, limit: 10 });
    expect(list.data).toHaveLength(1);
    expect(list.data[0].role).toBe('member');
    const locked = await useCases.lockMemberAccount.execute(member.id);
    expect(locked.status).toBe('locked');
    const unlocked = await useCases.unlockMemberAccount.execute(member.id);
    expect(unlocked.status).toBe('active');
  });

  test('không cho khóa tài khoản quản trị', async () => {
    const admin = await dependencies.userRepository.findByEmail('admin@example.com');
    await expect(useCases.lockMemberAccount.execute(admin.id)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  test('quản lý chuyên mục và chặn tên trùng', async () => {
    const created = await useCases.createCategory.execute({ name: 'Sự kiện', description: 'Hoạt động cộng đồng' });
    expect(created.name).toBe('Sự kiện');
    await expect(useCases.createCategory.execute({ name: 'sự kiện' })).rejects.toMatchObject({ code: 'CONFLICT' });
    const updated = await useCases.updateCategory.execute(created.id, { name: 'Sự kiện mới', description: null });
    expect(updated.name).toBe('Sự kiện mới');
    await expect(useCases.deleteCategory.execute(created.id)).resolves.toEqual({ message: 'Đã xóa chuyên mục' });
  });

  test('kiểm duyệt bài viết, bình luận và tổng hợp dashboard', async () => {
    const [category] = await dependencies.categoryRepository.list();
    const post = await useCases.createPost.execute(member.id, { title: 'Bài viết cần kiểm tra', content: 'Nội dung đủ dài để thực hiện kiểm thử quản trị.', categoryId: category.id });
    const comment = await useCases.createComment.execute(post.id, member.id, { content: 'Bình luận cần kiểm tra.' });
    expect((await useCases.adminListPosts.execute()).data).toHaveLength(1);
    expect((await useCases.adminListComments.execute()).data).toHaveLength(1);

    const admin = await dependencies.userRepository.findByEmail('admin@example.com');
    await useCases.adminDeletePost.execute(post.id, admin.id, 'Nội dung vi phạm quy định');
    await useCases.moderateComment.execute(comment.id, admin.id, 'Bình luận vi phạm quy định');
    const stats = await useCases.getDashboardStats.execute();
    expect(stats).toMatchObject({
      members: { total: 1, active: 1, locked: 0 },
      posts: { total: 1, published: 0, removed: 1 },
      comments: { total: 1, visible: 0, removed: 1 },
      categories: 2,
    });
  });
});
