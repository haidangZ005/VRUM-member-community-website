const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../../src/domain/entities/User');
const Post = require('../../src/domain/entities/Post');
const Comment = require('../../src/domain/entities/Comment');
const Category = require('../../src/domain/entities/Category');

class MemoryUserRepository {
  constructor() { this.users = []; }
  async findById(id) { return this.users.find((user) => user.id === id) || null; }
  async findByEmail(email) { return this.users.find((user) => user.email === email) || null; }
  async findByUsername(username) { return this.users.find((user) => user.username.toLowerCase() === username.toLowerCase()) || null; }
  async create(user) {
    const created = new User({ ...user, id: crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date() });
    this.users.push(created);
    return created;
  }
  async updateProfile(id, profile) {
    const user = await this.findById(id);
    Object.assign(user, profile, { updatedAt: new Date() });
    return user;
  }
  async updatePassword(id, passwordHash) {
    const user = await this.findById(id);
    user.passwordHash = passwordHash;
    return user;
  }
  async listMembers({ page, limit, search }) {
    const normalized = search.toLowerCase();
    const filtered = this.users.filter((user) => user.role === 'member' && [user.username, user.email, user.fullName || ''].some((value) => value.toLowerCase().includes(normalized)));
    return { items: filtered.slice((page - 1) * limit, page * limit), total: filtered.length };
  }
  async updateStatus(id, status) {
    const user = await this.findById(id);
    user.status = status;
    user.updatedAt = new Date();
    return user;
  }
  async countByStatus() {
    const members = this.users.filter((user) => user.role === 'member');
    return { total: members.length, active: members.filter((user) => user.status === 'active').length, locked: members.filter((user) => user.status === 'locked').length };
  }
}

class MemoryRefreshTokenRepository {
  constructor() { this.tokens = []; }
  async create(token) { const record = { id: crypto.randomUUID(), ...token, revoked_at: null }; this.tokens.push(record); return record; }
  async findValidByHash(tokenHash) { return this.tokens.find((token) => token.tokenHash === tokenHash && !token.revoked_at && token.expiresAt > new Date()) || null; }
  async revokeByHash(tokenHash) { const token = this.tokens.find((item) => item.tokenHash === tokenHash); if (token) token.revoked_at = new Date(); }
  async revokeAllForUser(userId) { this.tokens.filter((token) => token.userId === userId).forEach((token) => { token.revoked_at = new Date(); }); }
}

class MemoryResetTokenRepository {
  constructor() { this.tokens = []; }
  async create(token) { const record = { id: crypto.randomUUID(), ...token, usedAt: null }; this.tokens.push(record); return record; }
  async findValidByHash(tokenHash) { return this.tokens.find((token) => token.tokenHash === tokenHash && !token.usedAt && token.expiresAt > new Date()) || null; }
  async markUsed(id) { const token = this.tokens.find((item) => item.id === id); if (token) token.usedAt = new Date(); }
  async invalidateForUser(userId) { this.tokens.filter((token) => token.userId === userId && !token.usedAt).forEach((token) => { token.usedAt = new Date(); }); }
}

class FakeHashService {
  async hash(value) { return `hashed:${value}`; }
  async compare(value, hash) { return hash === `hashed:${value}`; }
}

class FakeTokenService {
  constructor() { this.accessSecret = 'test-access-secret'; this.refreshSecret = 'test-refresh-secret'; this.lastOpaqueToken = null; }
  generateAccessToken(payload) { return jwt.sign(payload, this.accessSecret, { expiresIn: '15m' }); }
  generateRefreshToken(payload) { return jwt.sign({ ...payload, nonce: crypto.randomUUID() }, this.refreshSecret, { expiresIn: '7d' }); }
  verifyAccessToken(token) { return jwt.verify(token, this.accessSecret); }
  verifyRefreshToken(token) { return jwt.verify(token, this.refreshSecret); }
  generateOpaqueToken() { this.lastOpaqueToken = crypto.randomBytes(16).toString('hex'); return this.lastOpaqueToken; }
  hashToken(token) { return crypto.createHash('sha256').update(token).digest('hex'); }
  getExpiration(token) { return new Date(jwt.decode(token).exp * 1000); }
}

