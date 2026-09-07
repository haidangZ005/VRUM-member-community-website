const ValidationError = require('../errors/ValidationError');
const validateImages = require('./validateImages');

class Post {
  constructor({
    id,
    authorId,
    categoryId = null,
    title,
    content,
    images = [],
    status = 'published',
    author = null,
    category = null,
    likeCount = 0,
    commentCount = 0,
    likedByCurrentUser = false,
    createdAt,
    updatedAt,
  }) {
    const normalizedTitle = title?.trim();
    const normalizedContent = content?.trim();
    if (!normalizedTitle || normalizedTitle.length < 5 || normalizedTitle.length > 255) {
      throw new ValidationError('Tiêu đề phải có từ 5 đến 255 ký tự');
    }
    if (!normalizedContent || normalizedContent.length < 10) {
      throw new ValidationError('Nội dung bài viết phải có ít nhất 10 ký tự');
    }
    if (!['published', 'removed'].includes(status)) {
      throw new ValidationError('Trạng thái bài viết không hợp lệ');
    }

    this.id = id;
    this.authorId = authorId;
    this.categoryId = categoryId;
    this.title = normalizedTitle;
    this.content = normalizedContent;
    this.images = validateImages(images);
    this.status = status;
    this.author = author;
    this.category = category;
    this.likeCount = Number(likeCount) || 0;
    this.commentCount = Number(commentCount) || 0;
    this.likedByCurrentUser = Boolean(likedByCurrentUser);
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  toJSON() {
    return {
      id: this.id,
      authorId: this.authorId,
      categoryId: this.categoryId,
      title: this.title,
      content: this.content,
      images: this.images,
      status: this.status,
      author: this.author,
      category: this.category,
      likeCount: this.likeCount,
      commentCount: this.commentCount,
      likedByCurrentUser: this.likedByCurrentUser,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Post;
