import { useEffect, useState } from 'react';
import { Globe2, Home, Plus, Settings, Star, TrendingUp } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useCategories, useRecommendedCategories } from '../../features/posts/hooks/usePosts';
import { useAuthStore } from '../../store/authStore';
import { readRecentCommunities, rememberCommunity } from '../../utils/recentCommunities';
import CommunityAvatar from '../ui/CommunityAvatar';
import { parseFeed } from '../../features/posts/feedOptions';

export default function CommunitySidebar({ selectedCategory = null }) {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('categoryId') || '';
  const feed = parseFeed(searchParams.get('feed'));
  const recentKey = `vrum.recentCommunities.${user?.id || 'guest'}`;
  const [recentCommunities, setRecentCommunities] = useState(() => readRecentCommunities(window.localStorage, recentKey));
  const favorites = useCategories({ favorites: 'true', limit: 10 });
  const recommended = useRecommendedCategories(5);

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
        <Link className={location.pathname === '/posts' && !categoryId && feed === 'home' ? 'active' : ''} to="/posts?feed=home"><Home size={19} /> Trang chủ</Link>
        <Link className={location.pathname === '/posts' && !categoryId && feed === 'popular' ? 'active' : ''} to="/posts?feed=popular"><TrendingUp size={19} /> Phổ biến</Link>
        <Link className={location.pathname === '/posts' && !categoryId && feed === 'all' ? 'active' : ''} to="/posts?feed=all"><Globe2 size={19} /> Tất cả</Link>
        <Link to={user ? '/communities/new' : '/login'} state={user ? { backgroundLocation: location } : { from: '/communities/new' }}><Plus size={20} /> Bắt đầu một cộng đồng</Link>
      </nav>
      <section className="sidebar-section">
        <h2>Gần đây</h2>
        {recentCommunities.length > 0 ? <nav aria-label="Cộng đồng đã xem gần đây">
          {recentCommunities.map((item) => <Link className={categoryId === item.id ? 'active' : ''} key={item.id} to={`/posts?categoryId=${encodeURIComponent(item.id)}`}><CommunityAvatar avatarUrl={item.avatarUrl} /><span>{item.name}</span></Link>)}
        </nav> : <p className="sidebar-empty">Cộng đồng bạn mở sẽ xuất hiện tại đây.</p>}
      </section>
      {user && recommended.data?.length > 0 && <section className="sidebar-section">
        <h2>Gợi ý cho bạn</h2>
        <nav aria-label="Cộng đồng được gợi ý">
          {recommended.data.map((item) => <Link key={item.id} to={`/posts?categoryId=${encodeURIComponent(item.id)}`}><CommunityAvatar avatarUrl={item.avatarUrl} /><span>{item.name}</span></Link>)}
        </nav>
      </section>}
      <section className="sidebar-section">
        <h2>Cộng đồng</h2>
        <nav aria-label="Cộng đồng của bạn">
          <Link className={location.pathname === '/communities/manage' ? 'active' : ''} to={user ? '/communities/manage' : '/login'} state={user ? undefined : { from: '/communities/manage' }}><Settings size={19} /> Quản lý cộng đồng</Link>
          {favorites.data?.map((item) => <Link className={categoryId === item.id ? 'active' : ''} key={item.id} to={`/posts?categoryId=${encodeURIComponent(item.id)}`}><CommunityAvatar avatarUrl={item.avatarUrl} /><span>{item.name}</span><Star className="sidebar-favorite" size={14} fill="currentColor" aria-label="Yêu thích" /></Link>)}
        </nav>
      </section>
    </aside>
  );
}
