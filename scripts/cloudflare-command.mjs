import nextEnv from '@next/env'
import { spawnSync } from 'node:child_process'

const command = process.argv[2]
if (!['deploy', 'preview'].includes(command)) throw new Error('Expected deploy or preview.')
nextEnv.loadEnvConfig(process.cwd())
// OpenNext creates a local platform proxy even for deployment. Supply its
// Hyperdrive connection from the private local environment, not wrangler.jsonc.
const connection = process.env.CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE || process.env.DATABASE_URL
if (!connection) throw new Error('Configure DATABASE_URL in .env before using the Cloudflare CLI.')
const result = spawnSync('npx', ['opennextjs-cloudflare', command, ...process.argv.slice(3)], {
  stdio: 'inherit',
  env: { ...process.env, CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE: connection },
})
process.exit(result.status ?? 1)