class FakeEmailService {
  constructor() { this.messages = []; }
  async sendPasswordReset(message) { this.messages.push(message); }
}

class MemoryCategoryRepository {
  constructor() {
    const now = new Date();
    this.memberships = [];
    this.mutes = [];
    this.recommendationFeedback = [];
    this.categories = [
      new Category({ id: crypto.randomUUID(), name: 'Hỏi đáp', description: 'Cùng nhau giải đáp', createdAt: now, updatedAt: now }),
      new Category({ id: crypto.randomUUID(), name: 'Chia sẻ', description: 'Kinh nghiệm thành viên', createdAt: now, updatedAt: now }),
    ];
  }
  hydrate(category, viewerId = null) {
    if (!category) return null;
    const membership = this.memberships.find((item) => item.categoryId === category.id && item.userId === viewerId);
    return new Category({ ...category.toJSON(), joinedByCurrentUser: Boolean(membership), favoriteByCurrentUser: Boolean(membership?.favorite), mutedByCurrentUser: this.mutes.some((item) => item.categoryId === category.id && item.userId === viewerId) });
  }
  async findById(id, viewerId = null) { return this.hydrate(this.categories.find((category) => category.id === id), viewerId); }
  async list({ search = '', limit, ownerId = null, viewerId = null, joinedOnly = false, favoritesOnly = false } = {}) {
    const matches = this.categories.filter((category) => {
      const membership = this.memberships.find((item) => item.categoryId === category.id && item.userId === viewerId);
      return category.name.toLowerCase().includes(search.toLowerCase()) && (!ownerId || category.ownerId === ownerId)
        && (!joinedOnly || membership) && (!favoritesOnly || membership?.favorite);
    }).map((category) => this.hydrate(category, viewerId));
    matches.sort((a, b) => Number(b.favoriteByCurrentUser) - Number(a.favoriteByCurrentUser) || a.name.localeCompare(b.name));
    return limit ? matches.slice(0, limit) : matches;
  }
  async findByName(name) { return this.categories.find((category) => category.name.toLowerCase() === name.toLowerCase()) || null; }
  async create(category) {
    const created = new Category({ ...category, id: crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date() });
    this.categories.push(created);
    if (created.ownerId) this.memberships.push({ categoryId: created.id, userId: created.ownerId, favorite: false });
    return this.hydrate(created, created.ownerId);
  }
  async update(id, changes) {
    const index = this.categories.findIndex((category) => category.id === id);
    const updated = new Category({ ...changes, id, createdAt: this.categories[index].createdAt, updatedAt: new Date() });
    this.categories[index] = updated;
    return updated;
  }
  async remove(id) {
    this.categories = this.categories.filter((category) => category.id !== id);
    this.memberships = this.memberships.filter((item) => item.categoryId !== id);
    this.mutes = this.mutes.filter((item) => item.categoryId !== id);
  }
  async join(categoryId, userId) {
    if (!this.memberships.some((item) => item.categoryId === categoryId && item.userId === userId)) this.memberships.push({ categoryId, userId, favorite: false });
    return this.findById(categoryId, userId);
  }
  async leave(categoryId, userId) {
    this.memberships = this.memberships.filter((item) => item.categoryId !== categoryId || item.userId !== userId);
    return this.findById(categoryId, userId);
  }
  async setFavorite(categoryId, userId, favorite) {
    await this.join(categoryId, userId);
    this.memberships.find((item) => item.categoryId === categoryId && item.userId === userId).favorite = favorite;
    return this.findById(categoryId, userId);
  }
  async setMuted(categoryId, userId, muted) {
    this.mutes = this.mutes.filter((item) => item.categoryId !== categoryId || item.userId !== userId);
    if (muted) this.mutes.push({ categoryId, userId });
    return this.findById(categoryId, userId);
  }
  async listRecommended(userId, limit = 5) {
    return this.categories.filter((category) => !this.memberships.some((item) => item.categoryId === category.id && item.userId === userId)
      && !this.mutes.some((item) => item.categoryId === category.id && item.userId === userId)
      && !this.recommendationFeedback.some((item) => item.categoryId === category.id && item.userId === userId)).slice(0, limit).map((category) => this.hydrate(category, userId));
  }
  async count() { return this.categories.length; }
}

