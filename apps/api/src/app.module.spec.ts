import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';

process.env.DATABASE_URL ??= 'postgresql://turnox:turnox_test@localhost:5432/turnox';

import { AppModule } from './app.module.js';

describe('API foundation', () => {
  it('can compile the root Nest module', async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();

    expect(module).toBeDefined();
    await module.close();
  });
});
