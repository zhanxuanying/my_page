import nextEnv from '@next/env'
import { readFile } from 'node:fs/promises'
import { getPayload } from 'payload'
import { markdownToLexical } from '../src/lib/content'
nextEnv.loadEnvConfig(process.cwd())
const { default: config } = await import('../src/payload.config')
const payload = await getPayload({ config })
const sourcePath = process.argv[2] || 'artifacts/legacy-posts.json'
const rows = JSON.parse(await readFile(sourcePath, 'utf8'))
let created = 0
for (const row of rows) {
  const exists = await payload.find({ collection: 'posts', where: { slug: { equals: row.slug } }, limit: 1, overrideAccess: true })
  if (exists.totalDocs) continue
  await payload.create({ collection: 'posts', overrideAccess: true, data: {
    slug: row.slug, title: row.title, excerpt: row.excerpt, category: row.category,
    content: markdownToLexical(row.body) as never, coverTheme: row.cover_theme,
    publishedAt: row.published_at, sortOrder: row.sort_order, isSample: row.is_sample,
    _status: row.published ? 'published' : 'draft',
  } })
  created++
}
console.log(`Imported ${created} posts; skipped ${rows.length - created} existing slugs.`)
await payload.destroy()
process.exit(0)
