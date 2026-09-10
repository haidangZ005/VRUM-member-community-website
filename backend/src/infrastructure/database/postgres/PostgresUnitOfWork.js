const pool = require('./connection');

class PostgresUnitOfWork {
  constructor({ postRepository, commentRepository, voteRepository, notificationRepository }) {
    Object.assign(this, { postRepository, commentRepository, voteRepository, notificationRepository });
  }

  async run(work) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work({
        postRepository: {
          create: (post) => this.postRepository.create(post, client),
          findById: (id, viewerId) => this.postRepository.findById(id, viewerId, client),
          update: (id, changes, viewerId) => this.postRepository.update(id, changes, viewerId, client),
          remove: (id) => this.postRepository.remove(id, client),
        },
        commentRepository: {
          create: (comment) => this.commentRepository.create(comment, client),
          findById: (id, viewerId) => this.commentRepository.findById(id, viewerId, client),
          update: (id, changes) => this.commentRepository.update(id, changes, client),
          moderate: (id, status) => this.commentRepository.moderate(id, status, client),
        },
        voteRepository: {
          setPostVote: (postId, userId, value) => this.voteRepository.setPostVote(postId, userId, value, client),
        },
        notificationRepository: {
          create: (notification) => this.notificationRepository.create(notification, client),
        },
      });
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = PostgresUnitOfWork;
