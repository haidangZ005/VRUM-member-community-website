const NotFoundError = require('../../../domain/errors/NotFoundError');

class ModerateComment {
  constructor({ notificationPublisher, unitOfWork }) { Object.assign(this, { notificationPublisher, unitOfWork }); }

  async execute(commentId, actorId, reason) {
    return this.unitOfWork.run(async ({ commentRepository, notificationRepository }) => {
      const comment = await commentRepository.findById(commentId);
      if (!comment) throw new NotFoundError('Không tìm thấy bình luận');
      await commentRepository.moderate(commentId, 'removed');
      await this.notificationPublisher.contentModerated({ entityType: 'comment', entity: comment, actorId, reason, notificationRepository });
      return { message: 'Đã gỡ bình luận khỏi cộng đồng' };
    });
  }
}

module.exports = ModerateComment;
