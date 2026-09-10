import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, LogOut, Search, ShieldCheck, UserPlus, UserRound } from 'lucide-react';
import { useLogout } from '../../features/auth/hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import ThemeSwitcher from '../ui/ThemeSwitcher';
import BrandLogo from '../ui/BrandLogo';

export default function CommunityHeader() {
  const logout = useLogout();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const displayName = user?.fullName || user?.username;
  const [searchInput, setSearchInput] = useState('');
  const currentCategoryId = new URLSearchParams(location.search).get('categoryId');
  return (
    <header className="community-header">
      <div className="community-header-inner">
        <Link className="brand dark" to="/posts" aria-label="VRUM - Bảng tin"><BrandLogo /></Link>
        <div className="header-search">
          <form className="topic-search" role="search" onSubmit={(event) => {
            event.preventDefault();
            const q = searchInput.trim();
            if (!q) return;
            const params = new URLSearchParams({ q });
            if (currentCategoryId) params.set('categoryId', currentCategoryId);
            navigate(`/search?${params}`);
          }}>
            <button type="submit" aria-label="Tìm kiếm"><Search size={19} /></button>
            <input type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Tìm bài viết, bình luận, cộng đồng…" aria-label="Tìm kiếm trong diễn đàn" />
          </form>
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
