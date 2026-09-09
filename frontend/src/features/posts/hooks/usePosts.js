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
  };
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

export function useToggleLike(post) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  return useMutation({
    mutationFn: () => (post.likedByCurrentUser ? postApi.unlike(post.id) : postApi.like(post.id)),
    onSuccess: ({ liked, likeCount }) => {
      queryClient.setQueryData(['post', post.id, user?.id || 'guest'], (current) => current ? { ...current, likedByCurrentUser: liked, likeCount } : current);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
