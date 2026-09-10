import { useEffect, useRef, useState } from 'react';
import { BellOff, BellRing, Check, LoaderCircle, PenLine, Plus, Sparkles, Star, Trash2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import CommunityHeader from '../../components/layout/CommunityHeader';
import CommunitySidebar from '../../components/layout/CommunitySidebar';
import CommunityAvatar from '../../components/ui/CommunityAvatar';
import PostCard from '../../features/posts/components/PostCard';
import CreatePostDialog from './CreatePostDialog';
import { useCategories, useCommunityActions, useDeleteCategory, useFeedActions, usePosts } from '../../features/posts/hooks/usePosts';
import { parseFeed, parseFeedSort } from '../../features/posts/feedOptions';

import { useAuthStore } from '../../store/authStore';

export default function PostListPage() {
  const user = useAuthStore((state) => state.user);
  const deletion = useDeleteCategory();
  const feedActions = useFeedActions();
  const [lastHiddenPost, setLastHiddenPost] = useState(null);
  const [dismissedPosts, setDismissedPosts] = useState([]);
  const loadMoreRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryId = searchParams.get('categoryId') || '';
  const requestedFeed = parseFeed(searchParams.get('feed'));
  const feed = !user && requestedFeed === 'home' ? 'popular' : requestedFeed;
  const defaultSort = feed === 'all' || categoryId ? 'new' : 'hot';
  const sort = parseFeedSort(searchParams.get('sort'), defaultSort);
  const posts = usePosts({ limit: 10, categoryId: categoryId || undefined, feed: categoryId ? undefined : feed, sort });
  const loadedPosts = posts.data?.pages.flatMap((page) => page.data) || [];
  const totalPosts = posts.data?.pages[0]?.meta.total || 0;
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = posts;
  const feedScope = `${feed}:${categoryId}`;
  const category = useCategories({ id: categoryId }, Boolean(categoryId));
  const selectedCategory = category.data?.[0];
  const communityActions = useCommunityActions();
  const createPostUrl = selectedCategory
    ? `/posts?categoryId=${encodeURIComponent(selectedCategory.id)}&create=true`
    : null;
  const closeComposer = () => setSearchParams((current) => { const next = new URLSearchParams(current); next.delete('create'); return next; }, { replace: true });

  useEffect(() => {
    if (!categoryId && searchParams.get('create') === 'true') {
      const next = new URLSearchParams(searchParams);
      next.delete('create');
      setSearchParams(next, { replace: true });
    }
  }, [categoryId, searchParams, setSearchParams]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasNextPage) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage();
    }, { rootMargin: '400px' });
    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="community-page"><CommunityHeader />
      <div className="community-shell">
        <CommunitySidebar selectedCategory={selectedCategory} />
        <main className="community-main">
        {user && selectedCategory && searchParams.get('create') === 'true' && <CreatePostDialog category={selectedCategory} onClose={closeComposer} />}
        {selectedCategory && <><section className="topic-hero"><div><div className="topic-community-identity"><CommunityAvatar avatarUrl={selectedCategory.avatarUrl} large /><h1>{selectedCategory.name}</h1></div><p>{selectedCategory.description}</p></div><div className="topic-hero-actions">{selectedCategory.ownerId === user?.id && <button type="button" className="topic-action topic-action-delete" disabled={deletion.isPending} onClick={() => { if (window.confirm(`Xóa cộng đồng “${selectedCategory.name}”? Không thể hoàn tác. Bài đăng được giữ lại nhưng không còn thuộc cộng đồng này.`)) deletion.mutate(selectedCategory.id); }}><Trash2 size={18} />{deletion.isPending ? 'Đang xóa…' : 'Xóa cộng đồng'}</button>}{user && <button className={`topic-action ${selectedCategory.mutedByCurrentUser ? 'joined' : ''}`} type="button" disabled={communityActions.mute.isPending} onClick={() => communityActions.mute.mutate({ id: selectedCategory.id, muted: !selectedCategory.mutedByCurrentUser })}>{selectedCategory.mutedByCurrentUser ? <BellOff size={18} /> : <BellRing size={18} />}{selectedCategory.mutedByCurrentUser ? 'Đã tắt nội dung' : 'Tắt nội dung'}</button>}{selectedCategory.joinedByCurrentUser && <button className={`topic-action topic-action-favorite ${selectedCategory.favoriteByCurrentUser ? 'active' : ''}`} type="button" title={selectedCategory.favoriteByCurrentUser ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'} aria-label={selectedCategory.favoriteByCurrentUser ? `Bỏ yêu thích ${selectedCategory.name}` : `Yêu thích ${selectedCategory.name}`} aria-pressed={selectedCategory.favoriteByCurrentUser} disabled={communityActions.favorite.isPending} onClick={() => communityActions.favorite.mutate({ id: selectedCategory.id, favorite: !selectedCategory.favoriteByCurrentUser })}><Star size={19} fill={selectedCategory.favoriteByCurrentUser ? 'currentColor' : 'none'} /></button>}{user ? <button className={`topic-action ${selectedCategory.joinedByCurrentUser ? 'joined' : ''}`} type="button" disabled={communityActions.membership.isPending} onClick={() => communityActions.membership.mutate({ id: selectedCategory.id, joined: !selectedCategory.joinedByCurrentUser })}>{selectedCategory.joinedByCurrentUser ? <Check size={18} /> : <Plus size={18} />}{selectedCategory.joinedByCurrentUser ? 'Đã tham gia' : 'Tham gia'}</button> : <Link className="topic-action" to="/login" state={{ from: `/posts?categoryId=${encodeURIComponent(selectedCategory.id)}` }}><Plus size={18} /> Tham gia</Link>}{createPostUrl && <Link className="topic-action topic-action-primary" to={user ? createPostUrl : '/login'} state={user ? undefined : { from: createPostUrl }}><PenLine size={18} /> Tạo bài đăng</Link>}</div></section>{(deletion.error || communityActions.favorite.error || communityActions.membership.error || communityActions.mute.error) && <div className="alert error community-action-error">Không thể cập nhật cộng đồng. Vui lòng thử lại.</div>}</>}
        <section className="feed-column" aria-live="polite">
          {lastHiddenPost && <div className="feed-undo" role="status"><span>Đã ẩn “{lastHiddenPost.title}”.</span><button type="button" disabled={feedActions.hide.isPending} onClick={() => feedActions.hide.mutate({ id: lastHiddenPost.id, hidden: false }, { onSuccess: () => setLastHiddenPost(null) })}>Hoàn tác</button></div>}
          <div className="feed-heading"><div><h2>{selectedCategory ? `Bài đăng trong ${selectedCategory.name}` : feed === 'home' ? 'Dành cho bạn' : feed === 'popular' ? 'Phổ biến trên VRUM' : 'Tất cả bài đăng'}</h2><p>{totalPosts} bài đăng</p></div><select className="feed-sort" value={sort} onChange={(event) => setSearchParams((current) => { const next = new URLSearchParams(current); next.set('sort', event.target.value); return next; })} aria-label="Sắp xếp bài viết"><option value="hot">Nổi bật</option><option value="new">Mới nhất</option><option value="top">Điểm cao</option></select></div>
          {posts.isLoading && <div className="feed-state">Đang tải những cuộc trò chuyện mới…</div>}
          {posts.isError && loadedPosts.length === 0 && <div className="feed-state error-state">Không thể tải bài viết. Vui lòng thử lại.</div>}
          {loadedPosts.filter((post) => !dismissedPosts.some((item) => item.id === post.id && item.scope === feedScope)).map((post) => <PostCard key={post.id} post={post} onHidden={setLastHiddenPost} onNotInterested={(id) => setDismissedPosts((current) => [...current, { id, scope: feedScope }])} />)}
          {!posts.isLoading && loadedPosts.length === 0 && <div className="feed-state empty-state"><Sparkles size={28} /><h3>Chưa có bài đăng</h3><p>{selectedCategory ? 'Hãy là người đầu tiên chia sẻ trong chủ đề này.' : 'Bài đăng mới sẽ xuất hiện tại đây.'}</p>{createPostUrl && <Link to={user ? createPostUrl : '/login'} state={user ? undefined : { from: createPostUrl }}>Tạo bài đăng đầu tiên</Link>}</div>}
          {hasNextPage && <div ref={loadMoreRef} className="feed-load-trigger" aria-hidden="true" />}
          {isFetchingNextPage && <div className="feed-loading-more" role="status"><LoaderCircle className="spin" size={20} /> Đang tải thêm bài viết…</div>}
          {posts.isFetchNextPageError && <button className="feed-load-retry" type="button" onClick={() => fetchNextPage()}>Không thể tải thêm. Thử lại</button>}
        </section>
        </main>
      </div>
    </div>
  );
}
