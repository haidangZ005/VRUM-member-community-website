const NotFoundError = require('../../../domain/errors/NotFoundError');

class NotificationState {
  constructor({ notificationRepository }) { this.notificationRepository = notificationRepository; }

  async unreadCount(userId) { return { count: await this.notificationRepository.unreadCount(userId) }; }

  async markRead(id, userId) {
    const notification = await this.notificationRepository.markRead(id, userId);
    if (!notification) throw new NotFoundError('Không tìm thấy thông báo');
    return notification;
  }

  async markAllRead(userId) { return { updated: await this.notificationRepository.markAllRead(userId) }; }
}

module.exports = NotificationState;
