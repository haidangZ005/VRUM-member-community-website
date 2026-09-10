import { useLocation, useNavigate } from 'react-router-dom';
import VoteControl from '../../../components/ui/VoteControl';
import { useSetPostVote } from '../hooks/usePosts';
import { useAuthStore } from '../../../store/authStore';

export default function PostVoteControl({ post, compact = false }) {
  const vote = useSetPostVote(post);
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const onVote = (value) => {
    if (isAuthenticated) vote.mutate(value);
    else navigate('/login', { state: { from: `${location.pathname}${location.search}${location.hash}` } });
  };
  return <VoteControl score={post.score} viewerVote={post.viewerVote} onVote={onVote} pending={vote.isPending} compact={compact} label="Bình chọn bài viết" />;
}
