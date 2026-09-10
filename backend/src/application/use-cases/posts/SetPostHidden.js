const NotFoundError = require('../../../domain/errors/NotFoundError');

class SetPostHidden {
  constructor({ postRepository }) { this.postRepository = postRepository; }

  async execute(postId, userId, hidden) {
    const post = await this.postRepository.findById(postId, userId);
    if (!post || post.status !== 'published') throw new NotFoundError('Không tìm thấy bài viết');
    await this.postRepository.setHidden(postId, userId, hidden);
    return { hidden };
  }
}

module.exports = SetPostHidden;
