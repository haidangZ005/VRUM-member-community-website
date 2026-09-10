const NotFoundError = require('../../../domain/errors/NotFoundError');

class SetPostVote {
  constructor({ notificationPublisher, unitOfWork }) {
    this.notificationPublisher = notificationPublisher;
    this.unitOfWork = unitOfWork;
  }

  async execute(postId, userId, value) {
    return this.unitOfWork.run(async ({ postRepository, voteRepository, notificationRepository }) => {
      const post = await postRepository.findById(postId, userId);
      if (!post || post.status !== 'published') throw new NotFoundError('Không tìm thấy bài viết');
      const result = await voteRepository.setPostVote(postId, userId, value);
      await this.notificationPublisher.postVoteMilestone({ post, actorId: userId, previousScore: result.previousScore, score: result.score, notificationRepository });
      return { score: result.score, viewerVote: result.viewerVote };
    });
  }
}

module.exports = SetPostVote;
