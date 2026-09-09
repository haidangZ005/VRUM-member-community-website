import { Heart } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToggleLike } from '../hooks/usePosts';
import { useAuthStore } from '../../../store/authStore';

export default function LikeButton({ post, compact = false }) {
  const toggle = useToggleLike(post);
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const requireLogin = () => navigate('/login', { state: { from: `${location.pathname}${location.search}${location.hash}` } });
  return (
    <button
      className={`reaction-button ${post.likedByCurrentUser ? 'liked' : ''} ${compact ? 'compact' : ''}`}
      type="button"
      disabled={toggle.isPending}
      aria-pressed={post.likedByCurrentUser}
      onClick={(event) => { event.preventDefault(); if (isAuthenticated) toggle.mutate(); else requireLogin(); }}
    >
      <Heart size={compact ? 16 : 18} fill={post.likedByCurrentUser ? 'currentColor' : 'none'} />
      <span>{post.likeCount}</span><span className="reaction-label">{post.likedByCurrentUser ? 'Đã thích' : 'Thích'}</span>
    </button>
  );
}
