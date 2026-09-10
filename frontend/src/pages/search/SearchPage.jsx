import { useState } from 'react';
import { ArrowLeft, ArrowRight, Image as ImageIcon, MessageSquare, Search, Users } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import CommunityHeader from '../../components/layout/CommunityHeader';
import CommunityAvatar from '../../components/ui/CommunityAvatar';
import { useCategories } from '../../features/posts/hooks/usePosts';
import { useSearch } from '../../features/search/hooks/useSearch';

const TYPES = [
  ['all', 'Tất cả'], ['posts', 'Bài viết'], ['comments', 'Bình luận'], ['communities', 'Cộng đồng'], ['users', 'Người dùng'], ['media', 'Media'],
];
const dateFormatter = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' });

function PostResult({ item }) {
  return <article className="search-result"><div className="search-result-meta"><span>{item.community?.name || 'Chung'}</span><span>u/{item.author.username}</span><time>{dateFormatter.format(new Date(item.createdAt))}</time></div><Link to={`/posts/${item.id}`}><h3>{item.title}</h3><p>{item.excerpt}</p></Link><small>{item.score} điểm · {item.commentCount} bình luận</small></article>;
}

function CommentResult({ item }) {
  return <article className="search-result"><div className="search-result-meta"><MessageSquare size={14} /><span>u/{item.author.username}</span><time>{dateFormatter.format(new Date(item.createdAt))}</time></div><Link to={`/posts/${item.postId}#comment-${item.id}`}><h3>{item.postTitle}</h3><p>{item.excerpt}</p></Link><small>{item.score} điểm</small></article>;
}

function CommunityResult({ item }) {
  return <Link className="search-community-result" to={`/posts?categoryId=${encodeURIComponent(item.id)}`}><CommunityAvatar avatarUrl={item.avatarUrl} large /><span><strong>{item.name}</strong><small>{item.description || 'Xem cộng đồng'}</small></span></Link>;
}

function UserResult({ item }) {
  return <article className="search-user-result"><span className="mini-avatar"><Users size={18} /></span><span><strong>u/{item.username}</strong><small>{item.fullName || 'Thành viên VRUM'}</small></span></article>;
}

function MediaResult({ item }) {
  return <Link className="search-media-result" to={`/posts/${item.postId}${item.targetType === 'comment' ? `#comment-${item.id}` : ''}`}>{item.thumbnail ? <img src={item.thumbnail} alt="" /> : <span className="search-media-placeholder"><ImageIcon size={20} /></span>}<span><strong>{item.title}</strong><small>{item.excerpt}</small></span></Link>;
}

const renderers = { posts: PostResult, comments: CommentResult, communities: CommunityResult, users: UserResult, media: MediaResult };

function ResultGroup({ type, items, total, compact = false, viewAllTo = null }) {
  const Renderer = renderers[type];
  const label = TYPES.find(([value]) => value === type)?.[1];
  return <section className={`search-group ${compact ? 'compact' : ''}`}><header><h2>{label}</h2><span>{total} kết quả</span>{viewAllTo && total > items.length && <Link className="search-view-all" to={viewAllTo}>Xem tất cả</Link>}</header>{items.map((item) => <Renderer key={`${type}-${item.id}`} item={item} />)}{items.length === 0 && <p className="search-empty">Không có kết quả phù hợp.</p>}</section>;
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q')?.trim() || '';
  const type = TYPES.some(([value]) => value === searchParams.get('type')) ? searchParams.get('type') : 'all';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const [authorId, setAuthorId] = useState(searchParams.get('authorId') || '');
  const categories = useCategories({ limit: 20 });
  const fromDate = searchParams.get('from') || '';
  const toDate = searchParams.get('to') || '';
  const params = {
    q, type, page, limit: type === 'all' ? 5 : 10,
    sort: searchParams.get('sort') || 'relevance',
    categoryId: searchParams.get('categoryId') || undefined,
    authorId: searchParams.get('authorId') || undefined,
    from: fromDate ? `${fromDate}T00:00:00.000Z` : undefined,
    to: toDate ? `${toDate}T23:59:59.999Z` : undefined,
  };
  const results = useSearch(params);
  const update = (changes) => setSearchParams((current) => {
    const next = new URLSearchParams(current);
    for (const [key, value] of Object.entries(changes)) value ? next.set(key, value) : next.delete(key);
    if (!Object.hasOwn(changes, 'page')) next.delete('page');
    return next;
  });
  const total = type === 'all' ? 0 : results.data?.meta.total || 0;
  const totalPages = results.data?.meta.totalPages || 1;
  const selectedCategory = categories.data?.find((item) => item.id === params.categoryId);
  const viewAllUrl = (resultType) => {
    const next = new URLSearchParams(searchParams);
    next.set('type', resultType);
    next.delete('page');
    return `/search?${next}`;
  };

  return <div className="community-page"><CommunityHeader /><main className="search-page">
    <header className="search-title"><Search size={28} /><div><h1>Kết quả cho “{q}”</h1><p>{selectedCategory ? <>Đang tìm trong <strong>{selectedCategory.name}</strong>. <button type="button" className="search-global-link" onClick={() => update({ categoryId: '' })}>Tìm trên toàn VRUM</button></> : 'Tìm trên toàn bộ nội dung công khai của VRUM.'}</p></div></header>
    <nav className="search-tabs" aria-label="Loại kết quả">{TYPES.map(([value, label]) => <button type="button" className={type === value ? 'active' : ''} key={value} onClick={() => update({ type: value })}>{label}</button>)}</nav>
    <form className="search-filters" onSubmit={(event) => { event.preventDefault(); update({ authorId: authorId.trim() }); }}>
      <select value={params.categoryId || ''} onChange={(event) => update({ categoryId: event.target.value })} aria-label="Lọc theo cộng đồng"><option value="">Mọi cộng đồng</option>{categories.data?.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select>
      <input value={authorId} onChange={(event) => setAuthorId(event.target.value)} placeholder="ID tác giả" aria-label="Lọc theo mã tác giả" />
      <input type="date" value={fromDate} onChange={(event) => update({ from: event.target.value })} aria-label="Từ ngày" />
      <input type="date" value={toDate} onChange={(event) => update({ to: event.target.value })} aria-label="Đến ngày" />
      <select value={params.sort} onChange={(event) => update({ sort: event.target.value })} aria-label="Sắp xếp"><option value="relevance">Liên quan</option><option value="new">Mới nhất</option><option value="top">Điểm cao</option></select>
      <button type="submit">Áp dụng</button>
    </form>
    {results.isLoading && <div className="feed-state">Đang tìm kiếm…</div>}
    {results.error && <div className="feed-state error-state">Không thể tìm kiếm. Vui lòng thử lại.</div>}
    {results.data && <div className="search-results">{type === 'all' ? Object.keys(renderers).map((resultType) => <ResultGroup compact key={resultType} type={resultType} items={results.data.data[resultType]} total={results.data.meta.totals[resultType]} viewAllTo={viewAllUrl(resultType)} />) : <ResultGroup type={type} items={results.data.data} total={total} />}</div>}
    {type !== 'all' && totalPages > 1 && <div className="pagination"><button disabled={page === 1} onClick={() => update({ page: String(page - 1) })}><ArrowLeft size={16} /> Trước</button><span>Trang {page} / {totalPages}</span><button disabled={page === totalPages} onClick={() => update({ page: String(page + 1) })}>Sau <ArrowRight size={16} /></button></div>}
    {!q && <div className="feed-state"><ImageIcon size={24} /> Hãy nhập từ khóa ở ô tìm kiếm phía trên.</div>}
  </main></div>;
}
