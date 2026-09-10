class IVoteRepository {
  async setPostVote(_postId, _userId, _value) { throw new Error('Not implemented'); }
  async setCommentVote(_commentId, _userId, _value) { throw new Error('Not implemented'); }
}

module.exports = IVoteRepository;
