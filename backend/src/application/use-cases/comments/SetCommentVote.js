const NotFoundError = require('../../../domain/errors/NotFoundError');

class SetCommentVote {
  constructor({ postRepository, commentRepository, voteRepository }) {
    this.postRepository = postRepository;
    this.commentRepository = commentRepository;
    this.voteRepository = voteRepository;
  }

  async execute(postId, commentId, userId, value) {
    const [post, comment] = await Promise.all([
      this.postRepository.findById(postId, userId),
      this.commentRepository.findById(commentId, userId),
    ]);
    if (!post || post.status !== 'published' || !comment || comment.postId !== postId || comment.status !== 'visible') {
      throw new NotFoundError('Không tìm thấy bình luận');
    }
    return this.voteRepository.setCommentVote(commentId, userId, value);
  }
}

module.exports = SetCommentVote;
