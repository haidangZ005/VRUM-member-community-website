import { Navigate, useSearchParams } from 'react-router-dom';

export default function CreatePostPage() {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('categoryId');
  const params = new URLSearchParams({ create: 'true' });
  if (categoryId) params.set('categoryId', categoryId);
  return <Navigate to={`/posts?${params}`} replace />;
}
