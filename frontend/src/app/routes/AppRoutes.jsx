import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import LoginPage from '../../pages/auth/LoginPage';
import RegisterPage from '../../pages/auth/RegisterPage';
import ForgotPasswordPage from '../../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../../pages/auth/ResetPasswordPage';
import ProfilePage from '../../pages/profile/ProfilePage';
import ProtectedRoute from './ProtectedRoute';
import PostListPage from '../../pages/posts/PostListPage';
import PostDetailPage from '../../pages/posts/PostDetailPage';
import PostEditorPage from '../../pages/posts/PostEditorPage';
import CreatePostPage from '../../pages/posts/CreatePostPage';
import CreateCommunityDialog from '../../pages/posts/CreateCommunityDialog';
import ManageCommunitiesPage from '../../pages/posts/ManageCommunitiesPage';
import AdminRoute from './AdminRoute';
import AdminLayout from '../../components/admin/AdminLayout';
import DashboardPage from '../../pages/admin/DashboardPage';
import MemberManagementPage from '../../pages/admin/MemberManagementPage';
import PostModerationPage from '../../pages/admin/PostModerationPage';
import CommentModerationPage from '../../pages/admin/CommentModerationPage';
import CategoryManagementPage from '../../pages/admin/CategoryManagementPage';

export default function AppRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  const creatingCommunity = location.pathname.replace(/\/$/, '') === '/communities/new';
  const background = location.state?.backgroundLocation;
  const closeCommunity = () => background ? navigate(-1) : navigate('/posts', { replace: true });

  return (
    <>
    <Routes location={creatingCommunity ? background || '/posts' : location}>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/posts" element={<PostListPage />} />
      <Route path="/posts/new" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
      <Route path="/communities/manage" element={<ProtectedRoute><ManageCommunitiesPage /></ProtectedRoute>} />
      <Route path="/posts/:id" element={<PostDetailPage />} />
      <Route path="/posts/:id/edit" element={<ProtectedRoute><PostEditorPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminLayout /></AdminRoute></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="members" element={<MemberManagementPage />} />
        <Route path="posts" element={<PostModerationPage />} />
        <Route path="comments" element={<CommentModerationPage />} />
        <Route path="categories" element={<CategoryManagementPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/posts" replace />} />
    </Routes>
    {creatingCommunity && <ProtectedRoute><CreateCommunityDialog onClose={closeCommunity} /></ProtectedRoute>}
    </>
  );
}
