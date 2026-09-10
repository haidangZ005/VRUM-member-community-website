import httpClient from '../../../services/httpClient';

export const notificationApi = {
  list: async (params) => (await httpClient.get('/notifications', { params })).data,
  unreadCount: async () => (await httpClient.get('/notifications/unread-count')).data.data,
  markRead: async (id) => (await httpClient.patch(`/notifications/${id}/read`)).data.data,
  markAllRead: async () => (await httpClient.patch('/notifications/read-all')).data.data,
  preferences: async () => (await httpClient.get('/notification-preferences')).data.data,
  updatePreferences: async (preferences) => (await httpClient.put('/notification-preferences', { preferences })).data.data,
};
