const NotFoundError = require('../../../domain/errors/NotFoundError');
const postSummaryVersion = require('./postSummaryVersion');

class GetPostSummary {
  constructor({ postRepository, postSummaryRepository }) {
    this.postRepository = postRepository;
    this.postSummaryRepository = postSummaryRepository;
  }

  async execute(postId) {
    const post = await this.postRepository.findById(postId);
    if (!post || post.status !== 'published') throw new NotFoundError('Không tìm thấy bài viết');
    return this.postSummaryRepository.findFresh(post.id, postSummaryVersion(post));
  }
}

module.exports = GetPostSummary;
