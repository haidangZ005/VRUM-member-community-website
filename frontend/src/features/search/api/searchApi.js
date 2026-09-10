import httpClient from '../../../services/httpClient';

export const searchApi = {
  search: async (params) => (await httpClient.get('/search', { params })).data,
};
