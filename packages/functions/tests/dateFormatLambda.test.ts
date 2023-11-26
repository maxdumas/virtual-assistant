import { afterEach, describe, expect, it, vi } from 'vitest';

describe('dateFormatLambda', async () => {
  it('calling the germanHandler', async () => {
    const { germanDateHandler } = await import('../src/germanDateHandler');
    const esmOnlyPackageLambda = await import('../src/dateHelper');
    vi.spyOn(esmOnlyPackageLambda, 'getGermanDateString').mockReturnValue('10.10.2021');
    const result = await germanDateHandler({} as any);
    expect(result.status).toEqual(200);
    expect(result.body).toBe('It is about time to have some fun with Bun: 10.10.2021');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
});
