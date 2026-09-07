const ForbiddenError = require('../../../domain/errors/ForbiddenError');
const NotFoundError = require('../../../domain/errors/NotFoundError');
const Post = require('../../../domain/entities/Post');

class EditPost {
  constructor({ postRepository, categoryRepository }) {
    this.postRepository = postRepository;
    this.categoryRepository = categoryRepository;
  }

  async execute(id, userId, changes) {
    const post = await this.postRepository.findById(id, userId);
    if (!post || post.status !== 'published') throw new NotFoundError('Không tìm thấy bài viết');
    if (post.authorId !== userId) throw new ForbiddenError('Bạn chỉ có thể sửa bài viết của mình');
    if (changes.categoryId && !(await this.categoryRepository.findById(changes.categoryId))) {
      throw new NotFoundError('Không tìm thấy chuyên mục');
    }
    const validated = new Post({ ...post, ...changes });
    const updated = await this.postRepository.update(id, { ...changes, images: validated.images }, userId);
    return updated.toJSON();
  }
}

module.exports = EditPost;
