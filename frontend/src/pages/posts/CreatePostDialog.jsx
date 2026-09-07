import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import PostForm from '../../features/posts/components/PostForm';
import { useCreatePost } from '../../features/posts/hooks/usePosts';

export default function CreatePostDialog({ category, onClose }) {
  const dialog = useRef(null);
  const create = useCreatePost({ stayOnFeed: true });
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  return <dialog ref={dialog} className="create-community-dialog create-post-dialog" aria-labelledby="create-post-title" onCancel={(event) => { event.preventDefault(); if (!create.isPending) onClose(); }}>
    <header className="community-dialog-heading"><h1 id="create-post-title">Tạo bài đăng</h1><button className="community-dialog-close" type="button" aria-label="Đóng cửa sổ tạo bài đăng" disabled={create.isPending} onClick={onClose}><X size={22} /></button></header>
    {create.error && <div className="alert error" role="alert">{create.error.response?.data?.error?.message || 'Không thể tạo bài đăng. Vui lòng thử lại.'}</div>}
    <PostForm fixedCategory={category} submitLabel="Tạo bài đăng" isPending={create.isPending} onCancel={onClose} onSubmit={(values) => create.mutate(values, { onSuccess: onClose })} />
  </dialog>;
}
