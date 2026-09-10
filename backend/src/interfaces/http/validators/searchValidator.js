const { z } = require('zod');

const dateTime = z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Thời gian không hợp lệ').optional();

const searchSchema = z.object({
  q: z.string().trim().min(1, 'Hãy nhập từ khóa tìm kiếm').max(200, 'Từ khóa tối đa 200 ký tự'),
  type: z.enum(['all', 'posts', 'comments', 'communities', 'users', 'media']).optional().default('all'),
  categoryId: z.uuid('Cộng đồng không hợp lệ').optional(),
  authorId: z.uuid('Tác giả không hợp lệ').optional(),
  from: dateTime,
  to: dateTime,
  sort: z.enum(['relevance', 'new', 'top']).optional().default('relevance'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(50).optional().default(20),
}).refine((value) => !value.from || !value.to || new Date(value.from) <= new Date(value.to), {
  message: 'Thời gian bắt đầu phải trước thời gian kết thúc',
});

module.exports = { searchSchema };
