import { BellRing, CheckCheck, Settings2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import CommunityHeader from '../../components/layout/CommunityHeader';
import NotificationItem from '../../features/notifications/components/NotificationItem';
import { useNotificationPreferences, useNotifications, useNotificationState } from '../../features/notifications/hooks/useNotifications';

const preferenceLabels = {
  POST_COMMENT: 'Bình luận mới trên bài viết của tôi',
  COMMENT_REPLY: 'Trả lời bình luận của tôi',
  MENTION: 'Nhắc đến @username của tôi',
  POST_VOTE_MILESTONE: 'Bài viết đạt mốc vote',
};

export default function NotificationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const unreadOnly = searchParams.get('filter') === 'unread';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const notifications = useNotifications({ page, limit: 20, unreadOnly });
  const preferences = useNotificationPreferences();
  const { markRead, markAllRead } = useNotificationState();
  const update = (changes) => setSearchParams((current) => {
    const next = new URLSearchParams(current);
    for (const [key, value] of Object.entries(changes)) value ? next.set(key, value) : next.delete(key);
    return next;
  });
  const togglePreference = (preference) => preferences.update.mutate([{ type: preference.type, inAppEnabled: !preference.inAppEnabled }]);

  return <div className="community-page"><CommunityHeader /><main className="notifications-page">
    <header className="notifications-title"><div><p className="eyebrow"><BellRing size={15} /> Hộp thư</p><h1>Thông báo</h1><p>Theo dõi các cuộc trò chuyện và hoạt động liên quan đến bạn.</p></div><button type="button" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}><CheckCheck size={17} /> Đánh dấu tất cả đã đọc</button></header>
    <div className="notifications-layout"><section className="notifications-list"><nav className="notification-tabs"><button className={!unreadOnly ? 'active' : ''} type="button" onClick={() => update({ filter: '', page: '' })}>Tất cả</button><button className={unreadOnly ? 'active' : ''} type="button" onClick={() => update({ filter: 'unread', page: '' })}>Chưa đọc</button></nav>
      {notifications.data?.data.map((item) => <NotificationItem key={item.id} item={item} onOpen={(selected) => { if (!selected.readAt) markRead.mutate(selected.id); }} />)}
      {notifications.isLoading && <p className="notification-state">Đang tải thông báo…</p>}{!notifications.isLoading && notifications.data?.data.length === 0 && <p className="notification-state">Không có thông báo phù hợp.</p>}
      {notifications.data?.meta.totalPages > 1 && <div className="pagination"><button disabled={page === 1} onClick={() => update({ page: String(page - 1) })}>Trước</button><span>Trang {page} / {notifications.data.meta.totalPages}</span><button disabled={page === notifications.data.meta.totalPages} onClick={() => update({ page: String(page + 1) })}>Sau</button></div>}
    </section><aside className="notification-settings"><header><Settings2 size={18} /><div><h2>Tùy chọn</h2><p>Chọn hoạt động bạn muốn nhận.</p></div></header>{preferences.data?.map((preference) => <label key={preference.type}><span>{preferenceLabels[preference.type]}</span><input type="checkbox" checked={preference.inAppEnabled} disabled={preferences.update.isPending} onChange={() => togglePreference(preference)} /></label>)}</aside></div>
  </main></div>;
}
