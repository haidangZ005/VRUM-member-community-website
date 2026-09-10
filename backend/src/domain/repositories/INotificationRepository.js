class INotificationRepository {
  async create(_notification) { throw new Error('Not implemented'); }
  async list(_recipientId, _options) { throw new Error('Not implemented'); }
  async unreadCount(_recipientId) { throw new Error('Not implemented'); }
  async markRead(_id, _recipientId) { throw new Error('Not implemented'); }
  async markAllRead(_recipientId) { throw new Error('Not implemented'); }
  async getPreferences(_userId) { throw new Error('Not implemented'); }
  async updatePreferences(_userId, _preferences) { throw new Error('Not implemented'); }
}

module.exports = INotificationRepository;
