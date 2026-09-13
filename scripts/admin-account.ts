import nextEnv from '@next/env'
import { randomBytes } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { getPayload } from 'payload'
nextEnv.loadEnvConfig(process.cwd())
const email = process.env.CMS_ADMIN_EMAIL || process.argv[2]
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Provide an admin email with CMS_ADMIN_EMAIL or as the first argument. Passwords must not be passed as arguments.')
const { default: config } = await import('../src/payload.config')
const payload = await getPayload({ config })
const users = await payload.find({ collection: 'users', overrideAccess: true, limit: 2 })
if (users.totalDocs > 1) throw new Error('Multiple administrators exist. Select an account explicitly before using this single-owner setup command.')
const exists = users.docs[0]
if (exists && !process.argv.includes('--reset')) {
  console.log('An administrator already exists. No account or password was changed. Use --reset explicitly for recovery.')
} else {
  const password = randomBytes(24).toString('base64url')
  // Store first: a failed API operation cannot leave an unknown password behind.
  execFileSync('security', ['add-generic-password', '-U', '-s', 'Xuanying writing admin', '-a', email, '-w', password], { stdio: 'pipe' })
  if (exists) await payload.update({ collection: 'users', id: exists.id, overrideAccess: true, data: { email, password, loginAttempts: 0, lockUntil: null } })
  else await payload.create({ collection: 'users', overrideAccess: true, data: { email, password, name: '占轩颖' } })
  console.log('Administrator ready. Password saved in macOS Keychain: Xuanying writing admin. No password printed.')
}
await payload.destroy()
process.exit(0)
