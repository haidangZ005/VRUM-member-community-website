import { useId, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

async function prepareImage(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Chọn ảnh JPG, PNG hoặc WebP.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Mỗi ảnh tối đa 5 MB.');
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    let result = canvas.toDataURL('image/jpeg', .8);
    if (result.length > 700000) result = canvas.toDataURL('image/jpeg', .55);
    if (result.length > 700000) throw new Error('Ảnh vẫn quá lớn sau khi thu nhỏ. Vui lòng chọn ảnh nhỏ hơn.');
    return result;
  } finally { bitmap.close(); }
}

export function AttachedImages({ images = [] }) {
  if (!images.length) return null;
  return <div className="attached-images">{images.map((src, index) => <img key={index} src={src} alt={`Ảnh đính kèm ${index + 1}`} loading="lazy" />)}</div>;
}

export default function ImageAttachments({ value = [], onChange, disabled, onBusyChange }) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const select = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    setError('');
    if (files.length + value.length > 4) { setError('Tối đa 4 ảnh. Hãy bỏ bớt ảnh trước khi thêm.'); return; }
    setBusy(true); onBusyChange?.(true);
    try {
      const added = [];
      for (const file of files) added.push(await prepareImage(file));
      onChange([...value, ...added]);
    } catch (problem) { setError(problem.message || 'Không thể đọc ảnh. Vui lòng chọn ảnh khác.'); }
    finally { setBusy(false); onBusyChange?.(false); }
  };
  return <div className="image-attachments">
    <label htmlFor={id}><ImagePlus size={18} /> {busy ? 'Đang xử lý ảnh…' : 'Thêm ảnh'}</label>
    <input id={id} type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={disabled || busy || value.length >= 4} onChange={select} aria-describedby={`${id}-hint`} />
    <small id={`${id}-hint`}>Tối đa 4 ảnh JPG, PNG hoặc WebP, 5 MB/ảnh. Ảnh được thu nhỏ để tải nhanh hơn.</small>
    {error && <p className="alert error" role="alert">{error}</p>}
    <div className="attachment-previews">{value.map((src, index) => <div key={index}><img src={src} alt={`Xem trước ảnh ${index + 1}`} /><button type="button" aria-label={`Bỏ ảnh ${index + 1}`} disabled={disabled || busy} onClick={() => onChange(value.filter((_, position) => position !== index))}><X size={16} /></button></div>)}</div>
  </div>;
}
