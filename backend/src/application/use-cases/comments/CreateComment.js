const Comment = require('../../../domain/entities/Comment');
const NotFoundError = require('../../../domain/errors/NotFoundError');

class CreateComment {
  constructor({ notificationPublisher, unitOfWork }) {
    this.notificationPublisher = notificationPublisher;
    this.unitOfWork = unitOfWork;
  }

  async execute(postId, authorId, input) {
    return this.unitOfWork.run(async ({ postRepository, commentRepository, notificationRepository }) => {
      const post = await postRepository.findById(postId, authorId);
      if (!post || post.status !== 'published') throw new NotFoundError('Không tìm thấy bài viết');
      let parent = null;
      if (input.parentId) {
        parent = await commentRepository.findById(input.parentId);
        if (!parent || parent.postId !== postId || parent.status !== 'visible') {
          throw new NotFoundError('Không tìm thấy bình luận để trả lời');
        }
      }
      const comment = await commentRepository.create(new Comment({ postId, authorId, content: input.content, images: input.images, parentId: input.parentId }));
      await this.notificationPublisher.commentCreated({ post, comment, parent, notificationRepository });
      return comment.toJSON();
    });
  }
}

module.exports = CreateComment;
