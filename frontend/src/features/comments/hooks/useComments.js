import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { commentApi } from '../api/commentApi';
import { useAuthStore } from '../../../store/authStore';

export function useComments(postId) {
  const { isInitialized, user } = useAuthStore();
  return useQuery({ queryKey: ['comments', postId, user?.id || 'guest'], queryFn: () => commentApi.list(postId), enabled: Boolean(postId) && isInitialized });
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

export function useSetCommentVote(postId, commentId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (value) => commentApi.vote({ postId, id: commentId, value }),
    onSuccess: ({ score, viewerVote }) => {
      queryClient.setQueriesData({ queryKey: ['comments', postId] }, (comments) => comments?.map((comment) => comment.id === commentId ? { ...comment, score, viewerVote } : comment));
    },
  });
}
