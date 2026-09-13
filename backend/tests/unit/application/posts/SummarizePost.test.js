const SummarizePost = require('../../../../src/application/use-cases/posts/SummarizePost');
const GetPostSummary = require('../../../../src/application/use-cases/posts/GetPostSummary');

describe('SummarizePost', () => {
  const updatedAt = new Date('2026-09-13T08:00:00.000Z');
  let dependencies;

  beforeEach(() => {
    dependencies = {
      postRepository: {
        findById: jest.fn().mockResolvedValue({ id: 'post-1', title: 'Một bài viết dài', content: 'Nội dung đủ dài để cần được tóm tắt.', status: 'published', updatedAt }),
      },
      postSummaryRepository: {
        findFresh: jest.fn().mockResolvedValue(null),
        save: jest.fn().mockResolvedValue({ summary: 'Ba ý chính.', model: 'test-model', generatedAt: updatedAt }),
      },
      summaryService: { summarize: jest.fn().mockResolvedValue({ summary: 'Ba ý chính.', model: 'test-model' }) },
    };
  });

  test('generates and saves a missing summary', async () => {
    const result = await new SummarizePost(dependencies).execute('post-1');

    expect(dependencies.summaryService.summarize).toHaveBeenCalledWith({ title: 'Một bài viết dài', content: 'Nội dung đủ dài để cần được tóm tắt.' });
    expect(dependencies.postSummaryRepository.save).toHaveBeenCalledWith(expect.objectContaining({ postId: 'post-1' }));
    expect(result).toEqual(expect.objectContaining({ summary: 'Ba ý chính.', cached: false }));
  });

  test('returns a fresh cached summary without calling the LLM', async () => {
    dependencies.postSummaryRepository.findFresh.mockResolvedValue({ summary: 'Bản đã lưu.', model: 'test-model', generatedAt: updatedAt });

    const result = await new SummarizePost(dependencies).execute('post-1');

    expect(result).toEqual(expect.objectContaining({ summary: 'Bản đã lưu.', cached: true }));
    expect(dependencies.summaryService.summarize).not.toHaveBeenCalled();
  });

  test('rechecks the cache immediately before generation', async () => {
    dependencies.postSummaryRepository.findFresh
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ summary: 'Vừa được request khác tạo.', model: 'test-model', generatedAt: updatedAt });

    const result = await new SummarizePost(dependencies).execute('post-1');

    expect(result).toEqual(expect.objectContaining({ summary: 'Vừa được request khác tạo.', cached: true }));
    expect(dependencies.summaryService.summarize).not.toHaveBeenCalled();
  });

  test('shares one LLM request between simultaneous calls for the same post version', async () => {
    let finishGeneration;
    dependencies.summaryService.summarize.mockReturnValue(new Promise((resolve) => { finishGeneration = resolve; }));
    const useCase = new SummarizePost(dependencies);

    const first = useCase.execute('post-1');
    const second = useCase.execute('post-1');
    await Promise.resolve();
    await Promise.resolve();
    finishGeneration({ summary: 'Một lần duy nhất.', model: 'test-model' });

    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
    expect(dependencies.summaryService.summarize).toHaveBeenCalledTimes(1);
  });

  test('reads an existing summary without generating one', async () => {
    dependencies.postSummaryRepository.findFresh.mockResolvedValue({ summary: 'Bản công khai.', model: 'test-model', generatedAt: updatedAt });

    const result = await new GetPostSummary(dependencies).execute('post-1');

    expect(result).toEqual(expect.objectContaining({ summary: 'Bản công khai.' }));
    expect(dependencies.summaryService.summarize).not.toHaveBeenCalled();
  });

  test('rejects missing or removed posts', async () => {
    dependencies.postRepository.findById.mockResolvedValue({ status: 'removed' });
    await expect(new SummarizePost(dependencies).execute('post-1')).rejects.toThrow('Không tìm thấy bài viết');
  });
});
