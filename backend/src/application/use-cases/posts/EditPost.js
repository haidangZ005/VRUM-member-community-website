const ForbiddenError = require('../../../domain/errors/ForbiddenError');
const NotFoundError = require('../../../domain/errors/NotFoundError');
const Post = require('../../../domain/entities/Post');

class EditPost {
  constructor({ categoryRepository, notificationPublisher, unitOfWork }) {
    this.categoryRepository = categoryRepository;
    this.notificationPublisher = notificationPublisher;
    this.unitOfWork = unitOfWork;
  }

  async execute(id, userId, changes) {
    if (changes.categoryId && !(await this.categoryRepository.findById(changes.categoryId))) {
      throw new NotFoundError('Không tìm thấy chuyên mục');
    }
    return this.unitOfWork.run(async ({ postRepository, notificationRepository }) => {
      const post = await postRepository.findById(id, userId);
      if (!post || post.status !== 'published') throw new NotFoundError('Không tìm thấy bài viết');
      if (post.authorId !== userId) throw new ForbiddenError('Bạn chỉ có thể sửa bài viết của mình');
      const validated = new Post({ ...post, ...changes });
      const updated = await postRepository.update(id, { ...changes, images: validated.images }, userId);
      await this.notificationPublisher.postEdited({ post: updated, previousContent: `${post.title} ${post.content}`, notificationRepository });
      return updated.toJSON();
    });
  }
}

module.exports = EditPost;
