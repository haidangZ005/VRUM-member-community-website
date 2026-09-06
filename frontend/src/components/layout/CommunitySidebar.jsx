import { useEffect, useState } from 'react';
import { Home, Plus, Settings, Star, TrendingUp } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useCategories } from '../../features/posts/hooks/usePosts';
import { useAuthStore } from '../../store/authStore';
import { readRecentCommunities, rememberCommunity } from '../../utils/recentCommunities';
import CommunityAvatar from '../ui/CommunityAvatar';

export default function CommunitySidebar({ selectedCategory = null }) {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('categoryId') || '';
  const sort = searchParams.get('sort') === 'popular' ? 'popular' : 'latest';
  const recentKey = `vrum.recentCommunities.${user?.id || 'guest'}`;
  const [recentCommunities, setRecentCommunities] = useState(() => readRecentCommunities(window.localStorage, recentKey));
  const favorites = useCategories({ favorites: 'true', limit: 10 });

  useEffect(() => {
    if (selectedCategory?.id) {
      setRecentCommunities(rememberCommunity(window.localStorage, recentKey, { id: selectedCategory.id, name: selectedCategory.name, avatarUrl: selectedCategory.avatarUrl }));
    } else {
      setRecentCommunities(readRecentCommunities(window.localStorage, recentKey));
    }
  }, [recentKey, selectedCategory?.id, selectedCategory?.name, selectedCategory?.avatarUrl]);

  return (
    <aside className="community-sidebar">
      <nav aria-label="Điều hướng diễn đàn">
        <Link className={location.pathname === '/posts' && !categoryId && sort === 'latest' ? 'active' : ''} to="/posts"><Home size={19} /> Trang chủ</Link>
        <Link className={location.pathname === '/posts' && !categoryId && sort === 'popular' ? 'active' : ''} to="/posts?sort=popular"><TrendingUp size={19} /> Phổ biến</Link>
        <Link to="/communities/new" state={{ backgroundLocation: location }}><Plus size={20} /> Bắt đầu một cộng đồng</Link>
      </nav>
      <section className="sidebar-section">
        <h2>Gần đây</h2>
        {recentCommunities.length > 0 ? <nav aria-label="Cộng đồng đã xem gần đây">
          {recentCommunities.map((item) => <Link className={categoryId === item.id ? 'active' : ''} key={item.id} to={`/posts?categoryId=${encodeURIComponent(item.id)}`}><CommunityAvatar avatarUrl={item.avatarUrl} /><span>{item.name}</span></Link>)}
        </nav> : <p className="sidebar-empty">Cộng đồng bạn mở sẽ xuất hiện tại đây.</p>}
      </section>
      <section className="sidebar-section">
        <h2>Cộng đồng</h2>
        <nav aria-label="Cộng đồng của bạn">
          <Link className={location.pathname === '/communities/manage' ? 'active' : ''} to="/communities/manage"><Settings size={19} /> Quản lý cộng đồng</Link>
          {favorites.data?.map((item) => <Link className={categoryId === item.id ? 'active' : ''} key={item.id} to={`/posts?categoryId=${encodeURIComponent(item.id)}`}><CommunityAvatar avatarUrl={item.avatarUrl} /><span>{item.name}</span><Star className="sidebar-favorite" size={14} fill="currentColor" aria-label="Yêu thích" /></Link>)}
        </nav>
      </section>
    </aside>
  );
}
