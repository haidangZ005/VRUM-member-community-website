import { Link, useLocation } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import LoginForm from '../../features/auth/components/LoginForm';

export default function LoginPage() {
  const location = useLocation();
  return (
    <AuthLayout eyebrow="Chào mừng trở lại" description="Đăng nhập để đăng bài, bình luận và tham gia các cộng đồng bạn quan tâm.">
      {location.state?.notice && <div className="alert success" role="status">{location.state.notice}</div>}
      <LoginForm />
      <div className="single-link"><Link to="/forgot-password">Quên mật khẩu?</Link></div>
      <p className="switch-copy">Chưa là thành viên? <Link to="/register" state={{ from: location.state?.from }}>Tạo tài khoản</Link></p>
    </AuthLayout>
  );
}
