import { useState } from 'react';
import { BookOpenCheck, ExternalLink, Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminPagination from '../../components/admin/AdminPagination';
import StatusBadge from '../../components/admin/StatusBadge';
import CustomSelect from '../../components/ui/CustomSelect';
import { useAdminPosts, useModeratePost } from '../../features/admin/hooks/useAdmin';

const dateFormatter = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' });
const statusOptions = [{ value: '', label: 'Mọi trạng thái' }, { value: 'published', label: 'Đang hiển thị' }, { value: 'removed', label: 'Đã gỡ' }];

export default function PostModerationPage() {
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const posts = useAdminPosts({ page, limit: 10, search: search || undefined, status: status || undefined });
  const moderate = useModeratePost();
  const submitSearch = (event) => { event.preventDefault(); setSearch(draft.trim()); setPage(1); };
  return (
    <>
      <header className="admin-page-header"><div><p className="eyebrow"><BookOpenCheck size={15} /> Nội dung</p><h1>Kiểm duyệt bài viết</h1><p>Xem toàn bộ bài viết và gỡ nội dung không phù hợp.</p></div></header>
      <form className="admin-toolbar" onSubmit={submitSearch}><div className="admin-search"><Search size={17} /><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Tìm tiêu đề, nội dung hoặc tác giả…" /></div><CustomSelect className="admin-status-filter" value={status} onChange={(value) => { setStatus(value); setPage(1); }} options={statusOptions} ariaLabel="Lọc trạng thái bài viết" /><button type="submit">Tìm kiếm</button></form>
      <section className="admin-table-card"><div className="table-scroll"><table className="admin-table"><thead><tr><th>Bài viết</th><th>Tác giả</th><th>Ngày đăng</th><th>Trạng thái</th><th aria-label="Thao tác" /></tr></thead><tbody>{posts.data?.data.map((post) => <tr key={post.id}><td className="content-cell"><strong>{post.title}</strong><small>{post.category?.name || 'Chung'} · {post.commentCount} bình luận · {post.score} điểm</small></td><td>{post.author?.fullName || post.author?.username}</td><td>{dateFormatter.format(new Date(post.createdAt))}</td><td><StatusBadge status={post.status} /></td><td className="table-action"><div><Link className="icon-action" to={`/posts/${post.id}`} title="Xem bài viết"><ExternalLink size={16} /></Link><button className="danger-soft" disabled={post.status === 'removed' || moderate.isPending} onClick={() => { const reason = window.prompt('Lý do gỡ bài viết:'); if (reason?.trim()) moderate.mutate({ id: post.id, reason: reason.trim() }); }}><Trash2 size={15} /> Gỡ</button></div></td></tr>)}</tbody></table></div>{posts.isLoading && <div className="admin-state">Đang tải bài viết…</div>}{!posts.isLoading && posts.data?.data.length === 0 && <div className="admin-state">Không có bài viết phù hợp.</div>}<AdminPagination meta={posts.data?.meta} onPageChange={setPage} /></section>
    </>
  );
}
