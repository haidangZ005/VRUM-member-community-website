import httpClient from '../../../services/httpClient';

export const commentApi = {
  list: async (postId) => (await httpClient.get(`/posts/${postId}/comments`)).data.data,
  create: async ({ postId, ...values }) => (await httpClient.post(`/posts/${postId}/comments`, values)).data.data,
  update: async ({ postId, id, ...values }) => (await httpClient.put(`/posts/${postId}/comments/${id}`, values)).data.data,
  remove: async ({ postId, id }) => (await httpClient.delete(`/posts/${postId}/comments/${id}`)).data.data,
  vote: async ({ postId, id, value }) => (await httpClient.put(`/posts/${postId}/comments/${id}/votes`, { value })).data.data,
};
