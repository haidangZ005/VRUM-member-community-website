const Comment = require('../../../../src/domain/entities/Comment');
const CreateComment = require('../../../../src/application/use-cases/comments/CreateComment');
const EditComment = require('../../../../src/application/use-cases/comments/EditComment');

describe('Comment ownership and replies', () => {
  const original = new Comment({ id: 'comment', postId: 'post', authorId: 'owner', content: 'Original comment' });
  let dependencies;
  beforeEach(() => {
    dependencies = {
      postRepository: { findById: jest.fn().mockResolvedValue({ status: 'published' }) },
      commentRepository: {
        findById: jest.fn().mockResolvedValue(original),
        update: jest.fn(async (_id, changes) => new Comment({ ...original, ...changes })),
        moderate: jest.fn(),
        create: jest.fn(async (comment) => comment),
      },
    };
  });

  test('author can edit and remove', async () => {
    const useCase = new EditComment(dependencies);
    expect((await useCase.execute('post', 'comment', 'owner', { content: 'Edited comment' })).content).toBe('Edited comment');
    await useCase.execute('post', 'comment', 'owner', null);
    expect(dependencies.commentRepository.moderate).toHaveBeenCalledWith('comment', 'removed');
  });
  test.each([{ content: 'Changed content' }, null])('other users cannot modify comments', async (changes) => {
    await expect(new EditComment(dependencies).execute('post', 'comment', 'other', changes)).rejects.toThrow('của mình');
    expect(dependencies.commentRepository.update).not.toHaveBeenCalled();
    expect(dependencies.commentRepository.moderate).not.toHaveBeenCalled();
  });
  test('rejects cross-post editing and replies', async () => {
    await expect(new EditComment(dependencies).execute('another-post', 'comment', 'owner', null)).rejects.toThrow('Không tìm thấy');
    await expect(new CreateComment(dependencies).execute('another-post', 'owner', { content: 'Reply text', parentId: 'comment' })).rejects.toThrow('Không tìm thấy');
  });
  test.each(['owner', 'other'])('allows replying to self or another author', async (userId) => {
    expect((await new CreateComment(dependencies).execute('post', userId, { content: 'Reply text', parentId: 'comment' })).parentId).toBe('comment');
  });
  test('removed posts cannot be edited', async () => {
    dependencies.postRepository.findById.mockResolvedValue({ status: 'removed' });
    await expect(new EditComment(dependencies).execute('post', 'comment', 'owner', null)).rejects.toThrow('Không tìm thấy');
  });
});
