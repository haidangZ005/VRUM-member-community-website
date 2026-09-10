const NotFoundError = require('../../../domain/errors/NotFoundError');

class AdminDeletePost {
  constructor({ notificationPublisher, unitOfWork }) { Object.assign(this, { notificationPublisher, unitOfWork }); }

  async execute(postId, actorId, reason) {
    return this.unitOfWork.run(async ({ postRepository, notificationRepository }) => {
      const post = await postRepository.findById(postId);
      if (!post) throw new NotFoundError('Không tìm thấy bài viết');
      await postRepository.remove(postId);
      await this.notificationPublisher.contentModerated({ entityType: 'post', entity: post, actorId, reason, notificationRepository });
      return { message: 'Đã gỡ bài viết khỏi cộng đồng' };
    });
  }
}

module.exports = AdminDeletePost;
