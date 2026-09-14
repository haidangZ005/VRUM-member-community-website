import { useState } from 'react';
import { LockKeyhole, Search, UnlockKeyhole, UsersRound } from 'lucide-react';
import AdminPagination from '../../components/admin/AdminPagination';
import StatusBadge from '../../components/admin/StatusBadge';
import UserAvatar from '../../components/ui/UserAvatar';
import { useAdminMembers, useMemberStatus } from '../../features/admin/hooks/useAdmin';

const dateFormatter = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' });

export default function MemberManagementPage() {
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const members = useAdminMembers({ page, limit: 10, search: search || undefined });
  const updateStatus = useMemberStatus();
  const submitSearch = (event) => { event.preventDefault(); setSearch(draft.trim()); setPage(1); };
  return (
    <>
      <header className="admin-page-header"><div><p className="eyebrow"><UsersRound size={15} /> Thành viên</p><h1>Quản lý thành viên</h1><p>Tìm kiếm tài khoản và kiểm soát quyền truy cập cộng đồng.</p></div></header>
      <form className="admin-toolbar" onSubmit={submitSearch}><div className="admin-search"><Search size={17} /><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Tìm theo tên, email hoặc tên người dùng…" /></div><button type="submit">Tìm kiếm</button></form>
      {updateStatus.error && <div className="alert error">{updateStatus.error.response?.data?.error?.message || 'Không thể cập nhật thành viên.'}</div>}
      <section className="admin-table-card"><div className="table-scroll"><table className="admin-table"><thead><tr><th>Thành viên</th><th>Email</th><th>Ngày tham gia</th><th>Trạng thái</th><th aria-label="Thao tác" /></tr></thead><tbody>{members.data?.data.map((member) => { const name = member.fullName || member.username; return <tr key={member.id}><td><div className="table-person"><UserAvatar user={member} small /><div><strong>{name}</strong><small>@{member.username}</small></div></div></td><td>{member.email}</td><td>{dateFormatter.format(new Date(member.createdAt))}</td><td><StatusBadge status={member.status} /></td><td className="table-action"><button className={member.status === 'active' ? 'danger-soft' : 'success-soft'} disabled={updateStatus.isPending} onClick={() => updateStatus.mutate({ id: member.id, status: member.status })}>{member.status === 'active' ? <><LockKeyhole size={15} /> Khóa</> : <><UnlockKeyhole size={15} /> Mở khóa</>}</button></td></tr>; })}</tbody></table></div>{members.isLoading && <div className="admin-state">Đang tải thành viên…</div>}{!members.isLoading && members.data?.data.length === 0 && <div className="admin-state">Không tìm thấy thành viên phù hợp.</div>}<AdminPagination meta={members.data?.meta} onPageChange={setPage} /></section>
    </>
  );
}
