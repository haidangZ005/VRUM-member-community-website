const Comment = require('../../../domain/entities/Comment');
const NotFoundError = require('../../../domain/errors/NotFoundError');

class CreateComment {
  constructor({ postRepository, commentRepository }) {
    this.postRepository = postRepository;
    this.commentRepository = commentRepository;
  }

  async execute(postId, authorId, input) {
    const post = await this.postRepository.findById(postId, authorId);
    if (!post || post.status !== 'published') throw new NotFoundError('Không tìm thấy bài viết');
    if (input.parentId) {
      const parent = await this.commentRepository.findById(input.parentId);
      if (!parent || parent.postId !== postId || parent.status !== 'visible') {
        throw new NotFoundError('Không tìm thấy bình luận để trả lời');
      }
    }
    const comment = await this.commentRepository.create(new Comment({ postId, authorId, content: input.content, images: input.images, parentId: input.parentId }));
    return comment.toJSON();
  }
}

module.exports = CreateComment;
