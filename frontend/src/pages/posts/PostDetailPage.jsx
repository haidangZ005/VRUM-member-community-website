import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Edit3, MessageSquare, Trash2 } from 'lucide-react';
import CommunityHeader from '../../components/layout/CommunityHeader';
import CommentList from '../../features/comments/components/CommentList';
import { AttachedImages } from '../../components/ui/ImageAttachments';
import PostVoteControl from '../../features/posts/components/PostVoteControl';
import { useDeletePost, usePost, useRecordPostView } from '../../features/posts/hooks/usePosts';
import { useAuthStore } from '../../store/authStore';

const dateFormatter = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long', timeStyle: 'short' });

export default function PostDetailPage() {
  const { id } = useParams();
  const post = usePost(id);
  const remove = useDeletePost();
  const { mutate: recordView } = useRecordPostView();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user && post.data?.id) recordView(post.data.id);
  }, [post.data?.id, recordView, user]);

  if (!post.data && !post.error) return <div className="page-loader">Đang mở cuộc trò chuyện…</div>;
  if (post.error) return <div className="community-page"><CommunityHeader /><div className="detail-state"><h1>Không tìm thấy bài viết</h1><Link to="/posts"><ArrowLeft size={17} /> Trở lại bảng tin</Link></div></div>;
  const data = post.data;
  const isOwner = user?.id === data.authorId;
  const authorName = data.author?.fullName || data.author?.username || 'Thành viên';

  return (
    <div className="community-page"><CommunityHeader />
      <main className="detail-main">
        <Link className="back-to-feed" to="/posts"><ArrowLeft size={17} /> Trở lại bảng tin</Link>
        <article className="post-detail">
          <div className="post-detail-top">{data.category ? <Link className="category-chip" to={`/posts?categoryId=${encodeURIComponent(data.category.id)}`}>{data.category.name}</Link> : <span className="category-chip">Chung</span>}{isOwner && <div className="owner-actions"><Link to={`/posts/${id}/edit`}><Edit3 size={16} /> Sửa</Link><button type="button" disabled={remove.isPending} onClick={() => { if (window.confirm('Xóa bài viết này? Thao tác này không thể hoàn tác.')) remove.mutate(id); }}><Trash2 size={16} /> Xóa</button></div>}</div>
          <h1>{data.title}</h1>
          <div className="detail-author"><div className="mini-avatar">{authorName.slice(0, 1).toUpperCase()}</div><div><strong>{authorName}</strong><time>{dateFormatter.format(new Date(data.createdAt))}</time></div></div>
          <div className="post-content">{data.content.split('\n').map((line, index) => <p key={`${index}-${line.slice(0, 12)}`}>{line || '\u00a0'}</p>)}</div>
          <AttachedImages images={data.images} />
          <footer className="detail-reactions"><PostVoteControl post={data} /><a href="#comments"><MessageSquare size={18} /> {data.commentCount} bình luận</a></footer>
        </article>
        <CommentList postId={id} />
      </main>
    </div>
  );
}
