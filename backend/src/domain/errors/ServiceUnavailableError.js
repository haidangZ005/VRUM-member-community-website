const DomainError = require('./DomainError');

class ServiceUnavailableError extends DomainError {
  constructor(message) {
    super(message, { code: 'SERVICE_UNAVAILABLE', statusCode: 503 });
  }
}

module.exports = ServiceUnavailableError;
