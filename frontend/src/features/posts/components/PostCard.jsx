import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import LikeButton from './LikeButton';
import { AttachedImages } from '../../../components/ui/ImageAttachments';

const dateFormatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function PostCard({ post }) {
  const authorName = post.author?.fullName || post.author?.username || 'Thành viên';
  const excerpt = post.content.length > 210 ? `${post.content.slice(0, 210)}…` : post.content;
  return (
    <article className="post-card">
      <div className="post-card-meta">
        <div className="mini-avatar">{authorName.slice(0, 1).toUpperCase()}</div>
        <div><strong>{authorName}</strong><span>{dateFormatter.format(new Date(post.createdAt))}</span></div>
        {post.category ? <Link className="category-chip" to={`/posts?categoryId=${encodeURIComponent(post.category.id)}`}>{post.category.name}</Link> : <span className="category-chip">Chung</span>}
      </div>
      <Link className="post-card-link" to={`/posts/${post.id}`}>
        <h2>{post.title}</h2><p>{excerpt}</p>
        <AttachedImages images={post.images} />
      </Link>
      <footer className="post-card-footer">
        <LikeButton post={post} compact />
        <Link className="comment-count" to={`/posts/${post.id}#comments`}><MessageSquare size={16} /> {post.commentCount} bình luận</Link>
        <Link className="read-link" to={`/posts/${post.id}`}>Đọc tiếp →</Link>
      </footer>
    </article>
  );
}
