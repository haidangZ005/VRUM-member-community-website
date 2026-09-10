const NotFoundError = require('../../../domain/errors/NotFoundError');

class RecordPostView {
  constructor({ postRepository }) { this.postRepository = postRepository; }

  async execute(postId, userId) {
    const post = await this.postRepository.findById(postId, userId);
    if (!post || post.status !== 'published') throw new NotFoundError('Không tìm thấy bài viết');
    await this.postRepository.recordView(postId, userId);
    return { viewed: true };
  }
}

module.exports = RecordPostView;
