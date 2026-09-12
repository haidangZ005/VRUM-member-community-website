const ValidationError = require('../errors/ValidationError');

class Category {
  constructor({ id, name, description = null, avatarUrl = null, ownerId = null, joinedByCurrentUser = false, favoriteByCurrentUser = false, mutedByCurrentUser = false, createdAt, updatedAt }) {
    const normalizedName = name?.trim();
    const normalizedDescription = description?.trim() || null;
    if (!normalizedName || normalizedName.length < 2 || normalizedName.length > 100) {
      throw new ValidationError('Tên chuyên mục phải có từ 2 đến 100 ký tự');
    }
    if (normalizedDescription && normalizedDescription.length > 500) {
      throw new ValidationError('Mô tả chuyên mục tối đa 500 ký tự');
    }
    this.id = id;
    this.name = normalizedName;
    this.description = normalizedDescription;
    if (avatarUrl !== null && !['thinkpad', 'framework', 'linux', 'questions', 'sharing', 'projects', 'technology', 'life'].some((icon) => avatarUrl === `/community-icons/${icon}.svg`)) {
      if (typeof avatarUrl !== 'string' || avatarUrl.length > 90000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(avatarUrl)) {
        throw new ValidationError('Ảnh đại diện phải là ảnh JPEG thu nhỏ, tối đa 90.000 ký tự');
      }
      const bytes = Buffer.from(avatarUrl.slice(23), 'base64');
      if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9) {
        throw new ValidationError('Dữ liệu ảnh đại diện không hợp lệ');
      }
    }
    this.avatarUrl = avatarUrl;
    this.ownerId = ownerId;
    this.joinedByCurrentUser = Boolean(joinedByCurrentUser);
    this.favoriteByCurrentUser = Boolean(favoriteByCurrentUser);
    this.mutedByCurrentUser = Boolean(mutedByCurrentUser);
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      avatarUrl: this.avatarUrl,
      ownerId: this.ownerId,
      joinedByCurrentUser: this.joinedByCurrentUser,
      favoriteByCurrentUser: this.favoriteByCurrentUser,
      mutedByCurrentUser: this.mutedByCurrentUser,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Category;
