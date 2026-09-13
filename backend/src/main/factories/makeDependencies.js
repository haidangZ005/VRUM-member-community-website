const PostgresUserRepository = require('../../infrastructure/database/postgres/repositories/PostgresUserRepository');
const PostgresRefreshTokenRepository = require('../../infrastructure/database/postgres/repositories/PostgresRefreshTokenRepository');
const PostgresPasswordResetTokenRepository = require('../../infrastructure/database/postgres/repositories/PostgresPasswordResetTokenRepository');
const BcryptHashService = require('../../infrastructure/services/BcryptHashService');
const JwtTokenService = require('../../infrastructure/services/JwtTokenService');
const NodemailerEmailService = require('../../infrastructure/services/NodemailerEmailService');
const PostgresPostRepository = require('../../infrastructure/database/postgres/repositories/PostgresPostRepository');
const PostgresCommentRepository = require('../../infrastructure/database/postgres/repositories/PostgresCommentRepository');
const PostgresVoteRepository = require('../../infrastructure/database/postgres/repositories/PostgresVoteRepository');
const PostgresCategoryRepository = require('../../infrastructure/database/postgres/repositories/PostgresCategoryRepository');
const PostgresSearchRepository = require('../../infrastructure/database/postgres/repositories/PostgresSearchRepository');
const PostgresNotificationRepository = require('../../infrastructure/database/postgres/repositories/PostgresNotificationRepository');
const PostgresPostSummaryRepository = require('../../infrastructure/database/postgres/repositories/PostgresPostSummaryRepository');
const PostgresUnitOfWork = require('../../infrastructure/database/postgres/PostgresUnitOfWork');
const GroqSummaryService = require('../../infrastructure/services/GroqSummaryService');

function makeDependencies() {
  const postRepository = new PostgresPostRepository();
  const commentRepository = new PostgresCommentRepository();
  const voteRepository = new PostgresVoteRepository();
  const notificationRepository = new PostgresNotificationRepository();
  return {
    userRepository: new PostgresUserRepository(),
    refreshTokenRepository: new PostgresRefreshTokenRepository(),
    resetTokenRepository: new PostgresPasswordResetTokenRepository(),
    hashService: new BcryptHashService(),
    tokenService: new JwtTokenService(),
    emailService: new NodemailerEmailService(),
    postRepository,
    commentRepository,
    voteRepository,
    categoryRepository: new PostgresCategoryRepository(),
    searchRepository: new PostgresSearchRepository(),
    notificationRepository,
    postSummaryRepository: new PostgresPostSummaryRepository(),
    summaryService: new GroqSummaryService(),
    unitOfWork: new PostgresUnitOfWork({ postRepository, commentRepository, voteRepository, notificationRepository }),
  };
}

module.exports = makeDependencies;
