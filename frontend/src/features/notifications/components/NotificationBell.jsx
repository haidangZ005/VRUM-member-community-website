import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import NotificationItem from './NotificationItem';

export default function NotificationBell({ unread = 0, notifications = [], isLoading = false, onOpen }) {
  return <details className="notification-bell"><summary className="icon-button" aria-label={`${unread} thông báo chưa đọc`}><Bell size={18} />{unread > 0 && <span className="notification-badge">{unread > 99 ? '99+' : unread}</span>}</summary><div className="notification-popover"><header><strong>Thông báo</strong><Link to="/notifications">Xem tất cả</Link></header><div>{notifications.map((item) => <NotificationItem key={item.id} item={item} onOpen={onOpen} />)}{!isLoading && notifications.length === 0 && <p>Chưa có thông báo.</p>}</div></div></details>;
}
