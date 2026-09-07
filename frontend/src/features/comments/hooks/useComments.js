import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { commentApi } from '../api/commentApi';

export function useComments(postId) {
  return useQuery({ queryKey: ['comments', postId], queryFn: () => commentApi.list(postId), enabled: Boolean(postId) });
}

export function useCommentMutation(postId, action = 'create') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values) => commentApi[action]({ postId, ...values }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
