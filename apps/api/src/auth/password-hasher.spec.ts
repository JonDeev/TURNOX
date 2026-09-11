import { describe, expect, it } from 'vitest';

import { PasswordHasher } from './password-hasher.js';

describe('PasswordHasher', () => {
  it('creates Argon2id PHC hashes and verifies only the original password', async () => {
    const hasher = new PasswordHasher();
    const encoded = await hasher.hash('correct horse battery staple');

    expect(encoded).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/u);
    expect(await hasher.verify('correct horse battery staple', encoded)).toBe(true);
    expect(await hasher.verify('wrong password', encoded)).toBe(false);
    expect(encoded).not.toContain('correct horse battery staple');
  });
});
