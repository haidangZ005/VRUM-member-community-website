function makeNotificationController(useCases) {
  return {
    async list(req, res) { return res.json(await useCases.listNotifications.execute(req.user.id, req.validatedQuery)); },
    async unreadCount(req, res) { return res.json({ data: await useCases.notificationState.unreadCount(req.user.id) }); },
    async markRead(req, res) { return res.json({ data: await useCases.notificationState.markRead(req.validatedParams.id, req.user.id) }); },
    async markAllRead(req, res) { return res.json({ data: await useCases.notificationState.markAllRead(req.user.id) }); },
    async getPreferences(req, res) { return res.json({ data: await useCases.notificationPreferences.get(req.user.id) }); },
    async updatePreferences(req, res) { return res.json({ data: await useCases.notificationPreferences.update(req.user.id, req.validatedBody.preferences) }); },
  };
}

module.exports = makeNotificationController;
