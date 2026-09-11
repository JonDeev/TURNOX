import { Injectable } from '@nestjs/common';
import { argon2, randomBytes, timingSafeEqual } from 'node:crypto';

const ALGORITHM = 'argon2id';
const VERSION = 19;
const MEMORY_KIB = 19_456;
const PASSES = 2;
const PARALLELISM = 1;
const TAG_LENGTH = 32;

function encode(value: Buffer): string {
  return value.toString('base64').replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

function decode(value: string): Buffer {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  return Buffer.from(normalized + '='.repeat((4 - (normalized.length % 4)) % 4), 'base64');
}

@Injectable()
export class PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const tag = await this.derive(password, salt, MEMORY_KIB, PASSES, PARALLELISM, TAG_LENGTH);

    return `$${ALGORITHM}$v=${VERSION}$m=${MEMORY_KIB},t=${PASSES},p=${PARALLELISM}$${encode(salt)}$${encode(tag)}`;
  }

  async verify(password: string, encoded: string | null | undefined): Promise<boolean> {
    if (encoded === null || encoded === undefined) return false;

    try {
      const parts = encoded.split('$');
      if (parts.length !== 6 || parts[1] !== ALGORITHM || parts[2] !== `v=${VERSION}`) return false;
      const parameterEntries = parts[3]!.split(',').map((part) => {
        const separator = part.indexOf('=');
        return [part.slice(0, separator), part.slice(separator + 1)] as const;
      });
      const parameters = new Map(parameterEntries);
      const memory = Number(parameters.get('m'));
      const passes = Number(parameters.get('t'));
      const parallelism = Number(parameters.get('p'));
      const salt = decode(parts[4]!);
      const expected = decode(parts[5]!);
      if (
        !Number.isSafeInteger(memory) ||
        !Number.isSafeInteger(passes) ||
        !Number.isSafeInteger(parallelism) ||
        salt.length < 8 ||
        expected.length === 0
      ) {
        return false;
      }

      const actual = await this.derive(
        password,
        salt,
        memory,
        passes,
        parallelism,
        expected.length,
      );
      return actual.length === expected.length && timingSafeEqual(actual, expected);
    } catch {
      return false;
    }
  }

  private derive(
    password: string,
    salt: Buffer,
    memory: number,
    passes: number,
    parallelism: number,
    tagLength: number,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      argon2(
        ALGORITHM,
        {
          message: Buffer.from(password, 'utf8'),
          nonce: salt,
          memory,
          passes,
          parallelism,
          tagLength,
        },
        (error, tag) => (error === null ? resolve(tag) : reject(error)),
      );
    });
  }
}
