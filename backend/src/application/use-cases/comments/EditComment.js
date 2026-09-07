const NotFoundError = require('../../../domain/errors/NotFoundError');
const ForbiddenError = require('../../../domain/errors/ForbiddenError');
const Comment = require('../../../domain/entities/Comment');

class EditComment {
  constructor({ postRepository, commentRepository }) {
    this.postRepository = postRepository;
    this.commentRepository = commentRepository;
  }

  async execute(postId, id, userId, changes) {
    const post = await this.postRepository.findById(postId, userId);
    const comment = await this.commentRepository.findById(id);
    if (!post || post.status !== 'published' || !comment || comment.postId !== postId || comment.status !== 'visible') {
      throw new NotFoundError('Không tìm thấy bình luận');
    }
    if (comment.authorId !== userId) throw new ForbiddenError('Bạn chỉ có thể sửa hoặc xóa bình luận của mình');
    if (changes === null) {
      await this.commentRepository.moderate(id, 'removed');
      return { id };
    }
    const validated = new Comment({ ...comment, ...changes });
    return (await this.commentRepository.update(id, { content: validated.content, images: validated.images })).toJSON();
  }
}

module.exports = EditComment;
