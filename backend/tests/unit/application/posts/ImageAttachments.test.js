const validateImages = require('../../../../src/domain/entities/validateImages');
const Post = require('../../../../src/domain/entities/Post');
const Comment = require('../../../../src/domain/entities/Comment');
const { createCommentSchema, createPostSchema } = require('../../../../src/interfaces/http/validators/postValidator');

const jpeg = `data:image/jpeg;base64,${Buffer.from([255, 216, 255, 224, 0, 0, 255, 217]).toString('base64')}`;
test('bounded JPEG attachments survive entity serialization', () => {
  expect(validateImages([jpeg])).toEqual([jpeg]);
  expect(new Post({ title: 'Post with images', content: 'A description of the image.', images: [jpeg] }).toJSON().images).toEqual([jpeg]);
  expect(new Comment({ content: 'Image comment', images: [jpeg] }).toJSON().images).toEqual([jpeg]);
});
test.each([
  ['javascript:alert(1)'], ['data:image/svg+xml;base64,PHN2Zz4='], ['https://example.com/image.jpg'],
  ['data:image/jpeg;base64,aGVsbG8='], Array(5).fill(jpeg), [`data:image/jpeg;base64,${'A'.repeat(700000)}`], null,
])('rejects unsupported or oversized attachments', (images) => {
  expect(() => validateImages(images)).toThrow();
});
test('API validates image inputs and rejects changes to reply parent on edit', () => {
  expect(createCommentSchema.safeParse({ content: 'Hello', images: [jpeg] }).success).toBe(true);
  expect(createPostSchema.safeParse({ title: 'Image post', content: 'Image description', categoryId: 'b515af1f-4fce-42e1-81b7-fb99d9ee8b73', images: ['bad'] }).success).toBe(false);
});
