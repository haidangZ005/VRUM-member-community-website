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
  async findByUsername(username) { return this.users.find((user) => user.username === username) || null; }
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
    this.categories = [
      new Category({ id: crypto.randomUUID(), name: 'Hỏi đáp', description: 'Cùng nhau giải đáp', createdAt: now, updatedAt: now }),
      new Category({ id: crypto.randomUUID(), name: 'Chia sẻ', description: 'Kinh nghiệm thành viên', createdAt: now, updatedAt: now }),
    ];
  }
  hydrate(category, viewerId = null) {
    if (!category) return null;
    const membership = this.memberships.find((item) => item.categoryId === category.id && item.userId === viewerId);
    return new Category({ ...category.toJSON(), joinedByCurrentUser: Boolean(membership), favoriteByCurrentUser: Boolean(membership?.favorite) });
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
  async count() { return this.categories.length; }
}

class MemoryVoteRepository {
  constructor() { this.votes = []; }
  set(targetType, targetId, userId, value) {
    this.votes = this.votes.filter((vote) => vote.targetType !== targetType || vote.targetId !== targetId || vote.userId !== userId);
    if (value !== 0) this.votes.push({ targetType, targetId, userId, value });
    return { score: this.score(targetType, targetId), viewerVote: value };
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
  async list({ page, limit, categoryId, viewerId, sort = 'latest' }) {
    const filtered = this.posts.filter((post) => post.status === 'published' && (!categoryId || post.categoryId === categoryId));
    if (sort === 'popular') filtered.sort((a, b) => this.voteRepository.score('post', b.id) - this.voteRepository.score('post', a.id));
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

function makeFakeDependencies() {
  const userRepository = new MemoryUserRepository();
  const categoryRepository = new MemoryCategoryRepository();
  const voteRepository = new MemoryVoteRepository();
  const commentRepository = new MemoryCommentRepository(userRepository, voteRepository);
  const postRepository = new MemoryPostRepository(userRepository, categoryRepository, voteRepository, commentRepository);
  commentRepository.postRepository = postRepository;
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
  };
}

module.exports = { makeFakeDependencies };
