export default function UserAvatar({ user, small = false }) {
  const name = user?.fullName || user?.username || 'Thành viên';
  return (
    <span className={`mini-avatar${small ? ' small' : ''}`} aria-hidden="true">
      {user?.avatarUrl
        ? <img src={user.avatarUrl} alt="" />
        : name.slice(0, 1).toUpperCase()}
    </span>
  );
}
