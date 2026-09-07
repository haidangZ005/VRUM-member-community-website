const ValidationError = require('../errors/ValidationError');

// ponytail: bounded inline images reuse PostgreSQL storage; move to object storage when media traffic grows.
function validateImages(images = []) {
  if (!Array.isArray(images) || images.length > 4) throw new ValidationError('Tối đa 4 ảnh mỗi bài đăng hoặc bình luận');
  for (const image of images) {
    if (typeof image !== 'string' || image.length > 700000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(image)) {
      throw new ValidationError('Ảnh không hợp lệ hoặc quá lớn');
    }
    const bytes = Buffer.from(image.slice(image.indexOf(',') + 1), 'base64');
    if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff || bytes[bytes.length - 2] !== 0xff || bytes[bytes.length - 1] !== 0xd9) {
      throw new ValidationError('Ảnh JPEG không hợp lệ');
    }
  }
  return images;
}

module.exports = validateImages;
