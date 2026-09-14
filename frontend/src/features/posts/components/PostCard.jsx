import { EyeOff, MessageSquare, ThumbsDown } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PostVoteControl from './PostVoteControl';
import { AttachedImages } from '../../../components/ui/ImageAttachments';
import { useFeedActions } from '../hooks/usePosts';
import { useAuthStore } from '../../../store/authStore';
import UserAvatar from '../../../components/ui/UserAvatar';
import UserPostsLink from '../../../components/ui/UserPostsLink';

const dateFormatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function PostCard({ post, onHidden, onNotInterested }) {
  const actions = useFeedActions();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const requireLogin = () => navigate('/login', { state: { from: `${location.pathname}${location.search}${location.hash}` } });
  const authorName = post.author?.fullName || post.author?.username || 'Thành viên';
  const excerpt = post.content.length > 210 ? `${post.content.slice(0, 210)}…` : post.content;
  return (
    <article className="post-card">
      <div className="post-card-meta">
        <UserAvatar user={post.author} categoryId={post.category?.id} />
        <div><strong><UserPostsLink user={post.author} categoryId={post.category?.id}>{authorName}</UserPostsLink></strong><span>{dateFormatter.format(new Date(post.createdAt))}</span></div>
        {post.category ? <Link className="category-chip" to={`/posts?categoryId=${encodeURIComponent(post.category.id)}`}>{post.category.name}</Link> : <span className="category-chip">Chung</span>}
      </div>
      <Link className="post-card-link" to={`/posts/${post.id}`}>
        <h2>{post.title}</h2><p>{excerpt}</p>
        <AttachedImages images={post.images} />
      </Link>
      <footer className="post-card-footer">
        <PostVoteControl post={post} compact />
        <Link className="comment-count" to={`/posts/${post.id}#comments`}><MessageSquare size={16} /> {post.commentCount} bình luận</Link>
        <button className="feed-card-action" type="button" disabled={actions.hide.isPending} onClick={() => user ? actions.hide.mutate({ id: post.id, hidden: true }, { onSuccess: () => onHidden?.(post) }) : requireLogin()}><EyeOff size={15} /> Ẩn</button>
        <button className="feed-card-action" type="button" disabled={actions.notInterested.isPending} onClick={() => user ? actions.notInterested.mutate(post.id, { onSuccess: () => onNotInterested?.(post.id) }) : requireLogin()}><ThumbsDown size={15} /> Không quan tâm</button>
        <Link className="read-link" to={`/posts/${post.id}`}>Đọc tiếp →</Link>
      </footer>
    </article>
  );
}
