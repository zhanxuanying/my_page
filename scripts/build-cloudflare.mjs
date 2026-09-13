import { readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
const config = JSON.parse(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'))
const result = spawnSync('npx', ['opennextjs-cloudflare', 'build'], {
  stdio: 'inherit', env: { ...process.env, NEXT_PUBLIC_SITE_URL: config.vars.NEXT_PUBLIC_SITE_URL, NEXT_TELEMETRY_DISABLED: '1', PAYLOAD_BUILD: '1' },
})
if (result.status !== 0) process.exit(result.status ?? 1)

// OpenNext copies local .env files into the server bundle. Runtime secrets must
// come from Cloudflare secret bindings, never from a developer's build machine.
const output = new URL('../.open-next/', import.meta.url)
const publicEnv = { NEXT_PUBLIC_SITE_URL: config.vars.NEXT_PUBLIC_SITE_URL, SUPABASE_URL: config.vars.SUPABASE_URL }
writeFileSync(new URL('cloudflare/next-env.mjs', output), ['production', 'development', 'test'].map(mode => `export const ${mode} = ${JSON.stringify(publicEnv)};\n`).join(''))
function removeEnvFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) removeEnvFiles(file)
    else if (entry.name === '.env' || entry.name.startsWith('.env.')) rmSync(file)
  }
}
removeEnvFiles(fileURLToPath(new URL('server-functions/', output)))
console.log('Cloudflare bundle prepared; private environment values are supplied through runtime secret bindings.')
