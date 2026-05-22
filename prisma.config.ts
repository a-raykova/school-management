import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  //direct connection for migrations (not pooler on :6543)
  datasource: {
    url: env('DIRECT_URL'),
  },
})
