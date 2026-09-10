import { BellRing, MessageSquareReply, ShieldAlert, Star, UserRoundSearch } from 'lucide-react';
import { Link } from 'react-router-dom';

const icons = { POST_COMMENT: MessageSquareReply, COMMENT_REPLY: MessageSquareReply, MENTION: UserRoundSearch, POST_VOTE_MILESTONE: Star, CONTENT_MODERATED: ShieldAlert, SYSTEM: BellRing };
const messages = {
  POST_COMMENT: (item) => `u/${item.payload.actorUsername || 'thành viên'} đã bình luận bài “${item.payload.postTitle}”`,
  COMMENT_REPLY: (item) => `u/${item.payload.actorUsername || 'thành viên'} đã trả lời bình luận của bạn`,
  MENTION: (item) => `u/${item.payload.actorUsername || 'thành viên'} đã nhắc đến bạn`,
  POST_VOTE_MILESTONE: (item) => `Bài “${item.payload.postTitle}” đã đạt ${item.payload.score} điểm`,
  CONTENT_MODERATED: (item) => `${item.payload.title} đã bị gỡ: ${item.payload.reason}`,
  SYSTEM: () => 'Thông báo hệ thống',
};
const dateFormatter = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

export default function NotificationItem({ item, onOpen }) {
  const Icon = icons[item.type] || BellRing;
  const target = item.payload.postId ? `/posts/${item.payload.postId}${item.payload.commentId ? `#comment-${item.payload.commentId}` : ''}` : '/notifications';
  return <Link className={`notification-item ${item.readAt ? '' : 'unread'}`} to={target} onClick={() => onOpen?.(item)}>
    <span className="notification-icon"><Icon size={18} /></span>
    <span><strong>{messages[item.type]?.(item) || 'Thông báo mới'}</strong>{item.payload.excerpt && <small>{item.payload.excerpt}</small>}<time>{dateFormatter.format(new Date(item.createdAt))}</time></span>
  </Link>;
}
