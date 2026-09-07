import { z } from 'zod';

export const postSchema = z.object({
  images: z.array(z.string()).max(4).default([]),
  title: z.string().trim().min(5, 'Tiêu đề cần ít nhất 5 ký tự').max(255, 'Tiêu đề tối đa 255 ký tự'),
  content: z.string().trim().min(10, 'Nội dung cần ít nhất 10 ký tự'),
  categoryId: z.string().optional(),
});
