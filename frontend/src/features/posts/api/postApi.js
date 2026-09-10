import httpClient from '../../../services/httpClient';

export const postApi = {
  list: async (params) => (await httpClient.get('/posts', { params })).data,
  getById: async (id) => (await httpClient.get(`/posts/${id}`)).data.data,
  create: async (input) => (await httpClient.post('/posts', input)).data.data,
  update: async ({ id, ...input }) => (await httpClient.put(`/posts/${id}`, input)).data.data,
  remove: async (id) => (await httpClient.delete(`/posts/${id}`)).data.data,
  vote: async ({ id, value }) => (await httpClient.put(`/posts/${id}/votes`, { value })).data.data,
  recordView: async (id) => (await httpClient.post(`/posts/${id}/views`)).data.data,
  setHidden: async ({ id, hidden }) => (await httpClient.put(`/posts/${id}/hides`, { hidden })).data.data,
  markNotInterested: async (id) => (await httpClient.post(`/posts/${id}/recommendation-feedback`)).data.data,
  categories: async (params) => (await httpClient.get('/posts/categories', { params })).data.data,
  createCategory: async (input) => (await httpClient.post('/posts/categories', input)).data.data,
  removeCategory: async (id) => (await httpClient.delete(`/posts/categories/${id}`)).data.data,
  setCategoryJoined: async ({ id, joined }) => (await httpClient[joined ? 'post' : 'delete'](`/posts/categories/${id}/join`)).data.data,
  setCategoryFavorite: async ({ id, favorite }) => (await httpClient[favorite ? 'post' : 'delete'](`/posts/categories/${id}/favorite`)).data.data,
  setCategoryMuted: async ({ id, muted }) => (await httpClient.put(`/posts/categories/${id}/mutes`, { muted })).data.data,
  recommendedCategories: async (limit = 5) => (await httpClient.get('/posts/categories/recommendations', { params: { limit } })).data.data,
};
