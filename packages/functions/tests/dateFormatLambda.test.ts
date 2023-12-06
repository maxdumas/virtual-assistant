import { afterEach, describe, expect, it, vi } from 'vitest';

describe('dateFormatLambda', async () => {
  it('calling the germanHandler', async () => {
    const { germanDateHandler } = await import('../src/germanDateHandler.js');
    const esmOnlyPackageLambda = await import('../src/dateHelper.js');
    vi.spyOn(esmOnlyPackageLambda, 'getGermanDateString').mockReturnValue('10.10.2021');
    const result = await germanDateHandler({} as any);
    expect(result.status).toEqual(200);
    expect(await result.text()).toBe('It is about time to have some fun with Bun: 10.10.2021');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
});
