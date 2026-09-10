class IPostRepository {
  async create(_post) { throw new Error('Not implemented'); }
  async list(_options) { throw new Error('Not implemented'); }
  async findById(_id, _viewerId) { throw new Error('Not implemented'); }
  async update(_id, _changes, _viewerId) { throw new Error('Not implemented'); }
  async remove(_id) { throw new Error('Not implemented'); }
  async recordView(_id, _userId) { throw new Error('Not implemented'); }
  async setHidden(_id, _userId, _hidden) { throw new Error('Not implemented'); }
  async markNotInterested(_id, _categoryId, _userId) { throw new Error('Not implemented'); }
  async listAll(_options) { throw new Error('Not implemented'); }
  async countByStatus() { throw new Error('Not implemented'); }
}

module.exports = IPostRepository;
