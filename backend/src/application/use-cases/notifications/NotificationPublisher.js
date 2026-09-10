const MILESTONES = [5, 10, 25, 50, 100];

function mentions(content) {
  return new Set([...content.matchAll(/@([a-zA-Z0-9_]{3,50})\b/g)].map((match) => match[1].toLowerCase()));
}

class NotificationPublisher {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async postCreated({ post, notificationRepository }) {
    await this.publishPostMentions({ post, previousContent: '', notificationRepository });
  }

  async postEdited({ post, previousContent, notificationRepository }) {
    await this.publishPostMentions({ post, previousContent, notificationRepository });
  }

  async publishPostMentions({ post, previousContent, notificationRepository }) {
    const oldMentions = mentions(previousContent);
    const actor = await this.userRepository.findById(post.authorId);
    const usernames = [...mentions(`${post.title} ${post.content}`)].filter((username) => !oldMentions.has(username));
    await Promise.all(usernames.map(async (username) => {
      const recipient = await this.userRepository.findByUsername(username);
      if (!recipient) return;
      await notificationRepository.create({
        recipientId: recipient.id,
        actorId: post.authorId,
        type: 'MENTION',
        entityType: 'post',
        entityId: post.id,
        categoryId: post.categoryId,
        dedupeKey: `MENTION:post:${post.id}:${recipient.id}`,
        payload: { actorUsername: actor?.username, postTitle: post.title, excerpt: post.content.slice(0, 180), postId: post.id },
      });
    }));
  }

  async commentCreated({ post, comment, parent = null, notificationRepository }) {
    const actor = await this.userRepository.findById(comment.authorId);
    const primaryRecipientId = parent ? parent.authorId : post.authorId;
    const type = parent ? 'COMMENT_REPLY' : 'POST_COMMENT';
    await notificationRepository.create({
      recipientId: primaryRecipientId,
      actorId: comment.authorId,
      type,
      entityType: 'comment',
      entityId: comment.id,
      categoryId: post.categoryId,
      dedupeKey: `${type}:${comment.id}:${primaryRecipientId}`,
      payload: { actorUsername: actor?.username, postTitle: post.title, excerpt: comment.content.slice(0, 180), postId: post.id, commentId: comment.id },
    });
    await this.publishMentions({ post, comment, actor, excludedRecipientIds: new Set([primaryRecipientId]), notificationRepository });
  }

  async commentEdited({ post, comment, previousContent, notificationRepository }) {
    const previousMentions = mentions(previousContent);
    const actor = await this.userRepository.findById(comment.authorId);
    await this.publishMentions({ post, comment, actor, excludedUsernames: previousMentions, notificationRepository });
  }

  async publishMentions({ post, comment, actor, notificationRepository, excludedRecipientIds = new Set(), excludedUsernames = new Set() }) {
    const usernames = [...mentions(comment.content)].filter((username) => !excludedUsernames.has(username));
    await Promise.all(usernames.map(async (username) => {
      const recipient = await this.userRepository.findByUsername(username);
      if (!recipient || excludedRecipientIds.has(recipient.id)) return;
      await notificationRepository.create({
        recipientId: recipient.id,
        actorId: comment.authorId,
        type: 'MENTION',
        entityType: 'comment',
        entityId: comment.id,
        categoryId: post.categoryId,
        dedupeKey: `MENTION:${comment.id}:${recipient.id}`,
        payload: { actorUsername: actor?.username, postTitle: post.title, excerpt: comment.content.slice(0, 180), postId: post.id, commentId: comment.id },
      });
    }));
  }

  async postVoteMilestone({ post, actorId, previousScore, score, notificationRepository }) {
    const crossed = MILESTONES.filter((milestone) => previousScore < milestone && score >= milestone);
    await Promise.all(crossed.map((milestone) => notificationRepository.create({
      recipientId: post.authorId,
      actorId,
      type: 'POST_VOTE_MILESTONE',
      entityType: 'post',
      entityId: post.id,
      categoryId: post.categoryId,
      dedupeKey: `POST_VOTE_MILESTONE:${post.id}:${milestone}`,
      payload: { postTitle: post.title, score: milestone, postId: post.id },
    })));
  }

  async contentModerated({ entityType, entity, actorId, reason, notificationRepository }) {
    const postId = entityType === 'post' ? entity.id : entity.postId;
    await notificationRepository.create({
      recipientId: entity.authorId,
      actorId,
      type: 'CONTENT_MODERATED',
      entityType,
      entityId: entity.id,
      dedupeKey: `CONTENT_MODERATED:${entityType}:${entity.id}`,
      payload: { reason, title: entity.title || entity.post?.title || 'Nội dung của bạn', postId },
    });
  }
}

module.exports = NotificationPublisher;
