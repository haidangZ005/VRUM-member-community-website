import { Navigate, useSearchParams } from 'react-router-dom';

export default function CreatePostPage() {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('categoryId');
  if (!categoryId) return <Navigate to="/posts" replace />;
  const params = new URLSearchParams({ categoryId, create: 'true' });
  return <Navigate to={`/posts?${params}`} replace />;
}
