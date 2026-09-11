import { defineConfig } from 'prisma/config';

export default defineConfig({
  datasource: {
    // Generate does not need a live database; migrations still fail clearly if this fallback is unreachable.
    url: process.env.DATABASE_URL ?? 'postgresql://turnox:turnox_dev@127.0.0.1:5432/turnox',
  },
  migrations: {
    path: 'prisma/migrations',
  },
  schema: 'prisma/schema.prisma',
});
