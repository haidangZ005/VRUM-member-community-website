const crypto = require('crypto');

function postSummaryVersion(post) {
  return crypto.createHash('sha256').update(post.title).update('\0').update(post.content).digest('hex');
}

module.exports = postSummaryVersion;
