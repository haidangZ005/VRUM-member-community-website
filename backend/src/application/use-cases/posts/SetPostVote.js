const NotFoundError = require('../../../domain/errors/NotFoundError');

class SetPostVote {
  constructor({ postRepository, voteRepository }) {
    this.postRepository = postRepository;
    this.voteRepository = voteRepository;
  }

  async execute(postId, userId, value) {
    const post = await this.postRepository.findById(postId, userId);
    if (!post || post.status !== 'published') throw new NotFoundError('Không tìm thấy bài viết');
    return this.voteRepository.setPostVote(postId, userId, value);
  }
}

module.exports = SetPostVote;
