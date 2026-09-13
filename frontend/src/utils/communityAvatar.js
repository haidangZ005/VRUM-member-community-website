export async function prepareAvatarImage(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Chọn ảnh JPG, PNG hoặc WebP.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Ảnh tối đa 5 MB.');
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, 256, 256);
    const side = Math.min(bitmap.width, bitmap.height);
    context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 256, 256);
    const avatar = canvas.toDataURL('image/jpeg', 0.82);
    if (avatar.length > 90000) throw new Error('Ảnh sau khi thu nhỏ vẫn quá lớn.');
    return avatar;
  } catch (error) {
    if (error instanceof Error && error.message === 'Ảnh sau khi thu nhỏ vẫn quá lớn.') throw error;
    throw new Error('Không thể đọc ảnh này. Hãy thử ảnh JPG, PNG hoặc WebP khác.');
  } finally {
    bitmap?.close();
  }
}

export const prepareCommunityAvatar = prepareAvatarImage;
