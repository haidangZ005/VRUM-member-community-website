class NotificationPreferences {
  constructor({ notificationRepository }) { this.notificationRepository = notificationRepository; }
  async get(userId) { return this.notificationRepository.getPreferences(userId); }
  async update(userId, preferences) { return this.notificationRepository.updatePreferences(userId, preferences); }
}

module.exports = NotificationPreferences;
