import { useParams } from 'react-router-dom';
import { PenLine } from 'lucide-react';
import CommunityHeader from '../../components/layout/CommunityHeader';
import PostForm from '../../features/posts/components/PostForm';
import { usePost, useUpdatePost } from '../../features/posts/hooks/usePosts';
import { useAuthStore } from '../../store/authStore';

export default function PostEditorPage() {
  const { id } = useParams();
  const post = usePost(id);
  const update = useUpdatePost();
  const user = useAuthStore((state) => state.user);

  if (post.isLoading) return <div className="page-loader">Đang tải bản nháp…</div>;
  if (post.error || post.data?.authorId !== user?.id) return <div className="community-page"><CommunityHeader /><div className="detail-state"><h1>Bạn không thể sửa bài viết này</h1></div></div>;
  return (
    <div className="community-page"><CommunityHeader />
      <main className="editor-main">
        <section className="editor-heading"><p className="eyebrow"><PenLine size={15} /> Chỉnh sửa bài viết</p><h1>Làm rõ điều bạn muốn chia sẻ.</h1><p>Viết chân thành, cung cấp đủ bối cảnh và để lại khoảng trống cho những góc nhìn khác.</p></section>
        {update.error && <div className="alert error editor-alert">{update.error.response?.data?.error?.message || 'Không thể lưu bài viết.'}</div>}
        <PostForm initialValues={post.data} isPending={update.isPending} submitLabel="Lưu thay đổi" onSubmit={(values) => update.mutate({ id, ...values })} />
      </main>
    </div>
  );
}
