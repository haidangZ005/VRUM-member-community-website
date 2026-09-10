const NotFoundError = require('../../../domain/errors/NotFoundError');

class ListCommentsByPost {
  constructor({ postRepository, commentRepository }) {
    this.postRepository = postRepository;
    this.commentRepository = commentRepository;
  }

  async execute(postId, viewerId = null) {
    const post = await this.postRepository.findById(postId, viewerId);
    if (!post || post.status !== 'published') throw new NotFoundError('Không tìm thấy bài viết');
    const comments = await this.commentRepository.listByPost(postId, viewerId);
    return comments.map((comment) => comment.toJSON());
  }
}

module.exports = ListCommentsByPost;
