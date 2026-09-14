import { Link } from 'react-router-dom';

export default function UserAvatar({ user, small = false, categoryId }) {
  const name = user?.fullName || user?.username || 'Thành viên';
  const avatar = (
    <span className={`mini-avatar${small ? ' small' : ''}`} aria-hidden="true">
      {user?.avatarUrl
        ? <img src={user.avatarUrl} alt="" />
        : name.slice(0, 1).toUpperCase()}
    </span>
  );
  return categoryId && user?.id
    ? <Link className="author-avatar-link" to={`/posts?${new URLSearchParams({ categoryId, authorId: user.id, authorName: name })}`} aria-label={`Xem bài đăng của ${name} trong cộng đồng này`}>{avatar}</Link>
    : avatar;
}
