import NotificationBell from './components/NotificationBell';
import { useNotifications, useNotificationState, useUnreadNotificationCount } from './hooks/useNotifications';

export default function NotificationBellContainer() {
  const notificationCount = useUnreadNotificationCount();
  const notifications = useNotifications({ page: 1, limit: 10 });
  const { markRead } = useNotificationState();
  return <NotificationBell
    unread={notificationCount.data?.count || 0}
    notifications={notifications.data?.data || []}
    isLoading={notifications.isLoading}
    onOpen={(selected) => { if (!selected.readAt) markRead.mutate(selected.id); }}
  />;
}
