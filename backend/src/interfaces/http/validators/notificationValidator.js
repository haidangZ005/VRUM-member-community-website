const { z } = require('zod');

const preferenceType = z.enum(['POST_COMMENT', 'COMMENT_REPLY', 'MENTION', 'POST_VOTE_MILESTONE']);
const notificationListSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(50).optional().default(20),
  unreadOnly: z.enum(['true', 'false']).transform((value) => value === 'true').optional().default(false),
});
const notificationIdSchema = z.object({ id: z.uuid('Mã thông báo không hợp lệ') });
const preferencesSchema = z.object({
  preferences: z.array(z.object({ type: preferenceType, inAppEnabled: z.boolean() }).strict()).min(1).max(5),
}).strict();

module.exports = { notificationListSchema, notificationIdSchema, preferencesSchema };
