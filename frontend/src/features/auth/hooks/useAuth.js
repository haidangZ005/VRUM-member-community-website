import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../../../store/authStore';

export function useLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);
  return useMutation({ mutationFn: authApi.login, onSuccess: (session) => {
    setSession(session);
    navigate(location.state?.from || (session.user.role === 'admin' ? '/admin' : '/posts'), { replace: true });
  } });
}

export function useRegister() {
  const navigate = useNavigate();
  const location = useLocation();
  return useMutation({ mutationFn: authApi.register, onSuccess: () => navigate('/login', { state: { notice: 'Tài khoản đã được tạo. Bạn có thể đăng nhập ngay.', from: location.state?.from } }) });
}

export function useForgotPassword() { return useMutation({ mutationFn: authApi.forgotPassword }); }

export function useResetPassword() {
  const navigate = useNavigate();
  return useMutation({ mutationFn: authApi.resetPassword, onSuccess: () => navigate('/login', { state: { notice: 'Mật khẩu đã được cập nhật.' } }) });
}

export function useProfile() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({ queryKey: ['profile'], queryFn: authApi.getProfile, enabled: isAuthenticated });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);
  return useMutation({ mutationFn: authApi.updateProfile, onSuccess: (user) => { updateUser(user); queryClient.setQueryData(['profile'], user); } });
}

export function useLogout() {
  const navigate = useNavigate();
  const clearSession = useAuthStore((state) => state.clearSession);
  return useMutation({ mutationFn: authApi.logout, onSettled: () => { clearSession(); navigate('/login'); } });
}
