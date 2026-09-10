const NotFoundError = require('../../../domain/errors/NotFoundError');
const ForbiddenError = require('../../../domain/errors/ForbiddenError');
const Comment = require('../../../domain/entities/Comment');

class EditComment {
  constructor({ notificationPublisher, unitOfWork }) {
    this.notificationPublisher = notificationPublisher;
    this.unitOfWork = unitOfWork;
  }

  async execute(postId, id, userId, changes) {
    return this.unitOfWork.run(async ({ postRepository, commentRepository, notificationRepository }) => {
      const post = await postRepository.findById(postId, userId);
      const comment = await commentRepository.findById(id);
      if (!post || post.status !== 'published' || !comment || comment.postId !== postId || comment.status !== 'visible') {
        throw new NotFoundError('Không tìm thấy bình luận');
      }
      if (comment.authorId !== userId) throw new ForbiddenError('Bạn chỉ có thể sửa hoặc xóa bình luận của mình');
      if (changes === null) {
        await commentRepository.moderate(id, 'removed');
        return { id };
      }
      const validated = new Comment({ ...comment, ...changes });
      const updated = await commentRepository.update(id, { content: validated.content, images: validated.images });
      await this.notificationPublisher.commentEdited({ post, comment: updated, previousContent: comment.content, notificationRepository });
      return updated.toJSON();
    });
  }
}

module.exports = EditComment;
