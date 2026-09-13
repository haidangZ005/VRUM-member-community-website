import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AtSign, Camera, Mail, ShieldCheck, UserRound } from 'lucide-react';
import FormField from '../../components/ui/FormField';
import SubmitButton from '../../components/ui/SubmitButton';
import { useProfile, useUpdateProfile } from '../../features/auth/hooks/useAuth';
import { profileSchema } from '../../features/auth/schema/authSchema';
import CommunityHeader from '../../components/layout/CommunityHeader';
import { prepareAvatarImage } from '../../utils/communityAvatar';

export default function ProfilePage() {
  const profile = useProfile();
  const update = useUpdateProfile();
  const [imageError, setImageError] = useState('');
  const [readingImage, setReadingImage] = useState(false);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({ resolver: zodResolver(profileSchema), defaultValues: { fullName: '', username: '', avatarUrl: '' } });
  const avatarUrl = watch('avatarUrl');
  const avatarInitial = (profile.data?.fullName || profile.data?.username || 'M').slice(0, 1).toUpperCase();

  useEffect(() => {
    if (profile.data) reset({ fullName: profile.data.fullName || '', username: profile.data.username, avatarUrl: profile.data.avatarUrl || '' });
  }, [profile.data, reset]);

  const chooseImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    update.reset();
    setImageError('');
    setReadingImage(true);
    try {
      setValue('avatarUrl', await prepareAvatarImage(file), { shouldDirty: true, shouldValidate: true });
    } catch (error) {
      setImageError(error.message);
    } finally {
      setReadingImage(false);
      event.target.value = '';
    }
  };

  const removeAvatar = () => {
    update.reset();
    setImageError('');
    setValue('avatarUrl', '', { shouldDirty: true, shouldValidate: true });
  };

  if (profile.isLoading) return <div className="page-loader">Đang tải hồ sơ...</div>;
  return (
    <main className="profile-page">
      <CommunityHeader />
      <section className="profile-hero">
        <div><p className="eyebrow"><ShieldCheck size={15} /> Tài khoản thành viên</p><h1>Hồ sơ của bạn</h1><p>Cập nhật cách bạn xuất hiện trong những cuộc trò chuyện của cộng đồng.</p></div>
        <div className="avatar-card">{avatarUrl ? <img src={avatarUrl} alt="Ảnh đại diện hiện tại" /> : <span>{avatarInitial}</span>}<small><Camera size={14} /> Ảnh đại diện</small></div>
      </section>
      <section className="profile-card">
        <div className="profile-card-head"><div><h2>Thông tin cá nhân</h2><p>Email và vai trò được quản lý an toàn bởi hệ thống.</p></div><span className="status-pill">● Đang hoạt động</span></div>
        <form className="profile-form" onSubmit={handleSubmit((values) => { if (!readingImage) update.mutate(values); })} noValidate>
          {update.isSuccess && <div className="alert success">Đã lưu thay đổi hồ sơ.</div>}
          {update.error && <div className="alert error">{update.error.response?.data?.error?.message || 'Không thể cập nhật hồ sơ.'}</div>}
          <div className="field-grid">
            <FormField label="Họ và tên" icon={UserRound} error={errors.fullName?.message}><input {...register('fullName')} /></FormField>
            <FormField label="Tên người dùng" icon={AtSign} error={errors.username?.message}><input {...register('username')} /></FormField>
          </div>
          <FormField label="Email" icon={Mail}><input value={profile.data?.email || ''} disabled /></FormField>
          <input type="hidden" {...register('avatarUrl')} />
          <section className="profile-avatar-editor" aria-labelledby="profile-avatar-title">
            <div className="profile-avatar-preview" aria-hidden="true">{avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{avatarInitial}</span>}</div>
            <div className="profile-avatar-copy">
              <strong id="profile-avatar-title">Ảnh đại diện</strong>
              <p>Chọn ảnh JPG, PNG hoặc WebP tối đa 5 MB. Ảnh sẽ được cắt vuông và thu nhỏ tự động.</p>
              <div className="profile-avatar-actions">
                <label className={`profile-avatar-upload${readingImage ? ' disabled' : ''}`}>
                  <Camera size={17} /> {readingImage ? 'Đang xử lý ảnh…' : 'Chọn ảnh'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" disabled={update.isPending || readingImage} onChange={chooseImage} />
                </label>
                {avatarUrl && <button type="button" className="text-button" disabled={update.isPending || readingImage} onClick={removeAvatar}>Bỏ ảnh</button>}
              </div>
              {(imageError || errors.avatarUrl?.message) && <small className="field-error" role="alert">{imageError || errors.avatarUrl?.message}</small>}
            </div>
          </section>
          <div className="profile-actions"><SubmitButton isPending={update.isPending} disabled={readingImage}>Lưu thay đổi</SubmitButton></div>
        </form>
      </section>
    </main>
  );
}
