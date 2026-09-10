const Post = require('../../../domain/entities/Post');
const NotFoundError = require('../../../domain/errors/NotFoundError');
const ValidationError = require('../../../domain/errors/ValidationError');

class CreatePost {
  constructor({ categoryRepository, notificationPublisher, unitOfWork }) {
    this.categoryRepository = categoryRepository;
    this.notificationPublisher = notificationPublisher;
    this.unitOfWork = unitOfWork;
  }

  async execute(authorId, input) {
    if (!input.categoryId) throw new ValidationError('Hãy chọn chủ đề trước khi tạo bài đăng');
    if (!(await this.categoryRepository.findById(input.categoryId))) {
      throw new NotFoundError('Không tìm thấy chủ đề');
    }
    return this.unitOfWork.run(async ({ postRepository, notificationRepository }) => {
      const created = await postRepository.create(new Post({ ...input, authorId }));
      await this.notificationPublisher.postCreated({ post: created, notificationRepository });
      return created.toJSON();
    });
  }
}

module.exports = CreatePost;
