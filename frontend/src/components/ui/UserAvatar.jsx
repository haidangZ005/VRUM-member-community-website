import UserPostsLink from './UserPostsLink';

export default function UserAvatar({ user, small = false, categoryId }) {
  const name = user?.fullName || user?.username || 'Thành viên';
  const avatar = (
    <span className={`mini-avatar${small ? ' small' : ''}`} aria-hidden="true">
      {user?.avatarUrl
        ? <img src={user.avatarUrl} alt="" />
        : name.slice(0, 1).toUpperCase()}
    </span>
  );
  return <UserPostsLink user={user} categoryId={categoryId} className="author-avatar-link">{avatar}</UserPostsLink>;
}
