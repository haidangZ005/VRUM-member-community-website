import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, PenLine, Plus, Sparkles, Star, Trash2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import CommunityHeader from '../../components/layout/CommunityHeader';
import CommunitySidebar from '../../components/layout/CommunitySidebar';
import CommunityAvatar from '../../components/ui/CommunityAvatar';
import PostCard from '../../features/posts/components/PostCard';
import CreatePostDialog from './CreatePostDialog';
import { useCategories, useCommunityActions, useDeleteCategory, usePosts } from '../../features/posts/hooks/usePosts';

import { useAuthStore } from '../../store/authStore';

export default function PostListPage() {
  const user = useAuthStore((state) => state.user);
  const deletion = useDeleteCategory();
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryId = searchParams.get('categoryId') || '';
  const sort = searchParams.get('sort') === 'popular' ? 'popular' : 'latest';
  const posts = usePosts({ page, limit: 8, categoryId: categoryId || undefined, sort });
  const category = useCategories({ id: categoryId }, Boolean(categoryId));
  const selectedCategory = category.data?.[0];
  const communityActions = useCommunityActions();
  const createPostUrl = selectedCategory
    ? `/posts?categoryId=${encodeURIComponent(selectedCategory.id)}&create=true`
    : null;
  const closeComposer = () => setSearchParams((current) => { const next = new URLSearchParams(current); next.delete('create'); return next; }, { replace: true });

  useEffect(() => {
    setPage(1);
  }, [categoryId, sort]);

  useEffect(() => {
    if (!categoryId && searchParams.get('create') === 'true') {
      const next = new URLSearchParams(searchParams);
      next.delete('create');
      setSearchParams(next, { replace: true });
    }
  }, [categoryId, searchParams, setSearchParams]);

  return (
    <div className="community-page"><CommunityHeader />
      <div className="community-shell">
        <CommunitySidebar selectedCategory={selectedCategory} />
        <main className="community-main">
        {selectedCategory && searchParams.get('create') === 'true' && <CreatePostDialog category={selectedCategory} onClose={closeComposer} />}
        {selectedCategory && <><section className="topic-hero"><div><div className="topic-community-identity"><CommunityAvatar avatarUrl={selectedCategory.avatarUrl} large /><h1>{selectedCategory.name}</h1></div><p>{selectedCategory.description}</p></div><div className="topic-hero-actions">{selectedCategory.ownerId === user?.id && <button type="button" className="topic-action topic-action-delete" disabled={deletion.isPending} onClick={() => { if (window.confirm(`Xóa cộng đồng “${selectedCategory.name}”? Không thể hoàn tác. Bài đăng được giữ lại nhưng không còn thuộc cộng đồng này.`)) deletion.mutate(selectedCategory.id); }}><Trash2 size={18} />{deletion.isPending ? 'Đang xóa…' : 'Xóa cộng đồng'}</button>}{selectedCategory.joinedByCurrentUser && <button className={`topic-action topic-action-favorite ${selectedCategory.favoriteByCurrentUser ? 'active' : ''}`} type="button" title={selectedCategory.favoriteByCurrentUser ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'} aria-label={selectedCategory.favoriteByCurrentUser ? `Bỏ yêu thích ${selectedCategory.name}` : `Yêu thích ${selectedCategory.name}`} aria-pressed={selectedCategory.favoriteByCurrentUser} disabled={communityActions.favorite.isPending} onClick={() => communityActions.favorite.mutate({ id: selectedCategory.id, favorite: !selectedCategory.favoriteByCurrentUser })}><Star size={19} fill={selectedCategory.favoriteByCurrentUser ? 'currentColor' : 'none'} /></button>}<button className={`topic-action ${selectedCategory.joinedByCurrentUser ? 'joined' : ''}`} type="button" disabled={communityActions.membership.isPending} onClick={() => communityActions.membership.mutate({ id: selectedCategory.id, joined: !selectedCategory.joinedByCurrentUser })}>{selectedCategory.joinedByCurrentUser ? <Check size={18} /> : <Plus size={18} />}{selectedCategory.joinedByCurrentUser ? 'Đã tham gia' : 'Tham gia'}</button>{createPostUrl && <Link className="topic-action topic-action-primary" to={createPostUrl}><PenLine size={18} /> Tạo bài đăng</Link>}</div></section>{(deletion.error || communityActions.favorite.error || communityActions.membership.error) && <div className="alert error community-action-error">Không thể cập nhật cộng đồng. Vui lòng thử lại.</div>}</>}
        <section className="feed-column" aria-live="polite">
          <div className="feed-heading"><div><h2>{selectedCategory ? `Bài đăng trong ${selectedCategory.name}` : sort === 'popular' ? 'Phổ biến trên VRUM' : 'Bài đăng mới nhất'}</h2><p>{posts.data?.meta.total || 0} bài đăng</p></div><span className="live-pill">● {sort === 'popular' ? 'Nổi bật' : 'Mới nhất'}</span></div>
          {posts.isLoading && <div className="feed-state">Đang tải những cuộc trò chuyện mới…</div>}
          {posts.error && <div className="feed-state error-state">Không thể tải bài viết. Vui lòng thử lại.</div>}
          {posts.data?.data.map((post) => <PostCard key={post.id} post={post} />)}
          {!posts.isLoading && posts.data?.data.length === 0 && <div className="feed-state empty-state"><Sparkles size={28} /><h3>Chưa có bài đăng</h3><p>{selectedCategory ? 'Hãy là người đầu tiên chia sẻ trong chủ đề này.' : 'Bài đăng mới sẽ xuất hiện tại đây.'}</p>{createPostUrl && <Link to={createPostUrl}>Tạo bài đăng đầu tiên</Link>}</div>}
          {posts.data && posts.data.meta.totalPages > 1 && <div className="pagination"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)}><ArrowLeft size={16} /> Trước</button><span>Trang {page} / {posts.data.meta.totalPages}</span><button disabled={page === posts.data.meta.totalPages} onClick={() => setPage((value) => value + 1)}>Sau <ArrowRight size={16} /></button></div>}
        </section>
        </main>
      </div>
    </div>
  );
}
