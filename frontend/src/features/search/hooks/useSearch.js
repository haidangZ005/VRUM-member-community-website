import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../api/searchApi';

export function useSearch(params) {
  return useQuery({
    queryKey: ['search', params],
    queryFn: () => searchApi.search(params),
    enabled: Boolean(params.q),
    placeholderData: (previous) => previous,
  });
}
