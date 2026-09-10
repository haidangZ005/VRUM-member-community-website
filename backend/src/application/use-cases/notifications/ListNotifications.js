class ListNotifications {
  constructor({ notificationRepository }) { this.notificationRepository = notificationRepository; }

  async execute(userId, { page = 1, limit = 20, unreadOnly = false }) {
    const result = await this.notificationRepository.list(userId, { page, limit, unreadOnly });
    return { data: result.items, meta: { page, limit, total: result.total, totalPages: Math.max(1, Math.ceil(result.total / limit)) } };
  }
}

module.exports = ListNotifications;
