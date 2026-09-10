import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { notificationApi } from '../api/notificationApi';

export function useNotifications(params) {
  const user = useAuthStore((state) => state.user);
  return useQuery({ queryKey: ['notifications', params], queryFn: () => notificationApi.list(params), enabled: Boolean(user), placeholderData: (previous) => previous });
}

export function useUnreadNotificationCount() {
  const user = useAuthStore((state) => state.user);
  return useQuery({ queryKey: ['notifications', 'unread-count'], queryFn: notificationApi.unreadCount, enabled: Boolean(user), refetchInterval: 45000, refetchOnWindowFocus: true });
}

export function useNotificationState() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['notifications'] });
  return {
    markRead: useMutation({ mutationFn: notificationApi.markRead, onSuccess: refresh }),
    markAllRead: useMutation({ mutationFn: notificationApi.markAllRead, onSuccess: refresh }),
  };
}

export function useNotificationPreferences() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['notification-preferences'], queryFn: notificationApi.preferences });
  const update = useMutation({ mutationFn: notificationApi.updatePreferences, onSuccess: (data) => queryClient.setQueryData(['notification-preferences'], data) });
  return { ...query, update };
}
