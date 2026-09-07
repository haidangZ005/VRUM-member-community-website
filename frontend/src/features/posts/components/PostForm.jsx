import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ArrowLeft, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { postSchema } from '../schema/postSchema';
import { useCategories } from '../hooks/usePosts';
import CustomSelect from '../../../components/ui/CustomSelect';
import ImageAttachments from '../../../components/ui/ImageAttachments';

export default function PostForm({ initialValues, fixedCategory, onSubmit, isPending, submitLabel, onCancel }) {
  const [readingImages, setReadingImages] = useState(false);
  const categories = useCategories(undefined, !fixedCategory);
  const { control, register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(postSchema),
    defaultValues: { title: '', content: '', images: [], categoryId: fixedCategory?.id || '' },
  });

  useEffect(() => {
    if (initialValues) reset({ title: initialValues.title, content: initialValues.content, images: initialValues.images || [], categoryId: initialValues.categoryId || '' });
  }, [initialValues, reset]);

  return (
    <form className="editor-card" onSubmit={handleSubmit((values) => { if (!readingImages && !isPending) onSubmit(values); })} noValidate>
      {fixedCategory ? <div className="editor-field"><span>Chủ đề</span><div className="editor-topic-context"><strong>{fixedCategory.name}</strong><small>Bài đăng sẽ xuất hiện trong chủ đề này.</small></div><input type="hidden" value={fixedCategory.id} {...register('categoryId')} /></div> : <div className="editor-field"><span>Chủ đề</span><Controller name="categoryId" control={control} render={({ field }) => <CustomSelect value={field.value} onChange={field.onChange} ariaLabel="Chọn chủ đề" options={[{ value: '', label: 'Chưa phân loại' }, ...(categories.data || []).map((category) => ({ value: category.id, label: category.name }))]} />} /></div>}
      <label className="editor-field"><span>Tiêu đề</span><input autoFocus placeholder="Một tiêu đề rõ ràng giúp mọi người dễ tham gia…" {...register('title')} />{errors.title && <small>{errors.title.message}</small>}</label>
      <label className="editor-field"><span>Nội dung</span><textarea rows="12" placeholder="Chia sẻ bối cảnh, góc nhìn hoặc câu hỏi của bạn…" {...register('content')} />{errors.content && <small>{errors.content.message}</small>}</label>
      <Controller name="images" control={control} render={({ field }) => <ImageAttachments value={field.value} onChange={field.onChange} disabled={isPending} onBusyChange={setReadingImages} />} />
      {readingImages && <p role="status">Đang xử lý ảnh, vui lòng chờ trước khi đăng.</p>}
      <div className="editor-actions">{onCancel ? <button className="text-button" type="button" onClick={onCancel} disabled={isPending}>Hủy</button> : <Link className="text-button" to={initialValues ? `/posts/${initialValues.id}` : '/posts'}><ArrowLeft size={17} /> Quay lại</Link>}<button className="primary-button editor-submit" type="submit" disabled={isPending}><Send size={17} /> {isPending ? 'Đang lưu…' : submitLabel}</button></div>
    </form>
  );
}
