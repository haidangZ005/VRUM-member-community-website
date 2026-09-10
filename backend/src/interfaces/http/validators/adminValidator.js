const { z } = require('zod');

const idParamSchema = z.object({ id: z.uuid('Mã dữ liệu không hợp lệ') });

const memberListSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
  search: z.string().trim().max(100).optional(),
});

const postModerationListSchema = memberListSchema.extend({ status: z.enum(['published', 'removed']).optional() });
const commentModerationListSchema = memberListSchema.extend({ status: z.enum(['visible', 'removed']).optional() });
const moderationSchema = z.object({ reason: z.string().trim().min(5, 'Lý do phải có ít nhất 5 ký tự').max(500, 'Lý do tối đa 500 ký tự') }).strict();

const categorySchema = z.object({
  name: z.string().trim().min(2, 'Tên chuyên mục phải có ít nhất 2 ký tự').max(100, 'Tên chuyên mục tối đa 100 ký tự'),
  description: z.string().trim().max(500, 'Mô tả tối đa 500 ký tự').nullable().optional(),
  avatarUrl: z.string().max(90000, 'Ảnh đại diện quá lớn').nullable().optional(),
}).strict();

module.exports = { idParamSchema, memberListSchema, postModerationListSchema, commentModerationListSchema, moderationSchema, categorySchema };
