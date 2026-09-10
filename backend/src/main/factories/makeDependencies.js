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

function makeDependencies() {
  return {
    userRepository: new PostgresUserRepository(),
    refreshTokenRepository: new PostgresRefreshTokenRepository(),
    resetTokenRepository: new PostgresPasswordResetTokenRepository(),
    hashService: new BcryptHashService(),
    tokenService: new JwtTokenService(),
    emailService: new NodemailerEmailService(),
    postRepository: new PostgresPostRepository(),
    commentRepository: new PostgresCommentRepository(),
    voteRepository: new PostgresVoteRepository(),
    categoryRepository: new PostgresCategoryRepository(),
    searchRepository: new PostgresSearchRepository(),
  };
}

module.exports = makeDependencies;
