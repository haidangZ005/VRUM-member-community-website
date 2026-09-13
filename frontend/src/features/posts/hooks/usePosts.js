import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { postApi } from '../api/postApi';
import { useAuthStore } from '../../../store/authStore';
import { forgetCommunity } from '../../../utils/recentCommunities';
import { getNextPostsPage } from '../../../utils/postPagination';

export function useDeleteCategory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  return useMutation({
    mutationFn: postApi.removeCategory,
    onSuccess: (_, id) => {
      forgetCommunity(window.localStorage, `vrum.recentCommunities.${user.id}`, id);
      navigate('/posts', { replace: true });
      for (const key of ['categories', 'posts', 'post', 'my-categories']) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}

export function usePosts(params) {
  const { isInitialized, user } = useAuthStore();
  return useInfiniteQuery({
    queryKey: ['posts', params, user?.id || 'guest'],
    queryFn: ({ pageParam }) => postApi.list({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: getNextPostsPage,
    enabled: isInitialized,
  });
}

export function usePost(id) {
  const { isInitialized, user } = useAuthStore();
  return useQuery({ queryKey: ['post', id, user?.id || 'guest'], queryFn: () => postApi.getById(id), enabled: Boolean(id) && isInitialized });
}

export function useCategories(params, enabled = true) {
  const { isInitialized, user } = useAuthStore();
  return useQuery({ queryKey: ['categories', params, user?.id || 'guest'], queryFn: () => postApi.categories(params), staleTime: 5 * 60 * 1000, enabled: enabled && isInitialized });
}

export function useCreateCategory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postApi.createCategory,
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['my-categories'] });
      navigate(`/posts?categoryId=${encodeURIComponent(category.id)}`, { replace: true });
    },
  });
}

export function useCommunityActions() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['categories'] });
  return {
    membership: useMutation({ mutationFn: postApi.setCategoryJoined, onSuccess: refresh }),
    favorite: useMutation({ mutationFn: postApi.setCategoryFavorite, onSuccess: refresh }),
    mute: useMutation({ mutationFn: postApi.setCategoryMuted, onSuccess: (_, { id }) => {
      refresh();
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['recommended-categories'] });
      queryClient.invalidateQueries({ queryKey: ['category', id] });
    } }),
  };
}

export function useRecommendedCategories(limit = 5) {
  const { isInitialized, user } = useAuthStore();
  return useQuery({ queryKey: ['recommended-categories', limit, user?.id], queryFn: () => postApi.recommendedCategories(limit), enabled: isInitialized && Boolean(user), staleTime: 5 * 60 * 1000 });
}

export function useFeedActions() {
  const queryClient = useQueryClient();
  const refreshFeeds = () => queryClient.invalidateQueries({ queryKey: ['posts'] });
  return {
    hide: useMutation({ mutationFn: postApi.setHidden, onSuccess: refreshFeeds }),
    notInterested: useMutation({ mutationFn: postApi.markNotInterested, onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommended-categories'] });
    } }),
  };
}

export function useRecordPostView() {
  return useMutation({ mutationFn: postApi.recordView });
}

export function useSummarizePost(id) {
  return useMutation({ mutationFn: async () => await postApi.getSummary(id) || postApi.summarize(id) });
}

export function useCreatePost({ stayOnFeed = false } = {}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postApi.create,
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      if (!stayOnFeed) navigate(`/posts/${post.id}`);
    },
  });
}

export function useUpdatePost() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  return useMutation({
    mutationFn: postApi.update,
    onSuccess: (post) => {
      queryClient.setQueryData(['post', post.id, user?.id || 'guest'], post);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      navigate(`/posts/${post.id}`);
    },
  });
}

export function useDeletePost() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      navigate('/posts');
    },
  });
}

export function useSetPostVote(post) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  return useMutation({
    mutationFn: (value) => postApi.vote({ id: post.id, value }),
    onSuccess: ({ score, viewerVote }) => {
      queryClient.setQueryData(['post', post.id, user?.id || 'guest'], (current) => current ? { ...current, score, viewerVote } : current);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
