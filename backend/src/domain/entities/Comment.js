const ValidationError = require('../errors/ValidationError');
const validateImages = require('./validateImages');

class Comment {
  constructor({ id, postId, authorId, content, images = [], parentId = null, status = 'visible', author = null, post = null, createdAt, updatedAt }) {
    const normalizedContent = content?.trim();
    if (!normalizedContent || normalizedContent.length < 2 || normalizedContent.length > 2000) {
      throw new ValidationError('Bình luận phải có từ 2 đến 2000 ký tự');
    }
    if (!['visible', 'removed'].includes(status)) {
      throw new ValidationError('Trạng thái bình luận không hợp lệ');
    }
    this.id = id;
    this.postId = postId;
    this.authorId = authorId;
    this.parentId = parentId;
    this.content = normalizedContent;
    this.images = validateImages(images);
    this.status = status;
    this.author = author;
    this.post = post;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  toJSON() {
    return {
      id: this.id,
      postId: this.postId,
      authorId: this.authorId,
      parentId: this.parentId,
      content: this.content,
      images: this.images,
      status: this.status,
      author: this.author,
      post: this.post,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Comment;