class MemoryVoteRepository {
  constructor() { this.votes = []; }
  set(targetType, targetId, userId, value) {
    const previousScore = this.score(targetType, targetId);
    this.votes = this.votes.filter((vote) => vote.targetType !== targetType || vote.targetId !== targetId || vote.userId !== userId);
    if (value !== 0) this.votes.push({ targetType, targetId, userId, value });
    return { previousScore, score: this.score(targetType, targetId), viewerVote: value };
  }
  async setPostVote(postId, userId, value) { return this.set('post', postId, userId, value); }
  async setCommentVote(commentId, userId, value) { return this.set('comment', commentId, userId, value); }
  score(targetType, targetId) { return this.votes.filter((vote) => vote.targetType === targetType && vote.targetId === targetId).reduce((sum, vote) => sum + vote.value, 0); }
  viewerVote(targetType, targetId, userId) { return this.votes.find((vote) => vote.targetType === targetType && vote.targetId === targetId && vote.userId === userId)?.value || 0; }
}

class MemoryCommentRepository {
  constructor(userRepository, voteRepository) { this.comments = []; this.userRepository = userRepository; this.voteRepository = voteRepository; }
  hydrate(comment, viewerId = null) {
    return new Comment({
      ...comment.toJSON(),
      score: this.voteRepository.score('comment', comment.id),
      viewerVote: viewerId ? this.voteRepository.viewerVote('comment', comment.id, viewerId) : 0,
    });
  }
  async create(comment) {
    const user = await this.userRepository.findById(comment.authorId);
    const post = this.postRepository?.posts.find((item) => item.id === comment.postId);
    const created = new Comment({
      ...comment,
      id: crypto.randomUUID(),
      author: user ? { id: user.id, username: user.username, fullName: user.fullName, avatarUrl: user.avatarUrl } : null,
      post: post ? { id: post.id, title: post.title } : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.comments.push(created);
    return this.hydrate(created, comment.authorId);
  }
  async listByPost(postId, viewerId = null) { return this.comments.filter((comment) => comment.postId === postId && comment.status === 'visible').map((comment) => this.hydrate(comment, viewerId)); }
  countByPost(postId) { return this.comments.filter((comment) => comment.postId === postId && comment.status === 'visible').length; }
  async findById(id) { return this.comments.find((comment) => comment.id === id) || null; }
  async listAll({ page, limit, search, status }) {
    const normalized = search.toLowerCase();
    const filtered = this.comments.filter((comment) => (!status || comment.status === status)
      && [comment.content, comment.author?.username || '', comment.post?.title || ''].some((value) => value.toLowerCase().includes(normalized)));
    return { items: filtered.slice((page - 1) * limit, page * limit), total: filtered.length };
  }
  async moderate(id, status) { const comment = await this.findById(id); comment.status = status; comment.updatedAt = new Date(); return comment; }
  async countByStatus() {
    return { total: this.comments.length, visible: this.comments.filter((comment) => comment.status === 'visible').length, removed: this.comments.filter((comment) => comment.status === 'removed').length };
  }
}

class MemoryPostRepository {
  constructor(userRepository, categoryRepository, voteRepository, commentRepository) {
    this.posts = [];
    this.userRepository = userRepository;
    this.categoryRepository = categoryRepository;
    this.voteRepository = voteRepository;
    this.commentRepository = commentRepository;
    this.views = [];
    this.hidden = [];
    this.feedback = [];
  }
  async hydrate(post, viewerId = null) {
    const user = await this.userRepository.findById(post.authorId);
    const category = post.categoryId ? await this.categoryRepository.findById(post.categoryId) : null;
    return new Post({
      ...post,
      author: user ? { id: user.id, username: user.username, fullName: user.fullName, avatarUrl: user.avatarUrl } : null,
      category: category ? { id: category.id, name: category.name } : null,
      score: this.voteRepository.score('post', post.id),
      commentCount: this.commentRepository.countByPost(post.id),
      viewerVote: viewerId ? this.voteRepository.viewerVote('post', post.id, viewerId) : 0,
    });
  }
  async create(post) {
    const created = new Post({ ...post, id: crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date() });
    this.posts.push(created);
    return this.hydrate(created, post.authorId);
  }
  async list({ page, limit, categoryId, viewerId, feed = 'all', sort = 'new' }) {
    const effectiveFeed = viewerId || feed !== 'home' ? feed : 'popular';
    const filtered = this.posts.filter((post) => post.status === 'published' && (!categoryId || post.categoryId === categoryId)
      && (!viewerId || !this.hidden.some((item) => item.postId === post.id && item.userId === viewerId))
      && (effectiveFeed === 'all' || !viewerId || !this.categoryRepository.mutes.some((item) => item.categoryId === post.categoryId && item.userId === viewerId))
      && (effectiveFeed !== 'home' || !viewerId || this.categoryRepository.memberships.some((item) => item.categoryId === post.categoryId && item.userId === viewerId)
        || !this.feedback.some((item) => item.categoryId === post.categoryId && item.userId === viewerId)));
    if (sort === 'hot' || sort === 'top') filtered.sort((a, b) => this.voteRepository.score('post', b.id) - this.voteRepository.score('post', a.id));
    if (effectiveFeed === 'home' && viewerId) filtered.sort((a, b) => {
      const joinedDifference = Number(this.categoryRepository.memberships.some((item) => item.categoryId === b.categoryId && item.userId === viewerId))
        - Number(this.categoryRepository.memberships.some((item) => item.categoryId === a.categoryId && item.userId === viewerId));
      if (joinedDifference) return joinedDifference;
      return Number(this.views.some((item) => item.postId === a.id && item.userId === viewerId))
        - Number(this.views.some((item) => item.postId === b.id && item.userId === viewerId));
    });
    const pageItems = filtered.slice((page - 1) * limit, page * limit);
    return { items: await Promise.all(pageItems.map((post) => this.hydrate(post, viewerId))), total: filtered.length };
  }
  async findById(id, viewerId = null) {
    const post = this.posts.find((item) => item.id === id);
    return post ? this.hydrate(post, viewerId) : null;
  }
  async update(id, changes, viewerId = null) {
    const post = this.posts.find((item) => item.id === id);
    Object.assign(post, changes, { updatedAt: new Date() });
    return this.hydrate(post, viewerId);
  }
  async remove(id) { const post = this.posts.find((item) => item.id === id); if (post) post.status = 'removed'; }
  async recordView(id, userId) {
    this.views = this.views.filter((item) => item.postId !== id || item.userId !== userId);
    this.views.push({ postId: id, userId, viewedAt: new Date() });
  }
  async setHidden(id, userId, hidden) {
    this.hidden = this.hidden.filter((item) => item.postId !== id || item.userId !== userId);
    if (hidden) this.hidden.push({ postId: id, userId });
  }
  async markNotInterested(id, categoryId, userId) {
    if (!this.feedback.some((item) => item.postId === id && item.userId === userId)) {
      this.feedback.push({ postId: id, categoryId, userId });
      this.categoryRepository.recommendationFeedback.push({ categoryId, userId });
    }
  }
  async listAll({ page, limit, search, status }) {
    const normalized = search.toLowerCase();
    const filtered = this.posts.filter((post) => (!status || post.status === status)
      && [post.title, post.content].some((value) => value.toLowerCase().includes(normalized)));
    const items = await Promise.all(filtered.slice((page - 1) * limit, page * limit).map((post) => this.hydrate(post)));
    return { items, total: filtered.length };
  }
  async countByStatus() {
    return { total: this.posts.length, published: this.posts.filter((post) => post.status === 'published').length, removed: this.posts.filter((post) => post.status === 'removed').length };
  }
}

class MemorySearchRepository {
  constructor({ postRepository, commentRepository, categoryRepository, userRepository, voteRepository }) {
    Object.assign(this, { postRepository, commentRepository, categoryRepository, userRepository, voteRepository });
  }
  matches(value, q) { return value.toLowerCase().includes(q.toLowerCase()); }
  inScope(item, filters) {
    return (!filters.categoryId || item.categoryId === filters.categoryId)
      && (!filters.authorId || item.authorId === filters.authorId)
      && (!filters.from || item.createdAt >= new Date(filters.from))
      && (!filters.to || item.createdAt <= new Date(filters.to));
  }
  page(items, filters) {
    const offset = (filters.page - 1) * filters.limit;
    return { items: items.slice(offset, offset + filters.limit), total: items.length };
  }
  postResult(post) {
    const author = this.userRepository.users.find((user) => user.id === post.authorId);
    const category = this.categoryRepository.categories.find((item) => item.id === post.categoryId);
    return { id: post.id, title: post.title, excerpt: post.content, author: { id: author.id, username: author.username, fullName: author.fullName, avatarUrl: author.avatarUrl }, community: category ? { id: category.id, name: category.name } : null, score: this.voteRepository.score('post', post.id), commentCount: this.commentRepository.countByPost(post.id), createdAt: post.createdAt };
  }
  async searchPosts(filters) {
    return this.page(this.postRepository.posts.filter((post) => post.status === 'published' && this.inScope(post, filters) && this.matches(`${post.title} ${post.content}`, filters.q)).map((post) => this.postResult(post)), filters);
  }
  async searchComments(filters) {
    const items = this.commentRepository.comments.filter((comment) => {
      const parentPost = this.postRepository.posts.find((post) => post.id === comment.postId);
      return comment.status === 'visible' && parentPost?.status === 'published'
        && this.inScope({ ...comment, categoryId: parentPost.categoryId }, filters) && this.matches(comment.content, filters.q);
    }).map((comment) => {
      const author = this.userRepository.users.find((user) => user.id === comment.authorId);
      const post = this.postRepository.posts.find((item) => item.id === comment.postId);
      return { id: comment.id, postId: post.id, postTitle: post.title, excerpt: comment.content, author: { id: author.id, username: author.username, fullName: author.fullName, avatarUrl: author.avatarUrl }, community: null, score: this.voteRepository.score('comment', comment.id), createdAt: comment.createdAt };
    });
    return this.page(items, filters);
  }
  async searchCommunities(filters) {
    return this.page(this.categoryRepository.categories.filter((category) => this.matches(`${category.name} ${category.description || ''}`, filters.q)).map((category) => ({ id: category.id, name: category.name, description: category.description, avatarUrl: category.avatarUrl })), filters);
  }
  async searchUsers(filters) {
    return this.page(this.userRepository.users.filter((user) => user.status === 'active' && this.matches(`${user.username} ${user.fullName || ''}`, filters.q)).map((user) => ({ id: user.id, username: user.username, fullName: user.fullName, avatarUrl: user.avatarUrl })), filters);
  }
  async searchMedia(filters) {
    const posts = this.postRepository.posts.filter((post) => post.status === 'published' && post.images.length && this.inScope(post, filters) && this.matches(`${post.title} ${post.content}`, filters.q)).map((post) => ({ ...this.postResult(post), postId: post.id, targetType: 'post', thumbnail: filters.includeThumbnail ? post.images[0] : null }));
    const comments = this.commentRepository.comments.filter((comment) => {
      const parentPost = this.postRepository.posts.find((post) => post.id === comment.postId);
      return comment.status === 'visible' && parentPost?.status === 'published' && comment.images.length
        && this.inScope({ ...comment, categoryId: parentPost.categoryId }, filters) && this.matches(comment.content, filters.q);
    }).map((comment) => ({ id: comment.id, postId: comment.postId, targetType: 'comment', title: comment.post?.title, excerpt: comment.content, thumbnail: filters.includeThumbnail ? comment.images[0] : null, createdAt: comment.createdAt }));
    return this.page([...posts, ...comments], filters);
  }
}

class MemoryNotificationRepository {
  constructor(categoryRepository) {
    this.categoryRepository = categoryRepository;
    this.notifications = [];
    this.preferences = [];
  }
  async create(notification) {
    if (!notification.recipientId || notification.recipientId === notification.actorId) return null;
    const preference = this.preferences.find((item) => item.userId === notification.recipientId && item.type === notification.type);
    if (notification.type !== 'CONTENT_MODERATED' && preference?.inAppEnabled === false) return null;
    const ordinary = ['POST_COMMENT', 'COMMENT_REPLY', 'MENTION', 'POST_VOTE_MILESTONE'].includes(notification.type);
    if (ordinary && notification.categoryId && this.categoryRepository.mutes.some((item) => item.userId === notification.recipientId && item.categoryId === notification.categoryId)) return null;
    if (notification.dedupeKey && this.notifications.some((item) => item.dedupeKey === notification.dedupeKey)) return null;
    const created = { id: crypto.randomUUID(), ...notification, actor: null, readAt: null, createdAt: new Date() };
    this.notifications.push(created);
    return created;
  }
  async list(recipientId, { page, limit, unreadOnly }) {
    const filtered = this.notifications.filter((item) => item.recipientId === recipientId && (!unreadOnly || !item.readAt)).sort((a, b) => b.createdAt - a.createdAt);
    return { items: filtered.slice((page - 1) * limit, page * limit), total: filtered.length };
  }
  async unreadCount(recipientId) { return this.notifications.filter((item) => item.recipientId === recipientId && !item.readAt).length; }
  async markRead(id, recipientId) { const item = this.notifications.find((entry) => entry.id === id && entry.recipientId === recipientId); if (item && !item.readAt) item.readAt = new Date(); return item || null; }
  async markAllRead(recipientId) { const unread = this.notifications.filter((item) => item.recipientId === recipientId && !item.readAt); unread.forEach((item) => { item.readAt = new Date(); }); return unread.length; }
  async getPreferences(userId) {
    return ['POST_COMMENT', 'COMMENT_REPLY', 'MENTION', 'POST_VOTE_MILESTONE'].map((type) => ({ type, inAppEnabled: this.preferences.find((item) => item.userId === userId && item.type === type)?.inAppEnabled ?? true }));
  }
  async updatePreferences(userId, preferences) {
    for (const preference of preferences) {
      this.preferences = this.preferences.filter((item) => item.userId !== userId || item.type !== preference.type);
      this.preferences.push({ userId, ...preference });
    }
    return this.getPreferences(userId);
  }
}

function makeFakeDependencies() {
  const userRepository = new MemoryUserRepository();
  const categoryRepository = new MemoryCategoryRepository();
  const voteRepository = new MemoryVoteRepository();
  const commentRepository = new MemoryCommentRepository(userRepository, voteRepository);
  const postRepository = new MemoryPostRepository(userRepository, categoryRepository, voteRepository, commentRepository);
  commentRepository.postRepository = postRepository;
  const searchRepository = new MemorySearchRepository({ postRepository, commentRepository, categoryRepository, userRepository, voteRepository });
  const notificationRepository = new MemoryNotificationRepository(categoryRepository);
  return {
    userRepository,
    refreshTokenRepository: new MemoryRefreshTokenRepository(),
    resetTokenRepository: new MemoryResetTokenRepository(),
    hashService: new FakeHashService(),
    tokenService: new FakeTokenService(),
    emailService: new FakeEmailService(),
    categoryRepository,
    postRepository,
    commentRepository,
    voteRepository,
    searchRepository,
    notificationRepository,
    unitOfWork: { run: (work) => work({ postRepository, commentRepository, voteRepository, notificationRepository }) },
  };
}

module.exports = { makeFakeDependencies };
