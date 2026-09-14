const GroqSummaryService = require('../../../../src/infrastructure/services/GroqSummaryService');

describe('GroqSummaryService', () => {
  afterEach(() => jest.restoreAllMocks());

  test('accepts a natural-language summary without requiring JSON', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Bài viết mô tả quá trình xây dựng VRUM và cách dùng AI để hỗ trợ người đọc.' } }] }),
    });
    const service = new GroqSummaryService({ apiKey: 'test-key' });

    await expect(service.summarize({ title: 'VRUM', content: 'Nội dung bài viết đủ dài để tóm tắt.' })).resolves.toEqual({
      summary: 'Bài viết mô tả quá trình xây dựng VRUM và cách dùng AI để hỗ trợ người đọc.',
      model: expect.any(String),
    });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      include_reasoning: false,
      max_completion_tokens: 1000,
      reasoning_effort: 'low',
    });
  });
});
