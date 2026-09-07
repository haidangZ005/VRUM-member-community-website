class ICommentRepository {
  async create(_comment) { throw new Error('Not implemented'); }
  async listByPost(_postId) { throw new Error('Not implemented'); }
  async findById(_id) { throw new Error('Not implemented'); }
  async update(_id, _changes) { throw new Error('Not implemented'); }
  async listAll(_options) { throw new Error('Not implemented'); }
  async moderate(_id, _status) { throw new Error('Not implemented'); }
  async countByStatus() { throw new Error('Not implemented'); }
}

module.exports = ICommentRepository;
