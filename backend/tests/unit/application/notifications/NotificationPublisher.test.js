const NotificationPublisher = require('../../../../src/application/use-cases/notifications/NotificationPublisher');

describe('NotificationPublisher', () => {
  test('phát mọi mốc vote vừa vượt và dùng dedupe key theo từng mốc', async () => {
    const notificationRepository = { create: jest.fn() };
    const publisher = new NotificationPublisher({ userRepository: {} });
    const post = { id: 'post-id', authorId: 'owner-id', categoryId: 'category-id', title: 'Bài viết' };

    await publisher.postVoteMilestone({ post, actorId: 'voter-id', previousScore: 4, score: 11, notificationRepository });

    expect(notificationRepository.create).toHaveBeenCalledTimes(2);
    expect(notificationRepository.create.mock.calls.map(([notification]) => notification.payload.score)).toEqual([5, 10]);
    expect(notificationRepository.create.mock.calls.map(([notification]) => notification.dedupeKey)).toEqual([
      'POST_VOTE_MILESTONE:post-id:5',
      'POST_VOTE_MILESTONE:post-id:10',
    ]);
    expect(notificationRepository.create).toHaveBeenCalledWith(expect.any(Object));
  });
});
