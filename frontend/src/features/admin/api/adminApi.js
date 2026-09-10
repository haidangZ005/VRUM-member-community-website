import httpClient from '../../../services/httpClient';

export const adminApi = {
  dashboard: async () => (await httpClient.get('/admin/dashboard')).data.data,
  members: async (params) => (await httpClient.get('/admin/members', { params })).data,
  lockMember: async (id) => (await httpClient.patch(`/admin/members/${id}/lock`)).data.data,
  unlockMember: async (id) => (await httpClient.patch(`/admin/members/${id}/unlock`)).data.data,
  posts: async (params) => (await httpClient.get('/admin/posts', { params })).data,
  deletePost: async ({ id, reason }) => (await httpClient.delete(`/admin/posts/${id}`, { data: { reason } })).data.data,
  comments: async (params) => (await httpClient.get('/admin/comments', { params })).data,
  deleteComment: async ({ id, reason }) => (await httpClient.delete(`/admin/comments/${id}`, { data: { reason } })).data.data,
  categories: async () => (await httpClient.get('/admin/categories')).data.data,
  createCategory: async (input) => (await httpClient.post('/admin/categories', input)).data.data,
  updateCategory: async ({ id, ...input }) => (await httpClient.put(`/admin/categories/${id}`, input)).data.data,
  deleteCategory: async (id) => (await httpClient.delete(`/admin/categories/${id}`)).data.data,
};
