import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { LogIn, LogOut, Search, ShieldCheck, UserPlus, UserRound } from 'lucide-react';
import { useLogout } from '../../features/auth/hooks/useAuth';
import { useCategories } from '../../features/posts/hooks/usePosts';
import { useAuthStore } from '../../store/authStore';
import ThemeSwitcher from '../ui/ThemeSwitcher';
import BrandLogo from '../ui/BrandLogo';

export default function CommunityHeader() {
  const logout = useLogout();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const displayName = user?.fullName || user?.username;
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const results = useCategories({ search: searchQuery, limit: 8 }, Boolean(searchQuery));
  return (
    <header className="community-header">
      <div className="community-header-inner">
        <Link className="brand dark" to="/posts" aria-label="VRUM - Bảng tin"><BrandLogo /></Link>
        <div className="header-search">
          <form className="topic-search" role="search" onSubmit={(event) => { event.preventDefault(); setSearchQuery(searchInput.trim()); }}>
            <button type="submit" aria-label="Tìm kiếm"><Search size={19} /></button>
            <input type="search" value={searchInput} onChange={(event) => { setSearchInput(event.target.value); if (!event.target.value.trim()) setSearchQuery(''); }} placeholder="Tìm kiếm trong diễn đàn" aria-label="Tìm kiếm trong diễn đàn" />
          </form>
          {searchQuery && <div className="topic-results" aria-live="polite">
            {results.isLoading && <p>Đang tìm cộng đồng…</p>}
            {results.error && <p>Không thể tìm kiếm. Vui lòng thử lại.</p>}
            {results.data?.map((item) => <Link key={item.id} to={`/posts?categoryId=${encodeURIComponent(item.id)}`} onClick={() => { setSearchInput(''); setSearchQuery(''); }}><strong>{item.name}</strong><span>{item.description || 'Xem các bài đăng trong cộng đồng này'}</span></Link>)}
            {!results.isLoading && results.data?.length === 0 && <p>Không tìm thấy cộng đồng phù hợp.</p>}
          </div>}
        </div>
        {user?.role === 'admin' && <nav className="community-nav" aria-label="Điều hướng quản trị"><NavLink to="/admin"><ShieldCheck size={16} /> Quản trị</NavLink></nav>}
        <div className="account-menu">
          <ThemeSwitcher />
          {user ? <>
            <Link className="account-link" to="/profile"><UserRound size={17} /><span>{displayName}</span></Link>
            <button className="icon-button" type="button" title="Đăng xuất" aria-label="Đăng xuất" onClick={() => logout.mutate()} disabled={logout.isPending}><LogOut size={18} /></button>
          </> : <>
            <Link className="account-link" to="/login" state={{ from: `${location.pathname}${location.search}${location.hash}` }}><LogIn size={17} /><span>Đăng nhập</span></Link>
            <Link className="account-link" to="/register" state={{ from: `${location.pathname}${location.search}${location.hash}` }}><UserPlus size={17} /><span>Đăng ký</span></Link>
          </>}
        </div>
      </div>
    </header>
  );
}
