class ICategoryRepository {
  async findById(_id) { throw new Error('Not implemented'); }
  async list(_filters) { throw new Error('Not implemented'); }
  async findByName(_name) { throw new Error('Not implemented'); }
  async create(_category) { throw new Error('Not implemented'); }
  async update(_id, _changes) { throw new Error('Not implemented'); }
  async remove(_id) { throw new Error('Not implemented'); }
  async join(_categoryId, _userId) { throw new Error('Not implemented'); }
  async leave(_categoryId, _userId) { throw new Error('Not implemented'); }
  async setFavorite(_categoryId, _userId, _favorite) { throw new Error('Not implemented'); }
  async setMuted(_categoryId, _userId, _muted) { throw new Error('Not implemented'); }
  async listRecommended(_userId, _limit) { throw new Error('Not implemented'); }
  async count() { throw new Error('Not implemented'); }
}

module.exports = ICategoryRepository;
