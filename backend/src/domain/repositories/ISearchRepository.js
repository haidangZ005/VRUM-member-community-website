class ISearchRepository {
  async searchPosts(_filters) { throw new Error('Not implemented'); }
  async searchComments(_filters) { throw new Error('Not implemented'); }
  async searchCommunities(_filters) { throw new Error('Not implemented'); }
  async searchUsers(_filters) { throw new Error('Not implemented'); }
  async searchMedia(_filters) { throw new Error('Not implemented'); }
}

module.exports = ISearchRepository;
