const { z } = require('zod');
const validateImages = require('../../../domain/entities/validateImages');
const imagesSchema = z.array(z.string().max(700000)).max(4).refine((images) => {
  try { validateImages(images); return true; } catch { return false; }
}, 'Ảnh không hợp lệ hoặc quá lớn').optional();

const optionalCategory = z.union([z.uuid('Chuyên mục không hợp lệ'), z.null()]).optional();

const createPostSchema = z.object({
  images: imagesSchema,
  title: z.string().trim().min(5, 'Tiêu đề phải có ít nhất 5 ký tự').max(255, 'Tiêu đề tối đa 255 ký tự'),
  content: z.string().trim().min(10, 'Nội dung phải có ít nhất 10 ký tự'),
  categoryId: z.uuid('Hãy chọn chủ đề trước khi tạo bài đăng'),
}).strict();

const updatePostSchema = z.object({
  images: imagesSchema,
  title: z.string().trim().min(5, 'Tiêu đề phải có ít nhất 5 ký tự').max(255, 'Tiêu đề tối đa 255 ký tự').optional(),
  content: z.string().trim().min(10, 'Nội dung phải có ít nhất 10 ký tự').optional(),
  categoryId: optionalCategory,
}).strict().refine((value) => Object.keys(value).length > 0, 'Cần cung cấp ít nhất một thay đổi');

const createCommentSchema = z.object({
  images: imagesSchema,
  content: z.string().trim().min(2, 'Bình luận phải có ít nhất 2 ký tự').max(2000, 'Bình luận tối đa 2000 ký tự'),
  parentId: z.uuid('Mã bình luận không hợp lệ').nullable().optional(),
}).strict();

const updateCommentSchema = createCommentSchema.omit({ parentId: true });
const commentIdSchema = z.object({ id: z.uuid(), commentId: z.uuid() });

const postIdSchema = z.object({ id: z.uuid('Mã bài viết không hợp lệ') });
const categoryIdSchema = z.object({ id: z.uuid('Mã cộng đồng không hợp lệ') });
const listPostsSchema = z.object({
  page: z.coerce.number().int().positive('Trang phải lớn hơn 0').optional(),
  limit: z.coerce.number().int().positive('Số bài mỗi trang phải lớn hơn 0').max(50, 'Tối đa 50 bài mỗi trang').optional(),
  categoryId: z.uuid('Chuyên mục không hợp lệ').optional(),
  sort: z.enum(['latest', 'popular']).optional(),
});
const listCategoriesSchema = z.object({
  id: z.uuid('Chuyên mục không hợp lệ').optional(),
  search: z.string().trim().max(100, 'Từ khóa tối đa 100 ký tự').optional(),
  limit: z.coerce.number().int().positive('Giới hạn phải lớn hơn 0').max(20, 'Tối đa 20 chủ đề').optional(),
  mine: z.literal('true').optional(),
  joined: z.literal('true').optional(),
  favorites: z.literal('true').optional(),
});

module.exports = { createPostSchema, updatePostSchema, createCommentSchema, updateCommentSchema, commentIdSchema, postIdSchema, categoryIdSchema, listPostsSchema, listCategoriesSchema };
