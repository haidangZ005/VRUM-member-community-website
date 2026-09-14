import { Link } from 'react-router-dom';

export default function UserPostsLink({ user, categoryId, children, className }) {
  const name = user?.fullName || user?.username || 'Thành viên';
  if (!categoryId || !user?.id) return children;
  return <Link className={className} to={`/posts?${new URLSearchParams({ categoryId, authorId: user.id, authorName: name })}`} aria-label={`Xem bài đăng của ${name} trong cộng đồng này`}>{children}</Link>;
}
