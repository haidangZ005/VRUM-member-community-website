const NotFoundError = require('../../../domain/errors/NotFoundError');
const postSummaryVersion = require('./postSummaryVersion');

class SummarizePost {
  constructor({ postRepository, postSummaryRepository, summaryService }) {
    this.postRepository = postRepository;
    this.postSummaryRepository = postSummaryRepository;
    this.summaryService = summaryService;
    this.inFlight = new Map();
  }

  async execute(postId) {
    const post = await this.postRepository.findById(postId);
    if (!post || post.status !== 'published') throw new NotFoundError('Không tìm thấy bài viết');

    const sourceVersion = postSummaryVersion(post);
    const cached = await this.postSummaryRepository.findFresh(post.id, sourceVersion);
    if (cached) return { ...cached, cached: true };

    const requestKey = `${post.id}:${sourceVersion}`;
    if (this.inFlight.has(requestKey)) return this.inFlight.get(requestKey);

    const generation = this.generateAndCache(post, sourceVersion);
    this.inFlight.set(requestKey, generation);
    try {
      return await generation;
    } finally {
      if (this.inFlight.get(requestKey) === generation) this.inFlight.delete(requestKey);
    }
  }

  async generateAndCache(post, sourceVersion) {
    const generatedByAnotherRequest = await this.postSummaryRepository.findFresh(post.id, sourceVersion);
    if (generatedByAnotherRequest) return { ...generatedByAnotherRequest, cached: true };

    const generated = await this.summaryService.summarize({ title: post.title, content: post.content });
    const saved = await this.postSummaryRepository.save({
      postId: post.id,
      summary: generated.summary,
      model: generated.model,
      sourceVersion,
    });
    return { ...saved, cached: false };
  }
}

module.exports = SummarizePost;
