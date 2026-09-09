import { Link, useLocation } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import RegisterForm from '../../features/auth/components/RegisterForm';

export default function RegisterPage() {
  const location = useLocation();
  return (
    <AuthLayout eyebrow="Gia nhập cộng đồng" title="Tạo nơi thuộc về bạn" description="Một tài khoản, hàng nghìn câu chuyện và những kết nối đang chờ bạn.">
      <RegisterForm />
      <p className="switch-copy">Đã có tài khoản? <Link to="/login" state={{ from: location.state?.from }}>Đăng nhập</Link></p>
    </AuthLayout>
  );
}

